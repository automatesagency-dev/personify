'use client'

import { useState, useEffect, useMemo } from 'react';
import Layout from '../components/Layout';
import { generationAPI } from '../services/api';

export default function History() {
  const [generations, setGenerations] = useState([]);
  const [filter, setFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [selectedGeneration, setSelectedGeneration] = useState(null);
  const [stats, setStats] = useState({
    imagesUsedToday: 0,
    textUsedToday: 0,
    totalGenerations: 0,
    favoriteModel: 'DALL-E'
  });

  useEffect(() => {
    loadGenerations();
  }, [filter]);

  const handleDownload = async (url) => {
    try {
      const response = await fetch(url);
      const blob = await response.blob();
      const blobUrl = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = blobUrl;
      a.download = `personify-${Date.now()}.png`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(blobUrl);
    } catch {
      window.open(url, '_blank');
    }
  };

  const loadGenerations = async () => {
    try {
      const type = filter === 'all' ? undefined : filter;
      const response = await generationAPI.getAll(type);
      const allGenerations = response.data.generations || [];
      setGenerations(allGenerations);
      
      // Calculate stats
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      const todayGenerations = allGenerations.filter(g => 
        new Date(g.createdAt) >= today
      );

      const imagesUsedToday = todayGenerations.filter(g => g.type === 'image').length;
      const textUsedToday = todayGenerations.filter(g => g.type === 'text').length;

      // Find favorite model
      const modelCounts = {};
      allGenerations.forEach(g => {
        modelCounts[g.model] = (modelCounts[g.model] || 0) + 1;
      });
      const favoriteModel = Object.keys(modelCounts).length > 0
        ? Object.keys(modelCounts).reduce((a, b) => modelCounts[a] > modelCounts[b] ? a : b)
        : 'DALL-E';

      setStats({
        imagesUsedToday,
        textUsedToday,
        totalGenerations: allGenerations.length,
        favoriteModel: favoriteModel.toUpperCase()
      });

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

  const filteredGenerations = useMemo(() => {
    if (!searchQuery) return generations;
    const q = searchQuery.toLowerCase();
    return generations.filter(gen => gen.prompt.toLowerCase().includes(q));
  }, [generations, searchQuery]);

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-screen">
          <div className="text-xl text-gray-400">Loading...</div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="p-4 md:p-8 max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6 md:mb-8">
          <h1 className="text-2xl md:text-3xl font-semibold text-white mb-1 md:mb-2">Generation History</h1>
          <p className="text-gray-400 text-sm md:text-base">View and manage all your AI-Generated content</p>
        </div>

        {/* Stats — mobile: single strip / desktop: 4 cards */}
        <div className="md:hidden bg-dark-card rounded-xl border border-gray-800 mb-4 overflow-hidden">
          <div className="grid grid-cols-4 divide-x divide-gray-800">
            {[
              { label: 'Images', value: `${stats.imagesUsedToday}/10` },
              { label: 'Text', value: `${stats.textUsedToday}/50` },
              { label: 'Total', value: stats.totalGenerations },
              { label: 'Model', value: stats.favoriteModel },
            ].map((s, i) => (
              <div key={i} className="flex flex-col items-center py-2.5 px-1">
                <p className="text-[10px] text-gray-500 mb-0.5">{s.label}</p>
                <p className="text-xs font-semibold text-gray-200 truncate w-full text-center">{s.value}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="hidden md:grid grid-cols-4 gap-6 mb-8">
          <div className="bg-dark-card rounded-xl p-6 border border-gray-800">
            <p className="text-gray-400 text-sm mb-2">Images Today</p>
            <div className="flex items-end justify-between gap-1">
              <p className="text-3xl font-bold text-white">{stats.imagesUsedToday}/10</p>
              <span className="text-gray-500 text-sm">{10 - stats.imagesUsedToday} left</span>
            </div>
          </div>
          <div className="bg-dark-card rounded-xl p-6 border border-gray-800">
            <p className="text-gray-400 text-sm mb-2">Text Today</p>
            <div className="flex items-end justify-between gap-1">
              <p className="text-3xl font-bold text-white">{stats.textUsedToday}/50</p>
              <span className="text-gray-500 text-sm">{50 - stats.textUsedToday} left</span>
            </div>
          </div>
          <div className="bg-dark-card rounded-xl p-6 border border-gray-800">
            <p className="text-gray-400 text-sm mb-2">Total</p>
            <div className="flex items-end justify-between gap-1">
              <p className="text-3xl font-bold text-white">{stats.totalGenerations}</p>
              <span className="text-gray-500 text-sm">All time</span>
            </div>
          </div>
          <div className="bg-dark-card rounded-xl p-6 border border-gray-800">
            <p className="text-gray-400 text-sm mb-2">Top Model</p>
            <p className="text-2xl font-bold text-white truncate">{stats.favoriteModel}</p>
            <span className="text-gray-500 text-sm">Most Used</span>
          </div>
        </div>

        {/* Filters and Search */}
        <div className="flex flex-col sm:flex-row flex-wrap gap-3 sm:gap-4 items-start sm:items-center justify-between mb-6">
          {/* Filter Tabs */}
          <div className="flex gap-1 bg-dark-card rounded-xl p-1.5 border border-gray-800">
            <button
              onClick={() => setFilter('all')}
              className={`px-4 md:px-6 py-2 rounded-lg text-sm font-medium transition ${
                filter === 'all'
                  ? 'bg-white text-black'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              All
            </button>
            <button
              onClick={() => setFilter('image')}
              className={`px-4 md:px-6 py-2 rounded-lg text-sm font-medium transition flex items-center gap-1.5 ${
                filter === 'image'
                  ? 'bg-white text-black'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              <span>🖼️</span> Images
            </button>
            <button
              onClick={() => setFilter('text')}
              className={`px-4 md:px-6 py-2 rounded-lg text-sm font-medium transition flex items-center gap-1.5 ${
                filter === 'text'
                  ? 'bg-white text-black'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              <span>📝</span> Text
            </button>
          </div>

          {/* Search */}
          <div className="flex gap-2 w-full sm:w-auto">
            <div className="relative flex-1 sm:flex-none">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search generations..."
                className="pl-10 pr-4 py-2 bg-dark-card border border-gray-800 rounded-lg text-white placeholder-gray-500 focus:border-brand-pink focus:ring-1 focus:ring-brand-pink outline-none transition w-full sm:w-64"
              />
              <svg
                className="w-5 h-5 text-gray-500 absolute left-3 top-1/2 -translate-y-1/2"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>

            <button className="px-3 md:px-4 py-2 bg-dark-card border border-gray-800 rounded-lg text-white hover:bg-gray-800 transition flex items-center gap-2 text-sm whitespace-nowrap">
              <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4h13M3 8h9m-9 4h6m4 0l4-4m0 0l4 4m-4-4v12" />
              </svg>
              <span className="hidden sm:inline">Most Recent</span>
            </button>
          </div>
        </div>

        {/* Generations — mobile: list / desktop: grid */}
        {filteredGenerations.length === 0 ? (
          <div className="bg-dark-card rounded-xl p-8 md:p-12 text-center border border-gray-800">
            <p className="text-gray-400 mb-4 text-sm">No generations yet</p>
            <a href="/generate" className="inline-block px-6 py-3 bg-white text-black rounded-lg font-semibold hover:bg-gray-200 transition text-sm">
              Create Your First Generation
            </a>
          </div>
        ) : (
          <>
            {/* Mobile list */}
            <div className="md:hidden flex flex-col gap-2">
              {filteredGenerations.map((gen) => (
                <div
                  key={gen.id}
                  className="bg-dark-card rounded-xl border border-gray-800 flex items-center gap-3 p-3 cursor-pointer active:bg-white/5 transition"
                  onClick={() => setSelectedGeneration(gen)}
                >
                  {/* Thumbnail */}
                  <div className="w-14 h-14 rounded-lg bg-black/40 flex-shrink-0 overflow-hidden flex items-center justify-center">
                    {gen.type === 'image' && gen.result
                      ? <img src={gen.result} alt="Generated" className="w-full h-full object-cover" />
                      : <span className="text-xl">{gen.type === 'image' ? '🖼️' : '📝'}</span>
                    }
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-white font-medium line-clamp-1 mb-0.5">{gen.prompt}</p>
                    <div className="flex items-center gap-1.5">
                      <span className={`text-[10px] px-1.5 py-0.5 rounded font-medium ${gen.type === 'image' ? 'bg-purple-500/20 text-purple-400' : 'bg-green-500/20 text-green-400'}`}>
                        {gen.type === 'image' ? 'IMG' : 'TXT'}
                      </span>
                      <span className="text-[10px] text-gray-500">{new Date(gen.createdAt).toLocaleDateString()}</span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-1.5 flex-shrink-0" onClick={e => e.stopPropagation()}>
                    {gen.type === 'image' && gen.result && (
                      <button onClick={() => handleDownload(gen.result)} className="p-2 bg-white/10 rounded-lg text-white">
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                        </svg>
                      </button>
                    )}
                    {gen.type === 'text' && gen.result && (
                      <button onClick={() => { navigator.clipboard.writeText(gen.result); alert('Copied!'); }} className="p-2 bg-white/10 rounded-lg text-white">
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                        </svg>
                      </button>
                    )}
                    <button onClick={() => handleDelete(gen.id)} className="p-2 bg-red-500/20 rounded-lg text-red-400">
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Desktop grid */}
            <div className="hidden md:grid grid-cols-2 md:grid-cols-3 gap-6">
              {filteredGenerations.map((gen) => (
                <div
                  key={gen.id}
                  className="bg-dark-card rounded-xl overflow-hidden border border-gray-800 hover:border-gray-700 transition group cursor-pointer"
                  onClick={() => setSelectedGeneration(gen)}
                >
                  <div className="h-56 bg-black/40 flex items-center justify-center overflow-hidden relative">
                    {gen.type === 'image' ? (
                      gen.result ? <img src={gen.result} alt="Generated" className="w-full h-full object-cover" /> : <span className="text-5xl">🖼️</span>
                    ) : (
                      <div className="p-6 text-center">
                        <span className="text-5xl mb-4 block">📄</span>
                        <p className="text-sm text-gray-400 line-clamp-3">{gen.prompt}</p>
                      </div>
                    )}
                    <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition flex items-center justify-center gap-3">
                      {gen.type === 'image' && gen.result && (
                        <button onClick={(e) => { e.stopPropagation(); handleDownload(gen.result); }} className="p-3 bg-white rounded-full hover:bg-gray-200 transition" title="Download">
                          <svg className="w-5 h-5 text-black" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                        </button>
                      )}
                      {gen.type === 'text' && gen.result && (
                        <button onClick={(e) => { e.stopPropagation(); navigator.clipboard.writeText(gen.result); alert('Copied to clipboard!'); }} className="p-3 bg-white rounded-full hover:bg-gray-200 transition" title="Copy">
                          <svg className="w-5 h-5 text-black" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>
                        </button>
                      )}
                      <button onClick={(e) => { e.stopPropagation(); handleDelete(gen.id); }} className="p-3 bg-red-500 rounded-full hover:bg-red-600 transition" title="Delete">
                        <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                      </button>
                    </div>
                  </div>
                  <div className="p-4">
                    <div className="flex items-center gap-2 mb-3">
                      <span className={`text-xs px-3 py-1 rounded-full font-medium ${gen.type === 'image' ? 'bg-purple-500/20 text-purple-400' : 'bg-green-500/20 text-green-400'}`}>{gen.type.toUpperCase()}</span>
                      <span className={`text-xs px-2 py-1 rounded ${gen.status === 'completed' ? 'bg-green-500/20 text-green-400' : gen.status === 'failed' ? 'bg-red-500/20 text-red-400' : 'bg-yellow-500/20 text-yellow-400'}`}>{gen.status}</span>
                    </div>
                    <p className="text-sm font-medium text-white mb-2 line-clamp-2">{gen.prompt}</p>
                    <div className="flex items-center justify-between text-xs text-gray-500">
                      <span>{gen.model}</span>
                      <span>{new Date(gen.createdAt).toLocaleDateString()}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}

        {/* Detail Modal */}
        {selectedGeneration && (
          <div
            className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50 backdrop-blur-sm"
            onClick={() => setSelectedGeneration(null)}
          >
            <div
              className="bg-dark-card rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto border border-gray-800"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-6">
                <div className="flex items-start justify-between mb-6">
                  <div>
                    <h2 className="text-2xl font-bold text-white mb-2">
                      {selectedGeneration.type === 'image' ? '🖼️ Image' : '📝 Text'} Generation
                    </h2>
                    <p className="text-sm text-gray-400">
                      {new Date(selectedGeneration.createdAt).toLocaleString()}
                    </p>
                  </div>
                  <button
                    onClick={() => setSelectedGeneration(null)}
                    className="text-gray-400 hover:text-white text-2xl transition"
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
                        className="w-full rounded-xl mb-4"
                      />
                    )}
                    {selectedGeneration.status === 'completed' && selectedGeneration.result && (
                      <div className="grid grid-cols-2 gap-3">
                        <button
                          onClick={() => handleDownload(selectedGeneration.result)}
                          className="bg-white text-black py-3 rounded-lg font-semibold hover:bg-gray-200 transition text-center"
                        >
                          Download Image
                        </button>
                        
                        <a
                          href={selectedGeneration.result}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="bg-white/10 hover:bg-white/20 text-white py-3 rounded-lg font-semibold transition text-center"
                        >
                          Open Full Size
                        </a>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="mb-6">
                    <div className="bg-black/40 rounded-xl p-6 mb-4 max-h-96 overflow-y-auto">
                      <p className="text-gray-300 whitespace-pre-wrap">
                        {selectedGeneration.result || 'No result available'}
                      </p>
                    </div>
                    {selectedGeneration.status === 'completed' && selectedGeneration.result && (
                      <button
                        onClick={() => {
                          navigator.clipboard.writeText(selectedGeneration.result);
                          alert('Copied to clipboard!');
                        }}
                        className="w-full bg-white text-black py-3 rounded-lg font-semibold hover:bg-gray-200 transition"
                      >
                        📋 Copy to Clipboard
                      </button>
                    )}
                  </div>
                )}

                {/* Details */}
                <div className="bg-black/40 rounded-xl p-4 mb-4 space-y-3">
                  <div>
                    <span className="text-sm font-medium text-gray-400">Prompt:</span>
                    <p className="text-sm text-white mt-1">{selectedGeneration.prompt}</p>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <span className="text-sm font-medium text-gray-400">Model:</span>
                      <p className="text-sm text-white">{selectedGeneration.model}</p>
                    </div>
                    <div>
                      <span className="text-sm font-medium text-gray-400">Status:</span>
                      <p className="text-sm text-white capitalize">{selectedGeneration.status}</p>
                    </div>
                  </div>
                  {selectedGeneration.errorMessage && (
                    <div>
                      <span className="text-sm font-medium text-red-400">Error:</span>
                      <p className="text-sm text-red-300">{selectedGeneration.errorMessage}</p>
                    </div>
                  )}
                </div>

                {/* Delete Button */}
                <button
                  onClick={() => {
                    setSelectedGeneration(null);
                    handleDelete(selectedGeneration.id);
                  }}
                  className="w-full bg-red-500/20 hover:bg-red-500/30 text-red-400 py-3 rounded-lg font-semibold transition"
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