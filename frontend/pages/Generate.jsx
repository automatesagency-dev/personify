'use client'

import { useState, useEffect, useCallback, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Layout from '../components/Layout';
import { generationAPI, personaAPI } from '../services/api';

function GenerateInner() {
  const searchParams = useSearchParams();
  const [type, setType] = useState(searchParams.get('type') || 'image');
  const [prompt, setPrompt] = useState('');
  const [model, setModel] = useState(
    searchParams.get('type') === 'text' ? 'gpt-4' : 'dall-e-3'
  );
  
  const [generating, setGenerating] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');
  const [showRetry, setShowRetry] = useState(false); // New state for retry button
  const [persona, setPersona] = useState(null);
  const [usageStats, setUsageStats] = useState({ used: 0, limit: 10 });
  
  const [useFaceConsistency, setUseFaceConsistency] = useState(true);
  const [faceModel, setFaceModel] = useState('nano-banana-2');
  const [retryAttempt, setRetryAttempt] = useState(0);
  const [retryMessage, setRetryMessage] = useState('');

  const loadUsageStats = useCallback(async () => {
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
      console.error("Usage stats error:", err);
    }
  }, [type]);

  const loadPersona = async () => {
    try {
      const response = await personaAPI.get();
      setPersona(response.data.persona);
    } catch {
      setPersona(null);
    }
  };

  useEffect(() => {
    loadPersona();
    loadUsageStats();
  }, [loadUsageStats]);

  const handleGenerate = async (retryCount = 0) => {
    if (!prompt.trim()) return;

    setGenerating(true);
    setError('');
    setShowRetry(false); // Reset retry button visibility
    if (retryCount === 0) setResult(null);
    setRetryAttempt(retryCount);

    try {
      let response;
      if (type === 'image') {
        response = await generationAPI.generateImage({
          prompt,
          model,
          useFaceConsistency,
          faceModel
        });
        setResult({ type: 'image', url: response.data.imageUrl });
      } else {
        response = await generationAPI.generateText({ prompt, model });
        setResult({ type: 'text', text: response.data.text });
      }

      await loadUsageStats();
      setRetryAttempt(0);
      setRetryMessage('');

    } catch (err) {
      const errorStatus = err.response?.status;
      const errorMessage = err.response?.data?.error || err.message;

      // 1. Persona Completion Check
      if (errorStatus === 400 && errorMessage.toLowerCase().includes('complete your persona')) {
        setError(
          '⚠️ Face Consistency requires a complete persona. ' +
          'Please go to your Persona page and fill out your bio, industry, and brand tone.'
        );
        return; 
      }

      // 2. Overload & Retry Logic
      const isServiceOverload = 
        errorStatus === 500 || 
        errorStatus === 503 || 
        errorMessage.includes('service') || 
        errorMessage.includes('traffic') ||
        errorMessage.includes('Downstream');

      if (isServiceOverload && retryCount < 3) {
        const modelName = useFaceConsistency 
          ? (faceModel === 'nano-banana-2' ? 'Nano Banana 2' : 'ByteDance SeeDream v4.5')
          : model.toUpperCase();
        
        setRetryMessage(`${modelName} is busy. Retrying... (Attempt ${retryCount + 1}/3)`);
        await new Promise(resolve => setTimeout(resolve, 3000));
        return handleGenerate(retryCount + 1); 
      }

      // 3. Final Error Reporting
      if (isServiceOverload) {
        setShowRetry(true); // Show the manual retry button
        const modelName = useFaceConsistency 
          ? (faceModel === 'nano-banana-2' ? 'Nano Banana 2' : 'ByteDance SeeDream v4.5')
          : model.toUpperCase();
        
        setError(
          `${modelName} is currently overloaded. We tried 3 times, but the server is still busy.`
        );
      } else {
        setError(errorMessage || 'Failed to generate content');
      }
    } finally {
      setGenerating(false);
      setRetryAttempt(0);
      setRetryMessage('');
    }
  };

  const handleReset = () => {
    setPrompt('');
    setResult(null);
    setError('');
    setShowRetry(false);
    setRetryAttempt(0);
  };

  return (
    <Layout>
      <div className="p-8 max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-semibold text-white mb-2">Generate Content</h1>
          <p className="text-gray-400">Create AI-powered images and text using your persona</p>
        </div>

        {!persona && (
          <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-xl p-4 mb-6 text-yellow-500 text-sm">
            ⚠️ You haven't created a persona yet. Your generations won't include personalized context.
          </div>
        )}

        {/* Mode Toggle */}
        <div className="flex gap-4 mb-8">
          <button
            onClick={() => {
              setType('image');
              setModel('dall-e-3');
              setUseFaceConsistency(true);
              setResult(null);
              setError('');
              setShowRetry(false);
            }}
            disabled={generating}
            className={`flex-1 p-6 rounded-xl border-2 transition text-left ${type === 'image' ? 'border-white bg-white/5' : 'border-gray-700 bg-black/20 hover:border-gray-600'}`}
          >
            <div className="flex items-center gap-3 mb-2">
              <span className="text-3xl">🎨</span>
              <h3 className="text-xl font-semibold text-white">Image Generation</h3>
            </div>
          </button>

          <button
            onClick={() => { 
              setType('text'); 
              setModel('gpt-4'); 
              setUseFaceConsistency(false);
              setResult(null); 
              setError('');
              setShowRetry(false);
            }}
            disabled={generating}
            className={`flex-1 p-6 rounded-xl border-2 transition text-left ${type === 'text' ? 'border-white bg-white/5' : 'border-gray-700 bg-black/20 hover:border-gray-600'}`}
          >
            <div className="flex items-center gap-3 mb-2">
              <span className="text-3xl">✍️</span>
              <h3 className="text-xl font-semibold text-white">Text Generation</h3>
            </div>
          </button>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-dark-card rounded-xl p-6 border border-gray-800">
              <label className="text-white font-medium block mb-3">Your Prompt</label>
              <textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                rows={4}
                className="w-full px-4 py-3 bg-black/40 border border-gray-700 rounded-lg text-white outline-none focus:border-brand-pink transition resize-none"
                placeholder={type === 'image' ? 'Describe your image...' : 'Write a post about...'}
                disabled={generating}
              />
            </div>

            {/* Generation Mode — image only */}
            {type === 'image' && (
              <div className="bg-dark-card rounded-xl p-6 border border-gray-800">
                <label className="text-white font-medium block mb-1">Generation Mode</label>
                <p className="text-gray-400 text-sm mb-4">How do you want to generate your image?</p>
                <div className="grid grid-cols-2 gap-4">
                  {/* Option 1: Use Persona Face */}
                  <button
                    onClick={() => setUseFaceConsistency(true)}
                    disabled={generating}
                    className={`p-4 rounded-xl border-2 transition text-left w-full ${useFaceConsistency ? 'border-brand-pink bg-brand-pink/5' : 'border-gray-700 bg-black/20 hover:border-gray-600'}`}
                  >
                    <span className="text-2xl mb-2 block">🧬</span>
                    <p className="text-white font-semibold text-sm">Use Persona Image</p>
                    <p className="text-gray-400 text-xs mt-1">Generate with your persona's face</p>
                  </button>

                  {/* Option 2: Normal generation */}
                  <button
                    onClick={() => setUseFaceConsistency(false)}
                    disabled={generating}
                    className={`p-4 rounded-xl border-2 transition text-left w-full ${!useFaceConsistency ? 'border-white bg-white/5' : 'border-gray-700 bg-black/20 hover:border-gray-600'}`}
                  >
                    <span className="text-2xl mb-2 block">🎨</span>
                    <p className="text-white font-semibold text-sm">Normal Generation</p>
                    <p className="text-gray-400 text-xs mt-1">Generate without your face</p>
                  </button>
                </div>

                {/* Model selector for active option */}
                <div className="mt-4">
                  {useFaceConsistency ? (
                    <>
                      <label className="text-gray-400 text-xs block mb-2">Face Model</label>
                      <select
                        value={faceModel}
                        onChange={(e) => setFaceModel(e.target.value)}
                        disabled={generating}
                        className="w-full bg-black/40 border border-gray-700 p-2 rounded-lg text-sm text-white outline-none focus:border-brand-pink"
                      >
                        <option value="nano-banana-2">Nano Banana 2 (HQ)</option>
                        <option value="bytedance-seedream">ByteDance SeeDream</option>
                      </select>
                      {!persona && (
                        <p className="text-yellow-400 text-xs mt-2">⚠️ Complete your persona with photos before using this mode.</p>
                      )}
                    </>
                  ) : (
                    <>
                      <label className="text-gray-400 text-xs block mb-2">Image Model</label>
                      <select
                        value={model}
                        onChange={(e) => setModel(e.target.value)}
                        disabled={generating}
                        className="w-full bg-black/40 border border-gray-700 p-2 rounded-lg text-sm text-white outline-none focus:border-brand-pink"
                      >
                        <option value="dall-e-3">DALL-E 3</option>
                        <option value="dall-e-2">DALL-E 2</option>
                      </select>
                    </>
                  )}
                </div>
              </div>
            )}

            <div className="bg-dark-card rounded-xl p-6 border border-gray-800">
              <h3 className="text-white font-semibold mb-4">Preview</h3>
              
              {generating && !result && (
                <div className="aspect-video bg-black/40 rounded-lg flex flex-col items-center justify-center border border-gray-700">
                  <div className="relative w-16 h-16 mb-4">
                    <div className="absolute inset-0 border-4 border-gray-700 rounded-full"></div>
                    <div className="absolute inset-0 border-4 border-brand-pink rounded-full border-t-transparent animate-spin"></div>
                  </div>
                  <p className="text-white font-medium mb-1">{retryMessage || 'Generating...'}</p>
                  {retryAttempt > 0 && <p className="text-yellow-400 text-xs">Attempt {retryAttempt}/3</p>}
                </div>
              )}
              
              {result ? (
                <div className="space-y-4">
                  {result.type === 'image' ? (
                    <>
                      <img src={result.url} alt="Generated" className="w-full rounded-lg shadow-lg" />
                      <div className="flex gap-4">
                        <a href={result.url} download target="_blank" rel="noreferrer" className="flex-1 bg-white text-black py-3 rounded-lg font-semibold text-center hover:bg-gray-200 transition">
                          Download
                        </a>
                        <a href={result.url} target="_blank" rel="noreferrer" className="flex-1 bg-white/10 text-white py-3 rounded-lg font-semibold text-center hover:bg-white/20 transition">
                          View Full
                        </a>
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="bg-black/40 rounded-lg p-6 max-h-96 overflow-y-auto text-gray-300 whitespace-pre-wrap border border-gray-700">
                        {result.text}
                      </div>
                      <button onClick={() => { navigator.clipboard.writeText(result.text); alert('Copied!'); }} className="w-full bg-white text-black py-3 rounded-lg font-semibold hover:bg-gray-200 transition">
                        📋 Copy to Clipboard
                      </button>
                    </>
                  )}
                </div>
              ) : !generating && (
                <div className="aspect-video bg-black/40 rounded-lg flex items-center justify-center border border-gray-700 text-gray-500">
                  <div className="text-center">
                    <span className="text-4xl mb-2 block">🖼️</span>
                    <p>Your content will appear here</p>
                  </div>
                </div>
              )}

              <div className="mt-6 pt-6 border-t border-gray-700">
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-gray-400">Today's Usage</span>
                  <span className="text-white font-semibold">{usageStats.used}/{usageStats.limit}</span>
                </div>
                <div className="w-full bg-gray-700 h-2 rounded-full overflow-hidden">
                  <div className="bg-brand-pink h-2 transition-all duration-500" style={{ width: `${Math.min((usageStats.used / usageStats.limit) * 100, 100)}%` }}></div>
                </div>
              </div>
            </div>

            <div className="flex gap-4">
              <button
                onClick={() => handleGenerate(0)}
                disabled={generating || !prompt.trim()}
                className="flex-1 bg-white text-black py-4 rounded-xl font-semibold hover:bg-gray-200 disabled:opacity-50 transition transform active:scale-95"
              >
                {generating ? 'Processing...' : 'Generate with AI'}
              </button>
              {result && <button onClick={handleReset} className="px-8 py-4 bg-white/10 text-white rounded-xl hover:bg-white/20 transition">New</button>}
            </div>

            {error && (
              <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-5">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-red-400 font-semibold mb-1">Error</p>
                    <p className="text-red-300 text-sm leading-relaxed">{error}</p>
                  </div>
                  {showRetry && (
                    <button 
                      onClick={() => handleGenerate(0)}
                      className="ml-4 px-4 py-2 bg-red-500 text-white rounded-lg text-sm font-bold hover:bg-red-600 transition shadow-lg"
                    >
                      🔄 Retry Now
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Sidebar Controls */}
          <div className="space-y-6">
            {type === 'text' && (
              <div className="bg-dark-card rounded-xl p-6 border border-gray-800">
                <label className="text-white font-medium block mb-4">✨ AI Model</label>
                <select value={model} onChange={(e) => setModel(e.target.value)} className="w-full bg-black/40 border border-gray-700 p-3 rounded-lg text-white focus:border-brand-pink outline-none">
                  <option value="gpt-4">GPT-4</option>
                  <option value="gpt-4o">GPT-4o</option>
                  <option value="gpt-3.5-turbo">GPT-3.5 Turbo</option>
                </select>
              </div>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
}

export default function Generate() {
  return (
    <Suspense fallback={<Layout><div className="flex items-center justify-center h-screen"><div className="text-xl text-gray-400">Loading...</div></div></Layout>}>
      <GenerateInner />
    </Suspense>
  );
}