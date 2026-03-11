import { useState, useEffect, useCallback } from 'react';
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
    setResult(null);
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
      
      const isServiceOverload = errorStatus === 500 || errorStatus === 503 || 
                                errorMessage.includes('service') || 
                                errorMessage.includes('traffic') ||
                                errorMessage.includes('Downstream');

      if (isServiceOverload && retryCount < 3) {
        const modelName = useFaceConsistency 
          ? (faceModel === 'nano-banana-2' ? 'Nano Banana 2' : 'ByteDance SeeDream v4.5')
          : model.toUpperCase();
        
        setRetryMessage(`${modelName} is busy. Retrying... (Attempt ${retryCount + 1}/3)`);
        await new Promise(resolve => setTimeout(resolve, 3000));
        
        // Return the recursive call to prevent the finally block from firing early
        return handleGenerate(retryCount + 1); 
      } else if (isServiceOverload) {
        const modelName = useFaceConsistency 
          ? (faceModel === 'nano-banana-2' ? 'Nano Banana 2' : 'ByteDance SeeDream v4.5')
          : model.toUpperCase();
        
        setError(
          `We're sorry! ${modelName} is temporarily overloaded due to high demand. ` +
          `Most users succeed on the second attempt. Please try again in a few moments. ` +
          `If this persists, contact support@personify.com`
        );
      } else {
        setError(errorMessage || 'Failed to generate content');
      }
    } finally {
      // This will only run when the final attempt in the recursion chain completes
      setGenerating(false);
      setRetryAttempt(0);
      setRetryMessage('');
    }
  };

  const handleReset = () => {
    setPrompt('');
    setResult(null);
    setError('');
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

        <div className="flex gap-4 mb-8">
          <button
            onClick={() => { setType('image'); setModel('dall-e-3'); setUseFaceConsistency(false); setResult(null); }}
            disabled={generating}
            className={`flex-1 p-6 rounded-xl border-2 transition text-left ${type === 'image' ? 'border-white bg-white/5' : 'border-gray-700 bg-black/20 hover:border-gray-600'}`}
          >
            <div className="flex items-center gap-3 mb-2">
              <span className="text-3xl">🎨</span>
              <h3 className="text-xl font-semibold text-white">Image Generation</h3>
            </div>
          </button>

          <button
            onClick={() => { setType('text'); setModel('gpt-4'); setResult(null); }}
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

            <div className="bg-dark-card rounded-xl p-6 border border-gray-800">
              <h3 className="text-white font-semibold mb-4">Preview</h3>
              
              {generating && !result && (
                <div className="aspect-video bg-black/40 rounded-lg flex flex-col items-center justify-center border border-gray-700">
                  <div className="relative w-16 h-16 mb-4">
                    <div className="absolute inset-0 border-4 border-gray-700 rounded-full"></div>
                    <div className="absolute inset-0 border-4 border-brand-pink rounded-full border-t-transparent animate-spin"></div>
                  </div>
                  <p className="text-white font-medium mb-1">{retryMessage || 'Generating your content...'}</p>
                  {retryAttempt > 0 && <p className="text-yellow-400 text-xs">Retry attempt {retryAttempt}/3</p>}
                </div>
              )}
              
              {result ? (
                <div className="space-y-4">
                  {result.type === 'image' ? (
                    <>
                      <img src={result.url} alt="Generated" className="w-full rounded-lg" />
                      <div className="flex gap-4">
                        <a href={result.url} download target="_blank" rel="noreferrer" className="flex-1 bg-white text-black py-3 rounded-lg font-semibold text-center hover:bg-gray-200">
                          Download Image
                        </a>
                        <a href={result.url} target="_blank" rel="noreferrer" className="flex-1 bg-white/10 text-white py-3 rounded-lg font-semibold text-center hover:bg-white/20">
                          Open Full Size
                        </a>
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="bg-black/40 rounded-lg p-6 max-h-96 overflow-y-auto text-gray-300 whitespace-pre-wrap">
                        {result.text}
                      </div>
                      <button onClick={() => { navigator.clipboard.writeText(result.text); alert('Copied!'); }} className="w-full bg-white text-black py-3 rounded-lg font-semibold hover:bg-gray-200">
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
                <div className="w-full bg-gray-700 h-2 rounded-full">
                  <div className="bg-brand-pink h-2 rounded-full transition-all" style={{ width: `${Math.min((usageStats.used / usageStats.limit) * 100, 100)}%` }}></div>
                </div>
                <p className="text-xs text-gray-400 mt-2">
                  {type === 'image' 
                    ? '⏱️ Images may take up to 2 minutes to generate' 
                    : '⏱️ Text generation typically takes 5-15 seconds'}
                </p>
              </div>
            </div>

            <div className="flex gap-4">
              <button
                onClick={() => handleGenerate(0)}
                disabled={generating || !prompt.trim()}
                className="flex-1 bg-white text-black py-4 rounded-xl font-semibold hover:bg-gray-200 disabled:opacity-50 transition"
              >
                {generating ? 'Processing...' : 'Generate with AI'}
              </button>
              {result && <button onClick={handleReset} className="px-8 py-4 bg-white/10 text-white rounded-xl hover:bg-white/20 transition">New Generation</button>}
            </div>

            {error && (
              <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4">
                <p className="text-red-400 font-semibold mb-1">Generation Failed</p>
                <p className="text-red-300 text-sm leading-relaxed">{error}</p>
              </div>
            )}
          </div>

          <div className="space-y-6">
            <div className="bg-dark-card rounded-xl p-6 border border-gray-800">
              <label className="text-white font-medium block mb-4">✨ AI Model Selection</label>
              {type === 'image' ? (
                <div className="space-y-4">
                  {!useFaceConsistency && (
                    <select value={model} onChange={(e) => setModel(e.target.value)} className="w-full bg-black/40 border border-gray-700 p-3 rounded-lg text-white">
                      <option value="dall-e-3">DALL-E 3</option>
                      <option value="dall-e-2">DALL-E 2</option>
                    </select>
                  )}
                  <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-4">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-white font-medium">Face Consistency</span>
                      <input 
                        type="checkbox" 
                        checked={useFaceConsistency} 
                        onChange={(e) => setUseFaceConsistency(e.target.checked)} 
                        disabled={generating}
                        className="w-5 h-5 accent-brand-pink cursor-pointer"
                      />
                    </div>
                    {useFaceConsistency && (
                      <select value={faceModel} onChange={(e) => setFaceModel(e.target.value)} className="w-full mt-3 bg-black/40 border border-gray-700 p-2 rounded text-sm text-white">
                        <option value="nano-banana-2">Nano Banana 2 (HQ)</option>
                        <option value="bytedance-seedream">ByteDance SeeDream</option>
                      </select>
                    )}
                    <p className="text-[10px] text-blue-300 mt-2 italic">Requires persona photos</p>
                  </div>
                </div>
              ) : (
                <select value={model} onChange={(e) => setModel(e.target.value)} className="w-full bg-black/40 border border-gray-700 p-3 rounded-lg text-white">
                  <option value="gpt-4">GPT-4</option>
                  <option value="gpt-4o">GPT-4o</option>
                  <option value="gpt-3.5-turbo">GPT-3.5 Turbo</option>
                </select>
              )}
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}