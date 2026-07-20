const Stripe = require('stripe');

// Initialize only when configured so the app still boots without Stripe keys.
// Uses the SDK's pinned API version (don't hardcode a version string here).
const stripe = process.env.STRIPE_SECRET_KEY
  ? new Stripe(process.env.STRIPE_SECRET_KEY)
  : null;

if (!stripe) {
  console.warn('⚠️  STRIPE_SECRET_KEY not set — billing endpoints are disabled.');
}

module.exports = { stripe };
