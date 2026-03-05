import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Layout from '../components/Layout';
import { personaAPI, generationAPI } from '../services/api';
import founderPageAPI from '../services/founderPageAPI';

// --- HELPER COMPONENTS ---

const StatCard = ({ title, value, subtitle, icon, colorClass }) => (
  <div className="bg-dark-card rounded-2xl p-6 border border-gray-800">
    <div className="flex items-start justify-between mb-4">
      <div>
        <p className="text-sm text-gray-400 mb-1">{title}</p>
        <p className={`font-bold text-white ${typeof value === 'string' && value.length > 10 ? 'text-2xl' : 'text-3xl'}`}>{value}</p>
      </div>
      <div className={`w-12 h-12 ${colorClass} rounded-xl flex items-center justify-center text-2xl`}>
        {icon}
      </div>
    </div>
    <p className="text-xs text-gray-500">{subtitle}</p>
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
  const navigate = useNavigate();
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
      console.error('Failed to load founder page status:', error);
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
    navigator.clipboard.writeText(`https://personify-alpha.vercel.app/${founderPage.username}`);
    alert('URL copied to clipboard!');
  };

  if (loading) return <Layout><div className="flex items-center justify-center h-screen"><div className="text-xl text-gray-400">Loading...</div></div></Layout>;

  const statCardsData = [
    { title: 'Images Today', value: `${stats.imagesUsedToday}/10`, subtitle: `${10 - stats.imagesUsedToday} remaining`, icon: '🖼️', colorClass: 'bg-purple-500/20' },
    { title: 'Text Today', value: `${stats.textUsedToday}/50`, subtitle: `${50 - stats.textUsedToday} remaining`, icon: '📝', colorClass: 'bg-green-500/20' },
    { title: 'Total Generations', value: stats.totalGenerations, subtitle: 'All time', icon: '✨', colorClass: 'bg-blue-500/20' },
    { title: 'Favourite Model', value: stats.favoriteModel, subtitle: 'Most Used', icon: '🤖', colorClass: 'bg-brand-pink/20' }
  ];

  const fpFeaturesData = [
    { title: '2 Templates', desc: 'Choose from professional designs' },
    { title: '1-Click Publish', desc: 'Go live instantly' },
    { title: 'Custom URL', desc: 'personify.io/yourname' },
    { title: 'Portfolio Showcase', desc: 'Display your best work' }
  ];

  return (
    <Layout>
      <div className="p-8 max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-semibold text-white mb-2">Welcome Back, {persona?.userId ? 'Sagar' : 'User'}</h1>
          <p className="text-gray-400">Ready to create something amazing today?</p>
        </div>

        {/* Persona Card */}
        {persona ? (
          <div className="bg-dark-card rounded-2xl p-6 mb-8 border border-gray-800">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 bg-gradient-to-br from-brand-pink to-purple-600 rounded-full flex items-center justify-center text-white font-semibold text-xl">SK</div>
                <div>
                  <h2 className="text-xl font-semibold text-white mb-1">Your Persona</h2>
                  <p className="text-gray-400 text-sm">Content Creator • {persona.industry || 'Tech & Lifestyle'}</p>
                </div>
              </div>
              <Link to="/persona" className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg transition text-sm font-medium">Change Persona</Link>
            </div>
            <div className="grid grid-cols-3 gap-6 mt-6">
              {[
                { val: persona.personaImages?.length || 0, label: 'Reference Images', isBig: true },
                { val: persona.targetAudience || 'Young Adults', label: 'Target Audience' },
                { val: persona.brandTone || 'Casual & Fun', label: 'Brand Tone' }
              ].map((item, i) => (
                <div key={i} className="text-center">
                  <p className={`${item.isBig ? 'text-3xl font-bold' : 'text-lg font-semibold'} text-white mb-1`}>{item.val}</p>
                  <p className="text-sm text-gray-400">{item.label}</p>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-2xl p-6 mb-8">
            <div className="flex items-start gap-4">
              <span className="text-3xl">👤</span>
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-yellow-500 mb-1">Create Your Persona</h3>
                <p className="text-gray-300 mb-4">Set up your digital persona to start generating personalized AI content.</p>
                <Link to="/persona" className="inline-block px-6 py-2 bg-yellow-500 text-black rounded-lg hover:bg-yellow-400 transition font-medium">Create Persona →</Link>
              </div>
            </div>
          </div>
        )}

        {/* Founder Page Widget */}
        <div className="mb-8">
          <h2 className="text-2xl font-semibold text-white mb-4">Founder Page</h2>
          {loadingFounderPage ? (
            <div className="bg-dark-card rounded-xl p-8 border border-gray-800"><div className="text-gray-400">Loading...</div></div>
          ) : founderPage?.published ? (
            <div className="bg-dark-card rounded-xl p-8 border border-gray-800">
              <div className="flex items-start justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-lg bg-green-500/20 flex items-center justify-center text-2xl">✨</div>
                  <div>
                    <h3 className="text-xl font-semibold text-white">Your Page is Live!</h3>
                    <p className="text-sm text-gray-400">Template: <span className="capitalize">{founderPage.template}</span></p>
                  </div>
                </div>
                <span className="px-3 py-1 bg-green-500/20 text-green-400 text-xs font-semibold rounded-full">Published</span>
              </div>
              <div className="bg-black/40 rounded-lg p-4 mb-6">
                <p className="text-gray-400 text-sm mb-2">Your page URL:</p>
                <div className="flex items-center gap-3">
                  <code className="flex-1 text-white bg-black/40 px-4 py-2 rounded text-sm">personify-alpha.vercel.app/{founderPage.username}</code>
                  <button onClick={copyUrl} className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg transition text-sm">Copy</button>
                </div>
              </div>
              <div className="flex gap-3">
                <button onClick={() => window.open(`/${founderPage.username}`, '_blank')} className="flex-1 px-6 py-3 bg-white text-black rounded-lg font-semibold hover:bg-gray-200 transition">View Page</button>
                <button onClick={() => navigate('/founder-page')} className="flex-1 px-6 py-3 bg-white/10 hover:bg-white/20 text-white rounded-lg font-semibold transition">Edit Page</button>
              </div>
            </div>
          ) : founderPage && !founderPage.published ? (
            <div className="bg-dark-card rounded-xl p-8 border border-gray-800">
              <div className="flex items-start justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-lg bg-yellow-500/20 flex items-center justify-center text-2xl">📝</div>
                  <div>
                    <h3 className="text-xl font-semibold text-white">Page in Draft</h3>
                    <p className="text-sm text-gray-400">Template: <span className="capitalize">{founderPage.template}</span></p>
                  </div>
                </div>
                <span className="px-3 py-1 bg-yellow-500/20 text-yellow-400 text-xs font-semibold rounded-full">Draft</span>
              </div>
              <p className="text-gray-400 mb-6">Your page is saved but not published yet. Continue editing and publish when ready.</p>
              <button onClick={() => navigate('/founder-page')} className="px-6 py-3 bg-white text-black rounded-lg font-semibold hover:bg-gray-200 transition">Continue Editing</button>
            </div>
          ) : (
            <div className="bg-dark-card rounded-xl p-8 border border-gray-800">
              <div className="flex items-start justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-lg bg-brand-pink/20 flex items-center justify-center text-2xl">🚀</div>
                  <div>
                    <h3 className="text-xl font-semibold text-white">Create Your Founder Page</h3>
                    <p className="text-sm text-gray-400">Showcase your personal brand online</p>
                  </div>
                </div>
                <span className="px-3 py-1 bg-green-500/20 text-green-400 text-xs font-semibold rounded-full">FREE</span>
              </div>
              <div className="grid md:grid-cols-2 gap-4 mb-6">
                {fpFeaturesData.map((f, i) => <FeatureItem key={i} title={f.title} desc={f.desc} />)}
              </div>
              <button onClick={() => navigate('/founder-page')} className="w-full px-6 py-3 bg-white text-black rounded-lg font-semibold hover:bg-gray-200 transition">Create Your Page</button>
            </div>
          )}
        </div>

        {/* Stats Grid */}
        <div className="grid md:grid-cols-4 gap-6 mb-8">
          {statCardsData.map((stat, idx) => <StatCard key={idx} {...stat} />)}
        </div>

        {/* Create New Generation */}
        <div className="bg-dark-card rounded-2xl p-6 border border-gray-800 mb-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-white">Create New Generation</h2>
            <div className="flex gap-2">
              <Link to="/generate?type=image" className="px-4 py-2 bg-white text-black rounded-lg hover:bg-gray-200 transition font-medium text-sm">Image</Link>
              <Link to="/generate?type=text" className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg transition font-medium text-sm">Text</Link>
            </div>
          </div>
          <div className="mb-4">
            <label className="block text-sm text-gray-400 mb-2">Your Prompt</label>
            <textarea placeholder="Describe what you want to create... Your persona will automatically enhance this prompt with your brand identity and style." rows={3} className="w-full px-4 py-3 bg-black/40 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:border-brand-pink focus:ring-1 focus:ring-brand-pink outline-none transition resize-none" />
          </div>
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm text-gray-400 mb-2">AI Model</label>
              <select className="w-full px-4 py-3 bg-black/40 border border-gray-700 rounded-lg text-white focus:border-brand-pink focus:ring-1 focus:ring-brand-pink outline-none transition"><option>DALL-E (Default)</option></select>
            </div>
            <div className="flex items-end">
              <Link to="/generate" className="w-full px-6 py-3 bg-white text-black rounded-lg hover:bg-gray-200 transition font-semibold text-center">Generate with AI</Link>
            </div>
          </div>
        </div>

        {/* Recent Generations */}
        {recentGenerations.length > 0 && (
          <div className="bg-dark-card rounded-2xl p-6 border border-gray-800">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-white">Recent Generations</h2>
              <Link to="/history" className="text-sm text-brand-pink hover:text-pink-400 font-medium">View All →</Link>
            </div>
            <div className="grid md:grid-cols-3 gap-4">
              {recentGenerations.map((gen) => (
                <div key={gen.id} className="bg-black/40 rounded-xl overflow-hidden border border-gray-800 hover:border-gray-700 transition">
                  <div className="h-48 bg-gray-900 flex items-center justify-center">
                    {gen.type === 'image' ? (
                      gen.result ? <img src={gen.result} alt="Generated" className="w-full h-full object-cover" /> : <span className="text-4xl">🖼️</span>
                    ) : (
                      <div className="p-4 text-sm text-gray-400 line-clamp-6">{gen.result}</div>
                    )}
                  </div>
                  <div className="p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <span className={`text-xs px-2 py-1 rounded ${gen.type === 'image' ? 'bg-purple-500/20 text-purple-400' : 'bg-green-500/20 text-green-400'}`}>{gen.type.toUpperCase()}</span>
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
    </Layout>
  );
}