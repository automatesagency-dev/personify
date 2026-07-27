const { prisma } = require('../config/database');
const { findPlanByPriceId } = require('../config/plans');

const HOLD_DAYS = 14;                // commission is held 14 days before it's usable
const MONTHLY_MAX_PAYMENTS = 7;      // 1 payment @ 30% + 6 payments @ 15%
const RATE_FIRST_MONTH = 0.30;
const RATE_RECURRING = 0.15;
const RATE_ANNUAL = 0.20;

// Determine the plan interval for an invoice from its line price, falling back
// to the referee's stored interval if the price can't be resolved.
function invoiceInterval(invoice, fallback) {
  const line = invoice.lines?.data?.[0];
  const priceId = line?.price?.id || line?.pricing?.price_details?.price || null;
  return findPlanByPriceId(priceId)?.interval || fallback || 'monthly';
}

// Called on a referee's successful payment (invoice.paid). Records a pending
// commission for their referrer per the schedule. Idempotent on the invoice id.
async function recordCommissionForInvoice(invoice) {
  if (!invoice || !invoice.id || (invoice.amount_paid || 0) <= 0) return; // skip $0 (trial) invoices

  const referee = await prisma.user.findUnique({
    where: { stripeCustomerId: invoice.customer },
    select: { id: true, referredById: true, billingInterval: true },
  });
  if (!referee || !referee.referredById || referee.referredById === referee.id) return;

  // Idempotency — one commission per invoice
  if (await prisma.commission.findUnique({ where: { sourceInvoiceId: invoice.id } })) return;

  const interval = invoiceInterval(invoice, referee.billingInterval);
  let rate, type;

  if (interval === 'yearly') {
    // Annual commission is one-time on the first annual payment.
    const priorAnnual = await prisma.commission.count({
      where: { refereeId: referee.id, type: 'annual', status: { not: 'reversed' } },
    });
    if (priorAnnual > 0) return;
    rate = RATE_ANNUAL; type = 'annual';
  } else {
    // Monthly: 30% first payment, 15% for the next 6 (7 total), then nothing.
    const priorMonthly = await prisma.commission.count({
      where: { refereeId: referee.id, type: { in: ['first_month', 'recurring'] }, status: { not: 'reversed' } },
    });
    if (priorMonthly >= MONTHLY_MAX_PAYMENTS) return;
    if (priorMonthly === 0) { rate = RATE_FIRST_MONTH; type = 'first_month'; }
    else { rate = RATE_RECURRING; type = 'recurring'; }
  }

  const amountCents = Math.round(rate * invoice.amount_paid); // Stripe amounts are already in cents
  if (amountCents <= 0) return;

  try {
    await prisma.commission.create({
      data: {
        referrerId: referee.referredById,
        refereeId: referee.id,
        amountCents,
        currency: (invoice.currency || 'aud').toLowerCase(),
        type,
        sourceInvoiceId: invoice.id,
        status: 'pending',
        availableAt: new Date(Date.now() + HOLD_DAYS * 24 * 60 * 60 * 1000),
      },
    });
    console.log(`   💰 commission +${amountCents}c (${type}) → referrer ${referee.referredById} [invoice ${invoice.id}]`);
  } catch (e) {
    if (e.code !== 'P2002') throw e; // ignore duplicate insert (idempotent)
  }
}

// Reverse the commission tied to an invoice (refund / chargeback).
async function reverseCommissionForInvoice(invoiceId) {
  if (!invoiceId) return;
  const commission = await prisma.commission.findUnique({ where: { sourceInvoiceId: invoiceId } });
  if (!commission || commission.status === 'reversed') return;
  await prisma.commission.update({ where: { id: commission.id }, data: { status: 'reversed' } });
  console.log(`   ↩️  commission reversed [invoice ${invoiceId}]`);
}

module.exports = { recordCommissionForInvoice, reverseCommissionForInvoice, HOLD_DAYS };
