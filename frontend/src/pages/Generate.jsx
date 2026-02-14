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

  const loadPersona = async () => {
    try {
      const response = await personaAPI.get();
      setPersona(response.data.persona);
    } catch (error) {
      // Persona doesn't exist
      setPersona(null);
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
          generation: response.data.generation
        });
      } else {
        response = await generationAPI.generateText({ prompt, model });
        setResult({
          type: 'text',
          text: response.data.text,
          generation: response.data.generation
        });
      }
    } catch (err) {
      console.error('Generation error:', err);
      setError(err.response?.data?.error || err.response?.data?.message || 'Generation failed. Please try again.');
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
      <div className="max-w-4xl mx-auto">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Generate Content</h1>
          <p className="text-gray-600">
            Create AI-powered content personalized to your persona
          </p>
        </div>

        {/* No Persona Warning */}
        {!persona && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 mb-6">
            <p className="text-yellow-800">
              ⚠️ You haven't created a persona yet. Generated content won't be personalized.{' '}
              <a href="/persona" className="underline font-semibold">Create one now</a>
            </p>
          </div>
        )}

        {/* Type Toggle */}
        <div className="bg-white rounded-xl shadow-sm p-2 mb-6 flex gap-2">
          <button
            onClick={() => handleTypeChange('image')}
            className={`flex-1 py-3 px-6 rounded-lg font-semibold transition ${
              type === 'image'
                ? 'bg-blue-600 text-white'
                : 'text-gray-600 hover:bg-gray-50'
            }`}
          >
            🎨 Generate Image
          </button>
          <button
            onClick={() => handleTypeChange('text')}
            className={`flex-1 py-3 px-6 rounded-lg font-semibold transition ${
              type === 'text'
                ? 'bg-green-600 text-white'
                : 'text-gray-600 hover:bg-gray-50'
            }`}
          >
            ✍️ Generate Text
          </button>
        </div>

        {/* Generation Form */}
        <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
          <form onSubmit={handleGenerate} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                What do you want to create?
              </label>
              <textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                rows={4}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder={
                  type === 'image'
                    ? 'e.g., A professional headshot in a modern office'
                    : 'e.g., Write a LinkedIn post about AI innovation'
                }
                disabled={generating}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Model
              </label>
              <select
                value={model}
                onChange={(e) => setModel(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                disabled={generating}
              >
                {type === 'image' ? (
                  <>
                    <option value="dall-e-3">DALL-E 3 (Best Quality)</option>
                    <option value="dall-e-2">DALL-E 2 (Faster)</option>
                  </>
                ) : (
                  <>
                    <option value="gpt-4">GPT-4 (Best Quality)</option>
                    <option value="gpt-3.5-turbo">GPT-3.5 Turbo (Faster)</option>
                  </>
                )}
              </select>
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
                {error}
              </div>
            )}

            <div className="flex gap-4">
              <button
                type="submit"
                disabled={generating || !prompt.trim()}
                className="flex-1 bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {generating ? (
                  <span className="flex items-center justify-center gap-2">
                    <span className="animate-spin">⏳</span>
                    {type === 'image' ? 'Generating Image...' : 'Generating Text...'}
                  </span>
                ) : (
                  `Generate ${type === 'image' ? 'Image' : 'Text'}`
                )}
              </button>
              
              {result && (
                <button
                  type="button"
                  onClick={handleReset}
                  className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg font-semibold hover:bg-gray-50 transition"
                >
                  New Generation
                </button>
              )}
            </div>
          </form>
        </div>

        {/* Result Display */}
        {result && (
          <div className="bg-white rounded-xl shadow-sm p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-gray-900">Result</h2>
              <span className="text-sm text-gray-500">
                {new Date(result.generation.createdAt).toLocaleString()}
              </span>
            </div>

{result.type === 'image' ? (
  <div>
    <img
      src={result.url}
      alt="Generated"
      className="w-full rounded-lg mb-4"
    />

    <div className="flex gap-3">
      <a
        href={result.url}
        download
        target="_blank"
        rel="noopener noreferrer"
        className="flex-1 bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 transition text-center"
      >
        Download Image
      </a>

      <a
        href={result.url}
        target="_blank"
        rel="noopener noreferrer"
        className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg font-semibold hover:bg-gray-50 transition text-center"
      >
        Open in New Tab
      </a>
    </div>
  </div>
) : (

              <div>
                <div className="bg-gray-50 rounded-lg p-6 mb-4 whitespace-pre-wrap">
                  {result.text}
                </div>
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(result.text);
                    alert('Copied to clipboard!');
                  }}
                  className="w-full bg-green-600 text-white py-3 rounded-lg font-semibold hover:bg-green-700 transition"
                >
                  📋 Copy to Clipboard
                </button>
              </div>
            )}

            <div className="mt-4 p-4 bg-gray-50 rounded-lg">
              <p className="text-sm text-gray-600 mb-1">
                <strong>Prompt:</strong> {result.generation.prompt}
              </p>
              <p className="text-sm text-gray-600">
                <strong>Model:</strong> {result.generation.model}
              </p>
            </div>
          </div>
        )}

        {/* Tips */}
        {!result && !generating && (
          <div className="bg-blue-50 rounded-xl p-6">
            <h3 className="font-semibold text-blue-900 mb-3">💡 Tips for better results:</h3>
            <ul className="space-y-2 text-sm text-blue-800">
              {type === 'image' ? (
                <>
                  <li>• Be specific about style, mood, and composition</li>
                  <li>• Include details like lighting, colors, and perspective</li>
                  <li>• Mention art styles (photorealistic, cartoon, sketch, etc.)</li>
                  <li>• Example: "Professional headshot, soft lighting, modern office background, business casual attire"</li>
                </>
              ) : (
                <>
                  <li>• Specify the format (blog post, tweet, email, etc.)</li>
                  <li>• Mention the desired tone and length</li>
                  <li>• Include key points you want covered</li>
                  <li>• Example: "Write a 200-word LinkedIn post about AI trends, professional and optimistic tone"</li>
                </>
              )}
            </ul>
          </div>
        )}
      </div>
    </Layout>
  );
}