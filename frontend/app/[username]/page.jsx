import { notFound } from 'next/navigation';
import PublicFounderPage from '../../views/PublicFounderPage';
import {
  fetchPublicFounderPage,
  founderPageSeo,
  SITE_URL,
} from '../../lib/founderPage';

// Rendered on the server and cached. Founder Pages change rarely, so an hour of
// staleness is a fair trade for pages that are served instantly and are fully
// readable by crawlers that do not execute JavaScript.
//
// Must be a literal — Next statically analyses segment config and rejects an
// imported identifier here.
export const revalidate = 3600;

export async function generateMetadata({ params, searchParams }) {
  const { username } = await params;
  const { preview } = (await searchParams) || {};

  // Preview renders unpublished content for its owner — never index it.
  if (preview === 'true') {
    return { title: 'Preview', robots: { index: false, follow: false } };
  }

  const page = await fetchPublicFounderPage(username);
  if (!page) {
    return { title: 'Page not found', robots: { index: false, follow: false } };
  }

  const seo = founderPageSeo(page, username);

  return {
    metadataBase: new URL(SITE_URL),
    title: seo.title,
    description: seo.description,
    alternates: { canonical: `/${username}` },
    openGraph: {
      type: 'profile',
      siteName: 'Personify',
      url: seo.url,
      title: seo.title,
      description: seo.description,
      ...(seo.image ? { images: [{ url: seo.image, alt: seo.name }] } : {}),
    },
    twitter: {
      card: seo.image ? 'summary_large_image' : 'summary',
      title: seo.title,
      description: seo.description,
      ...(seo.image ? { images: [seo.image] } : {}),
    },
    robots: { index: true, follow: true },
  };
}

export default async function FounderPageRoute({ params, searchParams }) {
  const { username } = await params;
  const { preview } = (await searchParams) || {};

  // Preview mode needs the owner's auth token, which only exists in the
  // browser, so that path still loads client-side.
  if (preview === 'true') {
    return <PublicFounderPage preview />;
  }

  const page = await fetchPublicFounderPage(username);

  // A missing or unpublished page must return a real 404 status. Previously it
  // rendered a "not found" message with an HTTP 200, so every mistyped URL was
  // an indexable soft-404.
  if (!page) notFound();

  return <PublicFounderPage page={page} />;
}
