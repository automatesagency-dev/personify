// Plan definitions used by the pricing UI and by llms.txt.
//
// NOTE: these mirror backend/src/config/plans.js, which remains the source of
// truth for enforcement and Stripe price IDs. Keep them in step, or better,
// serve them from the API so there is only one definition.

export const PLANS = [
  { key: 'free',    name: 'Free',    monthly: 0,  yearly: 0,   images: 10,  texts: 50,   blurb: 'Try it out',            features: ['10 images / month', '50 text generations / month', 'Freestyle + Brand Persona'] },
  { key: 'starter', name: 'Starter', monthly: 19, yearly: 190, images: 50,  texts: 150,  blurb: 'For getting started',   features: ['50 images / month', '150 text generations / month', 'Everything in Free'] },
  { key: 'pro',     name: 'Pro',     monthly: 49, yearly: 490, images: 200, texts: 500,  blurb: 'For regular creators',  popular: true, features: ['200 images / month', '500 text generations / month', 'Priority generation'] },
  { key: 'studio',  name: 'Studio',  monthly: 99, yearly: 990, images: 500, texts: 5000, blurb: 'For power users',       features: ['500 images / month', '5,000 text generations / month', 'Everything in Pro'] },
];
