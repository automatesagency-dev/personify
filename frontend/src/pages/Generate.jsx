import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import Layout from '../components/Layout';
import { generationAPI, personaAPI } from '../services/api';

export default function Generate() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [type, setType] = useState(searchParams.get('type') || 'image');
  const [prompt, setPrompt] = useState('');
  const [model, setModel] = useState(type === 'image' ? 'dall-e-3' : 'gpt-4');
  const [generating, setGenerating] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');
  const [persona, setPersona] = useState(null);
  const [usageStats, setUsageStats] = useState({ used: 0, limit: 10 });

  useEffect(() => {
    loadPersona();
  }, []);

  useEffect(() => {
    const typeParam = searchParams.get('type');
    if (typeParam === 'image' || typeParam === 'text') {
      setType(typeParam);
      setModel(typeParam === 'image' ? 'dall-e-3' : 'gpt-4');
    }
  }, [searchParams]);

  useEffect(() => {
    loadUsageStats();
  }, [type]);

  const loadPersona = async () => {
    try {
      const response = await personaAPI.get();
      setPersona(response.data.persona);
    } catch {
      setPersona(null);
    }
  };

  const loadUsageStats = async () => {
    try {
      const response = await generationAPI.getAll();
      const generations = response.data.generations || [];

      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const todayGenerations = generations.filter(
        (g) =>
          new Date(g.createdAt) >= today &&
          g.type === type
      );

      const limit = type === 'image' ? 10 : 50;
      setUsageStats({ used: todayGenerations.length, limit });
    } catch (err) {
      console.error('Failed to load usage stats:', err);
    }
  };

  const handleTypeChange = (newType) => {
    setType(newType);
    setSearchParams({ type: newType });
    setModel(newType === 'image' ? 'dall-e-3' : 'gpt-4');
    setResult(null);
    setError('');
  };

  const handleGenerate = async (e) => {
    e.preventDefault();

    if (!prompt.trim()) {
      setError('Please enter a prompt');
      return;
    }

    setGenerating(true);
    setError('');
    setResult(null);

    try {
      let response;

      if (type === 'image') {
        response = await generationAPI.generateImage({ prompt, model });
        setResult({
          type: 'image',
          url: response.data.imageUrl,
          generation: response.data.generation,
        });
      } else {
        response = await generationAPI.generateText({ prompt, model });
        setResult({
          type: 'text',
          text: response.data.text,
          generation: response.data.generation,
        });
      }

      loadUsageStats();
    } catch (err) {
      console.error('Generation error:', err);
      setError(
        err.response?.data?.error ||
        err.response?.data?.message ||
        'Generation failed. Please try again.'
      );
    } finally {
      setGenerating(false);
    }
  };

  const handleReset = () => {
    setPrompt('');
    setResult(null);
    setError('');
  };

  return (
    <Layout>
      <div className="p-8 max-w-7xl mx-auto">

        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-semibold text-white mb-2">
            Generate Content
          </h1>
          <p className="text-gray-400">
            Create AI-powered images and text using your persona
          </p>
        </div>

        {/* Persona Warning */}
        {!persona && (
          <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-xl p-4 mb-6">
            <p className="text-yellow-500 text-sm">
              ⚠️ You haven't created a persona yet. Generated content won't be personalized.{' '}
              <a href="/persona" className="underline font-semibold">
                Create one now
              </a>
            </p>
          </div>
        )}

        <div className="grid lg:grid-cols-3 gap-6">

          {/* LEFT COLUMN */}
          <div className="lg:col-span-2 space-y-6">

            {/* Prompt */}
            <div className="bg-dark-card rounded-xl p-6 border border-gray-800">
              <label className="text-white font-medium mb-3 block">
                ✏️ Your Prompt
              </label>

              <textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                rows={4}
                disabled={generating}
                placeholder={
                  type === 'image'
                    ? 'Describe what you want to create...'
                    : 'e.g., Write a LinkedIn post about AI innovation'
                }
                className="w-full px-4 py-3 bg-black/40 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:border-brand-pink focus:ring-1 focus:ring-brand-pink outline-none transition resize-none"
              />
            </div>

            {/* Preview */}
            <div className="bg-dark-card rounded-xl p-6 border border-gray-800">
              <h3 className="text-white font-semibold mb-4">Preview</h3>

              {result ? (
                <>
                  {result.type === 'image' ? (
                    <>
                      <img
                        src={result.url}
                        alt="Generated"
                        className="w-full rounded-lg mb-4"
                      />

                      <div className="space-y-2">
                        <a
                          href={result.url}
                          download
                          target="_blank"
                          rel="noopener noreferrer"
                          className="block w-full bg-white text-black py-3 rounded-lg font-semibold hover:bg-gray-200 transition text-center"
                        >
                          Download Image
                        </a>

                        <a
                          href={result.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="block w-full bg-white/10 hover:bg-white/20 text-white py-3 rounded-lg font-semibold transition text-center"
                        >
                          Open Full Size
                        </a>
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="bg-black/40 rounded-lg p-6 mb-4 max-h-96 overflow-y-auto">
                        <p className="text-gray-300 text-sm whitespace-pre-wrap">
                          {result.text}
                        </p>
                      </div>

                      <button
                        onClick={() => {
                          navigator.clipboard.writeText(result.text);
                        }}
                        className="w-full bg-white text-black py-3 rounded-lg font-semibold hover:bg-gray-200 transition"
                      >
                        📋 Copy to Clipboard
                      </button>
                    </>
                  )}
                </>
              ) : (
                <div className="aspect-video bg-black/40 rounded-lg flex items-center justify-center border border-gray-700">
                  <p className="text-gray-500 text-sm">
                    Your generated content will appear here.
                  </p>
                </div>
              )}

              {/* Usage */}
              <div className="mt-6 pt-6 border-t border-gray-700">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">Today's Usage</span>
                  <span className="text-white font-semibold">
                    {usageStats.used}/{usageStats.limit}
                  </span>
                </div>
              </div>
            </div>

            {/* Generate Button */}
            <div className="flex gap-4">
              <button
                onClick={handleGenerate}
                disabled={generating || !prompt.trim()}
                className="flex-1 bg-white text-black py-4 rounded-xl font-semibold hover:bg-gray-200 transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {generating ? 'Generating...' : 'Generate with AI'}
              </button>

              {result && (
                <button
                  onClick={handleReset}
                  className="px-8 py-4 bg-white/10 hover:bg-white/20 text-white rounded-xl font-semibold transition"
                >
                  New Generation
                </button>
              )}
            </div>

            {error && (
              <div className="bg-red-500/10 border border-red-500/20 text-red-400 px-4 py-3 rounded-lg text-sm">
                {error}
              </div>
            )}

          </div>

          {/* RIGHT COLUMN */}
          <div className="space-y-6">

            {/* Model Selector */}
            <div className="bg-dark-card rounded-xl p-6 border border-gray-800">
              <label className="text-white font-medium mb-4 block">
                ✨ AI Model
              </label>

              <select
                value={model}
                onChange={(e) => setModel(e.target.value)}
                disabled={generating}
                className="w-full px-4 py-3 bg-black/40 border border-gray-700 rounded-lg text-white"
              >
                {type === 'image' ? (
                  <>
                    <option value="dall-e-3">DALL-E 3</option>
                    <option value="dall-e-2">DALL-E 2</option>
                  </>
                ) : (
                  <>
                    <option value="gpt-4">GPT-4</option>
                    <option value="gpt-4-turbo">GPT-4 Turbo</option>
                    <option value="gpt-3.5-turbo">GPT-3.5 Turbo</option>
                    <option value="gpt-4o">GPT-4o</option>
                  </>
                )}
              </select>
            </div>

            {/* Tips */}
            {!result && !generating && (
              <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-6">
                <h3 className="font-semibold text-blue-400 mb-3">
                  💡 Tips for better results
                </h3>

                <ul className="space-y-2 text-sm text-blue-300">
                  {type === 'image' ? (
                    <>
                      <li>• Be specific about style and lighting</li>
                      <li>• Include composition details</li>
                      <li>• Mention art style references</li>
                    </>
                  ) : (
                    <>
                      <li>• Specify format (tweet, blog, email)</li>
                      <li>• Mention tone and length</li>
                      <li>• Include key talking points</li>
                    </>
                  )}
                </ul>
              </div>
            )}

          </div>
        </div>
      </div>
    </Layout>
  );
}