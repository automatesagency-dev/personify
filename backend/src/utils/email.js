const { prisma } = require('../config/database');

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Canonical form used for every comparison and every write. Addresses are
// stored lowercased, but historical rows predate that, so lookups must also be
// case-insensitive — see findUserByEmail.
function normalizeEmail(email) {
  return typeof email === 'string' ? email.trim().toLowerCase() : '';
}

function isValidEmail(email) {
  return email.length <= 254 && EMAIL_REGEX.test(email);
}

// The single email lookup for the whole codebase. Every auth path — login,
// registration, Google sign-in, password reset — must go through this, so that
// an account is found consistently regardless of the casing it was created
// with. A path that queries `email` directly will silently fail to find
// pre-canonicalization accounts (this was SEC-13).
async function findUserByEmail(email) {
  const normalized = normalizeEmail(email);
  if (!normalized) return null;
  return prisma.user.findFirst({
    where: { email: { equals: normalized, mode: 'insensitive' } }
  });
}

module.exports = { normalizeEmail, isValidEmail, findUserByEmail, EMAIL_REGEX };
