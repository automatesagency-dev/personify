'use client'

import { useState, useEffect, Suspense } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import founderPageAPI from '../services/founderPageAPI';

// --- SHARED HELPERS ---
const SectionTitle = ({ title, design, centered }) => (
  <h2 className={`text-4xl font-bold mb-12 ${centered ? 'text-center' : ''}`} 
      style={{ fontFamily: design.titleFont, color: design.primaryColor }}>
    {title}
  </h2>
);

const Grid = ({ items, renderItem, gap = "gap-8", cols = "md:grid-cols-3" }) => (
  <div className={`grid ${cols} ${gap}`}>{items.map(renderItem)}</div>
);

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
        console.error('Failed to load page:', err);
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
        <a href="https://personify-alpha.vercel.app" className="inline-block px-6 py-3 bg-white text-black rounded-lg font-bold hover:bg-gray-200 transition">
          Go to Personify
        </a>
      </div>
    </div>
  );

  return (
    <>
      {isPreview && (
        <div className="sticky top-0 z-[9999] bg-yellow-500 text-black text-sm font-semibold text-center py-2 px-4">
          👁️ Preview Mode — This is how your page will look. It is not live yet.{' '}
          <button onClick={() => window.close()} className="underline ml-2">Close Preview</button>
        </div>
      )}
      {page.template === 'visionary'
        ? <VisionaryTemplate page={page} />
        : <StorytellerTemplate page={page} />}
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

// --- VISIONARY TEMPLATE ---
function VisionaryTemplate({ page }) {
  const { design, basicInfo, contact, services = [], portfolio = {}, featured = [] } = page;

  return (
    <div className="min-h-screen bg-gray-50" style={{ fontFamily: design.bodyFont }}>
      <header className="bg-white border-b border-gray-200 sticky top-0 z-50 px-6 py-4">
        <div className="max-w-6xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-3">
            {basicInfo.logoUrl && <img src={basicInfo.logoUrl} alt="Logo" className="h-8" />}
            <span className="text-xl font-bold" style={{ fontFamily: design.titleFont, color: design.primaryColor }}>
              {basicInfo.name || page.username}
            </span>
          </div>
          <nav className="hidden md:flex gap-6 text-sm font-medium text-gray-600">
             <a href="#about" className="hover:text-black">About</a>
             <a href="#portfolio" className="hover:text-black">Portfolio</a>
             <a href="#contact" className="hover:text-black">Contact</a>
          </nav>
        </div>
      </header>

      <section className="bg-gray-100 py-20 px-6">
        <div className="max-w-6xl mx-auto grid md:grid-cols-2 gap-12 items-center">
          <div>
            <h1 className="text-5xl md:text-6xl font-bold mb-4" style={{ fontFamily: design.titleFont, color: design.primaryColor }}>
              {basicInfo.name}
            </h1>
            <p className="text-2xl mb-6" style={{ color: design.secondaryColor }}>{basicInfo.title}</p>
            <p className="text-gray-600 mb-8">{basicInfo.tagline}</p>
            <a href="#contact" className="inline-block px-6 py-3 rounded-lg font-semibold text-white" style={{ backgroundColor: design.primaryColor }}>
              Get In Touch
            </a>
          </div>
          {basicInfo.heroImageUrl && (
            <div className="rounded-2xl overflow-hidden shadow-2xl">
              <img src={basicInfo.heroImageUrl} alt={basicInfo.name} className="w-full h-full object-cover" />
            </div>
          )}
        </div>
      </section>

      <main className="max-w-6xl mx-auto px-6 space-y-32 py-20">
        <section id="about" className="max-w-4xl mx-auto">
          <SectionTitle title="About" design={design} />
          <div className="space-y-6 text-gray-700 text-lg leading-relaxed">
            <p>{basicInfo.about1}</p>
            {basicInfo.about2 && <p>{basicInfo.about2}</p>}
          </div>
        </section>

        {services.length > 0 && (
          <section id="services">
            <SectionTitle title="Services" design={design} centered />
            <Grid items={services} renderItem={(s, i) => (
              <div key={i} className="bg-white rounded-xl p-8 shadow-sm border border-gray-100">
                <h3 className="text-xl font-bold mb-3" style={{ color: design.primaryColor }}>{s.title}</h3>
                <p className="text-gray-600 leading-relaxed">{s.description}</p>
              </div>
            )} />
          </section>
        )}

        {portfolio?.images?.length > 0 && (
          <section id="portfolio">
            <SectionTitle title="Portfolio" design={design} centered />
            <Grid 
              items={portfolio.images.filter(img => img?.url)} 
              cols="md:grid-cols-3" 
              gap="gap-4"
              renderItem={(img, i) => (
                <div key={i} className="aspect-square rounded-lg overflow-hidden bg-gray-200">
                  <img src={img.url} className="w-full h-full object-cover hover:scale-105 transition-transform duration-300" alt="Work" />
                </div>
              )} 
            />
          </section>
        )}

        {featured.length > 0 && (
          <section id="featured">
            <SectionTitle title="Featured Work" design={design} centered />
            <Grid items={featured.filter(f => f.imageUrl)} renderItem={(work, i) => (
              <div key={i} className="bg-white rounded-xl overflow-hidden shadow-sm border border-gray-100">
                <img src={work.imageUrl} className="w-full h-64 object-cover" alt={work.title} />
                <div className="p-6">
                  <h3 className="font-bold text-lg mb-1">{work.title}</h3>
                  <p className="text-gray-600 text-sm mb-2">{work.subtitle}</p>
                  <p className="text-gray-400 text-xs font-medium uppercase tracking-wider">{work.year}</p>
                </div>
              </div>
            )} />
          </section>
        )}

        <section id="contact" className="text-center py-10">
          <SectionTitle title={contact.ctaText || "Let's Work Together"} design={design} centered />
          <p className="text-gray-600 text-lg mb-12 max-w-2xl mx-auto">{contact.ctaDescription}</p>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-4xl mx-auto">
            {contact.email && (
              <a href={`mailto:${contact.email}`} className="flex items-center justify-center gap-3 p-5 bg-white border border-gray-200 rounded-xl hover:shadow-md transition">
                <span>📧</span><span className="text-gray-700 font-medium">{contact.email}</span>
              </a>
            )}
            {contact.phone && (
              <a href={`tel:${contact.phone}`} className="flex items-center justify-center gap-3 p-5 bg-white border border-gray-200 rounded-xl hover:shadow-md transition">
                <span>📱</span><span className="text-gray-700 font-medium">{contact.phone}</span>
              </a>
            )}
            {contact.location && (
              <div className="flex items-center justify-center gap-3 p-5 bg-white border border-gray-200 rounded-xl text-gray-700 font-medium">
                <span>📍</span><span>{contact.location}</span>
              </div>
            )}
          </div>
        </section>
      </main>

      <footer className="bg-gray-900 text-white py-12 text-center mt-20">
        <p className="text-gray-400 text-sm">
          Created with <a href="https://personify-alpha.vercel.app" className="text-white hover:underline font-semibold">Personify</a>
        </p>
      </footer>
    </div>
  );
}

// --- STORYTELLER TEMPLATE ---
function StorytellerTemplate({ page }) {
  const { design, basicInfo, contact, services = [], portfolio = {}, featured = [] } = page;

  return (
    <div className="min-h-screen bg-black text-white" style={{ fontFamily: design.bodyFont }}>
      <section className="relative h-screen flex items-center justify-center text-center px-6">
        {basicInfo.heroImageUrl && (
          <div className="absolute inset-0 z-0">
            <img src={basicInfo.heroImageUrl} className="w-full h-full object-cover opacity-50" alt="Hero" />
            <div className="absolute inset-0 bg-gradient-to-b from-black/20 to-black"></div>
          </div>
        )}
        <div className="relative z-10">
          <h1 className="text-7xl md:text-9xl font-bold mb-4" style={{ fontFamily: design.titleFont }}>
            {basicInfo.name}
          </h1>
          <p className="text-2xl md:text-3xl font-light" style={{ color: design.secondaryColor }}>{basicInfo.title}</p>
        </div>
      </section>

      <main className="max-w-6xl mx-auto px-6 space-y-32 py-20">
        <section id="about" className="max-w-4xl mx-auto text-center">
          <SectionTitle title="The Story" design={design} centered />
          <div className="space-y-8 text-gray-300 text-xl leading-relaxed">
            <p>{basicInfo.about1}</p>
            {basicInfo.about2 && <p>{basicInfo.about2}</p>}
          </div>
        </section>

        {portfolio?.images?.length > 0 && (
          <section id="portfolio">
            <SectionTitle title="Visuals" design={design} centered />
            <Grid 
              items={portfolio.images.filter(img => img?.url)} 
              renderItem={(img, i) => (
                <div key={i} className="aspect-square rounded-xl overflow-hidden grayscale hover:grayscale-0 transition-all duration-700">
                  <img src={img.url} className="w-full h-full object-cover" alt="Portfolio" />
                </div>
              )} 
            />
          </section>
        )}

        {services.length > 0 && (
          <section id="services">
            <SectionTitle title="Expertise" design={design} centered />
            <Grid items={services} cols="md:grid-cols-2" renderItem={(s, i) => (
              <div key={i} className="bg-zinc-900/50 p-10 rounded-2xl border border-zinc-800">
                <h3 className="text-3xl font-bold mb-4" style={{ color: design.secondaryColor }}>{s.title}</h3>
                <p className="text-gray-400 text-lg">{s.description}</p>
              </div>
            )} />
          </section>
        )}

        {featured.length > 0 && (
          <section id="featured">
            <SectionTitle title="Selected Works" design={design} centered />
            <Grid items={featured.filter(f => f.imageUrl)} renderItem={(work, i) => (
              <div key={i} className="group relative overflow-hidden rounded-2xl">
                <img src={work.imageUrl} className="w-full h-[500px] object-cover transition-transform duration-1000 group-hover:scale-110" alt={work.title} />
                <div className="absolute inset-0 bg-black/60 flex flex-col justify-end p-8 opacity-0 group-hover:opacity-100 transition-opacity">
                  <h3 className="text-2xl font-bold">{work.title}</h3>
                  <p className="text-gray-300">{work.subtitle}</p>
                </div>
              </div>
            )} />
          </section>
        )}

        <section id="contact" className="text-center py-20">
          <SectionTitle title={contact.ctaText || "Let's Connect"} design={design} centered />
          <p className="text-gray-400 text-xl mb-12 max-w-2xl mx-auto">{contact.ctaDescription}</p>
          <div className="flex flex-wrap justify-center gap-6">
            {contact.email && (
              <a href={`mailto:${contact.email}`} className="px-8 py-4 bg-white text-black rounded-full font-bold hover:bg-gray-200 transition">
                Email Me
              </a>
            )}
            {contact.social1 && (
              <a href={`https://instagram.com/${contact.social1.replace('@', '')}`} target="_blank" rel="noopener noreferrer" className="px-8 py-4 border border-zinc-700 rounded-full font-bold hover:bg-zinc-900 transition">
                Instagram
              </a>
            )}
          </div>
        </section>
      </main>

      <footer className="py-12 border-t border-zinc-900 text-center">
        <p className="text-zinc-500 text-sm tracking-widest uppercase">
          Powered by <a href="https://personify-alpha.vercel.app" className="text-white hover:text-brand-pink transition">Personify</a>
        </p>
      </footer>
    </div>
  );
}