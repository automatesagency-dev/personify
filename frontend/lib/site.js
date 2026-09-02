// Canonical site identity. Single source for anything that needs the public
// origin or the default title/description — the root layout, robots, sitemap,
// and per-page metadata overrides.

export const SITE_URL = (
  process.env.NEXT_PUBLIC_SITE_URL || "https://personify.so"
).replace(/\/+$/, "");

export const SITE_NAME = "Personify";

export const SITE_TITLE = "Personify | AI-Powered Personal Branding";

export const SITE_DESCRIPTION =
  "Generate studio-quality AI photos of yourself and publish a Founder Page that showcases your story, services and work. Personal branding without the photoshoot.";
