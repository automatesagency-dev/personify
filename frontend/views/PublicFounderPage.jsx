'use client'

import { useState, useEffect, Suspense } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import founderPageAPI from '../services/founderPageAPI';

// ── Helpers ──────────────────────────────────────────────────────────────────

const ph = (val, fallback) => (val && val.trim()) ? val : fallback;

function ShareButton({ username, name, light = false }) {
  const [copied, setCopied] = useState(false);
  const url = `https://personify.so/${username}`;

  const share = async () => {
    if (navigator.share) {
      try { await navigator.share({ title: `${name}'s Founder Page`, url }); return; } catch {}
    }
    await navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <button
      onClick={share}
      className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold border transition hover:opacity-70 ${
        light ? 'border-white/30 text-white' : 'border-gray-300 text-gray-700'
      }`}
    >
      {copied ? '✓ Copied!' : '↗ Share'}
    </button>
  );
}

const FAQ_PRESET_QUESTIONS = {
  connections: 'How will your connections help me grow my business?',
  contact: 'Where can I contact you?',
};

const STATIC_FAQS = [
  {
    q: 'What is Personify?',
    a: 'Personify is a personal branding platform built for founders, creators, and professionals. It combines AI-powered content generation with beautifully designed Founder Pages, so you can showcase who you are, what you do, and how you can help others — all from one place. Think of it as your personal brand engine.',
  },
  {
    q: 'What is a Founder Page?',
    a: "A Founder Page is your dedicated home on the internet — a professionally designed page that brings together your story, services, portfolio, and contact details. It's built for founders and professionals who want a polished, memorable online presence without the complexity of building a full website.",
  },
];

function FAQAccordion({ faqs, dark = false }) {
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
      {allFaqs.map((faq, i) => (
        <div key={i} className={`rounded-2xl border overflow-hidden transition-all ${dark ? 'border-white/10 bg-white/5' : 'border-gray-200 bg-white shadow-sm'}`}>
          <button
            onClick={() => setOpen(open === i ? null : i)}
            className={`w-full flex items-center justify-between px-6 py-5 text-left font-semibold text-base transition ${dark ? 'text-white hover:bg-white/5' : 'text-gray-900 hover:bg-gray-50'}`}
          >
            <span>{faq.q}</span>
            <span className={`ml-4 flex-shrink-0 text-2xl font-light transition-transform duration-200 ${open === i ? 'rotate-45' : ''}`}>+</span>
          </button>
          {open === i && (
            <div className={`px-6 pb-5 text-sm leading-relaxed ${dark ? 'text-gray-400' : 'text-gray-600'}`}>
              {faq.a}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

// ── Router ───────────────────────────────────────────────────────────────────

function PublicFounderPageInner() {
  const params = useParams();
  const username = params?.username;
  const searchParams = useSearchParams();
  const isPreview = searchParams.get('preview') === 'true';
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    const loadPage = async () => {
      try {
        setLoading(true);
        const response = isPreview
          ? await founderPageAPI.getPreview()
          : await founderPageAPI.getPublic(username);
        setPage(response.data.founderPage);
      } catch (err) {
        setError(err.response?.data?.error || 'Page not found');
      } finally {
        setLoading(false);
      }
    };
    loadPage();
  }, [username, isPreview]);

  if (loading) return (
    <div className="min-h-screen bg-black flex items-center justify-center text-white">
      <div className="text-center">
        <div className="animate-spin text-4xl mb-4">⏳</div>
        <p>Loading...</p>
      </div>
    </div>
  );

  if (error || !page) return (
    <div className="min-h-screen bg-black flex items-center justify-center text-white p-6">
      <div className="text-center">
        <div className="text-6xl mb-4">😕</div>
        <h1 className="text-2xl mb-2">Page Not Found</h1>
        <p className="text-gray-400 mb-6">{error || 'This page does not exist.'}</p>
        <a href="https://personify.so" className="inline-block px-6 py-3 bg-white text-black rounded-lg font-bold hover:bg-gray-200 transition">
          Go to Personify
        </a>
      </div>
    </div>
  );

  return (
    <>
      {isPreview && (
        <div className="fixed top-0 left-0 right-0 z-[9999] bg-yellow-400 text-black text-sm font-semibold text-center py-2.5 px-4">
          👁️ Preview Mode — This is how your page will look when published.{' '}
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

export default function PublicFounderPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-black flex items-center justify-center text-white"><p>Loading...</p></div>}>
      <PublicFounderPageInner />
    </Suspense>
  );
}

// ── VISIONARY TEMPLATE ────────────────────────────────────────────────────────

function VisionaryTemplate({ page, isPreview }) {
  const { design, basicInfo, contact, services = [], portfolio = {}, featured = [], faq = [], username } = page;
  const pc = design.primaryColor;
  const sc = design.secondaryColor;

  return (
    <div className="min-h-screen bg-white text-gray-900" style={{ fontFamily: design.bodyFont }}>

      {/* ── Sticky Header ── */}
      <header className={`fixed left-0 right-0 z-50 bg-white/90 backdrop-blur-md border-b border-gray-100 ${isPreview ? 'top-10' : 'top-0'}`}>
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            {basicInfo.logoUrl
              ? <img src={basicInfo.logoUrl} alt="Logo" className="h-8 w-8 rounded-full object-cover" />
              : <div className="w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-bold" style={{ backgroundColor: pc }}>{(basicInfo.name || 'P')[0]}</div>
            }
            <span className="text-lg font-bold" style={{ fontFamily: design.titleFont, color: pc }}>
              {ph(basicInfo.name, 'Your Name')}
            </span>
          </div>
          <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-gray-500">
            <a href="#about" className="hover:text-gray-900 transition">About</a>
            {services.some(s => s.title) && <a href="#services" className="hover:text-gray-900 transition">Services</a>}
            {portfolio?.images?.some(i => i?.url) && <a href="#portfolio" className="hover:text-gray-900 transition">Work</a>}
            <a href="#contact" className="hover:text-gray-900 transition">Contact</a>
          </nav>
          <div className="flex items-center gap-3">
            <ShareButton username={username} name={basicInfo.name} />
            <a href="#contact" className="hidden md:inline-flex px-5 py-2.5 rounded-xl text-white text-sm font-bold hover:opacity-90 transition" style={{ backgroundColor: pc }}>
              Get In Touch
            </a>
          </div>
        </div>
      </header>

      {/* ── Hero ── */}
      <section className={`min-h-screen flex items-center relative overflow-hidden ${isPreview ? 'pt-28' : 'pt-20'}`}>
        {/* Background radial accent */}
        <div className="absolute top-0 right-0 w-2/3 h-full pointer-events-none" style={{ background: `radial-gradient(ellipse at 80% 40%, ${pc}12 0%, transparent 65%)` }} />
        <div className="absolute bottom-0 left-0 w-64 h-64 rounded-full pointer-events-none" style={{ background: `radial-gradient(circle, ${sc}15 0%, transparent 70%)` }} />

        <div className="max-w-7xl mx-auto px-6 grid md:grid-cols-2 gap-12 lg:gap-20 items-center py-16 w-full">
          {/* Left: text */}
          <div className="space-y-7">
            <div className="inline-flex items-center gap-2.5 px-4 py-2 rounded-full text-sm font-semibold border" style={{ borderColor: pc + '30', color: pc, backgroundColor: pc + '08' }}>
              <span className="w-2 h-2 rounded-full animate-pulse" style={{ backgroundColor: pc }} />
              {ph(basicInfo.title, 'Founder · Speaker · Creator')}
            </div>

            <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold leading-tight" style={{ fontFamily: design.titleFont, color: pc }}>
              {ph(basicInfo.name, 'Your Name Here')}
            </h1>

            {(basicInfo.tagline || true) && (
              <p className="text-xl md:text-2xl font-medium" style={{ color: sc }}>
                {ph(basicInfo.tagline, 'A short tagline that captures what you stand for')}
              </p>
            )}

            <p className="text-gray-500 text-lg leading-relaxed max-w-lg">
              {ph(basicInfo.about1?.substring(0, 220), 'A compelling intro about what you do, who you help, and why you do it. Share what makes you uniquely positioned to serve your audience.')}
            </p>

            <div className="flex flex-wrap gap-4">
              <a href="#contact" className="px-8 py-4 rounded-xl text-white font-bold text-base hover:opacity-90 transition shadow-md" style={{ backgroundColor: pc }}>
                Work With Me →
              </a>
              <a href="#portfolio" className="px-8 py-4 rounded-xl border-2 text-gray-700 font-bold text-base hover:bg-gray-50 transition" style={{ borderColor: pc + '30' }}>
                See My Work
              </a>
            </div>

            {(contact.social1 || contact.social2) && (
              <div className="flex items-center gap-4 pt-1">
                <span className="text-xs text-gray-400 uppercase tracking-wider font-medium">Find me on</span>
                <div className="flex gap-3">
                  {contact.social1 && <span className="text-sm font-bold" style={{ color: pc }}>{contact.social1}</span>}
                  {contact.social2 && <span className="text-sm font-bold" style={{ color: pc }}>{contact.social2}</span>}
                </div>
              </div>
            )}
          </div>

          {/* Right: hero image */}
          <div className="relative flex justify-center md:justify-end">
            <div className="relative w-full max-w-sm">
              {basicInfo.heroImageUrl ? (
                <div className="rounded-3xl overflow-hidden shadow-2xl aspect-[3/4]">
                  <img src={basicInfo.heroImageUrl} alt={basicInfo.name} className="w-full h-full object-cover" />
                  <div className="absolute inset-0 rounded-3xl pointer-events-none" style={{ background: `linear-gradient(to top, ${pc}50 0%, transparent 50%)` }} />
                </div>
              ) : (
                <div className="rounded-3xl aspect-[3/4] flex flex-col items-center justify-center gap-3" style={{ background: `linear-gradient(135deg, ${pc}12, ${sc}12)`, border: `2px dashed ${pc}25` }}>
                  <div className="text-5xl opacity-25">📸</div>
                  <p className="text-sm text-gray-400">Your hero photo</p>
                </div>
              )}
              {/* Floating card */}
              <div className="absolute -bottom-5 -left-5 bg-white rounded-2xl shadow-xl p-4 border border-gray-100">
                <p className="text-xs text-gray-400 mb-0.5">Available for</p>
                <p className="text-sm font-bold" style={{ color: pc }}>{ph(basicInfo.title, 'New Opportunities')}</p>
              </div>
              {/* Accent dot */}
              <div className="absolute -top-4 -right-4 w-14 h-14 rounded-2xl flex items-center justify-center text-white font-bold text-lg shadow-lg" style={{ backgroundColor: sc }}>
                ✦
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Brand strip ── */}
      <div className="py-5 border-y" style={{ borderColor: pc + '15', backgroundColor: pc + '06' }}>
        <div className="max-w-7xl mx-auto px-6 flex flex-wrap items-center justify-center gap-x-10 gap-y-2">
          {['Founder', 'Speaker', 'Advisor', 'Creator', 'Connector'].map((tag, i) => (
            <span key={i} className="text-[11px] font-bold tracking-[0.2em] uppercase" style={{ color: pc + '70' }}>
              {tag}
            </span>
          ))}
        </div>
      </div>

      <main className="max-w-7xl mx-auto px-6 py-24 space-y-28">

        {/* ── About ── */}
        <section id="about">
          <div className="grid md:grid-cols-[280px_1fr] gap-12 lg:gap-20 items-start">
            <div>
              <p className="text-xs font-bold tracking-widest uppercase mb-4" style={{ color: pc }}>About</p>
              <h2 className="text-3xl md:text-4xl font-bold leading-tight" style={{ fontFamily: design.titleFont, color: pc }}>
                The Story Behind the Work
              </h2>
              <div className="mt-6 w-12 h-1 rounded-full" style={{ backgroundColor: sc }} />
            </div>
            <div className="space-y-6 text-gray-600 text-lg leading-relaxed">
              <p>{ph(basicInfo.about1, 'Share your story here — what drives you, what you have built, and what you believe in. This is your chance to connect authentically with the people visiting your page.')}</p>
              {basicInfo.about2 && <p>{basicInfo.about2}</p>}
            </div>
          </div>
        </section>

        {/* ── Services ── */}
        {services.some(s => s.title) && (
          <section id="services">
            <div className="flex items-end justify-between mb-12">
              <div>
                <p className="text-xs font-bold tracking-widest uppercase mb-3" style={{ color: pc }}>Services</p>
                <h2 className="text-3xl md:text-4xl font-bold" style={{ fontFamily: design.titleFont, color: pc }}>How I Can Help</h2>
              </div>
            </div>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {services.filter(s => s.title).map((s, i) => (
                <div key={i} className="group relative p-8 rounded-2xl border border-gray-100 bg-white hover:shadow-xl transition-all duration-300 overflow-hidden">
                  <div className="absolute top-0 left-0 w-1 h-full rounded-l-2xl" style={{ backgroundColor: pc }} />
                  <div className="w-12 h-12 rounded-xl mb-6 flex items-center justify-center font-bold text-lg" style={{ backgroundColor: pc + '12', color: pc }}>
                    {String(i + 1).padStart(2, '0')}
                  </div>
                  <h3 className="text-xl font-bold mb-3" style={{ color: pc }}>{s.title}</h3>
                  <p className="text-gray-500 leading-relaxed text-sm">{ph(s.description, 'Description of this service and the results it delivers for your clients.')}</p>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* ── Portfolio ── */}
        {portfolio?.images?.some(i => i?.url) && (
          <section id="portfolio">
            <p className="text-xs font-bold tracking-widest uppercase mb-3" style={{ color: pc }}>Portfolio</p>
            <h2 className="text-3xl md:text-4xl font-bold mb-12" style={{ fontFamily: design.titleFont, color: pc }}>Selected Work</h2>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {portfolio.images.filter(img => img?.url).map((img, i) => (
                <div key={i} className="group relative aspect-square rounded-2xl overflow-hidden bg-gray-100">
                  <img src={img.url} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" alt="Portfolio" />
                  <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center" style={{ backgroundColor: pc + 'CC' }}>
                    <span className="text-white text-3xl">↗</span>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* ── Featured ── */}
        {featured.filter(f => f.imageUrl).length > 0 && (
          <section id="featured">
            <p className="text-xs font-bold tracking-widest uppercase mb-3" style={{ color: pc }}>Featured</p>
            <h2 className="text-3xl md:text-4xl font-bold mb-12" style={{ fontFamily: design.titleFont, color: pc }}>Featured Work</h2>
            <div className="space-y-8">
              {featured.filter(f => f.imageUrl).map((work, i) => (
                <div key={i} className={`grid md:grid-cols-2 gap-8 items-center ${i % 2 === 1 ? 'md:[direction:rtl]' : ''}`}>
                  <div className="rounded-2xl overflow-hidden shadow-lg aspect-video [direction:ltr]">
                    <img src={work.imageUrl} className="w-full h-full object-cover" alt={work.title} />
                  </div>
                  <div className="space-y-4 [direction:ltr]">
                    <p className="text-xs font-bold tracking-widest uppercase text-gray-400">{work.year}</p>
                    <h3 className="text-2xl md:text-3xl font-bold" style={{ color: pc }}>{work.title}</h3>
                    <p className="text-gray-500 text-lg">{work.subtitle}</p>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}
      </main>

      {/* ── CTA ── */}
      <section id="contact" className="py-28 px-6 relative overflow-hidden" style={{ background: `linear-gradient(135deg, ${pc} 0%, ${sc} 100%)` }}>
        <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(circle at 20% 50%, white 1px, transparent 1px), radial-gradient(circle at 80% 20%, white 1px, transparent 1px)', backgroundSize: '60px 60px' }} />
        <div className="max-w-4xl mx-auto text-center text-white relative z-10">
          <h2 className="text-4xl md:text-5xl font-bold mb-6" style={{ fontFamily: design.titleFont }}>
            {ph(contact.ctaText, "Let's Work Together")}
          </h2>
          <p className="text-white/80 text-xl mb-12 max-w-2xl mx-auto leading-relaxed">
            {ph(contact.ctaDescription, "Ready to take your brand to the next level? Reach out and let's build something meaningful together.")}
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            {contact.email && (
              <a href={`mailto:${contact.email}`} className="px-8 py-4 bg-white rounded-xl font-bold text-base hover:bg-gray-100 transition shadow-lg" style={{ color: pc }}>
                📧 {contact.email}
              </a>
            )}
            {contact.phone && (
              <a href={`tel:${contact.phone}`} className="px-8 py-4 bg-white/20 border border-white/40 backdrop-blur rounded-xl font-bold text-white text-base hover:bg-white/30 transition">
                📱 {contact.phone}
              </a>
            )}
            {contact.location && (
              <div className="px-8 py-4 bg-white/20 border border-white/40 backdrop-blur rounded-xl font-bold text-white text-base">
                📍 {contact.location}
              </div>
            )}
          </div>
        </div>
      </section>

      {/* ── FAQ ── */}
      <section className="py-24 px-6 bg-gray-50">
        <div className="max-w-7xl mx-auto">
          <p className="text-xs font-bold tracking-widest uppercase text-center mb-3" style={{ color: pc }}>FAQ</p>
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-12" style={{ fontFamily: design.titleFont, color: pc }}>Common Questions</h2>
          <FAQAccordion faqs={faq} dark={false} />
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="py-10 border-t border-gray-100 text-center">
        <p className="text-gray-400 text-sm">
          Made with ❤️ by <span className="font-semibold text-gray-600">{basicInfo.name || username}</span> · Powered by{' '}
          <a href="https://personify.so" className="font-semibold hover:underline" style={{ color: pc }}>Personify</a>
        </p>
      </footer>
    </div>
  );
}

// ── STORYTELLER TEMPLATE ──────────────────────────────────────────────────────

function StorytellerTemplate({ page, isPreview }) {
  const { design, basicInfo, contact, services = [], portfolio = {}, featured = [], faq = [], username } = page;
  const pc = design.primaryColor;
  const sc = design.secondaryColor;

  return (
    <div className="min-h-screen bg-[#080808] text-white" style={{ fontFamily: design.bodyFont }}>

      {/* ── Hero ── */}
      <section className={`relative min-h-screen flex flex-col items-center justify-center text-center px-6 overflow-hidden ${isPreview ? 'pt-10' : ''}`}>
        {basicInfo.heroImageUrl ? (
          <div className="absolute inset-0 z-0">
            <img src={basicInfo.heroImageUrl} className="w-full h-full object-cover" alt="Hero" />
            <div className="absolute inset-0" style={{ background: 'linear-gradient(to bottom, rgba(8,8,8,0.4) 0%, rgba(8,8,8,0.7) 50%, #080808 100%)' }} />
          </div>
        ) : (
          <div className="absolute inset-0 z-0" style={{ background: `radial-gradient(ellipse at 50% 50%, ${pc}25 0%, #080808 65%)` }} />
        )}

        {/* Logo / avatar */}
        <div className="relative z-10 mb-auto pt-12 flex items-center gap-3">
          {basicInfo.logoUrl
            ? <img src={basicInfo.logoUrl} alt="Logo" className="h-10 rounded-full object-cover border border-white/20" />
            : <div className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold border border-white/20 text-sm" style={{ backgroundColor: pc + '50' }}>{(basicInfo.name || 'P')[0]}</div>
          }
          <span className="text-sm font-semibold text-white/60">{ph(basicInfo.name, 'Your Name')}</span>
        </div>

        {/* Main hero text */}
        <div className="relative z-10 space-y-6 max-w-5xl my-auto">
          <p className="text-xs font-bold tracking-[0.35em] uppercase text-white/40">
            {ph(basicInfo.title, 'Founder · Speaker · Creator')}
          </p>
          <h1 className="text-6xl md:text-8xl lg:text-9xl font-bold leading-none" style={{ fontFamily: design.titleFont, color: sc }}>
            {ph(basicInfo.name, 'Your Name')}
          </h1>
          <p className="text-xl md:text-2xl text-white/50 max-w-2xl mx-auto font-light">
            {ph(basicInfo.tagline, 'A short tagline that captures your essence')}
          </p>
          <div className="flex items-center justify-center gap-4 pt-4 flex-wrap">
            <a href="#story" className="px-8 py-4 rounded-full font-bold text-black hover:opacity-90 transition shadow-xl" style={{ backgroundColor: sc }}>
              Read My Story ↓
            </a>
            <ShareButton username={username} name={basicInfo.name} light />
          </div>
        </div>

        {/* Scroll indicator */}
        <div className="relative z-10 mb-10 mt-auto flex flex-col items-center gap-2 text-white/25">
          <span className="text-[10px] tracking-widest uppercase">Scroll</span>
          <div className="w-px h-10 bg-gradient-to-b from-white/25 to-transparent" />
        </div>
      </section>

      <main className="max-w-6xl mx-auto px-6 space-y-36 py-32">

        {/* ── Story / About ── */}
        <section id="story">
          <div className="grid md:grid-cols-[220px_1fr] gap-12 lg:gap-20 items-start">
            <div className="md:sticky md:top-28">
              <p className="text-xs font-bold tracking-widest uppercase mb-4" style={{ color: sc }}>The Story</p>
              <div className="w-10 h-px mb-6" style={{ backgroundColor: sc }} />
              {basicInfo.logoUrl && (
                <img src={basicInfo.logoUrl} alt={basicInfo.name} className="w-16 h-16 rounded-full object-cover border border-white/10 mt-4" />
              )}
            </div>
            <div className="space-y-8">
              <p className="text-2xl md:text-3xl font-light leading-relaxed italic" style={{ color: 'rgba(255,255,255,0.85)' }}>
                "{ph(basicInfo.about1, 'Share your story here — what drives you, what you have built, and what you believe in. This is your chance to connect authentically with people.')}"
              </p>
              {basicInfo.about2 && (
                <p className="text-lg text-gray-400 leading-relaxed">{basicInfo.about2}</p>
              )}
            </div>
          </div>
        </section>

        {/* ── Visuals / Portfolio ── */}
        {portfolio?.images?.some(i => i?.url) && (
          <section id="portfolio">
            <p className="text-xs font-bold tracking-widest uppercase mb-12" style={{ color: sc }}>Visuals</p>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {portfolio.images.filter(img => img?.url).map((img, i) => (
                <div key={i} className={`group relative overflow-hidden rounded-2xl bg-zinc-900 ${i === 0 ? 'row-span-2' : ''}`}
                  style={{ aspectRatio: i === 0 ? '1/2.1' : '1/1' }}>
                  <img src={img.url} className="w-full h-full object-cover grayscale group-hover:grayscale-0 scale-105 group-hover:scale-100 transition-all duration-700" alt="Visual" />
                </div>
              ))}
            </div>
          </section>
        )}

        {/* ── Expertise / Services ── */}
        {services.some(s => s.title) && (
          <section id="services">
            <p className="text-xs font-bold tracking-widest uppercase mb-12" style={{ color: sc }}>Expertise</p>
            <div className="grid md:grid-cols-2 gap-5">
              {services.filter(s => s.title).map((s, i) => (
                <div key={i} className="relative p-8 rounded-2xl bg-zinc-900/60 border border-white/5 hover:border-white/10 transition-all group overflow-hidden">
                  <div className="absolute left-0 top-0 bottom-0 w-[3px] rounded-l-2xl" style={{ backgroundColor: sc }} />
                  <p className="text-xs font-bold tracking-widest uppercase mb-4 text-white/25">{String(i + 1).padStart(2, '0')}</p>
                  <h3 className="text-2xl font-bold mb-4" style={{ color: sc }}>{s.title}</h3>
                  <p className="text-gray-400 leading-relaxed">{ph(s.description, 'How this expertise creates value and the results you deliver.')}</p>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* ── Featured Works ── */}
        {featured.filter(f => f.imageUrl).length > 0 && (
          <section id="featured">
            <p className="text-xs font-bold tracking-widest uppercase mb-12" style={{ color: sc }}>Selected Works</p>
            <div className="space-y-4">
              {featured.filter(f => f.imageUrl).map((work, i) => (
                <div key={i} className="group relative overflow-hidden rounded-3xl" style={{ height: '440px' }}>
                  <img src={work.imageUrl} className="w-full h-full object-cover transition-transform duration-[1500ms] group-hover:scale-105" alt={work.title} />
                  <div className="absolute inset-0" style={{ background: 'linear-gradient(to top, rgba(0,0,0,0.85) 0%, rgba(0,0,0,0.2) 50%, transparent 100%)' }} />
                  <div className="absolute bottom-0 left-0 right-0 p-8 translate-y-2 group-hover:translate-y-0 transition-transform duration-500">
                    <p className="text-[11px] font-bold tracking-widest uppercase mb-2 text-white/40">{work.year}</p>
                    <h3 className="text-3xl font-bold mb-1">{work.title}</h3>
                    <p className="text-gray-300 text-base">{work.subtitle}</p>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* ── Contact / CTA ── */}
        <section id="contact" className="text-center py-16 relative">
          <div className="absolute inset-0 rounded-3xl pointer-events-none" style={{ background: `radial-gradient(ellipse at 50% 50%, ${pc}18 0%, transparent 70%)` }} />
          <div className="relative z-10">
            <p className="text-xs font-bold tracking-widest uppercase mb-5" style={{ color: sc }}>Connect</p>
            <h2 className="text-5xl md:text-6xl font-bold mb-6" style={{ fontFamily: design.titleFont }}>
              {ph(contact.ctaText, "Let's Connect")}
            </h2>
            <p className="text-gray-400 text-xl mb-12 max-w-2xl mx-auto leading-relaxed">
              {ph(contact.ctaDescription, "I'm always open to interesting conversations, collaborations, and opportunities.")}
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              {contact.email && (
                <a href={`mailto:${contact.email}`} className="px-8 py-4 bg-white text-black rounded-full font-bold hover:bg-gray-100 transition text-sm">
                  Email Me →
                </a>
              )}
              {contact.social1 && (
                <a href="#" className="px-8 py-4 border border-white/15 rounded-full font-bold hover:bg-white/5 transition text-sm">
                  {contact.social1}
                </a>
              )}
              {contact.social2 && (
                <a href="#" className="px-8 py-4 border border-white/15 rounded-full font-bold hover:bg-white/5 transition text-sm">
                  {contact.social2}
                </a>
              )}
              {contact.phone && (
                <a href={`tel:${contact.phone}`} className="px-8 py-4 border border-white/15 rounded-full font-bold hover:bg-white/5 transition text-sm">
                  {contact.phone}
                </a>
              )}
            </div>
          </div>
        </section>
      </main>

      {/* ── FAQ ── */}
      <section className="py-24 px-6 border-t border-white/5">
        <div className="max-w-6xl mx-auto">
          <p className="text-xs font-bold tracking-widest uppercase text-center mb-3" style={{ color: sc }}>FAQ</p>
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-12">Common Questions</h2>
          <FAQAccordion faqs={faq} dark={true} />
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="py-12 border-t border-white/5 text-center">
        <p className="text-white/20 text-xs tracking-widest uppercase">
          Crafted by <span className="text-white/35">{basicInfo.name || username}</span> · Powered by{' '}
          <a href="https://personify.so" className="text-white/35 hover:text-white/55 transition">Personify</a>
        </p>
      </footer>
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

  const fanConfig = [
    { rotate: -28, tx: -160, ty: 20, z: 1 },
    { rotate: -14, tx: -85,  ty: 8,  z: 2 },
    { rotate: -4,  tx: -15,  ty: 0,  z: 4 },
    { rotate: 8,   tx: 55,   ty: 6,  z: 3 },
    { rotate: 20,  tx: 125,  ty: 18, z: 2 },
    { rotate: 32,  tx: 185,  ty: 30, z: 1 },
  ];

  return (
    <div className="min-h-screen bg-[#0c0c0c] text-white" style={{ fontFamily: design.bodyFont }}>

      {/* ── Nav ── */}
      <nav className={`fixed left-0 right-0 z-50 flex items-center justify-between px-6 md:px-10 py-5 ${isPreview ? 'top-10' : 'top-0'}`}
        style={{ background: 'linear-gradient(to bottom, rgba(0,0,0,0.75) 0%, transparent 100%)' }}>
        <span className="text-base md:text-lg font-bold tracking-[0.12em] uppercase" style={{ fontFamily: design.titleFont }}>
          {ph(basicInfo.name, 'Your Name')}
        </span>
        <div className="flex items-center gap-3">
          <ShareButton username={username} name={basicInfo.name} light />
          <a href="#contact" className="w-10 h-10 rounded-full border border-white/20 flex items-center justify-center text-lg hover:bg-white/10 transition">
            ☰
          </a>
        </div>
      </nav>

      {/* ── Hero ── */}
      <section className="relative min-h-screen flex flex-col justify-end overflow-hidden">
        {basicInfo.heroImageUrl ? (
          <div className="absolute inset-0">
            <img src={basicInfo.heroImageUrl} className="w-full h-full object-cover object-top" alt="Hero" />
            <div className="absolute inset-0" style={{ background: 'linear-gradient(to bottom, rgba(0,0,0,0.05) 0%, rgba(0,0,0,0.25) 35%, rgba(12,12,12,0.75) 65%, #0c0c0c 100%)' }} />
          </div>
        ) : (
          <div className="absolute inset-0 flex items-center justify-center" style={{ background: `radial-gradient(ellipse at 50% 30%, ${pc}25 0%, #0c0c0c 65%)` }}>
            <div className="text-center text-gray-600">
              <div className="text-6xl mb-3 opacity-40">📸</div>
              <p className="text-sm">Add your hero photo in Basic Info</p>
            </div>
          </div>
        )}

        <div className="relative z-10 px-6 md:px-10 pb-0">
          <div className="flex items-start justify-between pt-28 pb-10 md:pb-16">
            <div className="max-w-xs">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-white/20 text-xs font-semibold text-white/80 mb-5 backdrop-blur-sm" style={{ backgroundColor: 'rgba(255,255,255,0.05)' }}>
                <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
                {ph(contact.ctaText, 'BOOK A STRATEGY CALL')}
              </div>
              <p className="text-white text-base md:text-lg font-semibold leading-snug max-w-[220px]" style={{ fontFamily: design.titleFont }}>
                {ph(basicInfo.title, 'Personal Brand Strategist & Founder')}
              </p>
            </div>
            <div className="hidden md:flex flex-col items-end max-w-xs text-right">
              <p className="text-white/55 text-sm leading-relaxed mb-5">
                {ph(basicInfo.about1?.substring(0, 160), 'Driven by strategy and powered by systems that turn personal stories into scalable digital influence.')}
              </p>
              <a href="#contact" className="inline-flex items-center gap-2 px-6 py-3 rounded-full font-bold text-sm hover:opacity-90 transition shadow-xl" style={{ backgroundColor: sc, color: '#000' }}>
                ✦ WORK WITH ME
              </a>
            </div>
          </div>
          <h1 className="font-black leading-none tracking-tight uppercase text-white" style={{ fontFamily: design.titleFont, fontSize: 'clamp(3rem, 13vw, 11rem)' }}>
            {ph(basicInfo.name, 'YOUR NAME')}
          </h1>
        </div>
      </section>

      {/* ── Tagline + Photo Grid ── */}
      <section className="px-6 md:px-10 py-20 md:py-28">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl md:text-5xl font-bold text-center mb-5 leading-tight max-w-3xl mx-auto" style={{ fontFamily: design.titleFont }}>
            {ph(basicInfo.about1, 'Turning Human Stories Into Scalable Digital Leverage')}
          </h2>
          <p className="text-gray-400 text-center max-w-2xl mx-auto mb-14 leading-relaxed text-base md:text-lg">
            {ph(contact.ctaDescription, 'I help founders, entrepreneurs, and professionals build powerful personal brands using AI-first systems that drive visibility, authority, and growth.')}
          </p>
          {portfolioImages.length > 0 && (
            <div className="grid grid-cols-3 gap-3 md:gap-4">
              {portfolioImages.slice(0, 3).map((img, i) => (
                <div key={i} className="rounded-2xl overflow-hidden aspect-[3/4]">
                  <img src={img.url} className="w-full h-full object-cover hover:scale-105 transition-transform duration-700" alt="" />
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* ── Services ── */}
      {services.some(s => s.title) && (
        <section id="services" className="px-6 md:px-10 py-20 border-t border-white/5">
          <div className="max-w-6xl mx-auto">
            <h2 className="text-3xl md:text-4xl font-bold mb-3 leading-tight" style={{ fontFamily: design.titleFont }}>
              Building Powerful Brand Systems
            </h2>
            <p className="text-gray-400 max-w-2xl mb-12 leading-relaxed">
              I design and implement strategies that transform how you create content, build your brand, and grow your business.
            </p>
            <div className="grid md:grid-cols-3 gap-4">
              {services.filter(s => s.title).map((s, i) => (
                <div key={i} className="bg-[#141414] rounded-2xl p-7 border border-white/5 hover:border-white/10 transition-all">
                  <p className="text-2xl font-bold mb-5" style={{ color: sc }}>{String(i + 1).padStart(2, '0')}</p>
                  <h3 className="text-lg font-bold text-white mb-3">{s.title}</h3>
                  <p className="text-gray-500 text-sm leading-relaxed">{ph(s.description, 'Description of this service and the value it delivers.')}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ── Featured ── */}
      {featuredItems.length > 0 && (
        <section id="featured" className="px-6 md:px-10 py-20 border-t border-white/5">
          <div className="max-w-6xl mx-auto">
            <h2 className="text-3xl font-bold mb-3" style={{ fontFamily: design.titleFont }}>Featured Systems & Projects</h2>
            <p className="text-gray-500 mb-10 text-sm">A showcase of content systems, brand frameworks, and digital infrastructures built to turn identity into leverage.</p>
            <div className="grid md:grid-cols-2 gap-4">
              {featuredItems.map((work, i) => (
                <div key={i} className="group relative rounded-2xl overflow-hidden aspect-video bg-zinc-900">
                  <img src={work.imageUrl} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" alt={work.title} />
                  <div className="absolute inset-0" style={{ background: 'linear-gradient(to top, rgba(0,0,0,0.85) 0%, transparent 55%)' }} />
                  <div className="absolute bottom-0 left-0 right-0 p-6">
                    <p className="text-[10px] text-white/35 uppercase tracking-widest mb-1.5 font-bold">{work.year}</p>
                    <h3 className="text-xl font-bold">{work.title}</h3>
                    <p className="text-gray-400 text-sm mt-1">{work.subtitle}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ── Fan Gallery + Personify Promo ── */}
      <section className="py-24 md:py-32 px-6 border-t border-white/5 relative overflow-hidden">
        <div className="absolute inset-0 pointer-events-none" style={{ background: `radial-gradient(ellipse at 50% 60%, ${pc}10 0%, transparent 65%)` }} />
        {portfolioImages.length > 0 && (
          <div className="relative flex justify-center items-end h-52 md:h-64 mb-16">
            {portfolioImages.slice(0, Math.min(6, portfolioImages.length)).map((img, i) => {
              const cfg = fanConfig[i] || fanConfig[0];
              return (
                <div
                  key={i}
                  className="absolute w-24 h-36 md:w-32 md:h-48 rounded-2xl overflow-hidden border-2 border-white/10 shadow-2xl"
                  style={{ transform: `rotate(${cfg.rotate}deg) translateX(${cfg.tx}px) translateY(${cfg.ty}px)`, zIndex: cfg.z, transformOrigin: 'bottom center' }}
                >
                  <img src={img.url} className="w-full h-full object-cover" alt="" />
                </div>
              );
            })}
          </div>
        )}
        <div className="relative z-10 text-center max-w-2xl mx-auto">
          <h2 className="text-3xl md:text-5xl font-bold mb-2 leading-tight" style={{ fontFamily: design.titleFont }}>
            Let's Create Something<br />Extraordinary
          </h2>
          <p className="text-gray-500 mb-8 text-sm">By Using Personify</p>
          <a href="https://personify.so" className="inline-flex items-center gap-2 px-8 py-4 rounded-full font-bold text-sm hover:opacity-90 transition shadow-xl" style={{ backgroundColor: sc, color: '#000' }}>
            ✦ TRY PERSONIFY NOW
          </a>
        </div>
      </section>

      {/* ── Contact ── */}
      <section id="contact" className="px-6 md:px-10 py-20 border-t border-white/5">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-4xl md:text-5xl font-bold text-center mb-4" style={{ fontFamily: design.titleFont }}>
            Let's Work Together
          </h2>
          <p className="text-gray-400 text-center max-w-xl mx-auto mb-14 leading-relaxed">
            {ph(contact.ctaDescription, 'Available for virtual consultations, in-person meetings, conference appearances, and more.')}
          </p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              contact.email    && { icon: '📧', label: 'Email Address', value: contact.email,    href: `mailto:${contact.email}` },
              contact.phone    && { icon: '📱', label: 'Phone Number',  value: contact.phone,    href: `tel:${contact.phone}` },
              contact.location && { icon: '📍', label: 'Location',      value: contact.location, href: null },
              contact.social1  && { icon: '✦',  label: 'Social',        value: contact.social1,  href: null },
            ].filter(Boolean).map((item, i) => {
              const inner = (
                <div className="flex items-center gap-3 p-5 rounded-2xl bg-[#141414] border border-white/5 hover:border-white/10 transition w-full h-full">
                  <div className="w-9 h-9 rounded-xl flex-shrink-0 flex items-center justify-center text-sm" style={{ backgroundColor: sc + '22', color: sc }}>
                    {item.icon}
                  </div>
                  <div className="min-w-0">
                    <p className="text-[10px] text-gray-500 mb-0.5 uppercase tracking-wider font-semibold">{item.label}</p>
                    <p className="text-sm font-semibold text-white truncate">{item.value}</p>
                  </div>
                </div>
              );
              return item.href ? <a key={i} href={item.href}>{inner}</a> : <div key={i}>{inner}</div>;
            })}
          </div>
        </div>
      </section>

      {/* ── FAQ ── */}
      <section className="py-20 px-6 md:px-10 border-t border-white/5">
        <div className="max-w-4xl mx-auto">
          <p className="text-xs font-bold tracking-widest uppercase text-center mb-3" style={{ color: sc }}>FAQ</p>
          <h2 className="text-3xl font-bold text-center mb-10" style={{ fontFamily: design.titleFont }}>Common Questions</h2>
          <FAQAccordion faqs={faq} dark={true} />
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="py-8 border-t border-white/5 text-center">
        <p className="text-white/20 text-xs tracking-wider">
          Creator Identity Pages Designed And Supported By{' '}
          <a href="https://personify.so" className="text-white/40 hover:text-white/60 transition">Personify</a>
        </p>
      </footer>
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

  const STATIC_FAQS_EC = [
    { q: 'What is Personify?', a: 'Personify is a personal branding platform built for founders, creators, and professionals. It combines AI-powered content generation with beautifully designed Founder Pages.' },
    { q: 'What is a Founder Page?', a: "A Founder Page is your dedicated home on the internet — a professionally designed page that brings together your story, products, and contact details." },
  ];
  const allFaqs = [
    ...STATIC_FAQS_EC,
    ...(faq || []).map(item => ({
      q: item.type === 'custom' ? item.customQuestion : (item.type === 'connections' ? 'How will your connections help me grow my business?' : 'Where can I contact you?'),
      a: item.answer,
    })).filter(f => f.q && f.a),
  ];

  return (
    <div style={{ backgroundColor: bg, color: textCol, fontFamily: design.bodyFont }} className="min-h-screen">

      {/* ── Header ── */}
      <header className={`sticky z-50 border-b ${isPreview ? 'top-10' : 'top-0'}`} style={{ backgroundColor: bg, borderColor: border }}>
        <div className="max-w-7xl mx-auto px-5 md:px-10 h-16 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            {ec.logoUrl
              ? <img src={ec.logoUrl} alt="Logo" className="h-8 w-8 rounded-full object-cover" />
              : <div className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold" style={{ backgroundColor: pc }}>{(ec.brandName || 'B')[0]}</div>
            }
            <span className="text-base font-bold tracking-widest uppercase" style={{ fontFamily: design.titleFont }}>{ec.brandName || 'Your Brand'}</span>
          </div>
          <nav className="hidden md:flex items-center gap-8 text-xs font-semibold tracking-widest uppercase" style={{ color: textMuted }}>
            <a href="#product" className="hover:opacity-100 opacity-60 transition">The Collection</a>
            <a href="#story" className="hover:opacity-100 opacity-60 transition">Our Story</a>
            <a href="#videos" className="hover:opacity-100 opacity-60 transition">Community</a>
            <a href="#reviews" className="hover:opacity-100 opacity-60 transition">Testimonials</a>
          </nav>
          <a href={ec.shopUrl || '#product'} target={ec.shopUrl ? '_blank' : undefined} rel="noopener noreferrer" className="text-xs font-bold px-4 py-2 rounded-full text-white transition hover:opacity-90" style={{ backgroundColor: pc }}>
            Shop Now
          </a>
        </div>
      </header>

      {/* ── Hero ── */}
      <section className="max-w-7xl mx-auto px-5 md:px-10 py-16 md:py-24 grid md:grid-cols-2 gap-12 items-center">
        <div className="space-y-6 order-2 md:order-1">
          <p className="text-xs font-bold tracking-[0.3em] uppercase" style={{ color: pc }}>Founder &amp; CEO</p>
          <h1 className="text-4xl md:text-6xl font-bold leading-tight" style={{ fontFamily: design.titleFont }}>
            {ec.tagline || 'Quiet Luxury, Rooted in Science'}
          </h1>
          <p style={{ color: textMuted }} className="text-base leading-relaxed max-w-md">
            {ec.brandStory?.substring(0, 200) || 'Designed for integrity and clinical efficacy.'}
          </p>
          <div className="flex items-center gap-2">
            {[1,2,3,4,5].map(i => <svg key={i} className="w-4 h-4 text-yellow-400" fill="currentColor" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/></svg>)}
            <span className="text-sm font-bold ml-1">4.9+</span>
          </div>
          <div className="flex flex-wrap gap-3">
            <a href={ec.shopUrl || '#product'} target={ec.shopUrl ? '_blank' : undefined} rel="noopener noreferrer" className="px-7 py-3.5 rounded-full font-bold text-sm text-white hover:opacity-90 transition shadow-lg" style={{ backgroundColor: pc }}>
              Shop Products
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
        <section id="product" className="py-16 md:py-24" style={{ backgroundColor: bgMuted }}>
          <div className="max-w-7xl mx-auto px-5 md:px-10 grid md:grid-cols-2 gap-12 items-center">
            <div className="relative">
              {fp.badge && <div className="absolute top-4 left-4 z-10 px-3 py-1 rounded-full text-xs font-bold text-white" style={{ backgroundColor: pc }}>{fp.badge}</div>}
              {fp.imageUrl
                ? <div className="rounded-3xl overflow-hidden shadow-xl aspect-square"><img src={fp.imageUrl} alt={fp.name} className="w-full h-full object-cover" /></div>
                : <div className="rounded-3xl aspect-square flex items-center justify-center text-5xl" style={{ backgroundColor: bgCard }}>📦</div>
              }
            </div>
            <div className="space-y-5">
              <p className="text-xs font-bold tracking-[0.3em] uppercase" style={{ color: pc }}>The Star Product</p>
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
                <a href={ec.shopUrl || '#'} target={ec.shopUrl ? '_blank' : undefined} rel="noopener noreferrer" className="px-6 py-3 rounded-full font-bold text-sm text-white hover:opacity-90 transition" style={{ backgroundColor: pc }}>Add to Cart</a>
              </div>
              {ec.shopUrl && <a href={ec.shopUrl} target="_blank" rel="noopener noreferrer" className="block text-xs font-semibold tracking-wider uppercase underline underline-offset-4 hover:opacity-70 transition" style={{ color: textMuted }}>Shop in TikTok Shop →</a>}
            </div>
          </div>
        </section>
      )}

      {/* ── Brand Story ── */}
      {ec.brandStory && (
        <section id="story" className="max-w-7xl mx-auto px-5 md:px-10 py-20 md:py-28 grid md:grid-cols-2 gap-16 items-center">
          <div className="space-y-6">
            <p className="text-xs font-bold tracking-[0.3em] uppercase" style={{ color: pc }}>A Philosophy of Restraint</p>
            <p className="text-2xl md:text-3xl font-light leading-relaxed italic">"{ec.brandStory?.substring(0, 280)}"</p>
            {ec.founderName && (
              <div className="pt-2">
                <p className="font-bold">{ec.founderName}</p>
                <p className="text-sm" style={{ color: textMuted }}>{ec.founderTitle || 'Founder'}</p>
                {ec.shopUrl && <a href={ec.shopUrl} target="_blank" rel="noopener noreferrer" className="inline-block mt-3 text-xs font-bold tracking-wider uppercase underline underline-offset-4 hover:opacity-70 transition" style={{ color: pc }}>Shop the full collection →</a>}
              </div>
            )}
          </div>
          <div className="flex justify-end">
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
            <h2 className="text-2xl md:text-3xl font-bold text-center mb-12" style={{ fontFamily: design.titleFont }}>Uncompromising Standards</h2>
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
        <section id="videos" className="py-16 md:py-20" style={{ backgroundColor: '#111111' }}>
          <div className="max-w-7xl mx-auto px-5 md:px-10">
            <div className="flex items-center justify-between mb-8">
              <div>
                <p className="text-xs font-bold tracking-[0.3em] uppercase text-white/40 mb-1">The Community</p>
                <h2 className="text-2xl md:text-3xl font-bold text-white" style={{ fontFamily: design.titleFont }}>{ec.videoSectionTitle || 'Our Videos'}</h2>
              </div>
              {(ec.socialTiktok || ec.socialInstagram) && (
                <a href={ec.socialTiktok ? `https://tiktok.com/${ec.socialTiktok}` : '#'} target="_blank" rel="noopener noreferrer" className="text-xs font-bold tracking-wider uppercase text-white/60 hover:text-white border border-white/20 px-4 py-2 rounded-full transition">Join Our Community</a>
              )}
            </div>
            <VideoGrid videos={ec.videos} />
          </div>
        </section>
      )}

      {/* ── Product Collection ── */}
      {collection.length > 0 && (
        <section className="py-16 md:py-24 max-w-7xl mx-auto px-5 md:px-10">
          <p className="text-xs font-bold tracking-[0.3em] uppercase text-center mb-2" style={{ color: pc }}>The Essential Collection</p>
          <h2 className="text-2xl md:text-3xl font-bold text-center mb-3" style={{ fontFamily: design.titleFont }}>Simple. Pure. Profound. Results.</h2>
          <p className="text-sm text-center mb-12" style={{ color: textMuted }}>Every product, precisely formulated.</p>
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
        <section id="reviews" className="py-16 md:py-20" style={{ backgroundColor: bgMuted }}>
          <div className="max-w-7xl mx-auto px-5 md:px-10">
            <p className="text-xs font-bold tracking-[0.3em] uppercase text-center mb-2" style={{ color: pc }}>Testimonials</p>
            <h2 className="text-2xl md:text-3xl font-bold text-center mb-12" style={{ fontFamily: design.titleFont }}>What Our Customers Say</h2>
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
              <button onClick={() => setFaqOpen(faqOpen === i ? null : i)} className="w-full flex items-center justify-between px-6 py-5 text-left font-semibold text-sm hover:opacity-80 transition">
                <span>{f.q}</span>
                <span className={`ml-4 flex-shrink-0 text-xl font-light transition-transform duration-200 ${faqOpen === i ? 'rotate-45' : ''}`}>+</span>
              </button>
              {faqOpen === i && <div className="px-6 pb-5 text-sm leading-relaxed" style={{ color: textMuted }}>{f.a}</div>}
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
