import { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import { generationAPI } from '../services/api';

export default function History() {
  const [generations, setGenerations] = useState([]);
  const [filter, setFilter] = useState('all'); // 'all', 'image', 'text'
  const [loading, setLoading] = useState(true);
  const [selectedGeneration, setSelectedGeneration] = useState(null);

  useEffect(() => {
    loadGenerations();
  }, [filter]);

  const loadGenerations = async () => {
    try {
      const type = filter === 'all' ? undefined : filter;
      const response = await generationAPI.getAll(type);
      setGenerations(response.data.generations || []);
    } catch (error) {
      console.error('Failed to load generations:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this generation?')) return;

    try {
      await generationAPI.delete(id);
      setGenerations(generations.filter(g => g.id !== id));
      if (selectedGeneration?.id === id) {
        setSelectedGeneration(null);
      }
    } catch (error) {
      alert('Failed to delete generation');
    }
  };

  const filteredGenerations = generations;

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
      <div className="max-w-6xl mx-auto">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Generation History</h1>
          <p className="text-gray-600">
            View and manage your AI-generated content
          </p>
        </div>

        {/* Filter Tabs */}
        <div className="bg-white rounded-xl shadow-sm p-2 mb-6 flex gap-2">
          <button
            onClick={() => setFilter('all')}
            className={`flex-1 py-2 px-4 rounded-lg font-medium transition ${
              filter === 'all'
                ? 'bg-blue-600 text-white'
                : 'text-gray-600 hover:bg-gray-50'
            }`}
          >
            All ({generations.length})
          </button>
          <button
            onClick={() => setFilter('image')}
            className={`flex-1 py-2 px-4 rounded-lg font-medium transition ${
              filter === 'image'
                ? 'bg-purple-600 text-white'
                : 'text-gray-600 hover:bg-gray-50'
            }`}
          >
            🖼️ Images ({generations.filter(g => g.type === 'image').length})
          </button>
          <button
            onClick={() => setFilter('text')}
            className={`flex-1 py-2 px-4 rounded-lg font-medium transition ${
              filter === 'text'
                ? 'bg-green-600 text-white'
                : 'text-gray-600 hover:bg-gray-50'
            }`}
          >
            📝 Text ({generations.filter(g => g.type === 'text').length})
          </button>
        </div>

        {/* Generations List */}
        {filteredGenerations.length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm p-12 text-center">
            <p className="text-gray-600 mb-4">No generations yet</p>

            <a
              href="/generate"
              className="inline-block px-6 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition"
            >
              Create Your First Generation
            </a>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredGenerations.map((gen) => (
              <div
                key={gen.id}
                className="bg-white rounded-xl shadow-sm overflow-hidden hover:shadow-md transition cursor-pointer"
                onClick={() => setSelectedGeneration(gen)}
              >
                {/* Preview */}
                <div className="h-48 bg-gray-100 flex items-center justify-center overflow-hidden">
                  {gen.type === 'image' ? (
                    gen.result ? (
                      <img
                        src={gen.result}
                        alt="Generated"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <span className="text-4xl">🖼️</span>
                    )
                  ) : (
                    <div className="p-4 text-sm text-gray-600 line-clamp-6">
                      {gen.result || 'Text content'}
                    </div>
                  )}
                </div>

                {/* Info */}
                <div className="p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <span className={`text-xs px-2 py-1 rounded ${
                      gen.type === 'image' 
                        ? 'bg-purple-100 text-purple-700' 
                        : 'bg-green-100 text-green-700'
                    }`}>
                      {gen.type}
                    </span>
                    <span className={`text-xs px-2 py-1 rounded ${
                      gen.status === 'completed' ? 'bg-green-100 text-green-700' :
                      gen.status === 'failed' ? 'bg-red-100 text-red-700' :
                      'bg-yellow-100 text-yellow-700'
                    }`}>
                      {gen.status}
                    </span>
                  </div>
                  
                  <p className="text-sm font-medium text-gray-900 mb-1 line-clamp-2">
                    {gen.prompt}
                  </p>
                  
                  <div className="flex items-center justify-between text-xs text-gray-500">
                    <span>{new Date(gen.createdAt).toLocaleDateString()}</span>
                    <span>{gen.model}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Detail Modal */}
        {selectedGeneration && (
          <div
            className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50"
            onClick={() => setSelectedGeneration(null)}
          >
            <div
              className="bg-white rounded-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900 mb-2">
                      {selectedGeneration.type === 'image' ? '🖼️ Image' : '📝 Text'} Generation
                    </h2>
                    <p className="text-sm text-gray-500">
                      {new Date(selectedGeneration.createdAt).toLocaleString()}
                    </p>
                  </div>
                  <button
                    onClick={() => setSelectedGeneration(null)}
                    className="text-gray-400 hover:text-gray-600 text-2xl"
                  >
                    ✕
                  </button>
                </div>

                {/* Result */}
                {selectedGeneration.type === 'image' ? (
                  <div className="mb-6">
                    {selectedGeneration.result && (
                      <img
                        src={selectedGeneration.result}
                        alt="Generated"
                        className="w-full rounded-lg mb-4"
                      />
                    )}
                    {selectedGeneration.status === 'completed' && selectedGeneration.result && (
                      <div className="flex gap-3">

                        <a
                          href={selectedGeneration.result}
                          download
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex-1 bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 transition text-center"
                        >
                          Download Image
                        </a>
                        
                        <a
                          href={selectedGeneration.result}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg font-semibold hover:bg-gray-50 transition"
                        >
                          Open Full Size
                        </a>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="mb-6">
                    <div className="bg-gray-50 rounded-lg p-6 mb-4 whitespace-pre-wrap">
                      {selectedGeneration.result || 'No result available'}
                    </div>
                    {selectedGeneration.status === 'completed' && selectedGeneration.result && (
                      <button
                        onClick={() => {
                          navigator.clipboard.writeText(selectedGeneration.result);
                          alert('Copied to clipboard!');
                        }}
                        className="w-full bg-green-600 text-white py-3 rounded-lg font-semibold hover:bg-green-700 transition"
                      >
                        📋 Copy to Clipboard
                      </button>
                    )}
                  </div>
                )}

                {/* Details */}
                <div className="bg-gray-50 rounded-lg p-4 mb-4 space-y-2">
                  <div>
                    <span className="text-sm font-medium text-gray-700">Prompt:</span>
                    <p className="text-sm text-gray-900 mt-1">{selectedGeneration.prompt}</p>
                  </div>
                  <div className="flex gap-4">
                    <div>
                      <span className="text-sm font-medium text-gray-700">Model:</span>
                      <p className="text-sm text-gray-900">{selectedGeneration.model}</p>
                    </div>
                    <div>
                      <span className="text-sm font-medium text-gray-700">Status:</span>
                      <p className="text-sm text-gray-900">{selectedGeneration.status}</p>
                    </div>
                  </div>
                  {selectedGeneration.errorMessage && (
                    <div>
                      <span className="text-sm font-medium text-red-700">Error:</span>
                      <p className="text-sm text-red-900">{selectedGeneration.errorMessage}</p>
                    </div>
                  )}
                </div>

                {/* Actions */}
                <button
                  onClick={() => handleDelete(selectedGeneration.id)}
                  className="w-full bg-red-600 text-white py-3 rounded-lg font-semibold hover:bg-red-700 transition"
                >
                  🗑️ Delete Generation
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}