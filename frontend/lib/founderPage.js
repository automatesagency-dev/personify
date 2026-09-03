// Server-side fetch for public Founder Pages.
//
// This exists so the page can be rendered on the server. Previously the data
// was fetched in a useEffect, which meant the HTML leaving our server was a
// loading spinner — search engines, link unfurlers (LinkedIn, X, Slack) and AI
// crawlers all saw nothing, and every page shared the same generic title.

import { SITE_URL } from './site';

const API_BASE = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api').replace(/\/+$/, '');

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

  const title = role ? `${name} | ${role}` : name;

  let description = firstOf(tagline, about, `${name} on Personify.`);
  if (description.length > 300) description = `${description.slice(0, 297).trimEnd()}…`;

  // Only absolute URLs are usable as share images; stored images are on R2.
  const rawImage = firstOf(basic.heroImageUrl, ecom.heroImageUrl, ecom.founderPhotoUrl, basic.logoUrl);
  const image = /^https?:\/\//i.test(rawImage) ? rawImage : null;

  return { name, title, description, image, url: `${SITE_URL}/${username}` };
}

// Preset FAQ questions. Shared with the renderer so the markup below and the
// visible accordion can never describe different questions.
export const FAQ_PRESET_QUESTIONS = {
  connections: 'How will your connections help me grow my business?',
  contact: 'Where can I contact you?',
};

/**
 * Schema.org JSON-LD for a Founder Page.
 *
 * This is the machine-readable layer search engines and AI assistants read to
 * understand that a page is about a *person*, which is what can place a founder
 * in a knowledge panel or a people-shaped answer.
 *
 * Rules applied throughout:
 *  - only emit a field when there is real content for it; the stored JSON uses
 *    empty strings rather than nulls, so every value is trimmed and checked
 *  - only describe what is actually rendered on the page
 *  - `sameAs` is deliberately omitted: the stored social values are free-text
 *    handles ("@luxbykate", "jo"), not the absolute profile URLs the property
 *    requires. Emitting handles would be invalid markup.
 */
export function founderPageJsonLd(page, username) {
  if (!page) return null;

  const seo = founderPageSeo(page, username);
  const basic = page.basicInfo || {};
  const contact = page.contact || {};
  const pageUrl = `${SITE_URL}/${username}`;

  const person = {
    '@type': 'Person',
    '@id': `${pageUrl}#person`,
    name: seo.name,
    url: pageUrl,
  };

  const jobTitle = firstOf(basic.title);
  if (jobTitle) person.jobTitle = jobTitle;

  const about = firstOf(basic.about1, basic.about2, basic.tagline);
  if (about) person.description = about;

  if (seo.image) person.image = seo.image;

  const locality = firstOf(contact.location);
  if (locality) {
    person.address = { '@type': 'PostalAddress', addressLocality: locality };
  }

  // Services the founder offers, when they have actually been filled in.
  const services = Array.isArray(page.services) ? page.services : [];
  const offers = services
    .filter((s) => s && firstOf(s.title))
    .map((s) => {
      const offer = {
        '@type': 'Offer',
        itemOffered: { '@type': 'Service', name: firstOf(s.title) },
      };
      const desc = firstOf(s.description);
      if (desc) offer.itemOffered.description = desc;
      return offer;
    });
  if (offers.length) person.makesOffer = offers;

  const graph = [
    {
      '@type': 'ProfilePage',
      '@id': pageUrl,
      url: pageUrl,
      name: seo.title,
      ...(seo.description ? { description: seo.description } : {}),
      mainEntity: { '@id': `${pageUrl}#person` },
      isPartOf: { '@type': 'WebSite', '@id': `${SITE_URL}#website`, name: 'Personify', url: SITE_URL },
    },
    person,
  ];

  // Only the founder's own questions. The two boilerplate Personify FAQs are
  // rendered too, but they describe the product rather than this person, so
  // marking them up per-page would be misleading.
  const faqs = (Array.isArray(page.faq) ? page.faq : [])
    .map((item) => ({
      question: item?.type === 'custom' ? firstOf(item.customQuestion) : firstOf(FAQ_PRESET_QUESTIONS[item?.type]),
      answer: firstOf(item?.answer),
    }))
    .filter((f) => f.question && f.answer);

  if (faqs.length) {
    graph.push({
      '@type': 'FAQPage',
      '@id': `${pageUrl}#faq`,
      mainEntity: faqs.map((f) => ({
        '@type': 'Question',
        name: f.question,
        acceptedAnswer: { '@type': 'Answer', text: f.answer },
      })),
    });
  }

  return { '@context': 'https://schema.org', '@graph': graph };
}
