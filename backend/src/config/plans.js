// =====================================
// Central plan definitions — the single source of truth for limits + pricing.
// Monthly quotas per plan; price IDs come from Stripe (test mode) via env vars.
// =====================================

const PLANS = {
  free: {
    key: 'free',
    name: 'Free',
    monthlyPriceAud: 0,
    limits: { image: 10, text: 50 },
    prices: { monthly: null, yearly: null },
  },
  starter: {
    key: 'starter',
    name: 'Starter',
    monthlyPriceAud: 19,
    yearlyPriceAud: 190,
    limits: { image: 50, text: 150 },
    prices: {
      monthly: process.env.STRIPE_PRICE_STARTER_MONTHLY || null,
      yearly: process.env.STRIPE_PRICE_STARTER_YEARLY || null,
    },
  },
  pro: {
    key: 'pro',
    name: 'Pro',
    monthlyPriceAud: 49,
    yearlyPriceAud: 490,
    limits: { image: 200, text: 500 },
    prices: {
      monthly: process.env.STRIPE_PRICE_PRO_MONTHLY || null,
      yearly: process.env.STRIPE_PRICE_PRO_YEARLY || null,
    },
  },
  studio: {
    key: 'studio',
    name: 'Studio',
    monthlyPriceAud: 99,
    yearlyPriceAud: 990,
    limits: { image: 500, text: 5000 },
    prices: {
      monthly: process.env.STRIPE_PRICE_STUDIO_MONTHLY || null,
      yearly: process.env.STRIPE_PRICE_STUDIO_YEARLY || null,
    },
  },
};

const TRIAL_DAYS = 7;

// Resolve a plan by key, defaulting to free for unknown/missing values.
function getPlan(key) {
  return PLANS[key] || PLANS.free;
}

// Monthly generation limits for a plan key.
function getLimits(planKey) {
  return getPlan(planKey).limits;
}

function daysInMonth(year, monthIndex) {
  return new Date(year, monthIndex + 1, 0).getDate();
}

// The current monthly usage window anchored to `anchor`'s day-of-month (e.g. the
// day the user subscribed). Returns { start, end }, where `end` is the next
// reset. The day is clamped to each month's length (a 31st anchor → 28th in Feb).
function monthlyWindow(anchor, now = new Date()) {
  const day = anchor.getDate();
  const mk = (y, m) => new Date(y, m, Math.min(day, daysInMonth(y, m)));
  let start = mk(now.getFullYear(), now.getMonth());
  if (start > now) start = mk(now.getFullYear(), now.getMonth() - 1);
  const end = mk(start.getFullYear(), start.getMonth() + 1);
  return { start, end };
}

// Reverse lookup: which plan + interval does a Stripe price id map to?
function findPlanByPriceId(priceId) {
  if (!priceId) return null;
  for (const plan of Object.values(PLANS)) {
    if (plan.prices.monthly === priceId) return { plan, interval: 'monthly' };
    if (plan.prices.yearly === priceId) return { plan, interval: 'yearly' };
  }
  return null;
}

module.exports = { PLANS, TRIAL_DAYS, getPlan, getLimits, findPlanByPriceId, monthlyWindow };
