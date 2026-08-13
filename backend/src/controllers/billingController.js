const { prisma } = require('../config/database');
const { stripe } = require('../config/stripe');
const { getPlan, findPlanByPriceId, TRIAL_DAYS, monthlyWindow } = require('../config/plans');
const { recordCommissionForInvoice, reverseCommissionForInvoice, sweepClearedCommissions } = require('../services/commissions');

const APP_URL = () => (process.env.APP_URL || (process.env.FRONTEND_URL || '').split(',')[0] || '').trim().replace(/\/+$/, '');

// POST /billing/checkout — start a subscription Checkout session
async function createCheckoutSession(req, res) {
  try {
    if (!stripe) return res.status(503).json({ error: 'Billing is not configured yet.' });

    const { plan: planKey, interval } = req.body;
    const plan = getPlan(planKey);

    if (plan.key === 'free' || !['monthly', 'yearly'].includes(interval)) {
      return res.status(400).json({ error: 'Invalid plan or billing interval.' });
    }
    const priceId = plan.prices[interval];
    if (!priceId) return res.status(400).json({ error: 'This plan is not available yet.' });

    const user = await prisma.user.findUnique({ where: { id: req.user.id } });

    // Ensure the user has a Stripe customer
    let customerId = user.stripeCustomerId;
    if (!customerId) {
      const customer = await stripe.customers.create({
        email: user.email,
        name: user.name || undefined,
        metadata: { userId: user.id }
      });
      customerId = customer.id;
      await prisma.user.update({ where: { id: user.id }, data: { stripeCustomerId: customerId } });
    }

    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      customer: customerId,
      line_items: [{ price: priceId, quantity: 1 }],
      // Omit the trial entirely when TRIAL_DAYS is 0 (Stripe requires >= 1).
      ...(TRIAL_DAYS > 0 ? { subscription_data: { trial_period_days: TRIAL_DAYS } } : {}),
      allow_promotion_codes: true,
      client_reference_id: user.id,
      success_url: `${APP_URL()}/settings?tab=pricing&checkout=success`,
      cancel_url: `${APP_URL()}/settings?tab=pricing&checkout=cancelled`,
    });

    res.json({ url: session.url });
  } catch (error) {
    console.error('Create checkout session error:', error);
    res.status(500).json({ error: 'Failed to start checkout.' });
  }
}

// POST /billing/portal — open the Stripe Customer Portal (manage/cancel)
async function createPortalSession(req, res) {
  try {
    if (!stripe) return res.status(503).json({ error: 'Billing is not configured yet.' });

    const user = await prisma.user.findUnique({ where: { id: req.user.id } });
    if (!user.stripeCustomerId) {
      return res.status(400).json({ error: 'No billing account found. Subscribe to a plan first.' });
    }

    const session = await stripe.billingPortal.sessions.create({
      customer: user.stripeCustomerId,
      return_url: `${APP_URL()}/settings?tab=pricing`,
    });

    res.json({ url: session.url });
  } catch (error) {
    console.error('Create portal session error:', error);
    res.status(500).json({ error: 'Failed to open billing portal.' });
  }
}

// GET /billing/subscription — current plan, status, and usage for the billing UI
async function getSubscription(req, res) {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: {
        plan: true, billingInterval: true, subscriptionStatus: true,
        currentPeriodStart: true, currentPeriodEnd: true, trialEndsAt: true, cancelAtPeriodEnd: true,
        bonusImages: true, bonusTexts: true
      }
    });

    const plan = getPlan(user.plan);
    const now = new Date();
    const win = user.currentPeriodStart
      ? monthlyWindow(new Date(user.currentPeriodStart))
      : { start: new Date(now.getFullYear(), now.getMonth(), 1), end: new Date(now.getFullYear(), now.getMonth() + 1, 1) };
    const windowStart = win.start;

    const [imageUsed, textUsed] = await Promise.all([
      prisma.generation.count({ where: { userId: req.user.id, type: 'image', status: { not: 'failed' }, createdAt: { gte: windowStart } } }),
      prisma.generation.count({ where: { userId: req.user.id, type: 'text', status: { not: 'failed' }, createdAt: { gte: windowStart } } }),
    ]);

    res.json({
      plan: plan.key,
      planName: plan.name,
      billingInterval: user.billingInterval,
      status: user.subscriptionStatus,
      currentPeriodEnd: user.currentPeriodEnd,
      resetsOn: win.end,
      trialEndsAt: user.trialEndsAt,
      cancelAtPeriodEnd: user.cancelAtPeriodEnd,
      limits: plan.limits,
      usage: { image: imageUsed, text: textUsed },
      bonus: { image: user.bonusImages, text: user.bonusTexts },
    });
  } catch (error) {
    console.error('Get subscription error:', error);
    res.status(500).json({ error: 'Failed to load subscription.' });
  }
}

// Reconcile our DB with a Stripe subscription object (source of truth = Stripe).
async function syncSubscription(subscription) {
  const user = await prisma.user.findUnique({ where: { stripeCustomerId: subscription.customer } });
  if (!user) {
    console.warn('⚠️  Webhook: no user found for Stripe customer', subscription.customer);
    return;
  }

  const item = subscription.items?.data?.[0];
  const status = subscription.status; // active | trialing | past_due | canceled | ...
  const priceId = item?.price?.id;
  const match = findPlanByPriceId(priceId);
  // Only active/trialing keep paid access — past_due/unpaid/canceled drop to free.
  const activeLike = ['active', 'trialing'].includes(status);
  console.log(`   ↳ sync ${user.email}: status=${status}, price=${priceId}, matchedPlan=${match?.plan?.key || 'none'}`);

  // Anchor the usage cycle to when the subscription started (stable across
  // renewals) so limits reset on the same day each month. current_period_end
  // moved onto the item in recent Stripe API versions — read the item first.
  const anchor = subscription.start_date ?? item?.current_period_start ?? subscription.current_period_start ?? null;
  const periodEnd = item?.current_period_end ?? subscription.current_period_end ?? null;

  const data = {
    subscriptionStatus: status,
    stripeSubscriptionId: subscription.id,
    cancelAtPeriodEnd: !!subscription.cancel_at_period_end,
    currentPeriodStart: anchor ? new Date(anchor * 1000) : null,
    currentPeriodEnd: periodEnd ? new Date(periodEnd * 1000) : null,
    trialEndsAt: subscription.trial_end ? new Date(subscription.trial_end * 1000) : null,
  };

  if (activeLike && match) {
    data.plan = match.plan.key;
    data.billingInterval = match.interval;
  } else {
    // canceled / unpaid / no matching price → back to free
    data.plan = 'free';
    data.billingInterval = null;
  }

  await prisma.user.update({ where: { id: user.id }, data });
}

// POST /billing/webhook — Stripe events (raw body, signature-verified)
async function handleWebhook(req, res) {
  if (!stripe) return res.status(503).end();

  const sig = req.headers['stripe-signature'];
  let event;
  try {
    event = stripe.webhooks.constructEvent(req.body, sig, process.env.STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    console.error('Webhook signature verification failed:', err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  console.log('📩 Stripe webhook received:', event.type);

  try {
    switch (event.type) {
      case 'customer.subscription.created':
      case 'customer.subscription.updated':
      case 'customer.subscription.deleted':
        await syncSubscription(event.data.object);
        break;
      case 'invoice.paid':
        await recordCommissionForInvoice(event.data.object);
        break;
      case 'charge.refunded':
        await reverseCommissionForInvoice(event.data.object.invoice);
        break;
      case 'charge.dispute.created': {
        try {
          const charge = await stripe.charges.retrieve(event.data.object.charge);
          await reverseCommissionForInvoice(charge.invoice);
        } catch (e) {
          console.error('Dispute reversal lookup failed:', e.message);
        }
        break;
      }
      default:
        break;
    }
    res.json({ received: true });
  } catch (error) {
    console.error('Webhook handler error:', error);
    res.status(500).json({ error: 'Webhook handler failed' });
  }
}

// GET /billing/credits — the user's Personify credit wallet
async function getCredits(req, res) {
  try {
    const userId = req.user.id;
    try { await sweepClearedCommissions(userId); } catch (e) { console.error('Credit sweep failed:', e.message); }

    const user = await prisma.user.findUnique({ where: { id: userId }, select: { creditCents: true, stripeCustomerId: true } });
    const pending = await prisma.commission.aggregate({
      where: { referrerId: userId, status: 'pending', availableAt: { gt: new Date() } },
      _sum: { amountCents: true },
    });

    // Credit already moved to Stripe (queued for the next invoice)
    let queuedCents = 0;
    if (stripe && user.stripeCustomerId) {
      try {
        const cust = await stripe.customers.retrieve(user.stripeCustomerId);
        if (cust && !cust.deleted && typeof cust.balance === 'number' && cust.balance < 0) queuedCents = -cust.balance;
      } catch { /* ignore */ }
    }

    res.json({
      currency: 'AUD',
      availableCents: user.creditCents,
      pendingCents: pending._sum.amountCents || 0,
      queuedCents,
    });
  } catch (error) {
    console.error('Get credits error:', error);
    res.status(500).json({ error: 'Failed to load credits.' });
  }
}

// POST /billing/apply-credit — move wallet credit to Stripe so it discounts the next invoice
async function applyCredit(req, res) {
  try {
    if (!stripe) return res.status(503).json({ error: 'Billing is not configured yet.' });
    const userId = req.user.id;
    await sweepClearedCommissions(userId);

    const user = await prisma.user.findUnique({ where: { id: userId } });
    const amount = user.creditCents;
    if (amount <= 0) return res.status(400).json({ error: 'You have no available credit to apply.' });

    let customerId = user.stripeCustomerId;
    if (!customerId) {
      const customer = await stripe.customers.create({ email: user.email, name: user.name || undefined, metadata: { userId: user.id } });
      customerId = customer.id;
      await prisma.user.update({ where: { id: user.id }, data: { stripeCustomerId: customerId } });
    }

    await stripe.customers.createBalanceTransaction(customerId, {
      amount: -amount, // negative = credit
      currency: 'aud',
      description: 'Personify credit applied to subscription',
    });
    await prisma.user.update({ where: { id: userId }, data: { creditCents: { decrement: amount } } });

    res.json({ appliedCents: amount });
  } catch (error) {
    console.error('Apply credit error:', error);
    res.status(500).json({ error: 'Failed to apply credit.' });
  }
}

module.exports = {
  createCheckoutSession,
  createPortalSession,
  getSubscription,
  getCredits,
  applyCredit,
  handleWebhook,
};
