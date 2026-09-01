import { BLOG_POSTS } from '../lib/blogPosts';
import { SITE_URL, fetchPublishedFounderPages } from '../lib/founderPage';

// Regenerated hourly, matching the Founder Page cache.
export const revalidate = 3600;

// Public marketing and legal pages. Authenticated app screens
// (/dashboard, /settings, /admin, …) are deliberately absent — they render
// nothing useful to a crawler and are disallowed in robots.js.
const STATIC_ROUTES = [
  { path: '', changeFrequency: 'weekly', priority: 1.0 },
  { path: '/register', changeFrequency: 'monthly', priority: 0.8 },
  { path: '/blog', changeFrequency: 'weekly', priority: 0.7 },
  { path: '/terms', changeFrequency: 'yearly', priority: 0.3 },
  { path: '/privacy', changeFrequency: 'yearly', priority: 0.3 },
];

// Blog dates are hand-written strings in two different formats
// ("May 1, 2026" and "1 May 2026"), so parse defensively and omit
// lastModified rather than emit an invalid date.
function parsePostDate(value) {
  if (!value) return undefined;
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? undefined : parsed;
}

export default async function sitemap() {
  const now = new Date();

  const staticEntries = STATIC_ROUTES.map(({ path, changeFrequency, priority }) => ({
    url: `${SITE_URL}${path}`,
    lastModified: now,
    changeFrequency,
    priority,
  }));

  const blogEntries = BLOG_POSTS.map((post) => ({
    url: `${SITE_URL}/blog/${post.slug}`,
    lastModified: parsePostDate(post.date),
    changeFrequency: 'monthly',
    priority: 0.6,
  }));

  // Every published Founder Page. These are the pages SEO-01 made renderable;
  // without listing them here nothing tells a search engine they exist, since
  // they are reachable only via a direct link.
  const founderPages = await fetchPublishedFounderPages();
  const founderEntries = founderPages.map(({ username, updatedAt }) => ({
    url: `${SITE_URL}/${username}`,
    lastModified: updatedAt ? new Date(updatedAt) : undefined,
    changeFrequency: 'weekly',
    priority: 0.9,
  }));

  return [...staticEntries, ...blogEntries, ...founderEntries];
}
