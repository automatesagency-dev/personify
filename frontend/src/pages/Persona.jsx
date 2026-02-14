import { useState, useEffect } from 'react';
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
      // Persona doesn't exist yet
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
    } catch (error) {
      setMessage({ 
        type: 'error', 
        text: error.response?.data?.error || 'Failed to save persona' 
      });
    } finally {
      setSaving(false);
    }
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setUploading(true);
    setMessage({ type: '', text: '' });

    try {
      const formData = new FormData();
      formData.append('image', file);

      await personaAPI.uploadImage(formData);
      setMessage({ type: 'success', text: 'Image uploaded successfully!' });
      await loadPersona();
    } catch (error) {
      setMessage({ 
        type: 'error', 
        text: error.response?.data?.error || 'Failed to upload image' 
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
        <div className="flex items-center justify-center h-64">
          <div className="text-xl text-gray-600">Loading...</div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="max-w-3xl">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Your Persona</h1>
          <p className="text-gray-600">
            Define your digital identity for personalized AI content generation
          </p>
        </div>

        {message.text && (
          <div className={`mb-6 p-4 rounded-lg ${
            message.type === 'success' 
              ? 'bg-green-50 text-green-700 border border-green-200' 
              : 'bg-red-50 text-red-700 border border-red-200'
          }`}>
            {message.text}
          </div>
        )}

        {/* Persona Images */}
        <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Persona Images</h2>
          
          <div className="grid grid-cols-3 gap-4 mb-4">
            {images.map((image) => (
              <div key={image.id} className="relative group">
                <img
                  src={`http://localhost:5000${image.imageUrl}`}
                  alt="Persona"
                  className="w-full h-32 object-cover rounded-lg"
                />
                <button
                  onClick={() => handleDeleteImage(image.id)}
                  className="absolute top-2 right-2 bg-red-500 text-white p-2 rounded-full opacity-0 group-hover:opacity-100 transition"
                >
                  🗑️
                </button>
              </div>
            ))}
          </div>

          <label className="block">
            <input
              type="file"
              accept="image/*"
              onChange={handleImageUpload}
              className="hidden"
              disabled={uploading}
            />
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center cursor-pointer hover:border-blue-500 transition">
              {uploading ? (
                <p className="text-gray-600">Uploading...</p>
              ) : (
                <>
                  <p className="text-gray-600 mb-1">Click to upload image</p>
                  <p className="text-sm text-gray-400">PNG, JPG, GIF up to 5MB</p>
                </>
              )}
            </div>
          </label>
        </div>

        {/* Persona Form */}
        <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-sm p-6 space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Bio
            </label>
            <textarea
              name="bio"
              value={formData.bio}
              onChange={handleChange}
              rows={3}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Tell us about yourself..."
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Industry / Niche
            </label>
            <input
              type="text"
              name="industry"
              value={formData.industry}
              onChange={handleChange}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="e.g., Technology, Fashion, Food"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Target Audience
            </label>
            <input
              type="text"
              name="targetAudience"
              value={formData.targetAudience}
              onChange={handleChange}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="e.g., Developers aged 18-35"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Brand Tone
            </label>
            <input
              type="text"
              name="brandTone"
              value={formData.brandTone}
              onChange={handleChange}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="e.g., Professional, Casual, Friendly"
            />
          </div>

          <button
            type="submit"
            disabled={saving}
            className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {saving ? 'Saving...' : persona ? 'Update Persona' : 'Create Persona'}
          </button>
        </form>
      </div>
    </Layout>
  );
}