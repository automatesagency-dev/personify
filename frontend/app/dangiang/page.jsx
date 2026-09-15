// Standalone one-off page for Dan Giang — deliberately independent of the
// Founder Page builder (own markup, own styling, own local image assets,
// no FounderPage DB model, no template system).
//
// This works because Next.js gives a static route precedence over a dynamic
// one: without this file, "/dangiang" would resolve to the builder's
// app/[username]/page.jsx (Dan already has a real, published Founder Page
// built through the normal builder there). This file shadows that path
// instead — deliberate, per request. The builder page's data is untouched
// and would resume working immediately if this file were ever removed.
export const dynamic = 'force-static'

import DanGiangPage from './DanGiangPage'

export const metadata = {
  title: 'Dan Giang — Speaker & Strategist',
  description: 'AI infrastructure, personal brand, and content systems that compound — keynotes, workshops, and advisory sessions with Dan Giang.',
  alternates: { canonical: '/dangiang' },
  robots: { index: true, follow: true },
}

export default function Page() {
  return <DanGiangPage />
}
