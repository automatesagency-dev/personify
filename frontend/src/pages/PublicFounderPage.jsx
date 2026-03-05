import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import founderPageAPI from '../services/founderPageAPI';

export default function PublicFounderPage() {
  const { username } = useParams();
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(null);
  const [error, setError] = useState('');

  const getBackendUrl = () => {
    if (window.location.hostname === 'localhost') {
      return 'http://localhost:5000';
    }
    return 'https://personify-backend-k04y.onrender.com';
  };

  const backendUrl = getBackendUrl();

  useEffect(() => {
    loadPage();
  }, [username]);

  const loadPage = async () => {
    try {
      setLoading(true);
      const response = await founderPageAPI.getPublic(username);
      setPage(response.data.founderPage);
    } catch (err) {
      console.error('Failed to load page:', err);
      setError(err.response?.data?.error || 'Page not found');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin text-4xl mb-4">⏳</div>
          <div className="text-white">Loading...</div>
        </div>
      </div>
    );
  }

  if (error || !page) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4">😕</div>
          <h1 className="text-2xl text-white mb-2">Page Not Found</h1>
          <p className="text-gray-400 mb-6">{error || 'This page does not exist or has been unpublished.'}</p>
          <a
            href="https://personify-alpha.vercel.app"
            className="inline-block px-6 py-3 bg-white text-black rounded-lg font-semibold hover:bg-gray-200 transition"
          >
            Go to Personify
          </a>
        </div>
      </div>
    );
  }

  // Render template based on selection
  if (page.template === 'visionary') {
    return <VisionaryTemplate page={page} backendUrl={backendUrl} />;
  } else if (page.template === 'storyteller') {
    return <StorytellerTemplate page={page} backendUrl={backendUrl} />;
  }

  // Fallback
  return (
    <div className="min-h-screen bg-black flex items-center justify-center">
      <div className="text-white">Unknown template</div>
    </div>
  );
}

// --- VISIONARY TEMPLATE (Dan Giang Style - Light) ---
function VisionaryTemplate({ page, backendUrl }) {
  const { design, basicInfo, contact, services, portfolio, featured } = page;

  return (
    <div 
      className="min-h-screen bg-gray-50"
      style={{ fontFamily: design.bodyFont }}
    >
      {/* Header/Nav */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-6 py-4 flex justify-between items-center">
          <div className="flex items-center gap-3">
            {basicInfo.logoUrl && (
              <img 
                src={`${backendUrl}${basicInfo.logoUrl}`} 
                alt="Logo" 
                className="h-8"
              />
            )}
            <span 
              className="text-xl font-bold"
              style={{ fontFamily: design.titleFont, color: design.primaryColor }}
            >
              {basicInfo.name || page.username}
            </span>
          </div>
          <nav className="hidden md:flex gap-6 text-sm">
            <a href="#about" className="text-gray-600 hover:text-gray-900">About</a>
            <a href="#services" className="text-gray-600 hover:text-gray-900">Services</a>
            <a href="#portfolio" className="text-gray-600 hover:text-gray-900">Portfolio</a>
            <a href="#contact" className="text-gray-600 hover:text-gray-900">Contact</a>
          </nav>
        </div>
      </header>

      {/* Hero Section */}
      <section className="bg-gray-100 py-20">
        <div className="max-w-6xl mx-auto px-6 grid md:grid-cols-2 gap-12 items-center">
          <div>
            <h1 
              className="text-5xl md:text-6xl font-bold mb-4"
              style={{ fontFamily: design.titleFont, color: design.primaryColor }}
            >
              {basicInfo.name || 'Your Name'}
            </h1>
            <p 
              className="text-2xl mb-6"
              style={{ color: design.secondaryColor }}
            >
              {basicInfo.title || 'Your Professional Title'}
            </p>
            <p className="text-gray-600 mb-8">
              {basicInfo.tagline || ''}
            </p>
            <div className="flex gap-4">
              <a 
                href="#contact"
                className="px-6 py-3 rounded-lg font-semibold text-white"
                style={{ backgroundColor: design.primaryColor }}
              >
                Get In Touch
              </a>
              {contact.social1 && (
                <a 
                  href={`https://instagram.com/${contact.social1.replace('@', '')}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-6 py-3 border-2 rounded-lg font-semibold"
                  style={{ borderColor: design.primaryColor, color: design.primaryColor }}
                >
                  {contact.social1}
                </a>
              )}
            </div>
          </div>
          {basicInfo.heroImageUrl && (
            <div className="rounded-2xl overflow-hidden">
              <img 
                src={`${backendUrl}${basicInfo.heroImageUrl}`}
                alt={basicInfo.name}
                className="w-full h-full object-cover"
              />
            </div>
          )}
        </div>
      </section>

      {/* About Section */}
      <section id="about" className="py-20 bg-white">
        <div className="max-w-4xl mx-auto px-6">
          <h2 
            className="text-4xl font-bold mb-8"
            style={{ fontFamily: design.titleFont, color: design.primaryColor }}
          >
            About
          </h2>
          {basicInfo.about1 && (
            <p className="text-gray-700 text-lg mb-6 leading-relaxed">
              {basicInfo.about1}
            </p>
          )}
          {basicInfo.about2 && (
            <p className="text-gray-700 text-lg leading-relaxed">
              {basicInfo.about2}
            </p>
          )}
        </div>
      </section>

      {/* Services Section */}
      {services && services.length > 0 && (
        <section id="services" className="py-20 bg-gray-50">
          <div className="max-w-6xl mx-auto px-6">
            <h2 
              className="text-4xl font-bold mb-12 text-center"
              style={{ fontFamily: design.titleFont, color: design.primaryColor }}
            >
              Services
            </h2>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              {services.map((service, index) => (
                <div key={index} className="bg-white rounded-xl p-6 shadow-sm">
                  <h3 
                    className="text-xl font-bold mb-3"
                    style={{ color: design.primaryColor }}
                  >
                    {service.title}
                  </h3>
                  <p className="text-gray-600">
                    {service.description}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Portfolio Section */}
      {portfolio?.images && portfolio.images.length > 0 && (
        <section id="portfolio" className="py-20 bg-white">
          <div className="max-w-6xl mx-auto px-6">
            <h2 
              className="text-4xl font-bold mb-12 text-center"
              style={{ fontFamily: design.titleFont, color: design.primaryColor }}
            >
              Portfolio
            </h2>
            <div className="grid md:grid-cols-3 gap-4">
              {portfolio.images.map((img, index) => (
                img?.url && (
                  <div key={index} className="aspect-square rounded-lg overflow-hidden">
                    <img 
                      src={`${backendUrl}${img.url}`}
                      alt={`Portfolio ${index + 1}`}
                      className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                    />
                  </div>
                )
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Featured Work */}
      {featured && featured.length > 0 && (
        <section className="py-20 bg-gray-50">
          <div className="max-w-6xl mx-auto px-6">
            <h2 
              className="text-4xl font-bold mb-12 text-center"
              style={{ fontFamily: design.titleFont, color: design.primaryColor }}
            >
              Featured Work
            </h2>
            <div className="grid md:grid-cols-3 gap-8">
              {featured.map((work, index) => (
                work.imageUrl && (
                  <div key={index} className="bg-white rounded-xl overflow-hidden shadow-sm">
                    <img 
                      src={`${backendUrl}${work.imageUrl}`}
                      alt={work.title}
                      className="w-full h-64 object-cover"
                    />
                    <div className="p-6">
                      <h3 className="font-bold text-lg mb-1">{work.title}</h3>
                      <p className="text-gray-600 text-sm mb-2">{work.subtitle}</p>
                      <p className="text-gray-400 text-xs">{work.year}</p>
                    </div>
                  </div>
                )
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Contact Section */}
      <section id="contact" className="py-20 bg-white">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <h2 
            className="text-4xl font-bold mb-6"
            style={{ fontFamily: design.titleFont, color: design.primaryColor }}
          >
            {contact.ctaText || "Let's Work Together"}
          </h2>
          <p className="text-gray-600 text-lg mb-8">
            {contact.ctaDescription || ''}
          </p>
          <div className="grid md:grid-cols-2 gap-6 max-w-2xl mx-auto">
            {contact.email && (
              <a 
                href={`mailto:${contact.email}`}
                className="flex items-center justify-center gap-3 p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition"
              >
                <span>📧</span>
                <span className="text-gray-700">{contact.email}</span>
              </a>
            )}
            {contact.phone && (
              <a 
                href={`tel:${contact.phone}`}
                className="flex items-center justify-center gap-3 p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition"
              >
                <span>📱</span>
                <span className="text-gray-700">{contact.phone}</span>
              </a>
            )}
            {contact.location && (
              <div className="flex items-center justify-center gap-3 p-4 bg-gray-50 rounded-lg">
                <span>📍</span>
                <span className="text-gray-700">{contact.location}</span>
              </div>
            )}
            {contact.social2 && (
              <a 
                href={`https://twitter.com/${contact.social2.replace('@', '')}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-3 p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition"
              >
                <span>🐦</span>
                <span className="text-gray-700">{contact.social2}</span>
              </a>
            )}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-8">
        <div className="max-w-6xl mx-auto px-6 text-center">
          <p className="text-gray-400 text-sm">
            Created with <a href="https://personify-alpha.vercel.app" className="text-white hover:underline">Personify</a>
          </p>
        </div>
      </footer>
    </div>
  );
}

// --- STORYTELLER TEMPLATE (Sarah Chen Style - Dark) ---
function StorytellerTemplate({ page, backendUrl }) {
  const { design, basicInfo, contact, services, portfolio, featured } = page;

  return (
    <div 
      className="min-h-screen bg-black text-white"
      style={{ fontFamily: design.bodyFont }}
    >
      {/* Hero Section with full-screen image */}
      <section className="relative h-screen flex items-center justify-center">
        {basicInfo.heroImageUrl && (
          <div className="absolute inset-0 z-0">
            <img 
              src={`${backendUrl}${basicInfo.heroImageUrl}`}
              alt={basicInfo.name}
              className="w-full h-full object-cover opacity-60"
            />
            <div className="absolute inset-0 bg-gradient-to-b from-black/50 to-black"></div>
          </div>
        )}
        <div className="relative z-10 text-center px-6">
          <h1 
            className="text-6xl md:text-8xl font-bold mb-4"
            style={{ fontFamily: design.titleFont }}
          >
            {basicInfo.name || 'Your Name'}
          </h1>
          <p 
            className="text-2xl md:text-3xl mb-6"
            style={{ color: design.secondaryColor }}
          >
            {basicInfo.title || 'Your Professional Title'}
          </p>
          <p className="text-gray-300 max-w-2xl mx-auto">
            {basicInfo.tagline || ''}
          </p>
        </div>
      </section>

      {/* About Section */}
      <section className="py-20 bg-black">
        <div className="max-w-4xl mx-auto px-6">
          <h2 
            className="text-4xl md:text-5xl font-bold mb-8"
            style={{ fontFamily: design.titleFont, color: design.primaryColor }}
          >
            About
          </h2>
          {basicInfo.about1 && (
            <p className="text-gray-300 text-lg mb-6 leading-relaxed">
              {basicInfo.about1}
            </p>
          )}
          {basicInfo.about2 && (
            <p className="text-gray-300 text-lg leading-relaxed">
              {basicInfo.about2}
            </p>
          )}
        </div>
      </section>

      {/* Portfolio Section */}
      {portfolio?.images && portfolio.images.length > 0 && (
        <section className="py-20 bg-zinc-900">
          <div className="max-w-6xl mx-auto px-6">
            <h2 
              className="text-4xl font-bold mb-12 text-center"
              style={{ fontFamily: design.titleFont, color: design.primaryColor }}
            >
              Portfolio
            </h2>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {portfolio.images.map((img, index) => (
                img?.url && (
                  <div key={index} className="aspect-square rounded-lg overflow-hidden">
                    <img 
                      src={`${backendUrl}${img.url}`}
                      alt={`Portfolio ${index + 1}`}
                      className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                    />
                  </div>
                )
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Services Section */}
      {services && services.length > 0 && (
        <section className="py-20 bg-black">
          <div className="max-w-6xl mx-auto px-6">
            <h2 
              className="text-4xl font-bold mb-12 text-center"
              style={{ fontFamily: design.titleFont, color: design.primaryColor }}
            >
              Services
            </h2>
            <div className="grid md:grid-cols-2 gap-8">
              {services.map((service, index) => (
                <div key={index} className="bg-zinc-900 rounded-xl p-8">
                  <div className="text-4xl mb-4" style={{ color: design.secondaryColor }}>
                    {['📸', '🎬', '✨', '🎨'][index % 4]}
                  </div>
                  <h3 className="text-2xl font-bold mb-3">{service.title}</h3>
                  <p className="text-gray-400">{service.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Featured Work */}
      {featured && featured.length > 0 && (
        <section className="py-20 bg-zinc-900">
          <div className="max-w-6xl mx-auto px-6">
            <h2 
              className="text-4xl font-bold mb-12 text-center"
              style={{ fontFamily: design.titleFont, color: design.primaryColor }}
            >
              Featured Work
            </h2>
            <div className="grid md:grid-cols-3 gap-6">
              {featured.map((work, index) => (
                work.imageUrl && (
                  <div key={index} className="bg-black rounded-xl overflow-hidden">
                    <img 
                      src={`${backendUrl}${work.imageUrl}`}
                      alt={work.title}
                      className="w-full h-64 object-cover"
                    />
                    <div className="p-6">
                      <h3 className="font-bold text-xl mb-1">{work.title}</h3>
                      <p className="text-gray-400 text-sm mb-2">{work.subtitle}</p>
                      <p className="text-gray-500 text-xs">{work.year}</p>
                    </div>
                  </div>
                )
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Contact Section */}
      <section className="py-20 bg-black">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <h2 
            className="text-5xl font-bold mb-6"
            style={{ fontFamily: design.titleFont }}
          >
            {contact.ctaText || "Let's Work Together"}
          </h2>
          <p className="text-gray-400 text-lg mb-12">
            {contact.ctaDescription || ''}
          </p>
          <div className="grid md:grid-cols-2 gap-6 max-w-2xl mx-auto">
            {contact.email && (
              <a 
                href={`mailto:${contact.email}`}
                className="flex items-center justify-center gap-3 p-6 bg-zinc-900 rounded-lg hover:bg-zinc-800 transition"
              >
                <span>📧</span>
                <span>{contact.email}</span>
              </a>
            )}
            {contact.phone && (
              <a 
                href={`tel:${contact.phone}`}
                className="flex items-center justify-center gap-3 p-6 bg-zinc-900 rounded-lg hover:bg-zinc-800 transition"
              >
                <span>📱</span>
                <span>{contact.phone}</span>
              </a>
            )}
            {contact.location && (
              <div className="flex items-center justify-center gap-3 p-6 bg-zinc-900 rounded-lg">
                <span>📍</span>
                <span>{contact.location}</span>
              </div>
            )}
            {contact.social1 && (
              <a 
                href={`https://instagram.com/${contact.social1.replace('@', '')}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-3 p-6 bg-zinc-900 rounded-lg hover:bg-zinc-800 transition"
              >
                <span>📸</span>
                <span>{contact.social1}</span>
              </a>
            )}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-zinc-950 py-8">
        <div className="max-w-6xl mx-auto px-6 text-center">
          <p className="text-gray-500 text-sm">
            Created with <a href="https://personify-alpha.vercel.app" className="text-white hover:underline">Personify</a>
          </p>
        </div>
      </footer>
    </div>
  );
}