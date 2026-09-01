import { SITE_URL } from '../lib/founderPage';

// Authenticated application screens. These render nothing useful without a
// session, so crawling them wastes budget — and it kept the admin path in
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

export default function robots() {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: PRIVATE_PATHS,
      },
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: SITE_URL,
  };
}
