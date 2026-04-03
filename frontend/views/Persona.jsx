'use client'

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
          <div className="flex flex-col items-center gap-4">
            <div className="w-8 h-8 border-4 border-gray-800 border-t-brand-pink rounded-full animate-spin"></div>
            <div className="text-sm font-medium text-gray-400">Loading Persona...</div>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="p-6 lg:p-10 max-w-[1400px] mx-auto min-h-screen flex flex-col">
        
        {/* Header & Notifications */}
        <div className="mb-8 flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">Brand Persona</h1>
            <p className="text-gray-400 text-sm">Define your digital identity to generate highly personalized AI content.</p>
          </div>

          {/* Floating Notification */}
          {message.text && (
            <div className={`px-4 py-3 rounded-lg border text-sm font-medium shadow-lg animate-fade-in ${
              message.type === 'success' 
                ? 'bg-green-500/10 text-green-400 border-green-500/20' 
                : 'bg-red-500/10 text-red-400 border-red-500/20'
            }`}>
              {message.type === 'success' ? '✅ ' : '⚠️ '} {message.text}
            </div>
          )}
        </div>

        {/* Main Grid: Left (Text Identity) & Right (Visual Identity) */}
        <div className="flex flex-col lg:flex-row gap-8 lg:gap-12 flex-1">
          
          {/* ── LEFT COLUMN: Text Identity Form ── */}
          <div className="w-full lg:w-5/12 flex flex-col">
            <div className="bg-[#111] rounded-2xl border border-gray-800 shadow-xl overflow-hidden flex flex-col h-full">
              
              <div className="px-6 py-4 border-b border-gray-800 bg-[#151515]">
                <h2 className="text-white font-semibold flex items-center gap-2">
                  <span className="text-brand-pink">✍️</span> Written Identity
                </h2>
              </div>

              <form onSubmit={handleSubmit} className="p-6 flex flex-col gap-6 flex-1">
                
                {/* Bio */}
                <div>
                  <label className="block text-sm font-bold text-white mb-1">Professional Bio</label>
                  <p className="text-xs text-gray-500 mb-2">Describe your expertise, background, and what you do.</p>
                  <textarea
                    name="bio"
                    value={formData.bio}
                    onChange={handleChange}
                    rows={4}
                    className="w-full px-4 py-3 bg-black border border-gray-700 rounded-xl text-white focus:border-brand-pink outline-none transition resize-none text-sm placeholder-gray-600"
                    placeholder="e.g., I am a digital marketer with 5 years of experience helping SaaS companies scale..."
                  />
                </div>

                {/* Industry & Tone */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-bold text-white mb-1">Industry / Niche</label>
                    <input
                      type="text"
                      name="industry"
                      value={formData.industry}
                      onChange={handleChange}
                      className="w-full px-4 py-3 bg-black border border-gray-700 rounded-xl text-white text-sm focus:border-brand-pink outline-none transition placeholder-gray-600"
                      placeholder="e.g., Real Estate"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-white mb-1">Brand Tone</label>
                    <input
                      type="text"
                      name="brandTone"
                      value={formData.brandTone}
                      onChange={handleChange}
                      className="w-full px-4 py-3 bg-black border border-gray-700 rounded-xl text-white text-sm focus:border-brand-pink outline-none transition placeholder-gray-600"
                      placeholder="e.g., Professional, witty"
                    />
                  </div>
                </div>

                {/* Target Audience */}
                <div>
                  <label className="block text-sm font-bold text-white mb-1">Target Audience</label>
                  <p className="text-xs text-gray-500 mb-2">Who are you trying to reach with your content?</p>
                  <input
                    type="text"
                    name="targetAudience"
                    value={formData.targetAudience}
                    onChange={handleChange}
                    className="w-full px-4 py-3 bg-black border border-gray-700 rounded-xl text-white text-sm focus:border-brand-pink outline-none transition placeholder-gray-600"
                    placeholder="e.g., First-time home buyers in Austin, Texas"
                  />
                </div>

                {/* Action Buttons */}
                <div className="mt-auto pt-6 flex flex-col gap-3 border-t border-gray-800">
                  <button
                    type="submit"
                    disabled={saving}
                    className="w-full bg-white text-black py-3.5 rounded-xl font-bold hover:bg-gray-200 transition disabled:opacity-50 active:scale-[0.98] shadow-lg"
                  >
                    {saving ? 'Syncing Profile...' : (persona ? 'Save Changes' : 'Create Persona')}
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
                      className="w-full py-3 text-gray-400 hover:text-white transition text-sm font-medium"
                    >
                      Undo unsaved changes
                    </button>
                  )}
                </div>
              </form>
            </div>

            {/* Contextual Tip */}
            <div className="mt-4 bg-blue-500/5 border border-blue-500/10 rounded-xl p-4 flex gap-3">
              <span className="text-blue-400">💡</span>
              <p className="text-xs text-blue-300/80 leading-relaxed">
                <strong className="text-blue-400">Pro Tip:</strong> Specificity is key! Your Brand Tone affects both text style and the lighting/mood of your generated images.
              </p>
            </div>
          </div>

          {/* ── RIGHT COLUMN: Visual Identity (Images) ── */}
          <div className="w-full lg:w-7/12 flex flex-col">
            <div className="bg-[#111] rounded-2xl border border-gray-800 shadow-xl overflow-hidden flex flex-col h-full">
              
              <div className="px-6 py-4 border-b border-gray-800 bg-[#151515] flex justify-between items-center">
                <h2 className="text-white font-semibold flex items-center gap-2">
                  <span className="text-brand-pink">📸</span> Visual Identity
                </h2>
                <span className="text-xs text-gray-500 font-medium">{images.length}/4 Reference Photos</span>
              </div>

              <div className="p-6 flex flex-col gap-6 h-full">
                
                {/* Upload Zone */}
                <div
                  onDrop={(e) => { e.preventDefault(); uploadImages(e.dataTransfer.files); }}
                  onDragOver={(e) => e.preventDefault()}
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full border-2 border-dashed border-gray-700 rounded-xl p-8 text-center hover:border-brand-pink hover:bg-brand-pink/5 transition-all cursor-pointer bg-black/20 group relative overflow-hidden"
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
                    <div className="text-white relative z-10 flex flex-col items-center justify-center py-2">
                      <div className="w-8 h-8 border-4 border-gray-700 border-t-brand-pink rounded-full animate-spin mb-3"></div>
                      <p className="font-medium text-sm">Uploading securely...</p>
                    </div>
                  ) : (
                    <div className="relative z-10">
                      <div className="w-12 h-12 bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-3 group-hover:scale-110 transition-transform duration-300">
                        <span className="text-xl">⬆️</span>
                      </div>
                      <p className="text-white font-medium mb-1">Click to upload or drag & drop</p>
                      <p className="text-gray-500 text-xs">PNG, JPG, HEIC up to 5MB</p>
                    </div>
                  )}
                </div>

                {/* Images Grid */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-2">
                  {images.map((image) => {
                    const isLoaded = loadedImages.has(image.id);
                    return (
                      <div key={image.id} className="relative group aspect-square bg-black/40 rounded-xl overflow-hidden border border-gray-800 shadow-sm">
                        {!isLoaded && (
                          <div className="absolute inset-0 z-10 flex items-center justify-center bg-[#151515] animate-pulse">
                            <div className="w-5 h-5 border-2 border-brand-pink border-t-transparent rounded-full animate-spin"></div>
                          </div>
                        )}

                        <img
                          src={image.imageUrl || image.url}
                          alt="Persona Reference"
                          loading="lazy"
                          onLoad={() => setLoadedImages(prev => new Set(prev).add(image.id))}
                          onError={(e) => {
                            console.error('Image load error:', image.id);
                            setLoadedImages(prev => new Set(prev).add(image.id));
                            e.target.src = 'https://via.placeholder.com/400?text=Error';
                          }}
                          className={`w-full h-full object-cover transition-opacity duration-500 ${
                            isLoaded ? 'opacity-100' : 'opacity-0'
                          }`}
                        />
                        
                        {/* Hover Overlay */}
                        <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                          <button
                            onClick={(e) => { e.stopPropagation(); handleDeleteImage(image.id); }}
                            className="bg-red-500/90 text-white p-2.5 rounded-full hover:bg-red-500 transition-all shadow-lg transform translate-y-2 group-hover:translate-y-0"
                            title="Delete Image"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        </div>
                      </div>
                    );
                  })}
                  
                  {/* Empty Slots */}
                  {[...Array(Math.max(0, 4 - images.length))].map((_, i) => (
                    <div key={`empty-${i}`} className="aspect-square border border-dashed border-gray-700 rounded-xl flex items-center justify-center bg-black/10 opacity-50">
                      <span className="text-2xl text-gray-700 font-light">+</span>
                    </div>
                  ))}
                </div>

              </div>
            </div>

            {/* Contextual Tip */}
            <div className="mt-4 bg-blue-500/5 border border-blue-500/10 rounded-xl p-4 flex gap-3">
              <span className="text-blue-400">💡</span>
              <p className="text-xs text-blue-300/80 leading-relaxed">
                <strong className="text-blue-400">Pro Tip:</strong> For the best AI face consistency, ensure your reference photos have clear, well-lit, and unobstructed views of your face from different angles.
              </p>
            </div>
          </div>

        </div>
      </div>
    </Layout>
  );
}