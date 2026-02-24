import { useState, useEffect, useRef } from 'react';
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
  const fileInputRef = useRef(null);

  useEffect(() => {
    loadPersona();
  }, []);

  const loadPersona = async () => {
    try {
      const response = await personaAPI.get();
      const personaData = response.data.persona;
      setPersona(personaData);
      setFormData({
        bio: personaData.bio || '',
        industry: personaData.industry || '',
        targetAudience: personaData.targetAudience || '',
        brandTone: personaData.brandTone || ''
      });
      setImages(personaData.personaImages || []);
    } catch (error) {
      setPersona(null);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setMessage({ type: '', text: '' });

    try {
      await personaAPI.create(formData);
      setMessage({ type: 'success', text: 'Persona saved successfully!' });
      await loadPersona();
      
      setTimeout(() => {
        setMessage({ type: '', text: '' });
      }, 3000);
    } catch (error) {
      setMessage({ 
        type: 'error', 
        text: error.response?.data?.error || 'Failed to save persona' 
      });
    } finally {
      setSaving(false);
    }
  };

  const handleFileSelect = async (e) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    await uploadImages(files);
  };

  const handleDrop = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    
    const files = e.dataTransfer.files;
    if (!files || files.length === 0) return;

    await uploadImages(files);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const uploadImages = async (files) => {
    setUploading(true);
    setMessage({ type: '', text: '' });

    try {
      // Upload each file
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        
        // Validate file type
        if (!file.type.startsWith('image/')) {
          setMessage({ type: 'error', text: 'Only image files are allowed' });
          continue;
        }

        // Validate file size (5MB max)
        if (file.size > 5 * 1024 * 1024) {
          setMessage({ type: 'error', text: 'Image must be less than 5MB' });
          continue;
        }

        const formData = new FormData();
        formData.append('image', file);

        await personaAPI.uploadImage(formData);
      }

      setMessage({ type: 'success', text: 'Images uploaded successfully!' });
      await loadPersona();
      
      setTimeout(() => {
        setMessage({ type: '', text: '' });
      }, 3000);
    } catch (error) {
      setMessage({ 
        type: 'error', 
        text: error.response?.data?.error || 'Failed to upload images' 
      });
    } finally {
      setUploading(false);
    }
  };

  const handleDeleteImage = async (imageId) => {
    if (!confirm('Delete this image?')) return;

    try {
      await personaAPI.deleteImage(imageId);
      setMessage({ type: 'success', text: 'Image deleted successfully!' });
      await loadPersona();
      
      setTimeout(() => {
        setMessage({ type: '', text: '' });
      }, 3000);
    } catch (error) {
      setMessage({ 
        type: 'error', 
        text: error.response?.data?.error || 'Failed to delete image' 
      });
    }
  };

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
      <div className="p-8 max-w-5xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-semibold text-white mb-2">Your Persona</h1>
          <p className="text-gray-400">
            Define your digital identity for personalized AI content generation
          </p>
        </div>

        {message.text && (
          <div className={`mb-6 p-4 rounded-xl ${
            message.type === 'success' 
              ? 'bg-green-500/20 text-green-400 border border-green-500/30' 
              : 'bg-red-500/20 text-red-400 border border-red-500/30'
          }`}>
            {message.text}
          </div>
        )}

        {/* Persona Images */}
        <div className="bg-dark-card rounded-xl p-6 mb-6 border border-gray-800">
          <h2 className="text-xl font-semibold text-white mb-4">Reference Images</h2>
          <p className="text-sm text-gray-400 mb-6">
            Upload images of yourself to help AI generate personalized content that looks like you
          </p>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            {images.map((image) => (
              <div key={image.id} className="relative group aspect-square">
                <img
                  src={`http://localhost:5000${image.imageUrl}`}
                  alt="Persona"
                  className="w-full h-full object-cover rounded-xl border border-gray-700"
                />
                <button
                  onClick={() => handleDeleteImage(image.id)}
                  className="absolute top-2 right-2 bg-red-500 text-white p-2 rounded-full opacity-0 group-hover:opacity-100 transition shadow-lg hover:bg-red-600"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              </div>
            ))}
            
            {/* Empty slots */}
            {[...Array(Math.max(0, 4 - images.length))].map((_, i) => (
              <div
                key={`empty-${i}`}
                className="aspect-square border-2 border-dashed border-gray-700 rounded-xl flex items-center justify-center bg-black/20"
              >
                <span className="text-4xl text-gray-600">+</span>
              </div>
            ))}
          </div>

          {/* Upload Area */}
          <div
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            className="border-2 border-dashed border-gray-700 rounded-xl p-8 text-center hover:border-brand-pink transition cursor-pointer bg-black/20"
            onClick={() => fileInputRef.current?.click()}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              multiple
              onChange={handleFileSelect}
              className="hidden"
            />
            
            {uploading ? (
              <div className="text-white">
                <div className="animate-spin text-4xl mb-4">⏳</div>
                <p>Uploading images...</p>
              </div>
            ) : (
              <>
                <div className="text-5xl mb-4">📸</div>
                <p className="text-white font-semibold mb-2">
                  Click to upload or drag and drop
                </p>
                <p className="text-gray-400 text-sm">
                  PNG, JPG, GIF up to 5MB
                </p>
              </>
            )}
          </div>
        </div>

        {/* Persona Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="bg-dark-card rounded-xl p-6 border border-gray-800 space-y-6">
            <div>
              <label className="block text-sm font-medium text-white mb-2">
                Bio
              </label>
              <textarea
                name="bio"
                value={formData.bio}
                onChange={handleChange}
                rows={4}
                className="w-full px-4 py-3 bg-black/40 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:border-brand-pink focus:ring-1 focus:ring-brand-pink outline-none transition resize-none"
                placeholder="Tell us about yourself, your content style, and what makes you unique..."
              />
              <p className="text-xs text-gray-500 mt-2">
                This helps AI understand your personality and content style
              </p>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-white mb-2">
                  Industry / Niche
                </label>
                <input
                  type="text"
                  name="industry"
                  value={formData.industry}
                  onChange={handleChange}
                  className="w-full px-4 py-3 bg-black/40 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:border-brand-pink focus:ring-1 focus:ring-brand-pink outline-none transition"
                  placeholder="e.g., Technology, Fashion, Food, Fitness"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-white mb-2">
                  Brand Tone
                </label>
                <input
                  type="text"
                  name="brandTone"
                  value={formData.brandTone}
                  onChange={handleChange}
                  className="w-full px-4 py-3 bg-black/40 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:border-brand-pink focus:ring-1 focus:ring-brand-pink outline-none transition"
                  placeholder="e.g., Professional, Casual, Playful, Inspiring"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-white mb-2">
                Target Audience
              </label>
              <input
                type="text"
                name="targetAudience"
                value={formData.targetAudience}
                onChange={handleChange}
                className="w-full px-4 py-3 bg-black/40 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:border-brand-pink focus:ring-1 focus:ring-brand-pink outline-none transition"
                placeholder="e.g., Young professionals aged 25-35 interested in tech and innovation"
              />
              <p className="text-xs text-gray-500 mt-2">
                Describe who you're creating content for
              </p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-4">
            <button
              type="submit"
              disabled={saving}
              className="flex-1 bg-white text-black py-4 rounded-xl font-semibold hover:bg-gray-200 transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {saving ? 'Saving...' : persona ? 'Update Persona' : 'Create Persona'}
            </button>
            
            {persona && (
              <button
                type="button"
                onClick={() => {
                  if (confirm('Are you sure you want to reset to default values?')) {
                    setFormData({
                      bio: persona.bio || '',
                      industry: persona.industry || '',
                      targetAudience: persona.targetAudience || '',
                      brandTone: persona.brandTone || ''
                    });
                  }
                }}
                className="px-8 py-4 bg-white/10 hover:bg-white/20 text-white rounded-xl font-semibold transition"
              >
                Reset
              </button>
            )}
          </div>
        </form>

        {/* Tips Section */}
        <div className="mt-8 bg-blue-500/10 border border-blue-500/20 rounded-xl p-6">
          <h3 className="font-semibold text-blue-400 mb-3 flex items-center gap-2">
            <span className="text-xl">💡</span>
            Tips for a great persona:
          </h3>
          <ul className="space-y-2 text-sm text-blue-300">
            <li>• Upload 3-5 clear photos of yourself in different settings</li>
            <li>• Be specific about your content niche and audience</li>
            <li>• Describe your unique voice and style in your bio</li>
            <li>• Your persona helps AI generate content that truly represents you</li>
            <li>• You can update your persona anytime as your brand evolves</li>
          </ul>
        </div>
      </div>
    </Layout>
  );
}