import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import Layout from '../components/Layout';
import { generationAPI, personaAPI } from '../services/api';

export default function Generate() {
  const [searchParams] = useSearchParams();
  const [type, setType] = useState(searchParams.get('type') || 'image');
  const [prompt, setPrompt] = useState('');
  const [model, setModel] = useState(
    searchParams.get('type') === 'text' ? 'gpt-4' : 'dall-e-3'
  );
  const [generating, setGenerating] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');
  const [persona, setPersona] = useState(null);
  const [usageStats, setUsageStats] = useState({ used: 0, limit: 10 });
  const [useFaceConsistency, setUseFaceConsistency] = useState(false);
  const [faceModel, setFaceModel] = useState('nano-banana-2');

  useEffect(() => {
    loadPersona();
  }, []);

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
        (g) => new Date(g.createdAt) >= today && g.type === type
      );

      const limit = type === 'image' ? 10 : 50;
      setUsageStats({ used: todayGenerations.length, limit });
    } catch (err) {
      console.error(err);
    }
  };

  const handleGenerate = async () => {
    if (!prompt.trim()) return;

    setGenerating(true);
    setError('');
    setResult(null);

    try {
      let response;

      if (type === 'image') {
        response = await generationAPI.generateImage({
          prompt,
          model,
          useFaceConsistency,
          faceModel
        });

        setResult({
          type: 'image',
          url: response.data.imageUrl
        });
      } else {
        response = await generationAPI.generateText({
          prompt,
          model
        });

        setResult({
          type: 'text',
          text: response.data.text
        });
      }

      await loadUsageStats();
    } catch (err) {
      setError(
        err.response?.data?.error ||
          err.message ||
          'Failed to generate'
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

        {/* No Persona Warning */}
        {!persona && (
          <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-xl p-4 mb-6">
            <p className="text-yellow-500 text-sm">
              ⚠️ You haven't created a persona yet. Your generations won't include personalized context.
            </p>
          </div>
        )}

        {/* Type Selection Toggle - Image/Text */}
        <div className="flex gap-4 mb-8">
          <button
            onClick={() => {
              setType('image');
              setModel('dall-e-3');
              setUseFaceConsistency(false);
              setResult(null);
            }}
            disabled={generating}
            className={`flex-1 p-6 rounded-xl border-2 transition text-left ${
              type === 'image'
                ? 'border-white bg-white/5'
                : 'border-gray-700 bg-black/20 hover:border-gray-600'
            }`}
          >
            <div className="flex items-center gap-3 mb-2">
              <span className="text-3xl">🎨</span>
              <h3 className="text-xl font-semibold text-white">Image Generation</h3>
            </div>
            <p className="text-sm text-gray-400">
              Create stunning AI-generated images personalized to your brand identity and visual style
            </p>
          </button>

          <button
            onClick={() => {
              setType('text');
              setModel('gpt-4');
              setResult(null);
            }}
            disabled={generating}
            className={`flex-1 p-6 rounded-xl border-2 transition text-left ${
              type === 'text'
                ? 'border-white bg-white/5'
                : 'border-gray-700 bg-black/20 hover:border-gray-600'
            }`}
          >
            <div className="flex items-center gap-3 mb-2">
              <span className="text-3xl">✍️</span>
              <h3 className="text-xl font-semibold text-white">Text Generation</h3>
            </div>
            <p className="text-sm text-gray-400">
              Generate compelling written content that matches your unique voice, tone, and audience preferences
            </p>
          </button>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Left Column - Generation Form (2/3 width) */}
          <div className="lg:col-span-2 space-y-6">
            {/* Prompt Input */}
            <div className="bg-dark-card rounded-xl p-6 border border-gray-800">
              <div className="flex items-center gap-2 mb-3">
                <span className="text-white text-lg">✏️</span>
                <label className="text-white font-medium">Your Prompt</label>
              </div>
              <textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                rows={4}
                className="w-full px-4 py-3 bg-black/40 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:border-brand-pink focus:ring-1 focus:ring-brand-pink outline-none transition resize-none"
                placeholder={
                  type === 'image'
                    ? 'Describe what you want to create... Your persona will automatically enhance this prompt with your brand identity and style.'
                    : 'e.g., Write a LinkedIn post about AI innovation'
                }
                disabled={generating}
              />
            </div>

            {/* Preview/Result Section */}
            <div className="bg-dark-card rounded-xl p-6 border border-gray-800">
              <h3 className="text-white font-semibold mb-4">Preview</h3>
              
              {result ? (
                <div>
                  {result.type === 'image' ? (
                    <div>
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
                    </div>
                  ) : (
                    <div>
                      <div className="bg-black/40 rounded-lg p-6 mb-4 max-h-96 overflow-y-auto">
                        <p className="text-gray-300 text-sm whitespace-pre-wrap">
                          {result.text}
                        </p>
                      </div>
                      <button
                        onClick={() => {
                          navigator.clipboard.writeText(result.text);
                          alert('Copied to clipboard!');
                        }}
                        className="w-full bg-white text-black py-3 rounded-lg font-semibold hover:bg-gray-200 transition"
                      >
                        📋 Copy to Clipboard
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <div className="aspect-video bg-black/40 rounded-lg flex items-center justify-center border border-gray-700">
                  <div className="text-center">
                    <span className="text-6xl mb-4 block">🖼️</span>
                    <p className="text-gray-500 text-sm">
                      Your generated content will appear here.
                    </p>
                  </div>
                </div>
              )}

              {/* Today's Usage */}
              <div className="mt-6 pt-6 border-t border-gray-700">
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-gray-400">Today's Usage</span>
                  <span className="text-white font-semibold">
                    {usageStats.used}/{usageStats.limit}
                  </span>
                </div>
                <div className="w-full bg-gray-700 rounded-full h-2 mb-2">
                  <div
                    className="bg-brand-pink h-2 rounded-full transition-all"
                    style={{ width: `${(usageStats.used / usageStats.limit) * 100}%` }}
                  ></div>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">Estimated Time</span>
                  <span className="text-white font-semibold">15s</span>
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
                {generating ? (
                  <span className="flex items-center justify-center gap-2">
                    <span className="animate-spin">⏳</span>
                    Generating...
                  </span>
                ) : (
                  `Generate with AI`
                )}
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

            {/* Error Message */}
            {error && (
              <div className="bg-red-500/10 border border-red-500/20 text-red-400 px-4 py-3 rounded-lg text-sm">
                {error}
              </div>
            )}
          </div>

          {/* Right Column - AI Model Selection (1/3 width) */}
          <div className="space-y-6">
            <div className="bg-dark-card rounded-xl p-6 border border-gray-800">
              <div className="flex items-center gap-2 mb-4">
                <span className="text-white text-lg">✨</span>
                <label className="text-white font-medium">AI Model</label>
              </div>
              
              {/* Show model dropdown for images when face consistency is OFF */}
              {type === 'image' ? (
                <>
                  {!useFaceConsistency ? (
                    <>
                      <select
                        value={model}
                        onChange={(e) => setModel(e.target.value)}
                        disabled={generating}
                        className="w-full px-4 py-3 bg-black/40 border border-gray-700 rounded-lg text-white focus:border-brand-pink focus:ring-1 focus:ring-brand-pink outline-none transition mb-4"
                      >
                        <option value="dall-e-3">DALL-E 3</option>
                        <option value="dall-e-2">DALL-E 2</option>
                        <option value="gemini-imagen" disabled>Gemini Imagen (Coming Soon)</option>
                        <option value="claude-imagen" disabled>Claude Vision (Coming Soon)</option>
                      </select>
                      <p className="text-xs text-gray-500 mb-4">
                        Select your preferred AI model for image generation
                      </p>
                    </>
                  ) : (
                    <div className="bg-brand-pink/10 border border-brand-pink/30 rounded-lg p-4 mb-4">
                      <p className="text-brand-pink text-sm font-medium mb-1">
                        Using {faceModel === 'nano-banana-2' ? 'Nano Banana 2' : 'ByteDance SeeDream v4.5'}
                      </p>
                      <p className="text-brand-pink/80 text-xs">
                        Face-consistent generation with your persona images
                      </p>
                    </div>
                  )}

                  {/* Face Consistency Toggle - ONLY for images */}
                  <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-4">
                    <div className="flex items-center gap-2 mb-3">
                      <span className="text-xl">✨</span>
                      <h3 className="font-semibold text-blue-400">Face Consistency</h3>
                    </div>
                    <div className="flex items-center justify-between mb-3">
                      <div>
                        <p className="text-white font-medium mb-1">Use My Face</p>
                        <p className="text-sm text-gray-400">
                          Generate images that actually look like you
                        </p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={useFaceConsistency}
                          onChange={(e) => setUseFaceConsistency(e.target.checked)}
                          disabled={generating}
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-gray-700 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-brand-pink rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-brand-pink"></div>
                      </label>
                    </div>

                    {/* Face Model Selection - Only show when toggle is ON */}
                    {useFaceConsistency && (
                      <div className="mb-3">
                        <label className="block text-sm font-medium text-white mb-2">
                          Face Model
                        </label>
                        <select
                          value={faceModel}
                          onChange={(e) => setFaceModel(e.target.value)}
                          disabled={generating}
                          className="w-full px-4 py-2 bg-black/40 border border-gray-700 rounded-lg text-white text-sm focus:border-brand-pink focus:ring-1 focus:ring-brand-pink outline-none transition"
                        >
                          <option value="nano-banana-2">Nano Banana 2 (Best Quality)</option>
                          <option value="bytedance-seedream">ByteDance SeeDream v4.5</option>
                        </select>
                      </div>
                    )}

                    {useFaceConsistency && (
                      <p className="text-xs text-blue-300">
                        💡 Make sure you've uploaded reference images in your Persona page
                      </p>
                    )}
                  </div>
                </>
              ) : (
                /* Text generation models */
                <>
                  <select
                    value={model}
                    onChange={(e) => setModel(e.target.value)}
                    disabled={generating}
                    className="w-full px-4 py-3 bg-black/40 border border-gray-700 rounded-lg text-white focus:border-brand-pink focus:ring-1 focus:ring-brand-pink outline-none transition"
                  >
                    <option value="gpt-4">GPT-4</option>
                    <option value="gpt-4-turbo">GPT-4 Turbo</option>
                    <option value="gpt-3.5-turbo">GPT-3.5 Turbo</option>
                    <option value="gpt-4o">GPT-4o</option>
                    <option value="gemini-pro" disabled>Gemini Pro (Coming Soon)</option>
                    <option value="claude-3.5" disabled>Claude 3.5 (Coming Soon)</option>
                  </select>
                  <p className="text-xs text-gray-500 mt-2">
                    Select your preferred AI model for text generation
                  </p>
                </>
              )}
            </div>

            {/* Tips Section */}
            {!result && !generating && (
              <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-6">
                <h3 className="font-semibold text-blue-400 mb-3 flex items-center gap-2">
                  <span className="text-xl">💡</span>
                  Tips for better results:
                </h3>
                <ul className="space-y-2 text-sm text-blue-300">
                  {type === 'image' ? (
                    <>
                      <li>• Be specific about style, mood, and composition</li>
                      <li>• Include details like lighting, colors, and perspective</li>
                      <li>• Mention art styles (photorealistic, cartoon, sketch)</li>
                      {useFaceConsistency && (
                        <li>• Upload clear, front-facing photos for best face matching</li>
                      )}
                    </>
                  ) : (
                    <>
                      <li>• Specify the format (blog post, tweet, email)</li>
                      <li>• Mention the desired tone and length</li>
                      <li>• Include key points you want covered</li>
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