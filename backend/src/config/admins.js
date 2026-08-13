// Authorization is intentionally tied to an immutable database role, not a
// mutable profile field such as email.  Do not reintroduce ADMIN_EMAILS here:
// doing so would let a user gain privileged access by changing their email.
function isAdmin(user) {
  return user?.role === 'admin';
}

module.exports = { isAdmin };
