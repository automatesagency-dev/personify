const crypto = require('crypto');

// Single-use tokens for password reset and email verification.
//
// SECURITY: the raw token goes in the emailed link and is never stored. Only
// its SHA-256 hash is written to the database, so a leaked backup, log line or
// support export does not hand over working reset links (this was SEC-03).
//
// SHA-256 is the right primitive here — unlike a password, the token is 256
// bits of CSPRNG output, so it has no guessable structure to slow down and a
// deliberately slow hash would only cost us latency on every lookup.

const TOKEN_BYTES = 32;

// Returns { token, tokenHash, expiresAt }. Send `token`, store `tokenHash`.
function createSecureToken(ttlMs) {
  const token = crypto.randomBytes(TOKEN_BYTES).toString('hex');
  return {
    token,
    tokenHash: hashToken(token),
    expiresAt: new Date(Date.now() + ttlMs)
  };
}

function hashToken(token) {
  return crypto.createHash('sha256').update(String(token)).digest('hex');
}

const TTL = {
  passwordReset: 60 * 60 * 1000,          // 1 hour
  emailVerification: 24 * 60 * 60 * 1000  // 24 hours
};

module.exports = { createSecureToken, hashToken, TTL };
