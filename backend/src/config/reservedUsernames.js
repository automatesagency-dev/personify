// Usernames that may not be claimed for a Founder Page.
//
// Founder Pages live at the site root (/:username), so every username competes
// with the site's own URL space. Next.js gives static routes precedence, so an
// existing page is not hijacked, but a claimed word blocks us from ever using
// that path ourselves. Reclaiming one from a paying customer later is a support
// problem rather than a code change, so the list is deliberately broad.
//
// This became urgent when the referral gate was removed: any authenticated user
// can now create a Founder Page, so the pool of people able to claim a slug is
// no longer limited to invited users.
//
// Checked case-insensitively against the already-lowercased username.

const RESERVED_USERNAMES = new Set([
  // ── Routes that exist today ──
  'admin', 'blog', 'community', 'dashboard', 'forgot-password', 'founder-page',
  'generate', 'history', 'login', 'onboarding', 'password-reset-success',
  'persona', 'privacy', 'register', 'reset-password', 'settings', 'terms',
  'verify-email',

  // ── Framework and metadata paths ──
  'robots', 'robots.txt', 'sitemap', 'sitemap.xml', 'opengraph-image',
  'twitter-image', 'favicon', 'favicon.ico', 'icon', 'apple-icon', 'manifest',
  'site.webmanifest', 'llms.txt', '_next', 'static', 'public', 'assets',

  // ── Marketing pages we are likely to want ──
  'pricing', 'plans', 'about', 'about-us', 'features', 'help', 'support',
  'docs', 'documentation', 'contact', 'faq', 'careers', 'jobs', 'press',
  'legal', 'security', 'status', 'changelog', 'roadmap', 'partners',
  'affiliates', 'enterprise', 'demo', 'download', 'directory', 'explore',
  'discover', 'showcase', 'examples', 'templates', 'compare', 'alternatives',

  // ── Auth, account and billing ──
  'auth', 'oauth', 'callback', 'signin', 'sign-in', 'signup', 'sign-up',
  'signout', 'sign-out', 'logout', 'account', 'accounts', 'billing',
  'subscribe', 'subscription', 'checkout', 'upgrade', 'invite', 'invites',
  'referral', 'referrals', 'refer', 'verify', 'reset', 'password',

  // ── API and infrastructure ──
  'api', 'graphql', 'webhook', 'webhooks', 'cdn', 'img', 'images', 'media',
  'files', 'uploads', 'download', 'www', 'mail', 'email', 'smtp', 'ftp',
  'ns', 'dns', 'server', 'host', 'localhost',

  // ── Brand and impersonation protection ──
  'personify', 'personifyso', 'official', 'team', 'staff', 'root', 'system',
  'moderator', 'mod', 'administrator', 'owner', 'billing-team',

  // ── Generic and reserved words ──
  'new', 'edit', 'create', 'delete', 'update', 'search', 'settings',
  'profile', 'profiles', 'user', 'users', 'page', 'pages', 'home', 'index',
  'null', 'undefined', 'true', 'false', 'test', 'testing', 'example',
]);

function isReservedUsername(username) {
  if (typeof username !== 'string') return false;
  return RESERVED_USERNAMES.has(username.trim().toLowerCase());
}

module.exports = { RESERVED_USERNAMES, isReservedUsername };
