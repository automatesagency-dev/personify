// Server-side fetch for public Founder Pages.
//
// This exists so the page can be rendered on the server. Previously the data
// was fetched in a useEffect, which meant the HTML leaving our server was a
// loading spinner — search engines, link unfurlers (LinkedIn, X, Slack) and AI
// crawlers all saw nothing, and every page shared the same generic title.

const API_BASE = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api').replace(/\/+$/, '');

export const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL || 'https://personify.so').replace(/\/+$/, '');

// How long a rendered page stays cached before being re-fetched (seconds).
export const FOUNDER_PAGE_REVALIDATE = 3600;

/**
 * Fetch a published Founder Page by username.
 * Returns the page object, or null when it does not exist or is unpublished.
 * The API returns 404 for missing and 403 for unpublished; both are "not found"
 * as far as a public visitor is concerned.
 */
export async function fetchPublicFounderPage(username) {
  if (!username || typeof username !== 'string') return null;

  try {
    const res = await fetch(
      `${API_BASE}/founder-page/public/${encodeURIComponent(username)}`,
      { next: { revalidate: FOUNDER_PAGE_REVALIDATE } }
    );

    if (!res.ok) return null;

    const data = await res.json();
    return data?.founderPage ?? null;
  } catch (err) {
    // A network failure must not 500 the route — treat it as not-found so the
    // visitor gets a proper 404 rather than an error page.
    console.error(`Founder page fetch failed for "${username}":`, err.message);
    return null;
  }
}

/**
 * Every published Founder Page, for the sitemap: just the slug and when it
 * last changed. Returns [] on failure — a sitemap missing the dynamic entries
 * is far better than a sitemap route that 500s.
 */
export async function fetchPublishedFounderPages() {
  try {
    const res = await fetch(`${API_BASE}/founder-page/published`, {
      next: { revalidate: FOUNDER_PAGE_REVALIDATE },
    });
    if (!res.ok) {
      console.error(`Published page list failed: HTTP ${res.status}`);
      return [];
    }
    const data = await res.json();
    return Array.isArray(data?.pages) ? data.pages : [];
  } catch (err) {
    console.error('Published page list failed:', err.message);
    return [];
  }
}

/** First non-empty trimmed string from the arguments, or ''. */
function firstOf(...values) {
  for (const v of values) {
    if (typeof v === 'string' && v.trim()) return v.trim();
  }
  return '';
}

/**
 * Derive title / description / share image from a page's stored content.
 * Kept separate from the route so it can be unit-tested without Next.
 */
export function founderPageSeo(page, username) {
  const basic = page?.basicInfo || {};
  const ecom = page?.ecommerce || {};

  const name = firstOf(basic.name, ecom.brandName, page?.user?.name, username);
  const role = firstOf(basic.title, ecom.tagline);
  const tagline = firstOf(basic.tagline, ecom.tagline);
  const about = firstOf(basic.about1, basic.about2);

  const title = role ? `${name} — ${role}` : name;

  let description = firstOf(tagline, about, `${name} on Personify.`);
  if (description.length > 300) description = `${description.slice(0, 297).trimEnd()}…`;

  // Only absolute URLs are usable as share images; stored images are on R2.
  const rawImage = firstOf(basic.heroImageUrl, ecom.heroImageUrl, ecom.founderPhotoUrl, basic.logoUrl);
  const image = /^https?:\/\//i.test(rawImage) ? rawImage : null;

  return { name, title, description, image, url: `${SITE_URL}/${username}` };
}
