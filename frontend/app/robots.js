import { SITE_URL } from '../lib/site';

// Authenticated application screens. These render nothing useful without a
// session, so crawling them wastes budget, and it kept the admin path in
// public crawl logs.
const PRIVATE_PATHS = [
  '/dashboard',
  '/settings',
  '/admin',
  '/generate',
  '/history',
  '/persona',
  '/onboarding',
  '/founder-page',
  '/community',
  '/verify-email',
  '/reset-password',
  '/forgot-password',
  '/password-reset-success',
];

// AI crawlers, named explicitly.
//
// Without naming them the policy is accidental: they inherit the "*" rule and
// nobody has decided anything. We do have a position, and these two groups get
// different treatment.

// Allowed. Founder Pages, the blog and pricing are content our users publish in
// order to be found, so having assistants read and cite it is the point. These
// agents get the same access as any search engine: everything public, nothing
// behind a login.
//
// Note on Google-Extended: blocking it does NOT remove us from Google's AI
// Overviews, which follow ordinary Googlebot. Blocking it would only forfeit
// Gemini grounding, so there is nothing to gain by doing so.
const ALLOWED_AI_AGENTS = [
  'GPTBot',            // OpenAI, training and retrieval
  'OAI-SearchBot',     // OpenAI, ChatGPT search results
  'ChatGPT-User',      // OpenAI, fetch on a user's behalf
  'ClaudeBot',         // Anthropic
  'Claude-Web',        // Anthropic, user-initiated fetch
  'anthropic-ai',      // Anthropic, legacy token
  'PerplexityBot',     // Perplexity
  'Perplexity-User',   // Perplexity, user-initiated fetch
  'Google-Extended',   // Gemini grounding, see note above
  'Applebot-Extended', // Apple Intelligence
  'DuckAssistBot',     // DuckDuckGo
  'cohere-ai',
];

// Blocked outright. Bulk scrapers with no user-facing product that sends
// traffic back, and which are widely reported as aggressive. Nothing here
// would ever cite a Founder Page, so allowing them is cost without benefit.
const BLOCKED_AI_AGENTS = [
  'CCBot',              // Common Crawl
  'Bytespider',         // ByteDance
  'Amazonbot',
  'meta-externalagent', // Meta
  'Diffbot',
  'Omgilibot',
  'ImagesiftBot',
  'Timpibot',
];

export default function robots() {
  return {
    rules: [
      // Search engines and everything not named below.
      {
        userAgent: '*',
        allow: '/',
        disallow: PRIVATE_PATHS,
      },
      // AI assistants we want reading public content.
      {
        userAgent: ALLOWED_AI_AGENTS,
        allow: '/',
        disallow: PRIVATE_PATHS,
      },
      // Bulk scrapers.
      {
        userAgent: BLOCKED_AI_AGENTS,
        disallow: '/',
      },
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: SITE_URL,
  };
}
