'use client'

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import Layout from '../components/Layout';
import { personaAPI, generationAPI } from '../services/api';
import founderPageAPI from '../services/founderPageAPI';
import { useAuth } from '../context/AuthContext';

// --- HELPER COMPONENTS ---

const StatCard = ({ title, value, subtitle, icon, colorClass }) => (
  <div className="bg-dark-card rounded-2xl p-6 border border-gray-800">
    <div className="flex items-start justify-between mb-4">
      <div className="flex-1 min-w-0 pr-2">
        <p className="text-sm text-gray-400 mb-1 truncate">{title}</p>
        <p className={`font-bold text-white ${typeof value === 'string' && value.length > 8 ? 'text-2xl' : 'text-3xl'}`}>{value}</p>
      </div>
      <div className={`w-12 h-12 flex-shrink-0 ${colorClass} rounded-xl flex items-center justify-center text-2xl`}>
        {icon}
      </div>
    </div>
    <p className="text-xs text-gray-500 leading-tight">{subtitle}</p>
  </div>
);

const FeatureItem = ({ title, desc }) => (
  <div className="flex items-start gap-3">
    <span className="text-brand-pink">✓</span>
    <div>
      <p className="text-white font-medium">{title}</p>
      <p className="text-gray-400 text-sm">{desc}</p>
    </div>
  </div>
);

// --- MAIN COMPONENT ---

export default function Dashboard() {
  const router = useRouter();
  const { user } = useAuth();
  const [persona, setPersona] = useState(null);
  const [recentGenerations, setRecentGenerations] = useState([]);
  const [founderPage, setFounderPage] = useState(null);
  const [loadingFounderPage, setLoadingFounderPage] = useState(true);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ totalGenerations: 0, imageGenerations: 0, textGenerations: 0, imagesUsedToday: 0, textUsedToday: 0, favoriteModel: 'DALL-E' });

  useEffect(() => {
    loadDashboardData();
    loadFounderPageStatus();
  }, []);

  const loadFounderPageStatus = async () => {
    try {
      setLoadingFounderPage(true);
      const { data } = await founderPageAPI.get();
      setFounderPage(data.founderPage);
    } catch (error) {
      setFounderPage(null);
    } finally {
      setLoadingFounderPage(false);
    }
  };

  const loadDashboardData = async () => {
    try {
      try {
        const personaRes = await personaAPI.get();
        setPersona(personaRes.data.persona);
      } catch (err) { setPersona(null); }

      const generationsRes = await generationAPI.getAll();
      const generations = generationsRes.data.generations || [];
      setRecentGenerations(generations.slice(0, 3));

      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const todayGenerations = generations.filter(g => new Date(g.createdAt) >= today);
      const modelCounts = generations.reduce((acc, g) => { acc[g.model] = (acc[g.model] || 0) + 1; return acc; }, {});
      const favoriteModel = Object.keys(modelCounts).length ? Object.keys(modelCounts).reduce((a, b) => modelCounts[a] > modelCounts[b] ? a : b) : 'DALL-E';

      setStats({
        totalGenerations: generations.length,
        imageGenerations: generations.filter(g => g.type === 'image').length,
        textGenerations: generations.filter(g => g.type === 'text').length,
        imagesUsedToday: todayGenerations.filter(g => g.type === 'image').length,
        textUsedToday: todayGenerations.filter(g => g.type === 'text').length,
        favoriteModel: favoriteModel.toUpperCase()
      });
    } catch (error) {
      console.error('Failed to load dashboard data:', error);
    } finally { setLoading(false); }
  };

  const copyUrl = () => {
    navigator.clipboard.writeText(`https://personify.so/${founderPage.username}`);
    alert('URL copied to clipboard!');
  };

  if (loading) return (
    <Layout>
      <div className="flex items-center justify-center h-screen">
        <div className="text-xl text-gray-400">Loading...</div>
      </div>
    </Layout>
  );

  const statCardsData = [
    { title: 'Images Today', value: `${stats.imagesUsedToday}/10`, subtitle: `${10 - stats.imagesUsedToday} remaining`, icon: '🖼️', colorClass: 'bg-purple-500/20' },
    { title: 'Text Today', value: `${stats.textUsedToday}/50`, subtitle: `${50 - stats.textUsedToday} remaining`, icon: '📝', colorClass: 'bg-green-500/20' },
    { title: 'Total', value: stats.totalGenerations, subtitle: 'All time', icon: '✨', colorClass: 'bg-blue-500/20' },
    { title: 'Top Model', value: stats.favoriteModel, subtitle: 'Most used', icon: '🤖', colorClass: 'bg-brand-pink/20' }
  ];

  const fpFeaturesData = [
    { title: '2 Templates', desc: 'Choose from professional designs' },
    { title: '1-Click Publish', desc: 'Go live instantly' },
    { title: 'Custom URL', desc: 'personify.io/yourname' },
    { title: 'Portfolio Showcase', desc: 'Display your best work' }
  ];

  const statItemsData = [
    { title: 'Images today', value: `${stats.imagesUsedToday}/10`, subtitle: `${10 - stats.imagesUsedToday} left` },
    { title: 'Text today', value: `${stats.textUsedToday}/50`, subtitle: `${50 - stats.textUsedToday} left` },
    { title: 'Total', value: stats.totalGenerations, subtitle: 'all time' },
    { title: 'Top model', value: stats.favoriteModel, subtitle: 'most used' }
  ];

  // ── Shared sub-components ──────────────────────────────────────────

  const PersonaCard = () => persona ? (
    <div className="bg-dark-card rounded-2xl p-4 md:p-6 border border-gray-800">
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 mb-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 md:w-16 md:h-16 bg-gradient-to-br from-brand-pink to-purple-600 rounded-full flex items-center justify-center text-white font-semibold text-lg md:text-xl flex-shrink-0">SK</div>
          <div>
            <h2 className="text-base md:text-xl font-semibold text-white">Your Persona</h2>
            <p className="text-gray-400 text-xs md:text-sm">Content Creator • {persona.industry || 'Tech & Lifestyle'}</p>
          </div>
        </div>
        <Link href="/persona" className="self-start sm:self-auto px-3 py-1.5 md:px-4 md:py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg transition text-xs md:text-sm font-medium whitespace-nowrap">
          Edit Persona
        </Link>
      </div>
      <div className="grid grid-cols-3 gap-2 md:gap-6 mt-2 md:mt-4">
        {[
          { val: persona.personaImages?.length || 0, label: 'Photos', isBig: true },
          { val: persona.targetAudience || 'Young Adults', label: 'Audience' },
          { val: persona.brandTone || 'Casual & Fun', label: 'Tone' }
        ].map((item, i) => (
          <div key={i} className="text-center bg-black/20 rounded-xl p-2 md:p-0 md:bg-transparent">
            <p className={`${item.isBig ? 'text-2xl md:text-3xl font-bold' : 'text-sm md:text-lg font-semibold'} text-white mb-0.5 md:mb-1 truncate`}>{item.val}</p>
            <p className="text-xs text-gray-400 truncate">{item.label}</p>
          </div>
        ))}
      </div>
    </div>
  ) : (
    <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-2xl p-4 md:p-6">
      <div className="flex items-start gap-3 md:gap-4">
        <span className="text-2xl md:text-3xl">👤</span>
        <div className="flex-1">
          <h3 className="text-base md:text-lg font-semibold text-yellow-500 mb-1">Create Your Persona</h3>
          <p className="text-gray-300 text-sm mb-3 md:mb-4">Set up your digital persona to generate personalized AI content.</p>
          <Link href="/persona" className="inline-block px-4 py-2 bg-yellow-500 text-black rounded-lg hover:bg-yellow-400 transition font-medium text-sm">
            Create Persona →
          </Link>
        </div>
      </div>
    </div>
  );

  return (
    <Layout>
      <div className="p-4 md:p-8 max-w-7xl mx-auto">

        {/* Header */}
        <div className="mb-5 md:mb-8">
          <h1 className="text-xl md:text-3xl font-semibold text-white mb-1">Welcome Back, {user?.name || 'User'} 👋</h1>
          <p className="text-gray-400 text-sm">Ready to create something amazing today?</p>
        </div>

        {/* ── MOBILE LAYOUT (flex-col with order) ── */}
        <div className="flex flex-col md:hidden gap-4">

          {/* 1. Persona */}
          <PersonaCard />

          {/* 2. Founder Page — compact row */}
          {loadingFounderPage ? (
            <div className="bg-dark-card rounded-2xl p-4 border border-gray-800">
              <div className="text-gray-500 text-sm">Loading...</div>
            </div>
          ) : founderPage?.published ? (
            <div className="bg-dark-card rounded-2xl p-4 border border-gray-800 flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-green-500/20 flex items-center justify-center text-sm flex-shrink-0">✨</div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5 mb-0.5">
                  <p className="text-sm font-semibold text-white">Page Live</p>
                  <span className="px-1.5 py-0.5 bg-green-500/20 text-green-400 text-[10px] font-semibold rounded-full">Live</span>
                </div>
                <code className="text-xs text-gray-500 truncate block">personify.so/{founderPage.username}</code>
              </div>
              <div className="flex gap-1.5 flex-shrink-0">
                <button onClick={copyUrl} className="px-2.5 py-1.5 bg-white/10 text-white rounded-lg text-xs font-medium">Copy</button>
                <button onClick={() => window.open(`/${founderPage.username}`, '_blank')} className="px-2.5 py-1.5 bg-white text-black rounded-lg text-xs font-semibold">View</button>
                <button onClick={() => router.push('/founder-page')} className="px-2.5 py-1.5 bg-white/10 text-white rounded-lg text-xs font-medium">Edit</button>
              </div>
            </div>
          ) : founderPage && !founderPage.published ? (
            <div className="bg-dark-card rounded-2xl p-4 border border-gray-800 flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-yellow-500/20 flex items-center justify-center text-sm flex-shrink-0">📝</div>
              <div className="flex-1">
                <div className="flex items-center gap-1.5 mb-0.5">
                  <p className="text-sm font-semibold text-white">Founder Page</p>
                  <span className="px-1.5 py-0.5 bg-yellow-500/20 text-yellow-400 text-[10px] font-semibold rounded-full">Draft</span>
                </div>
                <p className="text-xs text-gray-500">Not published yet</p>
              </div>
              <button onClick={() => router.push('/founder-page')} className="px-3 py-1.5 bg-white text-black rounded-lg text-xs font-semibold flex-shrink-0">Continue</button>
            </div>
          ) : (
            <div className="bg-dark-card rounded-2xl p-4 border border-gray-800 flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-brand-pink/20 flex items-center justify-center text-sm flex-shrink-0">🚀</div>
              <div className="flex-1">
                <div className="flex items-center gap-1.5 mb-0.5">
                  <p className="text-sm font-semibold text-white">Founder Page</p>
                  <span className="px-1.5 py-0.5 bg-green-500/20 text-green-400 text-[10px] font-semibold rounded-full">FREE</span>
                </div>
                <p className="text-xs text-gray-500">2 templates · custom URL · portfolio</p>
              </div>
              <button onClick={() => router.push('/founder-page')} className="px-3 py-1.5 bg-white text-black rounded-lg text-xs font-semibold flex-shrink-0">Create</button>
            </div>
          )}

          {/* 3. Stats — subtle strip */}
          <div className="bg-dark-card rounded-2xl border border-gray-800 overflow-hidden">
            <div className="grid grid-cols-2 divide-x divide-y divide-gray-800">
              {statItemsData.map((s, i) => (
                <div key={i} className="px-4 py-3">
                  <p className="text-[11px] text-gray-500 mb-0.5">{s.title}</p>
                  <p className="text-sm font-semibold text-gray-300">{s.value}</p>
                  <p className="text-[10px] text-gray-600 mt-0.5">{s.subtitle}</p>
                </div>
              ))}
            </div>
          </div>

        </div>

        {/* ── DESKTOP LAYOUT (original, unchanged) ── */}
        <div className="hidden md:block">

          {/* Stats Grid */}
          <div className="grid grid-cols-4 gap-6 mb-8">
            {statCardsData.map((stat, idx) => <StatCard key={idx} {...stat} />)}
          </div>

          {/* Persona Card */}
          <div className="mb-8">
            <PersonaCard />
          </div>

          {/* Founder Page + Generate */}
          <div className="grid md:grid-cols-2 gap-6 mb-8">

            {/* Founder Page Widget */}
            <div>
              {loadingFounderPage ? (
                <div className="bg-dark-card rounded-2xl p-8 border border-gray-800 h-full">
                  <div className="text-gray-400 text-sm">Loading...</div>
                </div>
              ) : founderPage?.published ? (
                <div className="bg-dark-card rounded-2xl p-6 border border-gray-800 h-full flex flex-col">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-xl bg-green-500/20 flex items-center justify-center text-2xl">✨</div>
                      <div>
                        <h3 className="text-lg font-semibold text-white">Your Page is Live!</h3>
                        <p className="text-sm text-gray-400 capitalize">{founderPage.template} template</p>
                      </div>
                    </div>
                    <span className="px-2 py-1 bg-green-500/20 text-green-400 text-xs font-semibold rounded-full">Live</span>
                  </div>
                  <div className="bg-black/40 rounded-lg p-3 mb-4">
                    <p className="text-gray-500 text-xs mb-1">Your page URL</p>
                    <div className="flex items-center gap-2">
                      <code className="flex-1 text-white text-xs truncate">personify.so/{founderPage.username}</code>
                      <button onClick={copyUrl} className="px-2 py-1 bg-white/10 hover:bg-white/20 text-white rounded text-xs transition flex-shrink-0">Copy</button>
                    </div>
                  </div>
                  <div className="flex gap-3 mt-auto">
                    <button onClick={() => window.open(`/${founderPage.username}`, '_blank')} className="flex-1 py-3 bg-white text-black rounded-lg font-semibold hover:bg-gray-200 transition text-sm">View</button>
                    <button onClick={() => router.push('/founder-page')} className="flex-1 py-3 bg-white/10 hover:bg-white/20 text-white rounded-lg font-semibold transition text-sm">Edit</button>
                  </div>
                </div>
              ) : founderPage && !founderPage.published ? (
                <div className="bg-dark-card rounded-2xl p-6 border border-gray-800 h-full flex flex-col">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-xl bg-yellow-500/20 flex items-center justify-center text-2xl">📝</div>
                      <div>
                        <h3 className="text-lg font-semibold text-white">Page in Draft</h3>
                        <p className="text-sm text-gray-400 capitalize">{founderPage.template} template</p>
                      </div>
                    </div>
                    <span className="px-2 py-1 bg-yellow-500/20 text-yellow-400 text-xs font-semibold rounded-full">Draft</span>
                  </div>
                  <p className="text-gray-400 text-sm mb-4 flex-1">Your page is saved but not published yet.</p>
                  <button onClick={() => router.push('/founder-page')} className="w-full py-3 bg-white text-black rounded-lg font-semibold hover:bg-gray-200 transition text-sm">Continue Editing</button>
                </div>
              ) : (
                <div className="bg-dark-card rounded-2xl p-6 border border-gray-800 h-full flex flex-col">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-xl bg-brand-pink/20 flex items-center justify-center text-2xl">🚀</div>
                      <div>
                        <h3 className="text-lg font-semibold text-white">Founder Page</h3>
                        <p className="text-sm text-gray-400">Showcase your personal brand</p>
                      </div>
                    </div>
                    <span className="px-2 py-1 bg-green-500/20 text-green-400 text-xs font-semibold rounded-full">FREE</span>
                  </div>
                  <div className="space-y-3 mb-6 flex-1">
                    {fpFeaturesData.map((f, i) => <FeatureItem key={i} title={f.title} desc={f.desc} />)}
                  </div>
                  <button onClick={() => router.push('/founder-page')} className="w-full py-3 bg-white text-black rounded-lg font-semibold hover:bg-gray-200 transition text-sm">Create Your Page</button>
                </div>
              )}
            </div>

            {/* Create New Generation */}
            <div className="bg-dark-card rounded-2xl p-6 border border-gray-800 flex flex-col">
              <div className="mb-6">
                <h2 className="text-lg font-semibold text-white mb-1">Create New Generation</h2>
                <p className="text-sm text-gray-400">Generate AI images or text powered by your persona</p>
              </div>
              <div className="grid grid-cols-2 gap-4 mb-6 flex-1">
                <Link href="/generate?type=image" className="flex flex-col items-center justify-center gap-3 p-6 bg-black/40 border border-gray-700 rounded-xl hover:border-brand-pink hover:bg-brand-pink/5 transition group">
                  <span className="text-4xl group-hover:scale-110 transition-transform">🎨</span>
                  <div className="text-center">
                    <p className="text-white font-semibold text-sm">Image</p>
                    <p className="text-gray-500 text-xs mt-1">AI-generated visuals</p>
                  </div>
                </Link>
                <Link href="/generate?type=text" className="flex flex-col items-center justify-center gap-3 p-6 bg-black/40 border border-gray-700 rounded-xl hover:border-brand-pink hover:bg-brand-pink/5 transition group">
                  <span className="text-4xl group-hover:scale-110 transition-transform">✍️</span>
                  <div className="text-center">
                    <p className="text-white font-semibold text-sm">Text</p>
                    <p className="text-gray-500 text-xs mt-1">Captions, posts & more</p>
                  </div>
                </Link>
              </div>
              <Link href="/generate" className="w-full py-3 bg-white text-black rounded-xl font-semibold hover:bg-gray-200 transition text-center text-sm">
                Open Generator →
              </Link>
            </div>
          </div>

          {/* Recent Generations */}
          {recentGenerations.length > 0 && (
            <div className="bg-dark-card rounded-2xl p-6 border border-gray-800">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-white">Recent Generations</h2>
                <Link href="/history" className="text-sm text-brand-pink hover:text-pink-400 font-medium">View All →</Link>
              </div>
              <div className="grid grid-cols-3 gap-4">
                {recentGenerations.map((gen) => (
                  <div key={gen.id} className="bg-black/40 rounded-xl overflow-hidden border border-gray-800 hover:border-gray-700 transition">
                    <div className="w-full h-48 bg-gray-900 flex items-center justify-center overflow-hidden">
                      {gen.type === 'image' ? (
                        gen.result
                          ? <img src={gen.result} alt="Generated" className="w-full h-full object-cover" />
                          : <span className="text-3xl">🖼️</span>
                      ) : (
                        <div className="p-3 text-xs text-gray-400 line-clamp-4">{gen.result}</div>
                      )}
                    </div>
                    <div className="p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <span className={`text-xs px-2 py-0.5 rounded ${gen.type === 'image' ? 'bg-purple-500/20 text-purple-400' : 'bg-green-500/20 text-green-400'}`}>
                          {gen.type.toUpperCase()}
                        </span>
                        <span className="text-xs text-gray-500">{new Date(gen.createdAt).toLocaleDateString()}</span>
                      </div>
                      <p className="text-sm text-gray-300 line-clamp-2">{gen.prompt}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

        </div>

      </div>
    </Layout>
  );
}
