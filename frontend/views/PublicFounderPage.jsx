'use client'

import { useState, useEffect, Suspense } from 'react';
import founderPageAPI from '../services/founderPageAPI';
import { FAQ_PRESET_QUESTIONS } from '../lib/founderPage';

// ── Helpers ──────────────────────────────────────────────────────────────────

const ph = (val, fallback) => (val && val.trim()) ? val : fallback;

// Anchored sections sit underneath a fixed header, so jumping to one has to
// leave room for it or the heading lands behind the bar.
const ANCHOR = 'scroll-mt-20 md:scroll-mt-28';

// Long single words (a name, a domain, a pasted email) used to push the layout
// sideways on a phone. Applied wherever a founder's own text is rendered large.
const WRAP = 'break-words [overflow-wrap:anywhere]';

/**
 * Font size for the big display name.
 *
 * These headlines are sized in viewport units, so a long single word (a
 * double-barrelled surname, a brand with no spaces) had nowhere to go but a
 * mid-word break. Scaling to the longest word keeps it on one line instead.
 */
function displayFontSize(text, maxVw = 11.5, capRem = 10) {
  const words = String(text || '').split(/[\s\u2013\u2014-]+/).filter(Boolean);
  const longest = Math.max(1, ...words.map(w => w.length));
  const vw = Math.max(5.5, Math.min(maxVw, 125 / longest));
  return `clamp(1.75rem, ${vw.toFixed(1)}vw, ${capRem}rem)`;
}

function useScrolled(threshold = 40) {
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > threshold);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, [threshold]);
  return scrolled;
}

function ShareButton({ username, name, light = false, compact = false }) {
  const [copied, setCopied] = useState(false);
  const url = `https://personify.so/${username}`;

  const share = async () => {
    if (navigator.share) {
      try { await navigator.share({ title: `${name}'s Founder Page`, url }); return; } catch {}
    }
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {}
  };

  return (
    <button
      onClick={share}
      aria-label="Share this page"
      className={`inline-flex items-center gap-2 rounded-full font-semibold border transition active:scale-95 hover:opacity-70 ${
        compact ? 'h-10 w-10 justify-center text-base' : 'px-4 py-2 text-sm'
      } ${light ? 'border-white/25 text-white bg-white/5 backdrop-blur-sm' : 'border-gray-200 text-gray-700 bg-white/70 backdrop-blur-sm'}`}
    >
      <span aria-hidden="true">{copied ? '✓' : '↗'}</span>
      {!compact && <span>{copied ? 'Copied!' : 'Share'}</span>}
    </button>
  );
}

/**
 * Header shared by the personal templates: inline links on desktop, a
 * full-screen sheet on mobile.
 *
 * The executive template used to render a "☰" that linked straight to
 * #contact — it looked like a menu and behaved like nothing. Visitors on a
 * phone also never saw the hero call to action, because it lived in a column
 * hidden below the md breakpoint. Both are fixed here, once, for every
 * template that mounts this.
 */
function SiteNav({ name, logoUrl, links = [], cta, username, isPreview, dark = true, accent = '#ffffff', titleFont, uppercase = false }) {
  const [open, setOpen] = useState(false);
  const scrolled = useScrolled(40);

  // A sheet that scrolls the page behind it reads as broken on iOS.
  useEffect(() => {
    if (!open) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = previous; };
  }, [open]);

  // Close on Escape, and whenever the viewport grows past the sheet breakpoint.
  useEffect(() => {
    if (!open) return;
    const onKey = (e) => { if (e.key === 'Escape') setOpen(false); };
    const mq = window.matchMedia('(min-width: 768px)');
    const onChange = () => { if (mq.matches) setOpen(false); };
    window.addEventListener('keydown', onKey);
    mq.addEventListener('change', onChange);
    return () => { window.removeEventListener('keydown', onKey); mq.removeEventListener('change', onChange); };
  }, [open]);

  const shell = dark
    ? (scrolled ? 'bg-[#0b0b0b]/85 border-white/10 backdrop-blur-xl' : 'bg-gradient-to-b from-black/60 to-transparent border-transparent')
    : (scrolled ? 'bg-white/90 border-gray-100 backdrop-blur-xl' : 'bg-white/60 border-transparent backdrop-blur-sm');
  const textCol = dark ? 'text-white' : 'text-gray-900';
  const linkCol = dark ? 'text-white/65 hover:text-white' : 'text-gray-500 hover:text-gray-900';

  return (
    <>
      <header className={`fixed left-0 right-0 z-50 border-b transition-colors duration-300 ${shell} ${isPreview ? 'top-10' : 'top-0'}`}>
        <div className="mx-auto max-w-7xl px-5 md:px-10 h-16 md:h-20 flex items-center justify-between gap-3">
          <a href="#top" className={`flex items-center gap-2.5 min-w-0 ${textCol}`}>
            {logoUrl
              ? <img src={logoUrl} alt="" className="h-8 w-8 md:h-9 md:w-9 rounded-full object-cover flex-shrink-0 border border-white/15" />
              : <span className="h-8 w-8 md:h-9 md:w-9 rounded-full flex-shrink-0 flex items-center justify-center text-sm font-bold text-white" style={{ backgroundColor: accent }}>{(name || 'P')[0]}</span>
            }
            <span
              className={`truncate text-sm md:text-base font-bold ${uppercase ? 'tracking-[0.12em] uppercase' : ''}`}
              style={{ fontFamily: titleFont }}
            >
              {ph(name, 'Your Name')}
            </span>
          </a>

          <nav className="hidden md:flex items-center gap-8 text-sm font-medium">
            {links.map(l => (
              <a key={l.href} href={l.href} className={`transition ${linkCol}`}>{l.label}</a>
            ))}
          </nav>

          <div className="flex items-center gap-2 md:gap-3">
            <ShareButton username={username} name={name} light={dark} compact />
            {cta && (
              <a
                href={cta.href}
                className="hidden sm:inline-flex items-center gap-1.5 px-5 py-2.5 rounded-full text-sm font-bold transition hover:opacity-90 active:scale-95 shadow-lg"
                style={{ backgroundColor: cta.color, color: cta.textColor || '#000' }}
              >
                {cta.label}
              </a>
            )}
            <button
              onClick={() => setOpen(true)}
              aria-label="Open menu"
              aria-expanded={open}
              className={`md:hidden h-10 w-10 rounded-full border flex flex-col items-center justify-center gap-[5px] transition active:scale-95 ${dark ? 'border-white/20 bg-white/5' : 'border-gray-200 bg-white/70'}`}
            >
              <span className={`block h-px w-4 ${dark ? 'bg-white' : 'bg-gray-900'}`} />
              <span className={`block h-px w-4 ${dark ? 'bg-white' : 'bg-gray-900'}`} />
            </button>
          </div>
        </div>
      </header>

      {/* Mobile sheet */}
      <div
        className={`md:hidden fixed inset-0 z-[60] transition-opacity duration-200 ${open ? 'opacity-100' : 'pointer-events-none opacity-0'}`}
        role="dialog"
        aria-modal="true"
      >
        <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setOpen(false)} />
        <div
          className={`absolute inset-x-0 top-0 rounded-b-3xl p-5 pb-8 shadow-2xl transition-transform duration-300 ${open ? 'translate-y-0' : '-translate-y-full'} ${dark ? 'bg-[#101010] text-white' : 'bg-white text-gray-900'}`}
        >
          <div className="flex items-center justify-between mb-6">
            <span className={`text-sm font-bold truncate ${uppercase ? 'tracking-[0.12em] uppercase' : ''}`} style={{ fontFamily: titleFont }}>
              {ph(name, 'Your Name')}
            </span>
            <button
              onClick={() => setOpen(false)}
              aria-label="Close menu"
              className={`h-10 w-10 rounded-full border flex items-center justify-center text-lg ${dark ? 'border-white/20' : 'border-gray-200'}`}
            >
              ✕
            </button>
          </div>

          <nav className="flex flex-col">
            {links.map(l => (
              <a
                key={l.href}
                href={l.href}
                onClick={() => setOpen(false)}
                className={`py-4 text-xl font-semibold border-b flex items-center justify-between ${dark ? 'border-white/5' : 'border-gray-100'}`}
              >
                {l.label}
                <span className="opacity-30 text-base">→</span>
              </a>
            ))}
          </nav>

          {cta && (
            <a
              href={cta.href}
              onClick={() => setOpen(false)}
              className="mt-6 flex items-center justify-center gap-2 w-full px-6 py-4 rounded-full font-bold text-sm transition active:scale-95"
              style={{ backgroundColor: cta.color, color: cta.textColor || '#000' }}
            >
              {cta.label}
            </a>
          )}
        </div>
      </div>
    </>
  );
}

/**
 * Thumb-reach call to action for phones. It stays out of the way until the
 * visitor has scrolled past the hero, so it never covers the first screen.
 */
function MobileCTABar({ label, href, color, textColor = '#000', dark = true }) {
  const scrolled = useScrolled(520);
  const [atTarget, setAtTarget] = useState(false);

  // Once the visitor reaches the section the bar points at, the bar would only
  // be covering the very buttons it advertises.
  useEffect(() => {
    if (!href?.startsWith('#')) return;
    const el = document.getElementById(href.slice(1));
    if (!el || typeof IntersectionObserver === 'undefined') return;
    const io = new IntersectionObserver(([entry]) => setAtTarget(entry.isIntersecting), { rootMargin: '-25% 0px -10% 0px' });
    io.observe(el);
    return () => io.disconnect();
  }, [href]);

  const show = scrolled && !atTarget;
  if (!href) return null;
  return (
    <div
      className={`md:hidden fixed inset-x-0 bottom-0 z-40 px-4 pb-[calc(env(safe-area-inset-bottom)+0.75rem)] pt-3 transition-all duration-300 ${
        show ? 'translate-y-0 opacity-100' : 'translate-y-full opacity-0 pointer-events-none'
      } ${dark ? 'bg-gradient-to-t from-black via-black/90 to-transparent' : 'bg-gradient-to-t from-white via-white/95 to-transparent'}`}
    >
      <a
        href={href}
        className="flex items-center justify-center gap-2 w-full px-6 py-4 rounded-full font-bold text-sm shadow-xl transition active:scale-95"
        style={{ backgroundColor: color, color: textColor }}
      >
        {label}
      </a>
    </div>
  );
}

const STATIC_FAQS = [
  {
    q: 'What is Personify?',
    a: 'Personify is a personal branding platform built for founders, creators, and professionals. It combines AI-powered content generation with beautifully designed Founder Pages, so you can showcase who you are, what you do, and how you can help others, all from one place. Think of it as your personal brand engine.',
  },
  {
    q: 'What is a Founder Page?',
    a: "A Founder Page is your dedicated home on the internet: a professionally designed page that brings together your story, services, portfolio, and contact details. It's built for founders and professionals who want a polished, memorable online presence without the complexity of building a full website.",
  },
];

function FAQAccordion({ faqs, dark = false, accent }) {
  const [open, setOpen] = useState(null);
  const allFaqs = [
    ...STATIC_FAQS,
    ...(faqs || []).map(item => ({
      q: item.type === 'custom' ? item.customQuestion : FAQ_PRESET_QUESTIONS[item.type],
      a: item.answer,
    })).filter(f => f.q && f.a),
  ];

  return (
    <div className="space-y-3 max-w-3xl mx-auto">
      {allFaqs.map((faq, i) => {
        const isOpen = open === i;
        return (
          <div
            key={i}
            className={`rounded-2xl border transition-colors ${
              dark
                ? `bg-white/[0.04] ${isOpen ? 'border-white/20' : 'border-white/10'}`
                : `bg-white shadow-sm ${isOpen ? 'border-gray-300' : 'border-gray-200'}`
            }`}
          >
            <button
              onClick={() => setOpen(isOpen ? null : i)}
              aria-expanded={isOpen}
              className={`w-full flex items-start justify-between gap-4 px-5 md:px-6 py-5 text-left font-semibold text-[15px] md:text-base transition ${
                dark ? 'text-white' : 'text-gray-900'
              }`}
            >
              <span>{faq.q}</span>
              <span
                className={`mt-0.5 flex-shrink-0 h-6 w-6 rounded-full flex items-center justify-center text-lg font-light transition-transform duration-300 ${isOpen ? 'rotate-45' : ''}`}
                style={{ backgroundColor: (accent || (dark ? '#ffffff' : '#111111')) + '1f', color: accent || (dark ? '#ffffff' : '#111111') }}
                aria-hidden="true"
              >
                +
              </span>
            </button>
            {/* Animated open/close: a 0fr → 1fr grid row avoids measuring heights. */}
            <div className={`grid transition-all duration-300 ease-out ${isOpen ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'}`}>
              <div className="overflow-hidden">
                <p className={`px-5 md:px-6 pb-5 text-sm leading-relaxed ${dark ? 'text-gray-400' : 'text-gray-600'}`}>
                  {faq.a}
                </p>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ── Router ───────────────────────────────────────────────────────────────────

// Renders a Founder Page. `page` is supplied by the server component, so the
// full page is present in the initial HTML — this component still runs on the
// server for that first render, and only hydrates for the interactive pieces
// (share button, FAQ accordion).
//
// Preview is the one exception: it shows the owner their unpublished page and
// needs their auth token, which only exists in the browser, so that path
// fetches client-side and shows a loading state.
function PublicFounderPagePreview() {
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    founderPageAPI.getPreview()
      .then(res => setPage(res.data.founderPage))
      .catch(err => setError(err.response?.data?.error || 'Page not found'))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return (
    <div className="min-h-screen bg-black flex items-center justify-center text-white">
      <div className="text-center">
        <div className="animate-spin text-4xl mb-4">⏳</div>
        <p>Loading preview...</p>
      </div>
    </div>
  );

  if (error || !page) return (
    <div className="min-h-screen bg-black flex items-center justify-center text-white p-6">
      <div className="text-center">
        <div className="text-6xl mb-4">😕</div>
        <h1 className="text-2xl mb-2">Preview unavailable</h1>
        <p className="text-gray-400 mb-6">{error || 'No founder page found.'}</p>
        <a href="/founder-page" className="inline-block px-6 py-3 bg-white text-black rounded-lg font-bold hover:bg-gray-200 transition">
          Back to editor
        </a>
      </div>
    </div>
  );

  return <FounderPageBody page={page} isPreview />;
}

function FounderPageBody({ page, isPreview = false }) {
  return (
    <>
      {isPreview && (
        <div className="fixed top-0 left-0 right-0 z-[9999] bg-yellow-400 text-black text-sm font-semibold text-center py-2.5 px-4">
          👁️ Preview Mode: this is how your page will look when published.{' '}
          <button onClick={() => window.close()} className="underline ml-2">Close</button>
        </div>
      )}
      {page.template === 'visionary'
        ? <VisionaryTemplate page={page} isPreview={isPreview} />
        : page.template === 'executive'
        ? <ExecutiveTemplate page={page} isPreview={isPreview} />
        : page.template === 'ecommerce-classic'
        ? <EcommerceTemplate page={page} isPreview={isPreview} dark={false} />
        : page.template === 'ecommerce-bold'
        ? <EcommerceTemplate page={page} isPreview={isPreview} dark={true} />
        : <StorytellerTemplate page={page} isPreview={isPreview} />}
    </>
  );
}

export default function PublicFounderPage({ page, preview = false }) {
  if (preview) {
    return (
      <Suspense fallback={<div className="min-h-screen bg-black" />}>
        <PublicFounderPagePreview />
      </Suspense>
    );
  }
  return <FounderPageBody page={page} />;
}

// ── VISIONARY TEMPLATE ────────────────────────────────────────────────────────

function VisionaryTemplate({ page, isPreview }) {
  const { design, basicInfo, contact, services = [], portfolio = {}, featured = [], faq = [], username } = page;
  const pc = design.primaryColor;
  const sc = design.secondaryColor;

  const portfolioImages = (portfolio?.images || []).filter(i => i?.url);
  const featuredItems = (featured || []).filter(f => f.imageUrl);
  const activeServices = services.filter(s => s.title);

  const navLinks = [
    { href: '#about', label: 'About' },
    activeServices.length > 0 && { href: '#services', label: 'Services' },
    portfolioImages.length > 0 && { href: '#portfolio', label: 'Work' },
    { href: '#contact', label: 'Contact' },
  ].filter(Boolean);

  return (
    <div id="top" className="min-h-screen bg-white text-gray-900" style={{ fontFamily: design.bodyFont }}>

      <SiteNav
        name={basicInfo.name}
        logoUrl={basicInfo.logoUrl}
        links={navLinks}
        cta={{ href: '#contact', label: 'Get In Touch', color: pc, textColor: '#fff' }}
        username={username}
        isPreview={isPreview}
        dark={false}
        accent={pc}
        titleFont={design.titleFont}
      />

      {/* ── Hero ── */}
      <section className={`relative flex items-center overflow-hidden pb-12 md:min-h-screen ${isPreview ? 'pt-32 md:pt-36' : 'pt-24 md:pt-28'}`}>
        {/* Background radial accent */}
        <div className="absolute top-0 right-0 w-2/3 h-full pointer-events-none" style={{ background: `radial-gradient(ellipse at 80% 40%, ${pc}12 0%, transparent 65%)` }} />
        <div className="absolute bottom-0 left-0 w-64 h-64 rounded-full pointer-events-none" style={{ background: `radial-gradient(circle, ${sc}15 0%, transparent 70%)` }} />

        <div className="max-w-7xl mx-auto px-5 md:px-8 grid md:grid-cols-2 gap-10 lg:gap-20 items-center py-8 md:py-16 w-full">
          {/* Left: text */}
          <div className="space-y-5 md:space-y-7 order-2 md:order-1">
            <div className="inline-flex items-center gap-2.5 px-4 py-2 rounded-full text-[13px] md:text-sm font-semibold border" style={{ borderColor: pc + '30', color: pc, backgroundColor: pc + '08' }}>
              <span className="w-2 h-2 rounded-full animate-pulse" style={{ backgroundColor: pc }} />
              {ph(basicInfo.title, 'Founder · Speaker · Creator')}
            </div>

            <h1
              className={`font-bold leading-[1.05] ${WRAP}`}
              style={{ fontFamily: design.titleFont, color: pc, fontSize: displayFontSize(ph(basicInfo.name, 'Your Name Here'), 8, 4.5) }}
            >
              {ph(basicInfo.name, 'Your Name Here')}
            </h1>

            <p className="text-lg md:text-2xl font-medium leading-snug" style={{ color: sc }}>
              {ph(basicInfo.tagline, 'A short tagline that captures what you stand for')}
            </p>

            <p className="text-gray-500 text-base md:text-lg leading-relaxed max-w-lg">
              {ph(basicInfo.about1?.substring(0, 220), 'A compelling intro about what you do, who you help, and why you do it. Share what makes you uniquely positioned to serve your audience.')}
            </p>

            <div className="flex flex-col sm:flex-row flex-wrap gap-3 md:gap-4 pt-1">
              <a href="#contact" className="px-7 py-4 rounded-xl text-white font-bold text-[15px] text-center hover:opacity-90 transition active:scale-95 shadow-md" style={{ backgroundColor: pc }}>
                Work With Me →
              </a>
              {portfolioImages.length > 0 && (
                <a href="#portfolio" className="px-7 py-4 rounded-xl border-2 text-gray-700 font-bold text-[15px] text-center hover:bg-gray-50 transition active:scale-95" style={{ borderColor: pc + '30' }}>
                  See My Work
                </a>
              )}
            </div>

            {(contact.social1 || contact.social2) && (
              <div className="flex flex-wrap items-center gap-x-4 gap-y-2 pt-1">
                <span className="text-[11px] text-gray-400 uppercase tracking-wider font-medium">Find me on</span>
                <div className="flex flex-wrap gap-3">
                  {[contact.social1, contact.social2].filter(Boolean).map((handle, i) => (
                    <span key={i} className="text-sm font-bold" style={{ color: pc }}>{handle}</span>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Right: hero image */}
          <div className="relative flex justify-center md:justify-end order-1 md:order-2">
            <div className="relative w-full max-w-[280px] sm:max-w-sm">
              {basicInfo.heroImageUrl ? (
                <div className="relative rounded-3xl overflow-hidden shadow-2xl aspect-[3/4]">
                  <img src={basicInfo.heroImageUrl} alt={basicInfo.name} className="w-full h-full object-cover" />
                  <div className="absolute inset-0 pointer-events-none" style={{ background: `linear-gradient(to top, ${pc}50 0%, transparent 50%)` }} />
                </div>
              ) : (
                <div className="rounded-3xl aspect-[3/4] flex flex-col items-center justify-center gap-3" style={{ background: `linear-gradient(135deg, ${pc}12, ${sc}12)`, border: `2px dashed ${pc}25` }}>
                  <div className="text-5xl opacity-25">📸</div>
                  <p className="text-sm text-gray-400">Your hero photo</p>
                </div>
              )}
              {/* Floating card. Pulled inside the frame on phones, where a
                  negative offset used to hang off the edge of the screen, and
                  no longer repeating the role badge a few pixels away. */}
              <div className="absolute bottom-3 -left-2 sm:-bottom-5 sm:-left-5 bg-white rounded-2xl shadow-xl p-3.5 sm:p-4 border border-gray-100 max-w-[75%]">
                <p className="text-[11px] text-gray-400 mb-0.5">{contact.location ? 'Based in' : 'Available for'}</p>
                <p className={`text-sm font-bold ${WRAP}`} style={{ color: pc }}>{contact.location || 'New opportunities'}</p>
              </div>
              {/* Accent dot */}
              <div className="absolute -top-3 -right-3 sm:-top-4 sm:-right-4 w-12 h-12 sm:w-14 sm:h-14 rounded-2xl flex items-center justify-center text-white font-bold text-lg shadow-lg" style={{ backgroundColor: sc }}>
                ✦
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Brand strip ── */}
      <div className="py-4 md:py-5 border-y" style={{ borderColor: pc + '15', backgroundColor: pc + '06' }}>
        <div className="max-w-7xl mx-auto px-5 flex flex-wrap items-center justify-center gap-x-6 md:gap-x-10 gap-y-2">
          {['Founder', 'Speaker', 'Advisor', 'Creator', 'Connector'].map((tag, i) => (
            <span key={i} className="text-[10px] md:text-[11px] font-bold tracking-[0.2em] uppercase" style={{ color: pc + '70' }}>
              {tag}
            </span>
          ))}
        </div>
      </div>

      <main className="max-w-7xl mx-auto px-5 md:px-8 py-16 md:py-24 space-y-20 md:space-y-28">

        {/* ── About ── */}
        <section id="about" className={ANCHOR}>
          <div className="grid md:grid-cols-[280px_1fr] gap-8 md:gap-16 lg:gap-20 items-start">
            <div>
              <p className="text-[11px] font-bold tracking-[0.25em] uppercase mb-3" style={{ color: pc }}>About</p>
              <h2 className="text-[26px] md:text-4xl font-bold leading-tight" style={{ fontFamily: design.titleFont, color: pc }}>
                The Story Behind the Work
              </h2>
              <div className="mt-5 w-12 h-1 rounded-full" style={{ backgroundColor: sc }} />
            </div>
            <div className="space-y-5 text-gray-600 text-base md:text-lg leading-relaxed">
              <p>{ph(basicInfo.about1, 'Share your story here: what drives you, what you have built, and what you believe in. This is your chance to connect authentically with the people visiting your page.')}</p>
              {basicInfo.about2 && <p>{basicInfo.about2}</p>}
            </div>
          </div>
        </section>

        {/* ── Services ── */}
        {activeServices.length > 0 && (
          <section id="services" className={ANCHOR}>
            <div className="mb-8 md:mb-12">
              <p className="text-[11px] font-bold tracking-[0.25em] uppercase mb-3" style={{ color: pc }}>Services</p>
              <h2 className="text-[26px] md:text-4xl font-bold" style={{ fontFamily: design.titleFont, color: pc }}>How I Can Help</h2>
            </div>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
              {activeServices.map((s, i) => (
                <div key={i} className="group relative p-6 md:p-8 rounded-2xl border border-gray-100 bg-white hover:shadow-xl hover:-translate-y-1 transition-all duration-300 overflow-hidden">
                  <div className="absolute top-0 left-0 w-1 h-full" style={{ backgroundColor: pc }} />
                  <div className="w-11 h-11 md:w-12 md:h-12 rounded-xl mb-5 flex items-center justify-center font-bold" style={{ backgroundColor: pc + '12', color: pc }}>
                    {String(i + 1).padStart(2, '0')}
                  </div>
                  <h3 className={`text-lg md:text-xl font-bold mb-2.5 ${WRAP}`} style={{ color: pc }}>{s.title}</h3>
                  <p className="text-gray-500 leading-relaxed text-sm">{ph(s.description, 'Description of this service and the results it delivers for your clients.')}</p>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* ── Portfolio ── */}
        {portfolioImages.length > 0 && (
          <section id="portfolio" className={ANCHOR}>
            <p className="text-[11px] font-bold tracking-[0.25em] uppercase mb-3" style={{ color: pc }}>Portfolio</p>
            <h2 className="text-[26px] md:text-4xl font-bold mb-8 md:mb-12" style={{ fontFamily: design.titleFont, color: pc }}>Selected Work</h2>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3 md:gap-4">
              {portfolioImages.map((img, i) => (
                <div key={i} className="group relative aspect-square rounded-xl md:rounded-2xl overflow-hidden bg-gray-100">
                  <img src={img.url} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" alt="Portfolio" loading="lazy" />
                  <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center" style={{ backgroundColor: pc + 'CC' }}>
                    <span className="text-white text-3xl">↗</span>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* ── Featured ── */}
        {featuredItems.length > 0 && (
          <section id="featured" className={ANCHOR}>
            <p className="text-[11px] font-bold tracking-[0.25em] uppercase mb-3" style={{ color: pc }}>Featured</p>
            <h2 className="text-[26px] md:text-4xl font-bold mb-8 md:mb-12" style={{ fontFamily: design.titleFont, color: pc }}>Featured Work</h2>
            <div className="space-y-10 md:space-y-8">
              {featuredItems.map((work, i) => (
                <div key={i} className={`grid md:grid-cols-2 gap-5 md:gap-8 items-center ${i % 2 === 1 ? 'md:[direction:rtl]' : ''}`}>
                  <div className="rounded-2xl overflow-hidden shadow-lg aspect-video [direction:ltr] bg-gray-100">
                    <img src={work.imageUrl} className="w-full h-full object-cover" alt={work.title} loading="lazy" />
                  </div>
                  <div className="space-y-3 [direction:ltr]">
                    {work.year && <p className="text-[11px] font-bold tracking-widest uppercase text-gray-400">{work.year}</p>}
                    <h3 className={`text-2xl md:text-3xl font-bold ${WRAP}`} style={{ color: pc }}>{work.title}</h3>
                    {work.subtitle && <p className="text-gray-500 text-base md:text-lg">{work.subtitle}</p>}
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}
      </main>

      {/* ── CTA ── */}
      <section id="contact" className={`py-20 md:py-28 px-5 md:px-8 relative overflow-hidden ${ANCHOR}`} style={{ background: `linear-gradient(135deg, ${pc} 0%, ${sc} 100%)` }}>
        <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(circle at 20% 50%, white 1px, transparent 1px), radial-gradient(circle at 80% 20%, white 1px, transparent 1px)', backgroundSize: '60px 60px' }} />
        <div className="max-w-4xl mx-auto text-center text-white relative z-10">
          <h2 className="text-[30px] md:text-5xl font-bold mb-5" style={{ fontFamily: design.titleFont }}>
            {ph(contact.ctaText, "Let's Work Together")}
          </h2>
          <p className="text-white/80 text-base md:text-xl mb-10 md:mb-12 max-w-2xl mx-auto leading-relaxed">
            {ph(contact.ctaDescription, "Ready to take your brand to the next level? Reach out and let's build something meaningful together.")}
          </p>
          <div className="flex flex-col sm:flex-row flex-wrap justify-center gap-3 md:gap-4">
            {contact.email && (
              <a href={`mailto:${contact.email}`} className={`px-7 py-4 bg-white rounded-xl font-bold text-[15px] hover:bg-gray-100 transition active:scale-95 shadow-lg ${WRAP}`} style={{ color: pc }}>
                ✉ {contact.email}
              </a>
            )}
            {contact.phone && (
              <a href={`tel:${contact.phone}`} className="px-7 py-4 bg-white/20 border border-white/40 backdrop-blur rounded-xl font-bold text-white text-[15px] hover:bg-white/30 transition active:scale-95">
                ☎ {contact.phone}
              </a>
            )}
            {contact.location && (
              <div className="px-7 py-4 bg-white/20 border border-white/40 backdrop-blur rounded-xl font-bold text-white text-[15px]">
                📍 {contact.location}
              </div>
            )}
          </div>
        </div>
      </section>

      {/* ── FAQ ── */}
      <section className="py-16 md:py-24 px-5 md:px-8 bg-gray-50">
        <div className="max-w-7xl mx-auto">
          <p className="text-[11px] font-bold tracking-[0.25em] uppercase text-center mb-3" style={{ color: pc }}>FAQ</p>
          <h2 className="text-[26px] md:text-4xl font-bold text-center mb-8 md:mb-12" style={{ fontFamily: design.titleFont, color: pc }}>Common Questions</h2>
          <FAQAccordion faqs={faq} dark={false} accent={pc} />
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="py-10 pb-28 md:pb-10 border-t border-gray-100 text-center px-5">
        <p className="text-gray-400 text-sm leading-relaxed">
          Made with ❤️ by <span className="font-semibold text-gray-600">{basicInfo.name || username}</span> · Powered by{' '}
          <a href="https://personify.so" className="font-semibold hover:underline" style={{ color: pc }}>Personify</a>
        </p>
      </footer>

      <MobileCTABar label="Work With Me →" href="#contact" color={pc} textColor="#fff" dark={false} />
    </div>
  );
}

// ── STORYTELLER TEMPLATE ──────────────────────────────────────────────────────

function StorytellerTemplate({ page, isPreview }) {
  const { design, basicInfo, contact, services = [], portfolio = {}, featured = [], faq = [], username } = page;
  const pc = design.primaryColor;
  const sc = design.secondaryColor;

  const portfolioImages = (portfolio?.images || []).filter(i => i?.url);
  const featuredItems = (featured || []).filter(f => f.imageUrl);
  const activeServices = services.filter(s => s.title);

  const navLinks = [
    { href: '#story', label: 'Story' },
    portfolioImages.length > 0 && { href: '#portfolio', label: 'Visuals' },
    activeServices.length > 0 && { href: '#services', label: 'Expertise' },
    { href: '#contact', label: 'Connect' },
  ].filter(Boolean);

  return (
    <div id="top" className="min-h-screen bg-[#080808] text-white" style={{ fontFamily: design.bodyFont }}>

      {/* The logo lockup used to float loose at the top of the hero with no
          navigation anywhere on the page. */}
      <SiteNav
        name={basicInfo.name}
        logoUrl={basicInfo.logoUrl}
        links={navLinks}
        cta={{ href: '#contact', label: "Let's Talk", color: sc, textColor: '#000' }}
        username={username}
        isPreview={isPreview}
        dark
        accent={pc}
        titleFont={design.titleFont}
      />

      {/* ── Hero ── */}
      <section className="relative min-h-[100svh] flex flex-col items-center justify-center text-center px-5 py-28 md:py-32 overflow-hidden">
        {basicInfo.heroImageUrl ? (
          <div className="absolute inset-0 z-0">
            <img src={basicInfo.heroImageUrl} className="w-full h-full object-cover object-[center_25%]" alt={ph(basicInfo.name, 'Hero')} />
            <div className="absolute inset-0" style={{ background: 'linear-gradient(to bottom, rgba(8,8,8,0.55) 0%, rgba(8,8,8,0.7) 50%, #080808 100%)' }} />
          </div>
        ) : (
          <div className="absolute inset-0 z-0" style={{ background: `radial-gradient(ellipse at 50% 50%, ${pc}25 0%, #080808 65%)` }} />
        )}

        {/* Main hero text */}
        <div className="relative z-10 space-y-5 md:space-y-6 max-w-5xl my-auto w-full">
          <p className="text-[10px] md:text-xs font-bold tracking-[0.3em] md:tracking-[0.35em] uppercase text-white/45">
            {ph(basicInfo.title, 'Founder · Speaker · Creator')}
          </p>
          <h1
            className={`font-bold leading-[0.9] ${WRAP}`}
            style={{ fontFamily: design.titleFont, color: sc, fontSize: displayFontSize(ph(basicInfo.name, 'Your Name'), 11, 8.5) }}
          >
            {ph(basicInfo.name, 'Your Name')}
          </h1>
          <p className="text-lg md:text-2xl text-white/55 max-w-2xl mx-auto font-light leading-relaxed">
            {ph(basicInfo.tagline, 'A short tagline that captures your essence')}
          </p>
          <div className="flex items-center justify-center gap-3 pt-3 flex-wrap">
            <a href="#story" className="px-7 py-4 rounded-full font-bold text-sm text-black hover:opacity-90 transition active:scale-95 shadow-xl" style={{ backgroundColor: sc }}>
              Read My Story ↓
            </a>
            <a href="#contact" className="px-7 py-4 rounded-full font-bold text-sm border border-white/25 bg-white/5 backdrop-blur-sm text-white hover:bg-white/10 transition active:scale-95">
              Get in touch
            </a>
          </div>
        </div>

        {/* Scroll indicator */}
        <div className="relative z-10 mt-auto flex flex-col items-center gap-2 text-white/25">
          <span className="text-[10px] tracking-widest uppercase">Scroll</span>
          <div className="w-px h-8 md:h-10 bg-gradient-to-b from-white/25 to-transparent" />
        </div>
      </section>

      <main className="max-w-6xl mx-auto px-5 md:px-8 space-y-20 md:space-y-32 py-20 md:py-32">

        {/* ── Story / About ── */}
        <section id="story" className={ANCHOR}>
          <div className="grid md:grid-cols-[220px_1fr] gap-8 md:gap-16 lg:gap-20 items-start">
            <div className="md:sticky md:top-28">
              <p className="text-[11px] font-bold tracking-[0.3em] uppercase mb-4" style={{ color: sc }}>The Story</p>
              <div className="w-10 h-px mb-6" style={{ backgroundColor: sc }} />
              {basicInfo.logoUrl && (
                <img src={basicInfo.logoUrl} alt={basicInfo.name} className="w-14 h-14 md:w-16 md:h-16 rounded-full object-cover border border-white/10" loading="lazy" />
              )}
            </div>
            <div className="space-y-6 md:space-y-8">
              <p className="text-xl md:text-3xl font-light leading-relaxed italic" style={{ color: 'rgba(255,255,255,0.88)' }}>
                "{ph(basicInfo.about1, 'Share your story here: what drives you, what you have built, and what you believe in. This is your chance to connect authentically with people.')}"
              </p>
              {basicInfo.about2 && (
                <p className="text-base md:text-lg text-gray-400 leading-relaxed">{basicInfo.about2}</p>
              )}
            </div>
          </div>
        </section>

        {/* ── Visuals / Portfolio ── */}
        {portfolioImages.length > 0 && (
          <section id="portfolio" className={ANCHOR}>
            <p className="text-[11px] font-bold tracking-[0.3em] uppercase mb-8 md:mb-12" style={{ color: sc }}>Visuals</p>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2.5 md:gap-3">
              {portfolioImages.map((img, i) => (
                <div key={i} className={`group relative overflow-hidden rounded-xl md:rounded-2xl bg-zinc-900 ${i === 0 ? 'row-span-2' : ''}`}
                  style={{ aspectRatio: i === 0 ? '1/2.1' : '1/1' }}>
                  <img src={img.url} className="w-full h-full object-cover grayscale group-hover:grayscale-0 scale-105 group-hover:scale-100 transition-all duration-700" alt="Visual" loading="lazy" />
                </div>
              ))}
            </div>
          </section>
        )}

        {/* ── Expertise / Services ── */}
        {activeServices.length > 0 && (
          <section id="services" className={ANCHOR}>
            <p className="text-[11px] font-bold tracking-[0.3em] uppercase mb-8 md:mb-12" style={{ color: sc }}>Expertise</p>
            <div className="grid md:grid-cols-2 gap-3 md:gap-5">
              {activeServices.map((s, i) => (
                <div key={i} className="relative p-6 md:p-8 rounded-2xl bg-zinc-900/60 border border-white/5 hover:border-white/15 hover:-translate-y-1 transition-all duration-300 group overflow-hidden">
                  <div className="absolute left-0 top-0 bottom-0 w-[3px] rounded-l-2xl" style={{ backgroundColor: sc }} />
                  <p className="text-[11px] font-bold tracking-[0.3em] uppercase mb-3 text-white/25">{String(i + 1).padStart(2, '0')}</p>
                  <h3 className={`text-xl md:text-2xl font-bold mb-3 ${WRAP}`} style={{ color: sc }}>{s.title}</h3>
                  <p className="text-gray-400 leading-relaxed text-[15px]">{ph(s.description, 'How this expertise creates value and the results you deliver.')}</p>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* ── Featured Works ── */}
        {featuredItems.length > 0 && (
          <section id="featured" className={ANCHOR}>
            <p className="text-[11px] font-bold tracking-[0.3em] uppercase mb-8 md:mb-12" style={{ color: sc }}>Selected Works</p>
            <div className="space-y-3 md:space-y-4">
              {featuredItems.map((work, i) => (
                <div key={i} className="group relative overflow-hidden rounded-2xl md:rounded-3xl h-[300px] sm:h-[380px] md:h-[440px]">
                  <img src={work.imageUrl} className="w-full h-full object-cover transition-transform duration-[1500ms] group-hover:scale-105" alt={work.title} loading="lazy" />
                  <div className="absolute inset-0" style={{ background: 'linear-gradient(to top, rgba(0,0,0,0.85) 0%, rgba(0,0,0,0.2) 50%, transparent 100%)' }} />
                  <div className="absolute bottom-0 left-0 right-0 p-6 md:p-8 md:translate-y-2 md:group-hover:translate-y-0 transition-transform duration-500">
                    {work.year && <p className="text-[10px] md:text-[11px] font-bold tracking-widest uppercase mb-2 text-white/45">{work.year}</p>}
                    <h3 className={`text-2xl md:text-3xl font-bold mb-1 ${WRAP}`}>{work.title}</h3>
                    {work.subtitle && <p className="text-gray-300 text-sm md:text-base">{work.subtitle}</p>}
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* ── Contact / CTA ── */}
        <section id="contact" className={`text-center py-10 md:py-16 relative ${ANCHOR}`}>
          <div className="absolute inset-0 rounded-3xl pointer-events-none" style={{ background: `radial-gradient(ellipse at 50% 50%, ${pc}18 0%, transparent 70%)` }} />
          <div className="relative z-10">
            <p className="text-[11px] font-bold tracking-[0.3em] uppercase mb-5" style={{ color: sc }}>Connect</p>
            <h2 className="text-4xl md:text-6xl font-bold mb-5" style={{ fontFamily: design.titleFont }}>
              {ph(contact.ctaText, "Let's Connect")}
            </h2>
            <p className="text-gray-400 text-base md:text-xl mb-10 md:mb-12 max-w-2xl mx-auto leading-relaxed">
              {ph(contact.ctaDescription, "I'm always open to interesting conversations, collaborations, and opportunities.")}
            </p>
            <div className="flex flex-wrap justify-center gap-3">
              {contact.email && (
                <a href={`mailto:${contact.email}`} className="px-7 py-4 bg-white text-black rounded-full font-bold hover:bg-gray-100 transition active:scale-95 text-sm">
                  Email Me →
                </a>
              )}
              {contact.phone && (
                <a href={`tel:${contact.phone}`} className="px-7 py-4 border border-white/15 rounded-full font-bold hover:bg-white/5 transition active:scale-95 text-sm">
                  {contact.phone}
                </a>
              )}
              {/* Handles are stored as free text, not URLs, so these are labels
                  rather than links that would have jumped back to the top. */}
              {[contact.social1, contact.social2].filter(Boolean).map((handle, i) => (
                <span key={i} className={`px-7 py-4 border border-white/15 rounded-full font-bold text-sm text-white/80 ${WRAP}`}>
                  {handle}
                </span>
              ))}
              {contact.location && (
                <span className="px-7 py-4 border border-white/15 rounded-full font-bold text-sm text-white/80">
                  📍 {contact.location}
                </span>
              )}
            </div>
          </div>
        </section>
      </main>

      {/* ── FAQ ── */}
      <section className="py-16 md:py-24 px-5 md:px-8 border-t border-white/5">
        <div className="max-w-6xl mx-auto">
          <p className="text-[11px] font-bold tracking-[0.3em] uppercase text-center mb-3" style={{ color: sc }}>FAQ</p>
          <h2 className="text-[26px] md:text-4xl font-bold text-center mb-10 md:mb-12" style={{ fontFamily: design.titleFont }}>Common Questions</h2>
          <FAQAccordion faqs={faq} dark accent={sc} />
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="py-10 pb-28 md:pb-10 border-t border-white/5 text-center px-5">
        <p className="text-white/20 text-[11px] tracking-widest uppercase leading-relaxed">
          Crafted by <span className="text-white/35">{basicInfo.name || username}</span> · Powered by{' '}
          <a href="https://personify.so" className="text-white/35 hover:text-white/55 transition">Personify</a>
        </p>
      </footer>

      <MobileCTABar label="Get in touch" href="#contact" color={sc} textColor="#000" dark />
    </div>
  );
}

// ── EXECUTIVE TEMPLATE ────────────────────────────────────────────────────────

function ExecutiveTemplate({ page, isPreview }) {
  const { design, basicInfo, contact, services = [], portfolio = {}, featured = [], faq = [], username } = page;
  const pc = design.primaryColor;
  const sc = design.secondaryColor;

  const portfolioImages = (portfolio?.images || []).filter(i => i?.url);
  const featuredItems = (featured || []).filter(f => f.imageUrl);
  const activeServices = services.filter(s => s.title);

  const name = ph(basicInfo.name, 'Your Name');
  // The hero teases with the tagline and the about section carries the full
  // story; before this both rendered the same about1 text.
  const heroPitch = ph(basicInfo.tagline, ph(basicInfo.about1, 'Driven by strategy and powered by systems that turn personal stories into scalable digital influence.'));

  const navLinks = [
    { href: '#about', label: 'About' },
    activeServices.length > 0 && { href: '#services', label: 'Services' },
    featuredItems.length > 0 && { href: '#featured', label: 'Work' },
    { href: '#contact', label: 'Contact' },
  ].filter(Boolean);

  // The fan of photos used hard-coded pixel offsets, so on a phone the outer
  // cards were pushed past the edge and clipped. Offsets are now expressed in
  // em and the container's font size shrinks with the viewport, which scales
  // the whole arrangement instead of cropping it.
  const fanConfig = [
    { rotate: -28, tx: -10,   ty: 1.25, z: 1 },
    { rotate: -14, tx: -5.3,  ty: 0.5,  z: 2 },
    { rotate: -4,  tx: -0.9,  ty: 0,    z: 4 },
    { rotate: 8,   tx: 3.4,   ty: 0.4,  z: 3 },
    { rotate: 20,  tx: 7.8,   ty: 1.1,  z: 2 },
    { rotate: 32,  tx: 11.5,  ty: 1.9,  z: 1 },
  ];

  const contactItems = [
    contact.email    && { icon: '✉', label: 'Email',    value: contact.email,    href: `mailto:${contact.email}` },
    contact.phone    && { icon: '☎', label: 'Phone',    value: contact.phone,    href: `tel:${contact.phone}` },
    contact.location && { icon: '📍', label: 'Location', value: contact.location, href: null },
    contact.social1  && { icon: '✦', label: 'Social',   value: contact.social1,  href: null },
    contact.social2  && { icon: '✦', label: 'Social',   value: contact.social2,  href: null },
  ].filter(Boolean);

  return (
    <div id="top" className="min-h-screen bg-[#0c0c0c] text-white" style={{ fontFamily: design.bodyFont }}>

      <SiteNav
        name={basicInfo.name}
        logoUrl={basicInfo.logoUrl}
        links={navLinks}
        cta={{ href: '#contact', label: '✦ Work With Me', color: sc, textColor: '#000' }}
        username={username}
        isPreview={isPreview}
        dark
        accent={pc}
        titleFont={design.titleFont}
        uppercase
      />

      {/* ── Hero ── */}
      <section className="relative flex min-h-[100svh] flex-col justify-end overflow-hidden">
        {basicInfo.heroImageUrl ? (
          <div className="absolute inset-0">
            {/* object-top cropped a portrait down to a strip of sky on wide
                screens; anchoring around the upper third keeps the subject in
                frame at every aspect ratio. */}
            <img
              src={basicInfo.heroImageUrl}
              className="w-full h-full object-cover object-[center_22%] md:object-[center_30%]"
              alt={name}
            />
            <div className="absolute inset-0" style={{ background: 'linear-gradient(to bottom, rgba(0,0,0,0.55) 0%, rgba(0,0,0,0.15) 28%, rgba(12,12,12,0.7) 62%, #0c0c0c 100%)' }} />
            <div className="absolute inset-0 hidden md:block" style={{ background: 'linear-gradient(to right, rgba(12,12,12,0.55) 0%, transparent 35%, transparent 65%, rgba(12,12,12,0.55) 100%)' }} />
          </div>
        ) : (
          <div className="absolute inset-0 flex items-center justify-center" style={{ background: `radial-gradient(ellipse at 50% 30%, ${pc}25 0%, #0c0c0c 65%)` }}>
            <div className="text-center text-gray-600">
              <div className="text-6xl mb-3 opacity-40">📸</div>
              <p className="text-sm">Add your hero photo in Basic Info</p>
            </div>
          </div>
        )}

        {/* Mobile reads top to bottom: role, name, pitch, action. On desktop the
            role and the pitch sit on one line with the name beneath them. */}
        <div className="relative z-10 mx-auto w-full max-w-7xl px-5 md:px-10 pt-24 md:pt-32 pb-8 md:pb-12">
          <div className="flex flex-col gap-y-6 md:grid md:grid-cols-2 md:gap-x-10">
            <div className="order-1 md:col-start-1 md:row-start-1 md:self-end md:max-w-xs">
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border border-white/20 text-[11px] md:text-xs font-semibold tracking-wide text-white/85 mb-4 backdrop-blur-md" style={{ backgroundColor: 'rgba(255,255,255,0.07)' }}>
                <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
                {ph(contact.ctaText, 'Book a strategy call')}
              </div>
              <p className={`text-white text-xl md:text-lg font-semibold leading-snug ${WRAP}`} style={{ fontFamily: design.titleFont }}>
                {ph(basicInfo.title, 'Personal Brand Strategist & Founder')}
              </p>
            </div>

            {/* Previously hidden below md, which left the phone hero with no
                intro and no call to action at all. */}
            <div className="order-3 flex flex-col items-start md:col-start-2 md:row-start-1 md:self-end md:justify-self-end md:items-end md:max-w-sm md:text-right">
              <p className="text-white/70 text-[15px] md:text-sm leading-relaxed mb-5">
                {heroPitch.length > 170 ? `${heroPitch.slice(0, 170).trimEnd()}…` : heroPitch}
              </p>
              <div className="flex flex-wrap items-center gap-3">
                <a href="#contact" className="inline-flex items-center gap-2 px-6 py-3.5 rounded-full font-bold text-sm transition hover:opacity-90 active:scale-95 shadow-xl" style={{ backgroundColor: sc, color: '#000' }}>
                  ✦ WORK WITH ME
                </a>
                {(featuredItems.length > 0 || portfolioImages.length > 0) && (
                  <a href={featuredItems.length > 0 ? '#featured' : '#about'} className="inline-flex items-center gap-2 px-6 py-3.5 rounded-full border border-white/25 bg-white/5 backdrop-blur-sm font-bold text-sm text-white transition hover:bg-white/10 active:scale-95">
                    See the work
                  </a>
                )}
              </div>
            </div>

            <h1
              className={`order-2 md:col-span-2 md:row-start-2 md:mt-12 font-black leading-[0.85] tracking-tight uppercase text-white ${WRAP}`}
              style={{ fontFamily: design.titleFont, fontSize: displayFontSize(name, 11.5, 10) }}
            >
              {name}
            </h1>
          </div>
        </div>

        <div className="relative z-10 hidden md:flex items-center justify-center gap-2 pb-6 text-[10px] uppercase tracking-[0.3em] text-white/30">
          <span>Scroll</span>
          <span className="h-px w-8 bg-white/25" />
        </div>
      </section>

      {/* ── Positioning + photo strip ── */}
      <section id="about" className={`px-5 md:px-10 py-20 md:py-28 ${ANCHOR}`}>
        <div className="max-w-7xl mx-auto">
          <p className="text-[11px] font-bold tracking-[0.3em] uppercase text-center mb-5" style={{ color: sc }}>About</p>
          <h2 className="text-[26px] md:text-5xl font-bold text-center mb-5 leading-tight max-w-3xl mx-auto" style={{ fontFamily: design.titleFont }}>
            The Story Behind the Work
          </h2>
          <p className="text-gray-400 text-center max-w-2xl mx-auto mb-12 md:mb-14 leading-relaxed text-[15px] md:text-lg">
            {ph(basicInfo.about1, 'I help founders, entrepreneurs, and professionals build powerful personal brands using AI-first systems that drive visibility, authority, and growth.')}
          </p>
          {basicInfo.about2 && (
            <p className="text-gray-500 text-center max-w-2xl mx-auto -mt-8 mb-12 md:mb-14 leading-relaxed text-sm md:text-base">
              {basicInfo.about2}
            </p>
          )}
          {portfolioImages.length > 0 && (
            <div className="grid grid-cols-3 gap-2.5 md:gap-4">
              {portfolioImages.slice(0, 3).map((img, i) => (
                <div key={i} className="rounded-xl md:rounded-2xl overflow-hidden aspect-[3/4] bg-zinc-900">
                  <img src={img.url} className="w-full h-full object-cover hover:scale-105 transition-transform duration-700" alt="" loading="lazy" />
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* ── Services ── */}
      {activeServices.length > 0 && (
        <section id="services" className={`px-5 md:px-10 py-16 md:py-24 border-t border-white/5 ${ANCHOR}`}>
          <div className="max-w-7xl mx-auto">
            <p className="text-[11px] font-bold tracking-[0.3em] uppercase mb-4" style={{ color: sc }}>Services</p>
            <h2 className="text-[26px] md:text-4xl font-bold mb-3 leading-tight" style={{ fontFamily: design.titleFont }}>
              Building Powerful Brand Systems
            </h2>
            <p className="text-gray-400 max-w-2xl mb-10 md:mb-12 leading-relaxed text-[15px]">
              I design and implement strategies that transform how you create content, build your brand, and grow your business.
            </p>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4">
              {activeServices.map((s, i) => (
                <div key={i} className="group relative overflow-hidden bg-[#141414] rounded-2xl p-6 md:p-7 border border-white/5 hover:border-white/15 hover:-translate-y-1 transition-all duration-300">
                  <div className="absolute inset-x-0 top-0 h-px opacity-0 group-hover:opacity-100 transition-opacity" style={{ background: `linear-gradient(to right, transparent, ${sc}, transparent)` }} />
                  <p className="text-xl md:text-2xl font-bold mb-4" style={{ color: sc }}>{String(i + 1).padStart(2, '0')}</p>
                  <h3 className={`text-lg font-bold text-white mb-2.5 ${WRAP}`}>{s.title}</h3>
                  <p className="text-gray-500 text-sm leading-relaxed">{ph(s.description, 'Description of this service and the value it delivers.')}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ── Featured ── */}
      {featuredItems.length > 0 && (
        <section id="featured" className={`px-5 md:px-10 py-16 md:py-24 border-t border-white/5 ${ANCHOR}`}>
          <div className="max-w-7xl mx-auto">
            <p className="text-[11px] font-bold tracking-[0.3em] uppercase mb-4" style={{ color: sc }}>Selected work</p>
            <h2 className="text-[26px] md:text-4xl font-bold mb-3" style={{ fontFamily: design.titleFont }}>Featured Systems & Projects</h2>
            <p className="text-gray-500 mb-10 text-sm max-w-2xl leading-relaxed">A showcase of content systems, brand frameworks, and digital infrastructures built to turn identity into leverage.</p>
            <div className="grid md:grid-cols-2 gap-3 md:gap-4">
              {featuredItems.map((work, i) => (
                <div key={i} className="group relative rounded-2xl overflow-hidden aspect-[4/3] md:aspect-video bg-zinc-900">
                  <img src={work.imageUrl} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" alt={work.title} loading="lazy" />
                  <div className="absolute inset-0" style={{ background: 'linear-gradient(to top, rgba(0,0,0,0.88) 0%, rgba(0,0,0,0.15) 55%, transparent 100%)' }} />
                  <div className="absolute bottom-0 left-0 right-0 p-5 md:p-6">
                    {work.year && <p className="text-[10px] text-white/40 uppercase tracking-widest mb-1.5 font-bold">{work.year}</p>}
                    <h3 className={`text-lg md:text-xl font-bold ${WRAP}`}>{work.title}</h3>
                    {work.subtitle && <p className="text-gray-300 text-sm mt-1">{work.subtitle}</p>}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ── Fan Gallery + Personify Promo ── */}
      <section className="py-20 md:py-32 px-5 md:px-10 border-t border-white/5 relative overflow-hidden">
        <div className="absolute inset-0 pointer-events-none" style={{ background: `radial-gradient(ellipse at 50% 60%, ${pc}10 0%, transparent 65%)` }} />
        {portfolioImages.length > 0 && (
          <div className="relative flex justify-center items-end h-44 sm:h-52 md:h-64 mb-12 md:mb-16 text-[9px] sm:text-[12px] md:text-[16px]">
            {portfolioImages.slice(0, 6).map((img, i) => {
              const cfg = fanConfig[i] || fanConfig[0];
              return (
                <div
                  key={i}
                  className="absolute w-[6.5em] h-[9.75em] rounded-xl md:rounded-2xl overflow-hidden border-2 border-white/10 shadow-2xl"
                  style={{
                    transform: `rotate(${cfg.rotate}deg) translateX(${cfg.tx}em) translateY(${cfg.ty}em)`,
                    zIndex: cfg.z,
                    transformOrigin: 'bottom center',
                  }}
                >
                  <img src={img.url} className="w-full h-full object-cover" alt="" loading="lazy" />
                </div>
              );
            })}
          </div>
        )}
        <div className="relative z-10 text-center max-w-2xl mx-auto">
          <h2 className="text-[26px] md:text-5xl font-bold mb-2 leading-tight" style={{ fontFamily: design.titleFont }}>
            Let's Create Something<br />Extraordinary
          </h2>
          <p className="text-gray-500 mb-8 text-sm">By Using Personify</p>
          <a href="https://personify.so" className="inline-flex items-center gap-2 px-8 py-4 rounded-full font-bold text-sm hover:opacity-90 transition active:scale-95 shadow-xl" style={{ backgroundColor: sc, color: '#000' }}>
            ✦ TRY PERSONIFY NOW
          </a>
        </div>
      </section>

      {/* ── Contact ── */}
      <section id="contact" className={`px-5 md:px-10 py-16 md:py-24 border-t border-white/5 ${ANCHOR}`}>
        <div className="max-w-5xl mx-auto">
          <h2 className="text-[28px] md:text-5xl font-bold text-center mb-4" style={{ fontFamily: design.titleFont }}>
            {ph(contact.ctaText, "Let's Work Together")}
          </h2>
          <p className="text-gray-400 text-center max-w-xl mx-auto mb-10 md:mb-14 leading-relaxed text-[15px]">
            {ph(contact.ctaDescription, 'Available for virtual consultations, in-person meetings, conference appearances, and more.')}
          </p>

          {contactItems.length > 0 && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 md:gap-4">
              {contactItems.map((item, i) => {
                const inner = (
                  <div className="flex items-center gap-3.5 p-4 md:p-5 rounded-2xl bg-[#141414] border border-white/5 hover:border-white/15 transition w-full h-full">
                    <div className="w-10 h-10 rounded-xl flex-shrink-0 flex items-center justify-center text-sm" style={{ backgroundColor: sc + '22', color: sc }} aria-hidden="true">
                      {item.icon}
                    </div>
                    <div className="min-w-0">
                      <p className="text-[10px] text-gray-500 mb-0.5 uppercase tracking-wider font-semibold">{item.label}</p>
                      {/* Emails and handles used to be truncated mid-word on a
                          phone, which made them unreadable and uncopyable. */}
                      <p className={`text-sm font-semibold text-white ${WRAP}`}>{item.value}</p>
                    </div>
                  </div>
                );
                return item.href
                  ? <a key={i} href={item.href} className="block active:scale-[0.99] transition">{inner}</a>
                  : <div key={i}>{inner}</div>;
              })}
            </div>
          )}

          {contact.email && (
            <div className="mt-8 text-center">
              <a href={`mailto:${contact.email}`} className="inline-flex items-center gap-2 px-8 py-4 rounded-full font-bold text-sm transition hover:opacity-90 active:scale-95 shadow-xl" style={{ backgroundColor: sc, color: '#000' }}>
                ✦ Start a conversation
              </a>
            </div>
          )}
        </div>
      </section>

      {/* ── FAQ ── */}
      <section className="py-16 md:py-20 px-5 md:px-10 border-t border-white/5">
        <div className="max-w-4xl mx-auto">
          <p className="text-[11px] font-bold tracking-[0.3em] uppercase text-center mb-3" style={{ color: sc }}>FAQ</p>
          <h2 className="text-[26px] md:text-3xl font-bold text-center mb-10" style={{ fontFamily: design.titleFont }}>Common Questions</h2>
          <FAQAccordion faqs={faq} dark accent={sc} />
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="py-8 pb-28 md:pb-8 border-t border-white/5 text-center px-5">
        <p className="text-white/25 text-xs tracking-wider leading-relaxed">
          Creator Identity Pages Designed And Supported By{' '}
          <a href="https://personify.so" className="text-white/45 hover:text-white/70 transition">Personify</a>
        </p>
      </footer>

      <MobileCTABar label="✦ WORK WITH ME" href="#contact" color={sc} textColor="#000" dark />
    </div>
  );
}

// ── VIDEO EMBED HELPER ────────────────────────────────────────────────────────

function parseVideoUrl(url) {
  if (!url?.trim()) return null;
  const yt = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/shorts\/)([a-zA-Z0-9_-]{11})/);
  if (yt) return { platform: 'youtube', embedUrl: `https://www.youtube.com/embed/${yt[1]}?rel=0` };
  const tt = url.match(/tiktok\.com\/@[\w.]+\/video\/(\d+)/);
  if (tt) return { platform: 'tiktok', embedUrl: `https://www.tiktok.com/embed/v2/${tt[1]}` };
  const ig = url.match(/instagram\.com\/(?:p|reel)\/([A-Za-z0-9_-]+)/);
  if (ig) return { platform: 'instagram', embedUrl: `https://www.instagram.com/p/${ig[1]}/embed` };
  return null;
}

function VideoGrid({ videos }) {
  const valid = (videos || []).map(v => ({ ...v, parsed: parseVideoUrl(v.url) })).filter(v => v.parsed);
  if (!valid.length) return null;
  const count = valid.length;
  const gridClass = count === 1
    ? 'grid-cols-1 max-w-lg mx-auto'
    : count === 2 ? 'grid-cols-2'
    : count === 3 ? 'grid-cols-1 sm:grid-cols-3'
    : 'grid-cols-2 md:grid-cols-4';

  return (
    <div className={`grid gap-3 md:gap-4 ${gridClass}`}>
      {valid.map((v, i) => (
        <div key={i} className={`rounded-2xl overflow-hidden bg-black ${v.parsed.platform === 'tiktok' ? 'aspect-[9/16]' : 'aspect-video'}`}>
          <iframe src={v.parsed.embedUrl} className="w-full h-full" frameBorder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowFullScreen title={`Video ${i + 1}`} />
        </div>
      ))}
    </div>
  );
}

// ── ECOMMERCE TEMPLATE ────────────────────────────────────────────────────────

function EcommerceTemplate({ page, isPreview, dark }) {
  const { design, faq = [], username } = page;
  const ec = page.ecommerce || {};
  const contact = page.contact || {};
  const pc = design.primaryColor;
  const sc = design.secondaryColor;

  const bg       = dark ? '#0a0a0a' : '#faf8f5';
  const bgCard   = dark ? '#111111' : '#ffffff';
  const bgMuted  = dark ? '#161616' : '#f4f0eb';
  const textCol  = dark ? '#ffffff' : '#1a1a1a';
  const textMuted = dark ? '#aaaaaa' : '#666666';
  const border   = dark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)';

  const fp = ec.featuredProduct || {};
  const collection = ec.collection || [];
  const reviews = ec.reviews || [];
  const standards = ec.standards || [];

  const [faqOpen, setFaqOpen] = useState(null);
  const [menuOpen, setMenuOpen] = useState(false);

  // Only link to sections that actually rendered.
  const shopLinks = [
    (fp.name || fp.imageUrl || collection.length > 0) && { href: '#product', label: 'The Collection' },
    ec.brandStory && { href: '#story', label: 'Our Story' },
    ec.videos?.some(v => v.url) && { href: '#videos', label: 'Community' },
    reviews.length > 0 && { href: '#reviews', label: 'Testimonials' },
  ].filter(Boolean);

  useEffect(() => {
    if (!menuOpen) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = previous; };
  }, [menuOpen]);

  const STATIC_FAQS_EC = [
    { q: 'What is Personify?', a: 'Personify is a personal branding platform built for founders, creators, and professionals. It combines AI-powered content generation with beautifully designed Founder Pages.' },
    { q: 'What is a Founder Page?', a: "A Founder Page is your dedicated home on the internet: a professionally designed page that brings together your story, products, and contact details." },
  ];
  const allFaqs = [
    ...STATIC_FAQS_EC,
    ...(faq || []).map(item => ({
      q: item.type === 'custom' ? item.customQuestion : (item.type === 'connections' ? 'How will your connections help me grow my business?' : 'Where can I contact you?'),
      a: item.answer,
    })).filter(f => f.q && f.a),
  ];

  return (
    <div id="top" style={{ backgroundColor: bg, color: textCol, fontFamily: design.bodyFont }} className="min-h-screen">

      {/* ── Header ── */}
      <header className={`sticky z-50 border-b backdrop-blur-xl ${isPreview ? 'top-10' : 'top-0'}`} style={{ backgroundColor: bg + 'f2', borderColor: border }}>
        <div className="max-w-7xl mx-auto px-5 md:px-10 h-16 flex items-center justify-between gap-3">
          <a href="#top" className="flex items-center gap-2.5 min-w-0">
            {ec.logoUrl
              ? <img src={ec.logoUrl} alt="" className="h-8 w-8 rounded-full object-cover flex-shrink-0" />
              : <span className="w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center text-white text-xs font-bold" style={{ backgroundColor: pc }}>{(ec.brandName || 'B')[0]}</span>
            }
            <span className="text-sm md:text-base font-bold tracking-widest uppercase truncate" style={{ fontFamily: design.titleFont }}>{ec.brandName || 'Your Brand'}</span>
          </a>
          <nav className="hidden md:flex items-center gap-8 text-xs font-semibold tracking-widest uppercase" style={{ color: textMuted }}>
            {shopLinks.map(l => (
              <a key={l.href} href={l.href} className="hover:opacity-100 opacity-60 transition">{l.label}</a>
            ))}
          </nav>
          <div className="flex items-center gap-2">
            <a href={ec.shopUrl || '#product'} target={ec.shopUrl ? '_blank' : undefined} rel="noopener noreferrer" className="text-xs font-bold px-4 py-2.5 rounded-full text-white transition hover:opacity-90 active:scale-95 whitespace-nowrap" style={{ backgroundColor: pc }}>
              {ec.navCtaLabel || 'Shop Now'}
            </a>
            {/* The section links were desktop-only, so a phone visitor had no
                way to reach the story, videos, or testimonials. */}
            <button
              onClick={() => setMenuOpen(true)}
              aria-label="Open menu"
              aria-expanded={menuOpen}
              className="md:hidden h-10 w-10 rounded-full border flex flex-col items-center justify-center gap-[5px] transition active:scale-95"
              style={{ borderColor: border }}
            >
              <span className="block h-px w-4" style={{ backgroundColor: textCol }} />
              <span className="block h-px w-4" style={{ backgroundColor: textCol }} />
            </button>
          </div>
        </div>
      </header>

      {/* Mobile menu */}
      <div
        className={`md:hidden fixed inset-0 z-[60] transition-opacity duration-200 ${menuOpen ? 'opacity-100' : 'pointer-events-none opacity-0'}`}
        role="dialog"
        aria-modal="true"
      >
        <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setMenuOpen(false)} />
        <div
          className={`absolute inset-x-0 top-0 rounded-b-3xl p-5 pb-8 shadow-2xl transition-transform duration-300 ${menuOpen ? 'translate-y-0' : '-translate-y-full'}`}
          style={{ backgroundColor: bgCard, color: textCol }}
        >
          <div className="flex items-center justify-between mb-6">
            <span className="text-sm font-bold tracking-widest uppercase truncate" style={{ fontFamily: design.titleFont }}>{ec.brandName || 'Your Brand'}</span>
            <button onClick={() => setMenuOpen(false)} aria-label="Close menu" className="h-10 w-10 rounded-full border flex items-center justify-center text-lg" style={{ borderColor: border }}>✕</button>
          </div>
          <nav className="flex flex-col">
            {shopLinks.map(l => (
              <a key={l.href} href={l.href} onClick={() => setMenuOpen(false)} className="py-4 text-xl font-semibold border-b flex items-center justify-between" style={{ borderColor: border }}>
                {l.label}
                <span className="opacity-30 text-base">→</span>
              </a>
            ))}
          </nav>
          <a
            href={ec.shopUrl || '#product'}
            target={ec.shopUrl ? '_blank' : undefined}
            rel="noopener noreferrer"
            onClick={() => setMenuOpen(false)}
            className="mt-6 flex items-center justify-center w-full px-6 py-4 rounded-full font-bold text-sm text-white transition active:scale-95"
            style={{ backgroundColor: pc }}
          >
            {ec.navCtaLabel || 'Shop Now'}
          </a>
        </div>
      </div>

      {/* ── Hero ── */}
      <section className="max-w-7xl mx-auto px-5 md:px-10 py-16 md:py-24 grid md:grid-cols-2 gap-12 items-center">
        <div className="space-y-6 order-2 md:order-1">
          <p className="text-xs font-bold tracking-[0.3em] uppercase" style={{ color: pc }}>{ec.heroEyebrow || 'Founder & CEO'}</p>
          <h1 className="text-4xl md:text-6xl font-bold leading-tight" style={{ fontFamily: design.titleFont }}>
            {ec.tagline || 'Quiet Luxury, Rooted in Science'}
          </h1>
          <p style={{ color: textMuted }} className="text-base leading-relaxed max-w-md">
            {ec.heroSubtitle || ec.brandStory?.substring(0, 200) || 'Designed for integrity and clinical efficacy.'}
          </p>
          <div className="flex items-center gap-2">
            {[1,2,3,4,5].map(i => <svg key={i} className="w-4 h-4 text-yellow-400" fill="currentColor" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/></svg>)}
            <span className="text-sm font-bold ml-1">{ec.heroRating || '4.9+'}</span>
          </div>
          <div className="flex flex-wrap gap-3">
            <a href={ec.shopUrl || '#product'} target={ec.shopUrl ? '_blank' : undefined} rel="noopener noreferrer" className="px-7 py-3.5 rounded-full font-bold text-sm text-white hover:opacity-90 transition shadow-lg" style={{ backgroundColor: pc }}>
              {ec.heroCtaLabel || 'Shop Products'}
            </a>
            {ec.socialTiktok && (
              <a href="#videos" className="px-7 py-3.5 rounded-full font-bold text-sm border transition hover:opacity-80" style={{ borderColor: pc, color: pc }}>
                Join TikTok Shop
              </a>
            )}
          </div>
        </div>
        <div className="order-1 md:order-2 flex justify-center md:justify-end">
          {ec.founderPhotoUrl ? (
            <div className="rounded-3xl overflow-hidden shadow-2xl" style={{ maxWidth: '380px', width: '100%', aspectRatio: '4/5' }}>
              <img src={ec.founderPhotoUrl} alt={ec.founderName || 'Founder'} className="w-full h-full object-cover" />
            </div>
          ) : (
            <div className="rounded-3xl flex items-center justify-center text-5xl" style={{ maxWidth: '380px', width: '100%', aspectRatio: '4/5', backgroundColor: bgMuted, border: `2px dashed ${border}` }}>📸</div>
          )}
        </div>
      </section>

      {/* ── Featured Product ── */}
      {(fp.name || fp.imageUrl) && (
        <section id="product" className={`py-16 md:py-24 ${ANCHOR}`} style={{ backgroundColor: bgMuted }}>
          <div className="max-w-7xl mx-auto px-5 md:px-10 grid md:grid-cols-2 gap-12 items-center">
            <div className="relative">
              {fp.badge && <div className="absolute top-4 left-4 z-10 px-3 py-1 rounded-full text-xs font-bold text-white" style={{ backgroundColor: pc }}>{fp.badge}</div>}
              {fp.imageUrl
                ? <div className="rounded-3xl overflow-hidden shadow-xl aspect-square"><img src={fp.imageUrl} alt={fp.name} className="w-full h-full object-cover" /></div>
                : <div className="rounded-3xl aspect-square flex items-center justify-center text-5xl" style={{ backgroundColor: bgCard }}>📦</div>
              }
            </div>
            <div className="space-y-5">
              <p className="text-xs font-bold tracking-[0.3em] uppercase" style={{ color: pc }}>{ec.featuredEyebrow || 'The Star Product'}</p>
              <h2 className="text-3xl md:text-4xl font-bold" style={{ fontFamily: design.titleFont }}>{fp.name || 'Featured Product'}</h2>
              {fp.description && <p style={{ color: textMuted }} className="leading-relaxed">{fp.description}</p>}
              {(fp.bullet1 || fp.bullet2 || fp.bullet3) && (
                <ul className="space-y-2">
                  {[fp.bullet1, fp.bullet2, fp.bullet3].filter(Boolean).map((b, i) => (
                    <li key={i} className="flex items-start gap-2.5 text-sm" style={{ color: textMuted }}>
                      <span className="mt-0.5 flex-shrink-0 w-4 h-4 rounded-full flex items-center justify-center text-white text-[10px] font-bold" style={{ backgroundColor: pc }}>✓</span>
                      {b}
                    </li>
                  ))}
                </ul>
              )}
              <div className="flex items-center justify-between pt-2">
                <span className="text-2xl font-bold" style={{ color: pc }}>{fp.price || '$—'}</span>
                <a href={ec.shopUrl || '#'} target={ec.shopUrl ? '_blank' : undefined} rel="noopener noreferrer" className="px-6 py-3 rounded-full font-bold text-sm text-white hover:opacity-90 transition" style={{ backgroundColor: pc }}>{ec.featuredCtaLabel || 'Add to Cart'}</a>
              </div>
              {ec.shopUrl && <a href={ec.shopUrl} target="_blank" rel="noopener noreferrer" className="block text-xs font-semibold tracking-wider uppercase underline underline-offset-4 hover:opacity-70 transition" style={{ color: textMuted }}>Shop in TikTok Shop →</a>}
            </div>
          </div>
        </section>
      )}

      {/* ── Brand Story ── */}
      {ec.brandStory && (
        <section id="story" className={`max-w-7xl mx-auto px-5 md:px-10 py-16 md:py-28 grid md:grid-cols-2 gap-10 md:gap-16 items-center ${ANCHOR}`}>
          <div className="space-y-6">
            <p className="text-xs font-bold tracking-[0.3em] uppercase" style={{ color: pc }}>{ec.storyEyebrow || 'A Philosophy of Restraint'}</p>
            <p className="text-2xl md:text-3xl font-light leading-relaxed italic">"{ec.brandStory?.substring(0, 280)}"</p>
            {ec.founderName && (
              <div className="pt-2">
                <p className="font-bold">{ec.founderName}</p>
                <p className="text-sm" style={{ color: textMuted }}>{ec.founderTitle || 'Founder'}</p>
                {ec.shopUrl && <a href={ec.shopUrl} target="_blank" rel="noopener noreferrer" className="inline-block mt-3 text-xs font-bold tracking-wider uppercase underline underline-offset-4 hover:opacity-70 transition" style={{ color: pc }}>Shop the full collection →</a>}
              </div>
            )}
          </div>
          <div className="flex justify-center md:justify-end">
            {ec.founderPhotoUrl
              ? <div className="rounded-3xl overflow-hidden shadow-xl" style={{ maxWidth: '360px', width: '100%', aspectRatio: '4/5' }}><img src={ec.founderPhotoUrl} alt={ec.founderName} className="w-full h-full object-cover" /></div>
              : <div className="rounded-3xl flex items-center justify-center text-5xl" style={{ maxWidth: '360px', width: '100%', aspectRatio: '4/5', backgroundColor: bgMuted }}>📸</div>
            }
          </div>
        </section>
      )}

      {/* ── Brand Standards ── */}
      {standards.some(s => s.title) && (
        <section className="py-16" style={{ backgroundColor: bgMuted }}>
          <div className="max-w-7xl mx-auto px-5 md:px-10">
            <h2 className="text-2xl md:text-3xl font-bold text-center mb-12" style={{ fontFamily: design.titleFont }}>{ec.standardsTitle || 'Uncompromising Standards'}</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
              {standards.filter(s => s.title).map((s, i) => (
                <div key={i} className="space-y-3">
                  <div className="w-12 h-12 rounded-full mx-auto flex items-center justify-center text-white font-bold" style={{ backgroundColor: pc }}>✓</div>
                  <h3 className="font-bold text-lg">{s.title}</h3>
                  {s.description && <p className="text-sm leading-relaxed" style={{ color: textMuted }}>{s.description}</p>}
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ── Video Feed ── */}
      {ec.videos?.some(v => v.url) && (
        <section id="videos" className={`py-16 md:py-20 ${ANCHOR}`} style={{ backgroundColor: '#111111' }}>
          <div className="max-w-7xl mx-auto px-5 md:px-10">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
              <div>
                <p className="text-xs font-bold tracking-[0.3em] uppercase text-white/40 mb-1">{ec.videoEyebrow || 'The Community'}</p>
                <h2 className="text-2xl md:text-3xl font-bold text-white" style={{ fontFamily: design.titleFont }}>{ec.videoSectionTitle || 'Our Videos'}</h2>
              </div>
              {(ec.socialTiktok || ec.socialInstagram) && (
                <a href={ec.socialTiktok ? `https://tiktok.com/${ec.socialTiktok}` : '#'} target="_blank" rel="noopener noreferrer" className="text-xs font-bold tracking-wider uppercase text-white/60 hover:text-white border border-white/20 px-4 py-2 rounded-full transition">{ec.videoCtaLabel || 'Join Our Community'}</a>
              )}
            </div>
            <VideoGrid videos={ec.videos} />
          </div>
        </section>
      )}

      {/* ── Product Collection ── */}
      {collection.length > 0 && (
        <section className="py-16 md:py-24 max-w-7xl mx-auto px-5 md:px-10">
          <p className="text-xs font-bold tracking-[0.3em] uppercase text-center mb-2" style={{ color: pc }}>{ec.collectionEyebrow || 'The Essential Collection'}</p>
          <h2 className="text-2xl md:text-3xl font-bold text-center mb-3" style={{ fontFamily: design.titleFont }}>{ec.collectionTitle || 'Simple. Pure. Profound. Results.'}</h2>
          <p className="text-sm text-center mb-12" style={{ color: textMuted }}>{ec.collectionSubtitle || 'Every product, precisely formulated.'}</p>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-5 md:gap-8">
            {collection.map((item, i) => (
              <div key={i} className="group">
                <div className="relative rounded-2xl overflow-hidden aspect-square mb-3" style={{ backgroundColor: bgMuted }}>
                  {item.badge && <div className="absolute top-3 left-3 z-10 px-2 py-1 rounded-full text-[10px] font-bold text-white" style={{ backgroundColor: pc }}>{item.badge}</div>}
                  {item.imageUrl
                    ? <img src={item.imageUrl} alt={item.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                    : <div className="w-full h-full flex items-center justify-center text-3xl">📦</div>
                  }
                </div>
                <h3 className="font-semibold text-sm">{item.name}</h3>
                <p className="text-sm font-bold mt-0.5" style={{ color: pc }}>{item.price}</p>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* ── Reviews ── */}
      {reviews.length > 0 && (
        <section id="reviews" className={`py-16 md:py-20 ${ANCHOR}`} style={{ backgroundColor: bgMuted }}>
          <div className="max-w-7xl mx-auto px-5 md:px-10">
            <p className="text-xs font-bold tracking-[0.3em] uppercase text-center mb-2" style={{ color: pc }}>{ec.reviewsEyebrow || 'Testimonials'}</p>
            <h2 className="text-2xl md:text-3xl font-bold text-center mb-12" style={{ fontFamily: design.titleFont }}>{ec.reviewsTitle || 'What Our Customers Say'}</h2>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
              {reviews.map((r, i) => (
                <div key={i} className="rounded-2xl p-6 space-y-3" style={{ backgroundColor: bgCard, border: `1px solid ${border}` }}>
                  <div className="flex gap-0.5">{[1,2,3,4,5].map(n => <span key={n} className={`text-lg ${n <= (r.rating || 5) ? 'text-yellow-400' : 'text-gray-300'}`}>★</span>)}</div>
                  <p className="text-sm leading-relaxed" style={{ color: textMuted }}>"{r.text}"</p>
                  <p className="text-xs font-bold">{r.name}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ── FAQ ── */}
      <section className="py-16 md:py-20 max-w-4xl mx-auto px-5 md:px-10">
        <p className="text-xs font-bold tracking-[0.3em] uppercase text-center mb-2" style={{ color: pc }}>FAQ</p>
        <h2 className="text-2xl md:text-3xl font-bold text-center mb-10" style={{ fontFamily: design.titleFont }}>Ritual Guidance</h2>
        <div className="space-y-3">
          {allFaqs.map((f, i) => (
            <div key={i} className="rounded-2xl overflow-hidden" style={{ border: `1px solid ${border}`, backgroundColor: bgCard }}>
              <button onClick={() => setFaqOpen(faqOpen === i ? null : i)} aria-expanded={faqOpen === i} className="w-full flex items-start justify-between gap-4 px-5 md:px-6 py-5 text-left font-semibold text-[15px] hover:opacity-80 transition">
                <span>{f.q}</span>
                <span className={`mt-0.5 flex-shrink-0 h-6 w-6 rounded-full flex items-center justify-center text-lg font-light transition-transform duration-300 ${faqOpen === i ? 'rotate-45' : ''}`} style={{ backgroundColor: pc + '1f', color: pc }}>+</span>
              </button>
              <div className={`grid transition-all duration-300 ease-out ${faqOpen === i ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'}`}>
                <div className="overflow-hidden">
                  <p className="px-5 md:px-6 pb-5 text-sm leading-relaxed" style={{ color: textMuted }}>{f.a}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="py-10 border-t text-center" style={{ borderColor: border }}>
        <div className="flex justify-center mb-4">
          {ec.logoUrl
            ? <img src={ec.logoUrl} alt="Logo" className="h-8 w-8 rounded-full object-cover" />
            : <span className="text-lg font-bold tracking-widest uppercase" style={{ fontFamily: design.titleFont }}>{ec.brandName || 'Brand'}</span>
          }
        </div>
        {(ec.socialInstagram || ec.socialTiktok || ec.socialYoutube) && (
          <div className="flex justify-center gap-6 mb-4 text-sm font-medium" style={{ color: textMuted }}>
            {ec.socialInstagram && <span>{ec.socialInstagram}</span>}
            {ec.socialTiktok && <span>{ec.socialTiktok}</span>}
            {ec.socialYoutube && <span>{ec.socialYoutube}</span>}
          </div>
        )}
        <p className="text-xs" style={{ color: textMuted }}>
          Made with ❤️ by <span className="font-semibold">{ec.founderName || ec.brandName || username}</span> · Powered by{' '}
          <a href="https://personify.so" className="font-semibold hover:underline" style={{ color: pc }}>Personify</a>
        </p>
      </footer>
    </div>
  );
}
