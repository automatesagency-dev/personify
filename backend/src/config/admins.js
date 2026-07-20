// Admin allow-list, driven by env so admins can be added without a code change.
// Falls back to the known team admins if ADMIN_EMAILS is unset.
const ADMIN_EMAILS = (process.env.ADMIN_EMAILS || 'admin@automatesagency.com,joanne@automatesagency.com')
  .split(',')
  .map((e) => e.trim().toLowerCase())
  .filter(Boolean);

function isAdmin(email) {
  return !!email && ADMIN_EMAILS.includes(email.toLowerCase());
}

module.exports = { ADMIN_EMAILS, isAdmin };
