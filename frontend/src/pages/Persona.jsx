import { useState, useEffect, useRef, useCallback } from 'react';
import Layout from '../components/Layout';
import { personaAPI } from '../services/api';

export default function Persona() {
  const [persona, setPersona] = useState(null);
  const [formData, setFormData] = useState({
    bio: '',
    industry: '',
    targetAudience: '',
    brandTone: ''
  });
  const [images, setImages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  
  // Track loaded images for smooth transition
  const [loadedImages, setLoadedImages] = useState(new Set());
  const fileInputRef = useRef(null);

  const notify = (type, text) => {
    setMessage({ type, text });
    setTimeout(() => setMessage({ type: '', text: '' }), 4000);
  };

  const loadPersona = useCallback(async () => {
    try {
      const response = await personaAPI.get();
      const personaData = response.data.persona;
      if (personaData) {
        setPersona(personaData);
        setFormData({
          bio: personaData.bio || '',
          industry: personaData.industry || '',
          targetAudience: personaData.targetAudience || '',
          brandTone: personaData.brandTone || ''
        });
        setImages(personaData.personaImages || []);
      }
    } catch (error) {
      console.error("Failed to fetch persona:", error);
      setPersona(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadPersona();
  }, [loadPersona]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await personaAPI.create(formData);
      notify('success', 'Persona updated successfully!');
      await loadPersona();
    } catch (error) {
      notify('error', error.response?.data?.error || 'Failed to save persona');
    } finally {
      setSaving(false);
    }
  };

  const uploadImages = async (files) => {
    setUploading(true);
    try {
      for (const file of Array.from(files)) {
        if (!file.type.startsWith('image/')) {
          notify('error', 'Only image files are allowed');
          continue;
        }
        if (file.size > 5 * 1024 * 1024) {
          notify('error', 'Images must be under 5MB');
          continue;
        }

        const data = new FormData();
        data.append('image', file);
        await personaAPI.uploadImage(data);
      }
      notify('success', 'Images uploaded successfully!');
      await loadPersona();
    } catch (error) {
      notify('error', 'Image upload failed');
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleDeleteImage = async (imageId) => {
    if (!window.confirm('Are you sure you want to delete this reference photo?')) return;

    try {
      await personaAPI.deleteImage(imageId);
      setLoadedImages(prev => {
        const next = new Set(prev);
        next.delete(imageId);
        return next;
      });
      notify('success', 'Image deleted');
      await loadPersona();
    } catch (error) {
      notify('error', 'Failed to delete image');
    }
  };

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-screen bg-black">
          <div className="animate-pulse text-xl text-gray-500">Initializing Persona...</div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="p-8 max-w-5xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-semibold text-white mb-2">Your Persona</h1>
          <p className="text-gray-400">Define your digital identity for personalized AI content generation</p>
        </div>

        {message.text && (
          <div className={`mb-6 p-4 rounded-xl border transition-all duration-300 ${
            message.type === 'success' 
              ? 'bg-green-500/20 text-green-400 border-green-500/30' 
              : 'bg-red-500/20 text-red-400 border-red-500/30'
          }`}>
            {message.text}
          </div>
        )}

        {/* Image Management Section */}
        <div className="bg-dark-card rounded-xl p-6 mb-6 border border-gray-800">
          <h2 className="text-xl font-semibold text-white mb-4">Reference Images</h2>
          <p className="text-sm text-gray-400 mb-6">Upload photos to train the AI on your specific appearance.</p>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            {images.map((image) => {
              const isLoaded = loadedImages.has(image.id);
              return (
                <div key={image.id} className="relative group aspect-square bg-black/40 rounded-xl overflow-hidden">
                  {!isLoaded && (
                    <div className="absolute inset-0 z-10 flex items-center justify-center bg-gray-800 animate-pulse">
                      <div className="w-6 h-6 border-2 border-brand-pink border-t-transparent rounded-full animate-spin"></div>
                    </div>
                  )}

                  <img
                    src={image.imageUrl || image.url} // ✅ Fixed: Using direct R2/Storage URL
                    alt="Persona Reference"
                    loading="lazy"
                    onLoad={() => setLoadedImages(prev => new Set(prev).add(image.id))}
                    onError={(e) => {
                      console.error('Image load error:', image.id);
                      setLoadedImages(prev => new Set(prev).add(image.id));
                      e.target.src = 'https://via.placeholder.com/400?text=Load+Error';
                    }}
                    className={`w-full h-full object-cover border border-gray-700 transition-opacity duration-500 ${
                      isLoaded ? 'opacity-100' : 'opacity-0'
                    }`}
                  />

                  <button
                    onClick={() => handleDeleteImage(image.id)}
                    className="absolute top-2 right-2 z-20 bg-red-500 text-white p-2 rounded-full opacity-0 group-hover:opacity-100 transition-all shadow-lg hover:bg-red-600 scale-90 group-hover:scale-100"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
              );
            })}
            
            {/* Display empty slots up to 4 */}
            {[...Array(Math.max(0, 4 - images.length))].map((_, i) => (
              <div key={`empty-${i}`} className="aspect-square border-2 border-dashed border-gray-700 rounded-xl flex items-center justify-center bg-black/10">
                <span className="text-4xl text-gray-700 font-light">+</span>
              </div>
            ))}
          </div>

          <div
            onDrop={(e) => { e.preventDefault(); uploadImages(e.dataTransfer.files); }}
            onDragOver={(e) => e.preventDefault()}
            onClick={() => fileInputRef.current?.click()}
            className="border-2 border-dashed border-gray-700 rounded-xl p-8 text-center hover:border-brand-pink transition cursor-pointer bg-black/20 group"
          >
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              multiple
              onChange={(e) => uploadImages(e.target.files)}
              className="hidden"
            />
            
            {uploading ? (
              <div className="text-white">
                <div className="w-10 h-10 border-4 border-brand-pink border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                <p className="font-medium">Uploading to secure storage...</p>
              </div>
            ) : (
              <>
                <div className="text-5xl mb-4 group-hover:scale-110 transition-transform duration-300">📸</div>
                <p className="text-white font-semibold mb-2">Click to upload or drag and drop</p>
                <p className="text-gray-500 text-xs uppercase tracking-widest">PNG, JPG, HEIC • Max 5MB per file</p>
              </>
            )}
          </div>
        </div>

        {/* Persona Details Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="bg-dark-card rounded-xl p-6 border border-gray-800 space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Professional Bio</label>
              <textarea
                name="bio"
                value={formData.bio}
                onChange={handleChange}
                rows={4}
                className="w-full px-4 py-3 bg-black/40 border border-gray-700 rounded-lg text-white focus:border-brand-pink focus:ring-1 focus:ring-brand-pink outline-none transition resize-none"
                placeholder="Describe your expertise and personality..."
              />
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Industry / Niche</label>
                <input
                  type="text"
                  name="industry"
                  value={formData.industry}
                  onChange={handleChange}
                  className="w-full px-4 py-3 bg-black/40 border border-gray-700 rounded-lg text-white focus:border-brand-pink outline-none transition"
                  placeholder="e.g., Software, Lifestyle"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Brand Tone</label>
                <input
                  type="text"
                  name="brandTone"
                  value={formData.brandTone}
                  onChange={handleChange}
                  className="w-full px-4 py-3 bg-black/40 border border-gray-700 rounded-lg text-white focus:border-brand-pink outline-none transition"
                  placeholder="e.g., Sarcastic, Authoritative"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Target Audience</label>
              <input
                type="text"
                name="targetAudience"
                value={formData.targetAudience}
                onChange={handleChange}
                className="w-full px-4 py-3 bg-black/40 border border-gray-700 rounded-lg text-white focus:border-brand-pink outline-none transition"
                placeholder="Who are you speaking to?"
              />
            </div>
          </div>

          <div className="flex gap-4">
            <button
              type="submit"
              disabled={saving}
              className="flex-1 bg-white text-black py-4 rounded-xl font-bold hover:bg-gray-200 transition disabled:opacity-50 active:scale-[0.98]"
            >
              {saving ? 'Syncing...' : (persona ? 'Update Persona' : 'Build Persona')}
            </button>
            
            {persona && (
              <button
                type="button"
                onClick={() => {
                  if (confirm('Revert changes to last saved version?')) {
                    setFormData({
                      bio: persona.bio || '',
                      industry: persona.industry || '',
                      targetAudience: persona.targetAudience || '',
                      brandTone: persona.brandTone || ''
                    });
                  }
                }}
                className="px-8 py-4 bg-white/5 hover:bg-white/10 text-white rounded-xl font-semibold transition border border-white/10"
              >
                Reset Form
              </button>
            )}
          </div>
        </form>

        <div className="mt-8 bg-blue-500/5 border border-blue-500/20 rounded-xl p-6">
          <h3 className="font-semibold text-blue-400 mb-3 flex items-center gap-2">
            <span className="text-xl">💡</span>
            Optimization Tips
          </h3>
          <ul className="space-y-2 text-sm text-blue-300/80">
            <li>• Ensure photos have clear, unobstructed views of your face.</li>
            <li>• Specificity in your Bio yields better AI consistency.</li>
            <li>• Brand Tone affects both text style and image lighting/mood.</li>
          </ul>
        </div>
      </div>
    </Layout>
  );
}