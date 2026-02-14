import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import Layout from '../components/Layout';
import { personaAPI, generationAPI } from '../services/api';

export default function Dashboard() {
  const [persona, setPersona] = useState(null);
  const [recentGenerations, setRecentGenerations] = useState([]);
  const [stats, setStats] = useState({
    totalGenerations: 0,
    imageGenerations: 0,
    textGenerations: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      // Load persona
      try {
        const personaRes = await personaAPI.get();
        setPersona(personaRes.data.persona);
      } catch (err) {
        // Persona might not exist yet
        setPersona(null);
      }

      // Load recent generations
      const generationsRes = await generationAPI.getAll();
      const generations = generationsRes.data.generations || [];
      setRecentGenerations(generations.slice(0, 5));

      // Calculate stats
      const imageCount = generations.filter(g => g.type === 'image').length;
      const textCount = generations.filter(g => g.type === 'text').length;
      
      setStats({
        totalGenerations: generations.length,
        imageGenerations: imageCount,
        textGenerations: textCount
      });

    } catch (error) {
      console.error('Failed to load dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-64">
          <div className="text-xl text-gray-600">Loading...</div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-6">
        {/* Welcome Header */}
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl p-8 text-white">
          <h1 className="text-3xl font-bold mb-2">Welcome to Personify!</h1>
          <p className="text-blue-100">
            {persona 
              ? 'Your AI-powered content creation hub' 
              : 'Get started by creating your persona'}
          </p>
        </div>

        {/* Persona Status */}
        {!persona ? (
          <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-6">
            <div className="flex items-start gap-4">
              <span className="text-3xl">👤</span>
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-gray-900 mb-1">
                  Create Your Persona
                </h3>
                <p className="text-gray-600 mb-4">
                  Set up your digital persona to start generating personalized AI content.
                </p>
                <Link
                  to="/persona"
                  className="inline-block px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
                >
                  Create Persona →
                </Link>
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-xl shadow-sm p-6">
            <div className="flex items-start gap-4">
              <span className="text-3xl">✅</span>
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-gray-900 mb-1">
                  Persona Active
                </h3>
                <p className="text-gray-600 mb-2">{persona.bio}</p>
                <div className="flex gap-2 text-sm text-gray-500">
                  <span>📊 {persona.industry}</span>
                  <span>•</span>
                  <span>🎯 {persona.brandTone}</span>
                </div>
              </div>
              <Link
                to="/persona"
                className="text-blue-600 hover:text-blue-700 font-medium"
              >
                Edit
              </Link>
            </div>
          </div>
        )}

        {/* Stats Grid */}
        <div className="grid md:grid-cols-3 gap-6">
          <div className="bg-white rounded-xl shadow-sm p-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center text-2xl">
                🎨
              </div>
              <div>
                <p className="text-sm text-gray-600">Total Generations</p>
                <p className="text-2xl font-bold text-gray-900">{stats.totalGenerations}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center text-2xl">
                🖼️
              </div>
              <div>
                <p className="text-sm text-gray-600">Images</p>
                <p className="text-2xl font-bold text-gray-900">{stats.imageGenerations}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center text-2xl">
                ✍️
              </div>
              <div>
                <p className="text-sm text-gray-600">Text</p>
                <p className="text-2xl font-bold text-gray-900">{stats.textGenerations}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="grid md:grid-cols-2 gap-6">
          <Link
            to="/generate?type=image"
            className="bg-white rounded-xl shadow-sm p-6 hover:shadow-md transition group"
          >
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-500 rounded-xl flex items-center justify-center text-3xl">
                🎨
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-gray-900 mb-1 group-hover:text-blue-600 transition">
                  Generate Image
                </h3>
                <p className="text-gray-600 text-sm">
                  Create AI-generated images with DALL-E
                </p>
              </div>
              <span className="text-2xl text-gray-400 group-hover:text-blue-600 transition">→</span>
            </div>
          </Link>

          <Link
            to="/generate?type=text"
            className="bg-white rounded-xl shadow-sm p-6 hover:shadow-md transition group"
          >
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-teal-500 rounded-xl flex items-center justify-center text-3xl">
                ✍️
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-gray-900 mb-1 group-hover:text-green-600 transition">
                  Generate Text
                </h3>
                <p className="text-gray-600 text-sm">
                  Create content with GPT-4
                </p>
              </div>
              <span className="text-2xl text-gray-400 group-hover:text-green-600 transition">→</span>
            </div>
          </Link>
        </div>

        {/* Recent Generations */}
        {recentGenerations.length > 0 && (
          <div className="bg-white rounded-xl shadow-sm p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold text-gray-900">Recent Generations</h2>
              <Link to="/history" className="text-blue-600 hover:text-blue-700 font-medium">
                View All →
              </Link>
            </div>
            <div className="space-y-3">
              {recentGenerations.map((gen) => (
                <div key={gen.id} className="flex items-center gap-4 p-3 hover:bg-gray-50 rounded-lg transition">
                  <span className="text-2xl">
                    {gen.type === 'image' ? '🖼️' : '📝'}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {gen.prompt}
                    </p>
                    <p className="text-xs text-gray-500">
                      {new Date(gen.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                  <span className={`text-xs px-2 py-1 rounded ${
                    gen.status === 'completed' ? 'bg-green-100 text-green-700' :
                    gen.status === 'failed' ? 'bg-red-100 text-red-700' :
                    'bg-yellow-100 text-yellow-700'
                  }`}>
                    {gen.status}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}