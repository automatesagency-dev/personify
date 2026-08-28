const rateLimit = require('express-rate-limit');
const { ipKeyGenerator } = require('express-rate-limit');

// Every rate limiter lives here so the throttling on each unauthenticated entry
// point is visible in one place.
//
// Previously only /register, /login and /google were limited. The password
// reset and email verification endpoints are equally unauthenticated but had no
// limit at all, which allowed both mail flooding and unbounded token guessing.
//
// NOTE: these use the default in-memory store, so counters are per-process and
// reset on deploy. That must move to a shared store before running more than
// one instance (tracked separately as SEC-17).

const shared = {
  standardHeaders: true,
  legacyHeaders: false,
};

// Lowercased+trimmed address, used only to build a rate-limit key. Deliberately
// local: this is a keying concern, not the account-lookup path.
const emailKey = (value) =>
  typeof value === 'string' ? value.trim().toLowerCase() : '';

// Login / register / Google sign-in. Only failed attempts count, so a
// legitimate user is never penalised for signing in repeatedly.
const authLimiter = rateLimit({
  ...shared,
  windowMs: 15 * 60 * 1000,
  max: 20,
  skipSuccessfulRequests: true,
  message: { error: 'Too many attempts, please try again in 15 minutes.' },
});

// Requesting a password reset sends mail to an address the caller chooses, so
// the key combines IP and target address: one attacker cannot flood many
// addresses, and many attackers cannot flood a single address.
const passwordResetRequestLimiter = rateLimit({
  ...shared,
  windowMs: 60 * 60 * 1000,
  max: 5,
  keyGenerator: (req) => `${ipKeyGenerator(req.ip)}:${emailKey(req.body?.email)}`,
  message: {
    error: 'Too many password reset requests. Please try again in an hour.',
  },
});

// Submitting a reset or verification token. Guessing is the threat, so this is
// keyed on IP and only failures count — following a valid link is unaffected
// however many times the user clicks it.
const tokenSubmissionLimiter = rateLimit({
  ...shared,
  windowMs: 60 * 60 * 1000,
  max: 10,
  skipSuccessfulRequests: true,
  message: {
    error: 'Too many attempts. Please request a new link and try again later.',
  },
});

// Asking for another verification email. Authenticated, so keyed on the user
// id; this stops one account being used to send itself mail repeatedly.
const resendVerificationLimiter = rateLimit({
  ...shared,
  windowMs: 60 * 60 * 1000,
  max: 5,
  keyGenerator: (req) => req.user?.id || ipKeyGenerator(req.ip),
  message: {
    error: 'Too many verification emails requested. Please try again in an hour.',
  },
});

module.exports = {
  authLimiter,
  passwordResetRequestLimiter,
  tokenSubmissionLimiter,
  resendVerificationLimiter,
};
