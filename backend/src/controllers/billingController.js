const { prisma } = require('../config/database');
const { stripe } = require('../config/stripe');
const { getPlan, findPlanByPriceId, TRIAL_DAYS } = require('../config/plans');

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
      subscription_data: { trial_period_days: TRIAL_DAYS },
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
        currentPeriodStart: true, currentPeriodEnd: true, trialEndsAt: true, cancelAtPeriodEnd: true
      }
    });

    const plan = getPlan(user.plan);
    const windowStart = user.currentPeriodStart
      ? new Date(user.currentPeriodStart)
      : new Date(new Date().getFullYear(), new Date().getMonth(), 1);

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
      trialEndsAt: user.trialEndsAt,
      cancelAtPeriodEnd: user.cancelAtPeriodEnd,
      limits: plan.limits,
      usage: { image: imageUsed, text: textUsed },
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
    console.warn('Webhook: no user for Stripe customer', subscription.customer);
    return;
  }

  const status = subscription.status; // active | trialing | past_due | canceled | ...
  const priceId = subscription.items?.data?.[0]?.price?.id;
  const match = findPlanByPriceId(priceId);
  const activeLike = ['active', 'trialing', 'past_due'].includes(status);

  const data = {
    subscriptionStatus: status,
    stripeSubscriptionId: subscription.id,
    cancelAtPeriodEnd: !!subscription.cancel_at_period_end,
    currentPeriodStart: subscription.current_period_start ? new Date(subscription.current_period_start * 1000) : null,
    currentPeriodEnd: subscription.current_period_end ? new Date(subscription.current_period_end * 1000) : null,
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

  try {
    switch (event.type) {
      case 'customer.subscription.created':
      case 'customer.subscription.updated':
      case 'customer.subscription.deleted':
        await syncSubscription(event.data.object);
        break;
      default:
        break;
    }
    res.json({ received: true });
  } catch (error) {
    console.error('Webhook handler error:', error);
    res.status(500).json({ error: 'Webhook handler failed' });
  }
}

module.exports = {
  createCheckoutSession,
  createPortalSession,
  getSubscription,
  handleWebhook,
};
