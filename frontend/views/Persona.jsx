'use client'

import { useState, useEffect, useRef, useCallback } from 'react';
import Layout from '../components/Layout';
import { personaAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';

export default function Persona() {
  const { user } = useAuth();
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
  const [showEditModal, setShowEditModal] = useState(false);

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

  const getInitials = (name) => {
    if (!name) return 'U';
    return name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
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

  const hasDetails = persona && (persona.bio || persona.industry || persona.brandTone || persona.targetAudience || images.length > 0);
  const avatarUrl = user?.profilePictureUrl || images[0]?.imageUrl || images[0]?.url || null;

  return (
    <Layout>
      <div className="p-4 md:p-6 lg:p-10 max-w-[1400px] mx-auto min-h-screen">

        {/* Floating Notification */}
        {message.text && (
          <div className={`fixed top-6 right-6 z-[60] px-4 py-3 rounded-lg border text-sm font-medium shadow-lg ${
            message.type === 'success'
              ? 'bg-green-500/10 text-green-400 border-green-500/20'
              : 'bg-red-500/10 text-red-400 border-red-500/20'
          }`}>
            {message.type === 'success' ? '✅ ' : '⚠️ '} {message.text}
          </div>
        )}

        {/* Header */}
        <div className="mb-8 text-center">
          <h1 className="text-2xl md:text-3xl font-bold text-white mb-1 md:mb-2">Brand Persona</h1>
          <p className="text-gray-400 text-sm">Your digital identity — used to personalize every AI generation.</p>
        </div>

        {!hasDetails ? (
          /* ── EMPTY STATE ── */
          <div className="max-w-md mx-auto mt-6 bg-[#111] border border-gray-800 rounded-3xl p-8 text-center">
            <div className="w-16 h-16 rounded-2xl bg-brand-pink/10 flex items-center justify-center mx-auto mb-4 text-3xl">🧬</div>
            <h2 className="text-white font-semibold text-lg mb-2">Create your persona</h2>
            <p className="text-gray-400 text-sm mb-6">Add your bio, industry, brand tone and reference photos so the AI can generate content that looks and sounds like you.</p>
            <button onClick={() => setShowEditModal(true)} className="w-full bg-white text-black py-3 rounded-xl font-bold hover:bg-gray-200 transition active:scale-[0.98]">Create Persona</button>
          </div>
        ) : (
          /* ── IDENTITY CARD ── */
          <div className="max-w-xl mx-auto">
            <div className="relative bg-gradient-to-b from-[#161616] to-[#0e0e0e] border border-gray-800 rounded-3xl overflow-hidden shadow-2xl">
              {/* Accent glow */}
              <div className="absolute -top-24 left-1/2 -translate-x-1/2 w-72 h-72 bg-brand-pink/10 rounded-full blur-3xl pointer-events-none" />

              <div className="relative p-8 flex flex-col items-center text-center">
                {/* Avatar */}
                <div className="w-28 h-28 rounded-full p-[3px] bg-gradient-to-br from-brand-pink to-purple-600 mb-4">
                  {avatarUrl ? (
                    <img src={avatarUrl} alt="Persona" className="w-full h-full rounded-full object-cover border-2 border-[#111]" />
                  ) : (
                    <div className="w-full h-full rounded-full bg-[#1a1a1a] flex items-center justify-center text-2xl font-bold text-white">{getInitials(user?.name || user?.email)}</div>
                  )}
                </div>

                {/* Name */}
                <h2 className="text-2xl font-bold text-white">{user?.name || 'Your Persona'}</h2>

                {/* Attribute pills */}
                <div className="flex flex-wrap justify-center gap-2 mt-3">
                  {persona.industry && <span className="px-3 py-1 rounded-full text-xs font-semibold bg-brand-pink/15 text-brand-pink border border-brand-pink/20">🏢 {persona.industry}</span>}
                  {persona.brandTone && <span className="px-3 py-1 rounded-full text-xs font-semibold bg-white/5 text-gray-200 border border-gray-700">🎨 {persona.brandTone}</span>}
                </div>

                {/* Bio */}
                {persona.bio && (
                  <p className="text-gray-300 text-sm leading-relaxed mt-5 max-w-md">{persona.bio}</p>
                )}

                {/* Target audience */}
                {persona.targetAudience && (
                  <div className="mt-6 w-full max-w-md bg-black/30 border border-gray-800 rounded-2xl p-4">
                    <p className="text-[11px] font-bold tracking-wider uppercase text-gray-500 mb-1">🎯 Target Audience</p>
                    <p className="text-sm text-gray-200">{persona.targetAudience}</p>
                  </div>
                )}

                {/* Reference photos */}
                <div className="mt-6 w-full max-w-md">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-[11px] font-bold tracking-wider uppercase text-gray-500">📸 Reference Photos</p>
                    <span className="text-[11px] text-gray-600">{images.length}/4</span>
                  </div>
                  {images.length > 0 ? (
                    <div className="flex gap-2 justify-center">
                      {images.map((image) => (
                        <div key={image.id} className="w-16 h-16 rounded-xl overflow-hidden border border-gray-800 flex-shrink-0">
                          <img src={image.imageUrl || image.url} alt="Reference" className="w-full h-full object-cover" />
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-gray-600">No photos yet — add some for face-consistent AI images.</p>
                  )}
                </div>

                {/* Edit button */}
                <button onClick={() => setShowEditModal(true)} className="mt-8 w-full max-w-md bg-white text-black py-3 rounded-xl font-bold hover:bg-gray-200 transition active:scale-[0.98] shadow-lg flex items-center justify-center gap-2">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                  Edit Persona
                </button>
              </div>
            </div>

            {/* Pro tip */}
            <div className="mt-4 bg-blue-500/5 border border-blue-500/10 rounded-xl p-4 flex gap-3">
              <span className="text-blue-400">💡</span>
              <p className="text-xs text-blue-300/80 leading-relaxed"><strong className="text-blue-400">Pro Tip:</strong> Specificity is key. Your Brand Tone shapes both the writing style and the lighting/mood of your generated images.</p>
            </div>
          </div>
        )}
      </div>

      {/* ── EDIT MODAL ── */}
      {showEditModal && (
        <div className="fixed inset-0 z-50 flex items-start md:items-center justify-center p-4 overflow-y-auto">
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={() => setShowEditModal(false)} />
          <div className="relative w-full max-w-2xl my-8 bg-[#111] border border-gray-800 rounded-2xl shadow-2xl">
            {/* Modal header */}
            <div className="sticky top-0 z-10 flex items-center justify-between px-6 py-4 border-b border-gray-800 bg-[#111] rounded-t-2xl">
              <h2 className="text-white font-semibold text-lg">Edit Persona</h2>
              <button onClick={() => setShowEditModal(false)} className="text-gray-400 hover:text-white transition p-1" title="Close">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>

            <div className="p-6 space-y-8 max-h-[75vh] overflow-y-auto">
              {/* Written Identity */}
              <form onSubmit={handleSubmit} className="space-y-5">
                <div>
                  <h3 className="text-white font-semibold flex items-center gap-2 mb-4"><span className="text-brand-pink">✍️</span> Written Identity</h3>
                  <label className="block text-sm font-bold text-white mb-1">Professional Bio</label>
                  <textarea name="bio" value={formData.bio} onChange={handleChange} rows={4} className="w-full px-4 py-3 bg-black border border-gray-700 rounded-xl text-white focus:border-brand-pink outline-none transition resize-none text-sm placeholder-gray-600" placeholder="e.g., I am a digital marketer with 5 years of experience helping SaaS companies scale..." />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-bold text-white mb-1">Industry / Niche</label>
                    <input type="text" name="industry" value={formData.industry} onChange={handleChange} className="w-full px-4 py-3 bg-black border border-gray-700 rounded-xl text-white text-sm focus:border-brand-pink outline-none transition placeholder-gray-600" placeholder="e.g., Real Estate" />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-white mb-1">Brand Tone</label>
                    <input type="text" name="brandTone" value={formData.brandTone} onChange={handleChange} className="w-full px-4 py-3 bg-black border border-gray-700 rounded-xl text-white text-sm focus:border-brand-pink outline-none transition placeholder-gray-600" placeholder="e.g., Professional, witty" />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-bold text-white mb-1">Target Audience</label>
                  <input type="text" name="targetAudience" value={formData.targetAudience} onChange={handleChange} className="w-full px-4 py-3 bg-black border border-gray-700 rounded-xl text-white text-sm focus:border-brand-pink outline-none transition placeholder-gray-600" placeholder="e.g., First-time home buyers in Austin, Texas" />
                </div>
                <button type="submit" disabled={saving} className="w-full bg-white text-black py-3 rounded-xl font-bold hover:bg-gray-200 transition disabled:opacity-50 active:scale-[0.98]">
                  {saving ? 'Saving...' : 'Save Changes'}
                </button>
              </form>

              {/* Visual Identity */}
              <div className="border-t border-gray-800 pt-6">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-white font-semibold flex items-center gap-2"><span className="text-brand-pink">📸</span> Reference Photos</h3>
                  <span className="text-xs text-gray-500">{images.length}/4</span>
                </div>
                <p className="text-xs text-gray-500 mb-4">Photos save automatically. Add up to 4 clear, well-lit shots of your face from different angles.</p>

                <input ref={fileInputRef} type="file" accept="image/*" multiple onChange={(e) => uploadImages(e.target.files)} className="hidden" />

                <div className="grid grid-cols-4 gap-3">
                  {images.map((image) => {
                    const isLoaded = loadedImages.has(image.id);
                    return (
                      <div key={image.id} className="relative group aspect-square bg-black/40 rounded-xl overflow-hidden border border-gray-800">
                        {!isLoaded && (
                          <div className="absolute inset-0 z-10 flex items-center justify-center bg-[#151515]">
                            <div className="w-5 h-5 border-2 border-brand-pink border-t-transparent rounded-full animate-spin"></div>
                          </div>
                        )}
                        <img src={image.imageUrl || image.url} alt="Persona Reference" loading="lazy"
                          onLoad={() => setLoadedImages(prev => new Set(prev).add(image.id))}
                          onError={(e) => { setLoadedImages(prev => new Set(prev).add(image.id)); e.target.src = 'https://via.placeholder.com/400?text=Error'; }}
                          className={`w-full h-full object-cover transition-opacity duration-500 ${isLoaded ? 'opacity-100' : 'opacity-0'}`} />
                        <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                          <button onClick={() => handleDeleteImage(image.id)} className="bg-red-500/90 text-white p-2 rounded-full hover:bg-red-500 transition shadow-lg" title="Delete Image">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                          </button>
                        </div>
                      </div>
                    );
                  })}
                  {images.length < 4 && (
                    <button onClick={() => fileInputRef.current?.click()} disabled={uploading} className="aspect-square border-2 border-dashed border-gray-700 rounded-xl flex flex-col items-center justify-center gap-1 text-gray-500 hover:border-brand-pink hover:text-brand-pink transition">
                      {uploading ? (
                        <div className="w-5 h-5 border-2 border-brand-pink border-t-transparent rounded-full animate-spin" />
                      ) : (
                        <>
                          <span className="text-2xl leading-none">+</span>
                          <span className="text-[10px]">Add</span>
                        </>
                      )}
                    </button>
                  )}
                </div>
              </div>

              {/* Done button */}
              <button onClick={() => setShowEditModal(false)} className="w-full py-3 text-gray-400 hover:text-white transition text-sm font-medium">
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
}
