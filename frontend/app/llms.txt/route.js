import { SITE_URL, SITE_NAME, SITE_DESCRIPTION } from '../../lib/site';
import { BLOG_POSTS } from '../../lib/blogPosts';
import { PLANS } from '../../lib/plans';

// llms.txt: a short, plain-text description of what this site is, written for
// AI agents rather than inferred by them.
//
// Served from a route rather than public/ so the plan prices and the blog index
// come from the same data the site renders. A hand-maintained file would drift.

export const revalidate = 3600;
export const dynamic = 'force-static';

const n = (value) => value.toLocaleString('en-AU');

function priceLine(plan) {
  const quota = `${n(plan.images)} images and ${n(plan.texts)} text generations per month.`;
  if (plan.monthly === 0) {
    return `- ${plan.name}: no cost, no card required. ${quota}`;
  }
  return `- ${plan.name}: A$${plan.monthly}/month or A$${plan.yearly}/year. ${quota}`;
}

export function GET() {
  const body = `# ${SITE_NAME}

> ${SITE_DESCRIPTION}

${SITE_NAME} is a personal branding platform for founders, creators and
professionals. It does two things:

1. Generates studio-quality AI photographs of you, so you can produce
   professional imagery without booking a photoshoot.
2. Publishes a Founder Page: a single public page at ${SITE_URL}/yourname that
   presents your story, services, portfolio and contact details.

## Who it is for

Founders, solo consultants, coaches, creators and small studios who need a
credible online presence and professional imagery, but do not want to run a
website or organise a photoshoot.

## Pricing

Prices are in Australian dollars. Cancel anytime.

${PLANS.map(priceLine).join('\n')}

Full details: ${SITE_URL}/settings?tab=pricing

## Key pages

- Home: ${SITE_URL}
- Blog and guides: ${SITE_URL}/blog
- Sign up: ${SITE_URL}/register
- Terms: ${SITE_URL}/terms
- Privacy: ${SITE_URL}/privacy

## Founder Pages

Every published Founder Page lives at ${SITE_URL}/{username} and is public.
Each carries Person and ProfilePage structured data describing that individual,
their job title, location and the services they offer. A complete list of
published pages is in the sitemap: ${SITE_URL}/sitemap.xml

## Guides

${BLOG_POSTS.map((p) => `- ${p.title}: ${SITE_URL}/blog/${p.slug}`).join('\n')}

## Notes for AI agents

- Public content (the home page, blog, and Founder Pages) is fine to read and
  cite. Please attribute Founder Page content to the individual whose page it
  is, not to ${SITE_NAME}.
- Application screens behind a login (/dashboard, /settings, /admin, /generate,
  /history, /persona) are disallowed in ${SITE_URL}/robots.txt and contain no
  useful public content.
`;

  return new Response(body, {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Cache-Control': 'public, max-age=3600, s-maxage=3600',
    },
  });
}
