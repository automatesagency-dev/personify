'use client'

import { useState, useEffect, useCallback, useRef, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Layout from '../components/Layout';
import { generationAPI, personaAPI } from '../services/api';
import posthog from 'posthog-js';

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
  const [showRetry, setShowRetry] = useState(false);
  const [persona, setPersona] = useState(null);
  const [usageStats, setUsageStats] = useState({ used: 0, limit: 10 });

  const [useFaceConsistency, setUseFaceConsistency] = useState(true);
  const [faceModel, setFaceModel] = useState('nano-banana-2');
  const [retryAttempt, setRetryAttempt] = useState(0);
  const [retryMessage, setRetryMessage] = useState('');

  // Up to 3 reference images: [{ file, preview }]
  const [referenceImages, setReferenceImages] = useState([]);
  const fileInputRef = useRef(null);

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
      console.error('Usage stats error:', err);
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

  const handleAddImage = (e) => {
    const file = e.target.files[0];
    if (!file || referenceImages.length >= 3) return;
    posthog.capture('reference_image_added', { total_after: referenceImages.length + 1 });
    const reader = new FileReader();
    reader.onload = (ev) => {
      setReferenceImages((prev) => [...prev, { file, preview: ev.target.result }]);
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const removeReferenceImage = (index) => {
    setReferenceImages((prev) => prev.filter((_, i) => i !== index));
  };

  const clearReferenceImages = () => setReferenceImages([]);

  const handleGenerate = async (retryCount = 0) => {
    if (!prompt.trim()) return;

    setGenerating(true);
    setError('');
    setShowRetry(false);
    if (retryCount === 0) setResult(null);
    setRetryAttempt(retryCount);

    if (retryCount === 0) {
      posthog.capture('generation_started', {
        content_type: type,
        model: useFaceConsistency ? faceModel : model,
        face_consistency: useFaceConsistency,
        reference_images: referenceImages.length,
      });
    }

    try {
      const referenceImagesBase64 = referenceImages.map((img) => img.preview.split(',')[1]);
      const referenceImagesMimeTypes = referenceImages.map((img) => img.file.type || 'image/jpeg');

      let response;
      if (type === 'image') {
        response = await generationAPI.generateImage({
          prompt,
          model,
          useFaceConsistency,
          faceModel,
          referenceImagesBase64,
          referenceImagesMimeTypes,
        });
        setResult({ type: 'image', url: response.data.imageUrl });
      } else {
        response = await generationAPI.generateText({
          prompt,
          model,
          referenceImagesBase64,
          referenceImagesMimeTypes,
        });
        setResult({ type: 'text', text: response.data.text });
      }

      posthog.capture('generation_completed', {
        content_type: type,
        model: useFaceConsistency ? faceModel : model,
        face_consistency: useFaceConsistency,
        reference_images: referenceImages.length,
      });

      await loadUsageStats();
      setRetryAttempt(0);
      setRetryMessage('');

    } catch (err) {
      const errorStatus = err.response?.status;
      const errorMessage = err.response?.data?.error || err.message;

      if (errorStatus === 400 && errorMessage.toLowerCase().includes('complete your persona')) {
        setError(
          '⚠️ Face Consistency requires a complete persona. ' +
          'Please go to your Persona page and fill out your bio, industry, and brand tone.'
        );
        return;
      }

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

      if (isServiceOverload) {
        setShowRetry(true);
        const modelName = useFaceConsistency
          ? (faceModel === 'nano-banana-2' ? 'Nano Banana 2' : 'ByteDance SeeDream v4.5')
          : model.toUpperCase();
        setError(`${modelName} is currently overloaded. We tried 3 times, but the server is still busy.`);
      } else {
        setError(errorMessage || 'Failed to generate content');
      }
      posthog.capture('generation_failed', {
        content_type: type,
        model: useFaceConsistency ? faceModel : model,
        error: errorMessage,
        service_overload: isServiceOverload,
      });
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
    clearReferenceImages();
  };

  const switchType = (newType) => {
    posthog.capture('content_type_switched', { to: newType });
    setType(newType);
    setModel(newType === 'text' ? 'gpt-4' : 'dall-e-3');
    setUseFaceConsistency(newType === 'image');
    setResult(null);
    setError('');
    setShowRetry(false);
    clearReferenceImages();
  };

  return (
    <Layout>
      <div className="p-6 lg:p-10 max-w-[1400px] mx-auto min-h-screen flex flex-col">
        
        {/* Header & Main Toggles */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-8 gap-4">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">Create Content</h1>
            <p className="text-gray-400 text-sm">Turn your ideas into high-quality assets</p>
          </div>
          
          <div className="flex bg-black/40 p-1 rounded-xl border border-gray-800">
            <button
              onClick={() => switchType('image')}
              disabled={generating}
              className={`px-6 py-2.5 rounded-lg text-sm font-medium transition-all ${
                type === 'image' ? 'bg-white text-black shadow-sm' : 'text-gray-400 hover:text-white hover:bg-white/5'
              }`}
            >
              🎨 Image
            </button>
            <button
              onClick={() => switchType('text')}
              disabled={generating}
              className={`px-6 py-2.5 rounded-lg text-sm font-medium transition-all ${
                type === 'text' ? 'bg-white text-black shadow-sm' : 'text-gray-400 hover:text-white hover:bg-white/5'
              }`}
            >
              ✍️ Text
            </button>
          </div>
        </div>

        {!persona && (
          <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-xl p-4 mb-8 flex items-center gap-3 text-yellow-500 text-sm font-medium">
            <span className="text-xl">⚠️</span>
            You haven't created a persona yet. Your generated content won't include personalized context or your face.
          </div>
        )}

        {/* Main Workspace - 2 Columns */}
        <div className="flex flex-col lg:flex-row gap-8 lg:gap-12 flex-1">
          
          {/* LEFT COLUMN: Input & Settings */}
          <div className="w-full lg:w-5/12 flex flex-col gap-6">
            
            {/* The Prompt Box */}
            <div className="bg-[#111] rounded-2xl border border-gray-800 shadow-xl overflow-hidden focus-within:border-brand-pink transition-colors">
              <textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                rows={5}
                className="w-full px-5 py-4 bg-transparent text-white outline-none resize-none placeholder-gray-600 text-base"
                placeholder={type === 'image' ? "Describe the image you want to create..." : "What do you want to write about?"}
                disabled={generating}
              />
              
              {/* Reference Images Toolbar within Prompt */}
              <div className="bg-[#1a1a1a] px-5 py-3 border-t border-gray-800 flex items-center justify-between">
                <div className="flex items-center gap-2 overflow-x-auto">
                  {referenceImages.map((img, i) => (
                    <div key={i} className="relative group flex-shrink-0">
                      <img
                        src={img.preview}
                        alt={`ref-${i}`}
                        className="w-10 h-10 object-cover rounded-md border border-gray-600 opacity-80 group-hover:opacity-100 transition"
                      />
                      <button
                        onClick={() => removeReferenceImage(i)}
                        disabled={generating}
                        className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-red-500 hover:bg-red-400 rounded-full text-white flex items-center justify-center text-[10px] shadow-sm"
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                  
                  {referenceImages.length < 3 && (
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      disabled={generating}
                      className="w-10 h-10 rounded-md border border-dashed border-gray-600 hover:border-gray-400 flex items-center justify-center text-gray-500 hover:text-gray-300 transition flex-shrink-0 bg-black/20"
                      title="Attach reference image"
                    >
                      <span className="text-lg leading-none">+</span>
                    </button>
                  )}
                  <input ref={fileInputRef} type="file" accept="image/jpeg,image/png,image/webp" onChange={handleAddImage} className="hidden" />
                </div>
                
                <span className="text-xs text-gray-500 whitespace-nowrap ml-4">
                  {referenceImages.length}/3 attached
                </span>
              </div>
            </div>

            {/* Settings Area */}
            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider">Generation Settings</h3>
              
              {type === 'image' ? (
                <div className="flex flex-col gap-3">
                  {/* Option 1: Persona Mode */}
                  <div 
                    onClick={() => !generating && setUseFaceConsistency(true)}
                    className={`relative p-4 rounded-xl border-2 cursor-pointer transition-all ${
                      useFaceConsistency ? 'border-brand-pink bg-brand-pink/5' : 'border-gray-800 bg-[#111] hover:border-gray-700'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div className={`p-2 rounded-lg ${useFaceConsistency ? 'bg-brand-pink/20 text-brand-pink' : 'bg-gray-800 text-gray-400'}`}>
                        🧬
                      </div>
                      <div className="flex-1">
                        <h4 className="text-white font-medium mb-1">Brand Persona Mode</h4>
                        <p className="text-gray-400 text-xs leading-relaxed mb-3">
                          Uses your uploaded photos to generate a facially consistent image. Ideal for professional headshots and branded content.
                        </p>
                        
                        {useFaceConsistency && (
                          <div onClick={e => e.stopPropagation()}>
                            <select
                              value={faceModel}
                              onChange={(e) => setFaceModel(e.target.value)}
                              disabled={generating}
                              className="w-full bg-black border border-gray-700 px-3 py-2 rounded-lg text-sm text-white outline-none focus:border-brand-pink"
                            >
                              <option value="nano-banana-2">Model: Nano Banana 2 (High Quality)</option>
                              <option value="bytedance-seedream">Model: ByteDance SeeDream</option>
                            </select>
                          </div>
                        )}
                        {useFaceConsistency && !persona && (
                          <p className="text-yellow-400 text-xs mt-2 font-medium">⚠️ Complete your persona first.</p>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Option 2: Normal Mode */}
                  <div 
                    onClick={() => !generating && setUseFaceConsistency(false)}
                    className={`relative p-4 rounded-xl border-2 cursor-pointer transition-all ${
                      !useFaceConsistency ? 'border-white/60 bg-white/5' : 'border-gray-800 bg-[#111] hover:border-gray-700'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div className={`p-2 rounded-lg ${!useFaceConsistency ? 'bg-white/20 text-white' : 'bg-gray-800 text-gray-400'}`}>
                        🎨
                      </div>
                      <div className="flex-1">
                        <h4 className="text-white font-medium mb-1">Freestyle Mode</h4>
                        <p className="text-gray-400 text-xs leading-relaxed mb-3">
                          Generates images purely from your prompt without using your face. Best for abstract art, scenes, and concepts.
                        </p>
                        
                        {!useFaceConsistency && (
                          <div onClick={e => e.stopPropagation()}>
                            <select
                              value={model}
                              onChange={(e) => setModel(e.target.value)}
                              disabled={generating}
                              className="w-full bg-black border border-gray-700 px-3 py-2 rounded-lg text-sm text-white outline-none focus:border-white/50"
                            >
                              <option value="dall-e-3">Model: DALL-E 3 (Creative)</option>
                              <option value="dall-e-2">Model: DALL-E 2 (Fast)</option>
                            </select>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                /* Text Mode Settings */
                <div className="bg-[#111] rounded-xl border border-gray-800 p-5">
                  <label className="text-white font-medium block mb-2">Select AI Model</label>
                  <p className="text-gray-400 text-xs mb-4">Choose the intelligence engine for your text.</p>
                  <select 
                    value={model} 
                    onChange={(e) => setModel(e.target.value)} 
                    disabled={generating} 
                    className="w-full bg-black border border-gray-700 p-3 rounded-lg text-white text-sm focus:border-brand-pink outline-none"
                  >
                    <option value="gpt-4">GPT-4 (Best for logic & reasoning)</option>
                    <option value="gpt-4o">GPT-4o (Fastest & most capable)</option>
                    <option value="gpt-3.5-turbo">GPT-3.5 Turbo (Quick drafts)</option>
                  </select>
                  {referenceImages.length > 0 && (
                    <div className="mt-3 bg-blue-500/10 border border-blue-500/20 rounded-lg p-3">
                      <p className="text-blue-400 text-xs flex items-center gap-2">
                        <span>⚡</span> GPT-4o will be used automatically to process your attached images.
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Action Buttons */}
            <div className="mt-4 flex flex-col gap-3">
              <button
                onClick={() => handleGenerate(0)}
                disabled={generating || !prompt.trim()}
                className="w-full bg-white text-black py-4 rounded-xl font-bold text-lg hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed transition-all transform active:scale-[0.98] shadow-lg"
              >
                {generating ? 'Processing...' : `Generate ${type === 'image' ? 'Image' : 'Text'}`}
              </button>
              
              {result && (
                <button onClick={handleReset} className="w-full py-3 text-gray-400 hover:text-white transition text-sm font-medium">
                  Clear and start over
                </button>
              )}
            </div>
            
            {/* Error Message Inline */}
            {error && (
              <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4 flex flex-col gap-3">
                <div className="flex gap-3">
                  <span className="text-red-400 mt-0.5">⚠️</span>
                  <p className="text-red-300 text-sm leading-relaxed">{error}</p>
                </div>
                {showRetry && (
                  <button
                    onClick={() => handleGenerate(0)}
                    className="self-end px-4 py-2 bg-red-500/20 text-red-300 hover:bg-red-500 hover:text-white rounded-lg text-xs font-bold transition"
                  >
                    🔄 Retry Now
                  </button>
                )}
              </div>
            )}
            
          </div>

          {/* RIGHT COLUMN: Preview & Results */}
          <div className="w-full lg:w-7/12 flex flex-col">
            <div className="bg-[#111] rounded-2xl border border-gray-800 shadow-xl flex-1 flex flex-col overflow-hidden min-h-[500px]">
              
              {/* Output Header */}
              <div className="px-6 py-4 border-b border-gray-800 flex justify-between items-center bg-[#151515]">
                <h3 className="text-white font-semibold flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-brand-pink"></span>
                  Output Preview
                </h3>
                
                {/* Usage Stats (Moved to a cleaner spot) */}
                <div className="flex items-center gap-3">
                  <span className="text-xs text-gray-500 font-medium">Daily Uses: {usageStats.used}/{usageStats.limit}</span>
                  <div className="w-24 bg-gray-800 h-1.5 rounded-full overflow-hidden">
                    <div 
                      className="bg-brand-pink h-full transition-all duration-500" 
                      style={{ width: `${Math.min((usageStats.used / usageStats.limit) * 100, 100)}%` }}
                    />
                  </div>
                </div>
              </div>

              {/* Output Content Area */}
              <div className="flex-1 p-6 flex flex-col justify-center bg-black/20">
                {generating && !result && (
                  <div className="flex flex-col items-center justify-center animate-pulse">
                    <div className="relative w-16 h-16 mb-6">
                      <div className="absolute inset-0 border-4 border-gray-800 rounded-full"></div>
                      <div className="absolute inset-0 border-4 border-brand-pink rounded-full border-t-transparent animate-spin"></div>
                    </div>
                    <p className="text-white font-medium text-lg mb-2">{retryMessage || 'Working on your request...'}</p>
                    {retryAttempt > 0 && <p className="text-yellow-400 text-sm bg-yellow-400/10 px-3 py-1 rounded-full">Attempt {retryAttempt}/3</p>}
                  </div>
                )}

                {result ? (
                  <div className="w-full h-full flex flex-col h-full">
                    {result.type === 'image' ? (
                      <div className="flex flex-col h-full justify-between items-center space-y-6">
                        <div className="relative w-full max-w-lg mx-auto rounded-xl overflow-hidden shadow-2xl border border-gray-700">
                          <img src={result.url} alt="Generated Asset" className="w-full h-auto object-contain" />
                        </div>
                        <div className="flex w-full max-w-lg gap-3">
                          <a href={result.url} download target="_blank" rel="noreferrer" onClick={() => posthog.capture('image_downloaded')} className="flex-1 bg-white text-black py-3.5 rounded-xl font-bold text-center hover:bg-gray-200 transition shadow-lg">
                            ↓ Download Image
                          </a>
                          <a href={result.url} target="_blank" rel="noreferrer" className="flex-1 bg-[#222] border border-gray-700 text-white py-3.5 rounded-xl font-bold text-center hover:bg-[#333] transition">
                            ⤢ Open Full Size
                          </a>
                        </div>
                      </div>
                    ) : (
                      <div className="flex flex-col h-full">
                        <div className="flex-1 bg-[#1a1a1a] rounded-xl p-6 overflow-y-auto text-gray-200 text-lg leading-relaxed whitespace-pre-wrap border border-gray-700 custom-scrollbar">
                          {result.text}
                        </div>
                        <button 
                          onClick={() => { navigator.clipboard.writeText(result.text); posthog.capture('text_copied'); alert('Copied!'); }}
                          className="mt-4 w-full bg-white text-black py-3.5 rounded-xl font-bold hover:bg-gray-200 transition shadow-lg flex items-center justify-center gap-2"
                        >
                          <span>📋</span> Copy Text to Clipboard
                        </button>
                      </div>
                    )}
                  </div>
                ) : !generating && (
                  <div className="text-center flex flex-col items-center justify-center h-full opacity-60">
                    <div className="w-20 h-20 bg-gray-800 rounded-2xl flex items-center justify-center mb-4 transform -rotate-6">
                      <span className="text-3xl">{type === 'image' ? '🖼️' : '📝'}</span>
                    </div>
                    <h4 className="text-white font-medium text-lg mb-1">Awaiting your prompt</h4>
                    <p className="text-gray-500 text-sm max-w-xs mx-auto">Fill out the details on the left and hit generate to see your results here.</p>
                  </div>
                )}
              </div>
            </div>
          </div>
          
        </div>
      </div>
    </Layout>
  );
}

export default function Generate() {
  return (
    <Suspense fallback={
      <Layout>
        <div className="flex items-center justify-center h-screen bg-black">
          <div className="flex flex-col items-center gap-4">
            <div className="w-8 h-8 border-4 border-gray-800 border-t-brand-pink rounded-full animate-spin"></div>
            <div className="text-sm font-medium text-gray-400">Loading Workspace...</div>
          </div>
        </div>
      </Layout>
    }>
      <GenerateInner />
    </Suspense>
  );
}