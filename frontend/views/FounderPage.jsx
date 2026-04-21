'use client'

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Layout from '../components/Layout';
import founderPageAPI from '../services/founderPageAPI';
import { uploadAPI } from '../services/api';
import ColorPicker from '../components/ColorPicker';

// --- HELPER COMPONENTS ---

const TextInput = ({ label, value, onChange, placeholder, type = "text", note, prefix, className = "" }) => (
  <div className={className}>
    <label className="block text-xs md:text-sm font-medium text-white mb-1.5 md:mb-2">{label}</label>
    <div className={prefix ? "flex items-center gap-2" : ""}>
      {prefix && <span className="text-gray-400 text-xs md:text-sm truncate max-w-[120px] md:max-w-none">{prefix}</span>}
      <input type={type} value={value} onChange={onChange} placeholder={placeholder} className="flex-1 w-full px-3 md:px-4 py-2.5 md:py-3 bg-black/40 border border-gray-700 rounded-lg text-sm text-white placeholder-gray-500 focus:border-brand-pink focus:ring-1 focus:ring-brand-pink outline-none transition" />
    </div>
    {note && <p className="text-xs text-gray-500 mt-1.5 md:mt-2">{note}</p>}
  </div>
);

const TextArea = ({ label, value, onChange, placeholder, rows = 3, className = "" }) => (
  <div className={className}>
    <label className="block text-xs md:text-sm font-medium text-white mb-1.5 md:mb-2">{label}</label>
    <textarea value={value} onChange={onChange} rows={rows} placeholder={placeholder} className="w-full px-3 md:px-4 py-2.5 md:py-3 bg-black/40 border border-gray-700 rounded-lg text-sm text-white placeholder-gray-500 focus:border-brand-pink focus:ring-1 focus:ring-brand-pink outline-none transition resize-none" />
  </div>
);

const ImageUpload = ({ label, id, onUpload, imageUrl, uploading, isSquare = false }) => (
  <div>
    {label && <label className="block text-xs md:text-sm font-medium text-white mb-1.5 md:mb-2">{label}</label>}
    <input type="file" accept="image/*" onChange={(e) => e.target.files[0] && onUpload(e.target.files[0])} className="hidden" id={id} disabled={uploading} />
    <label htmlFor={id} className={`block border-2 border-dashed border-gray-700 rounded-lg p-4 md:p-8 text-center hover:border-brand-pink transition cursor-pointer ${uploading ? 'opacity-50' : ''} ${isSquare ? 'aspect-square flex items-center justify-center' : ''}`}>
      {imageUrl ? (
        <img src={imageUrl} alt="Upload preview" className={`${isSquare ? 'w-full h-full object-cover' : 'max-h-24 md:max-h-32 mx-auto'} rounded`} />
      ) : (
        <div>
          <span className="text-brand-pink text-xl md:text-2xl">📤</span>
          <p className="text-white text-xs md:text-sm mt-1 md:mt-2">Tap to <span className="text-brand-pink">Upload</span></p>
        </div>
      )}
    </label>
  </div>
);

const SelectInput = ({ label, value, onChange, options }) => (
  <div>
    <label className="block text-xs md:text-sm font-medium text-white mb-1.5 md:mb-2">{label}</label>
    <select value={value} onChange={onChange} className="w-full px-3 md:px-4 py-2.5 md:py-3 bg-black/40 border border-gray-700 rounded-lg text-sm text-white focus:border-brand-pink focus:ring-1 focus:ring-brand-pink outline-none transition">
      {options.map(opt => <option key={opt} value={opt}>{opt}</option>)}
    </select>
  </div>
);

// --- MAIN COMPONENT ---

export default function FounderPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [activeTab, setActiveTab] = useState('design');
  const [showTemplateSelector, setShowTemplateSelector] = useState(false);

  const [formData, setFormData] = useState({
    username: '', template: '', published: false,
    design: { titleFont: 'Afacad', bodyFont: 'Poppins', primaryColor: '#623437', secondaryColor: '#f5a623' },
    basicInfo: { name: '', title: '', tagline: '', about1: '', about2: '', heroImageUrl: '', logoUrl: '' },
    contact: { email: '', phone: '', location: '', social1: '', social2: '', ctaText: "Let's Work Together", ctaDescription: '' },
    services: [{ id: '1', title: '', description: '' }, { id: '2', title: '', description: '' }],
    portfolio: { images: [] },
    featured: []
  });

  const tabs = ['design', 'basicInfo', 'contact', 'services', 'portfolio', 'featured'];
  const tabLabels = { design: 'Design', basicInfo: 'Basic Info', contact: 'Contact', services: 'Services', portfolio: 'Portfolio', featured: 'Featured' };
  const tabLabelsMobile = { design: 'Design', basicInfo: 'Info', contact: 'Contact', services: 'Services', portfolio: 'Gallery', featured: 'Featured' };

  useEffect(() => { loadFounderPage(); }, []);

  const loadFounderPage = async () => {
    try {
      setLoading(true);
      const { data } = await founderPageAPI.get();
      if (data.founderPage) {
        setFormData(prev => ({ ...prev, ...data.founderPage, services: data.founderPage.services?.length ? data.founderPage.services : prev.services }));
        setShowTemplateSelector(!data.founderPage.template);
      } else {
        setShowTemplateSelector(true);
      }
    } catch (error) {
      console.error('Failed to load:', error);
      setShowTemplateSelector(true);
    } finally { setLoading(false); }
  };

  const executeUpload = async (file, onSuccess) => {
    try {
      setUploading(true);
      const uploadData = new FormData();
      uploadData.append('image', file);
      const { data } = await uploadAPI.uploadImage(uploadData);
      onSuccess(data.image.imageUrl);
    } catch (error) {
      console.error('Upload failed:', error);
      alert('Failed to upload image.');
    } finally { setUploading(false); }
  };

  const handleImageUpload = (file, field) => executeUpload(file, (url) => {
    if (field.includes('.')) {
      const [parent, child] = field.split('.');
      setFormData(prev => ({ ...prev, [parent]: { ...prev[parent], [child]: url } }));
    } else {
      setFormData(prev => ({ ...prev, [field]: url }));
    }
  });

  const handlePortfolioUpload = (file, index) => executeUpload(file, (url) => {
    const newImages = [...(formData.portfolio.images || [])];
    newImages[index] = { id: Date.now().toString(), url };
    setFormData(prev => ({ ...prev, portfolio: { images: newImages } }));
  });

  const handleFeaturedImageUpload = (file, workId) => executeUpload(file, (url) => {
    setFormData(prev => ({ ...prev, featured: prev.featured.map(w => w.id === workId ? { ...w, imageUrl: url } : w) }));
  });

  const handleAction = async (action, isPublish = false) => {
    try {
      if (isPublish && !formData.username) {
        alert('Please enter a username');
        return setActiveTab('basicInfo');
      }
      setSaving(true);
      await founderPageAPI.upsert(formData);
      if (isPublish) {
        await founderPageAPI.publish(true);
        setFormData(prev => ({ ...prev, published: true }));
        alert('🎉 Your page is now live!');
        window.open(`/${formData.username}`, '_blank');
      } else {
        alert('Founder page saved successfully!');
      }
    } catch (error) {
      alert(error.response?.data?.error || `Failed to ${isPublish ? 'publish' : 'save'}.`);
    } finally { setSaving(false); }
  };

  const updateNested = (parent, field, value) => setFormData(prev => ({ ...prev, [parent]: { ...prev[parent], [field]: value } }));
  const updateArray = (arrName, id, field, value) => setFormData(prev => ({ ...prev, [arrName]: prev[arrName].map(item => item.id === id ? { ...item, [field]: value } : item) }));
  const deleteArrayItem = (arrName, id, min = 0) => {
    if (formData[arrName].length <= min) return alert(`You must have at least ${min} items`);
    setFormData(prev => ({ ...prev, [arrName]: formData[arrName].filter(item => item.id !== id) }));
  };
  const addArrayItem = (arrName, defaultObj) => setFormData(prev => ({ ...prev, [arrName]: [...prev[arrName], { id: Date.now().toString(), ...defaultObj }] }));

  if (loading) return <Layout><div className="p-8 flex items-center justify-center min-h-screen text-white">Loading...</div></Layout>;

  if (showTemplateSelector) {
    const activeTemplates = [
      {
        id: 'visionary',
        icon: '🚀',
        title: 'The Visionary',
        subtitle: 'Bold & Inspiring',
        subtitleColor: 'text-green-400',
        description: 'Large hero headline, minimal layout. Perfect for thought leaders & startup founders.',
        preview: (
          <div className="bg-black/40 rounded-lg p-4 mt-4 space-y-2">
            <div className="flex items-center gap-2"><div className="w-5 h-5 rounded-full bg-green-600" /><div className="h-2 w-28 bg-gray-600 rounded" /></div>
            <div className="h-2 w-full bg-gray-700 rounded" />
            <div className="h-2 w-4/5 bg-gray-700 rounded" />
            <div className="h-6 w-16 bg-green-700 rounded mt-2" />
          </div>
        )
      },
      {
        id: 'storyteller',
        icon: '✍️',
        title: 'The Storyteller',
        subtitle: 'Warm & Personal',
        subtitleColor: 'text-orange-400',
        description: 'Narrative-driven bio with a warm, human feel. Great for coaches & speakers.',
        preview: (
          <div className="bg-black/40 rounded-lg p-4 mt-4 space-y-2">
            <div className="flex items-center gap-2"><div className="w-5 h-5 rounded-full bg-orange-700" /><div className="h-2 w-32 bg-gray-600 rounded" /></div>
            <div className="h-2 w-full bg-gray-700 rounded" />
            <div className="h-2 w-3/4 bg-gray-700 rounded" />
            <div className="h-6 w-16 bg-orange-800 rounded mt-2" />
          </div>
        )
      }
    ];

    const comingSoonTemplates = [
      {
        id: 'expert',
        icon: '📊',
        title: 'The Expert',
        subtitle: 'Clean & Professional',
        subtitleColor: 'text-blue-400',
        description: 'Skills, achievements, and credentials front and center. For executives & consultants.',
        preview: (
          <div className="bg-black/40 rounded-lg p-4 mt-4 space-y-2">
            <div className="flex items-center gap-2"><div className="w-5 h-5 rounded-full bg-blue-800" /><div className="h-2 w-28 bg-gray-700 rounded" /></div>
            <div className="h-2 w-full bg-gray-800 rounded" />
            <div className="h-6 w-16 bg-gray-700 rounded mt-2" />
          </div>
        )
      },
      {
        id: 'creator',
        icon: '🎨',
        title: 'The Creator',
        subtitle: 'Vibrant & Media-First',
        subtitleColor: 'text-purple-400',
        description: 'Media-first layout for content creators, artists, and influencers.',
        preview: (
          <div className="bg-black/40 rounded-lg p-4 mt-4 space-y-2">
            <div className="flex items-center gap-2"><div className="w-5 h-5 rounded-full bg-purple-800" /><div className="h-2 w-28 bg-gray-700 rounded" /></div>
            <div className="h-2 w-full bg-gray-800 rounded" />
            <div className="h-6 w-16 bg-gray-700 rounded mt-2" />
          </div>
        )
      }
    ];

    return (
      <Layout>
        <div className="p-4 md:p-8 max-w-6xl mx-auto">
          <button onClick={() => router.push('/dashboard')} className="text-gray-400 hover:text-white mb-4 flex items-center gap-2 text-sm">← Back</button>
          <h1 className="text-2xl md:text-3xl font-semibold text-white mb-2">Founder Page</h1>
          <p className="text-gray-400 text-sm md:text-base mb-6 md:mb-8">Choose a template to get started.</p>

          <div className="grid md:grid-cols-2 gap-4 md:gap-6">
            {/* Active templates */}
            {activeTemplates.map(t => (
              <button
                key={t.id}
                onClick={() => { setFormData({ ...formData, template: t.id }); setShowTemplateSelector(false); }}
                className="bg-dark-card rounded-xl p-4 md:p-6 border-2 border-gray-800 hover:border-white transition text-left group"
              >
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-10 h-10 md:w-12 md:h-12 rounded-lg bg-gray-800 flex items-center justify-center text-xl md:text-2xl flex-shrink-0">{t.icon}</div>
                  <div>
                    <h3 className="text-base md:text-lg font-semibold text-white">{t.title}</h3>
                    <p className={`text-xs md:text-sm font-medium ${t.subtitleColor}`}>{t.subtitle}</p>
                  </div>
                </div>
                <p className="text-gray-400 text-xs md:text-sm leading-relaxed">{t.description}</p>
                {t.preview}
              </button>
            ))}

            {/* Coming soon templates */}
            {comingSoonTemplates.map(t => (
              <div
                key={t.id}
                className="bg-dark-card rounded-xl p-4 md:p-6 border-2 border-gray-800 text-left opacity-60 cursor-not-allowed relative"
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 md:w-12 md:h-12 rounded-lg bg-gray-800 flex items-center justify-center text-xl md:text-2xl flex-shrink-0">{t.icon}</div>
                    <div>
                      <h3 className="text-base md:text-lg font-semibold text-white">{t.title}</h3>
                      <p className={`text-xs md:text-sm font-medium ${t.subtitleColor}`}>{t.subtitle}</p>
                    </div>
                  </div>
                  <span className="text-xs font-semibold bg-gray-700 text-gray-300 px-2 md:px-3 py-1 rounded-full whitespace-nowrap">Soon</span>
                </div>
                <p className="text-gray-500 text-xs md:text-sm leading-relaxed">{t.description}</p>
                {t.preview}
              </div>
            ))}
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="p-4 md:p-8 max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-3 mb-6 md:mb-8">
          <div>
            <button onClick={() => router.push('/dashboard')} className="text-gray-400 hover:text-white mb-2 md:mb-4 flex items-center gap-2 text-sm">← Back</button>
            <h1 className="text-2xl md:text-3xl font-semibold text-white">Founder Page Builder</h1>
          </div>
          <div className="flex gap-2 md:gap-4">
            <button
              onClick={async () => {
                if (!formData.username) {
                alert('Please enter a username first to preview your page');
                setActiveTab('basicInfo');
                return;
              }
    
    // Auto-save before preview
    try {
      setSaving(true);
      await founderPageAPI.upsert(formData);
      // Small delay to ensure backend processes the save
      await new Promise(resolve => setTimeout(resolve, 500));
      window.open(`/${formData.username}?preview=true`, '_blank');
    } catch (error) {
      alert('Failed to save changes before preview. Please try again.');
      console.error('Preview save error:', error);
    } finally {
      setSaving(false);
    }
  }}
  disabled={saving}
  className="flex-1 md:flex-none px-3 md:px-6 py-2.5 md:py-3 bg-white/10 hover:bg-white/20 text-white rounded-lg text-sm font-semibold transition flex items-center justify-center gap-2 disabled:opacity-50"
>
  {saving ? '💾 Saving...' : '👁️ Preview'}
</button>
            <button onClick={() => handleAction('publish', true)} disabled={saving} className="flex-1 md:flex-none px-3 md:px-6 py-2.5 md:py-3 bg-white text-black rounded-lg text-sm font-semibold hover:bg-gray-200 transition disabled:opacity-50">🚀 Publish</button>
          </div>
        </div>

        <div className="mb-4 md:mb-8 overflow-x-auto -mx-4 px-4 md:mx-0 md:px-0">
          <div className="bg-dark-card rounded-xl p-1.5 inline-flex gap-1">
            {tabs.map(tab => (
              <button key={tab} onClick={() => setActiveTab(tab)} className={`px-2.5 md:px-6 py-1.5 md:py-3 rounded-lg text-xs md:text-sm font-medium transition whitespace-nowrap ${activeTab === tab ? 'bg-white text-black' : 'text-gray-400 hover:text-white'}`}>
                <span className="md:hidden">{tabLabelsMobile[tab]}</span>
                <span className="hidden md:inline">{tabLabels[tab]}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="bg-dark-card rounded-xl p-4 md:p-8 border border-gray-800 mb-4">
          
          {activeTab === 'design' && (
  <div className="space-y-4 md:space-y-6">
    <div className="flex flex-col gap-3 md:flex-row md:justify-between md:items-center mb-4 md:mb-6">
      <h2 className="text-lg md:text-2xl font-semibold text-white">Design Settings</h2>
      <div className="flex gap-2">
        <button
          onClick={() => setFormData(prev => ({ ...prev, design: { titleFont: 'Afacad', bodyFont: 'Poppins', primaryColor: '#623437', secondaryColor: '#f5a623' } }))}
          className="flex-1 md:flex-none px-3 md:px-4 py-2 bg-white/5 hover:bg-white/10 text-gray-300 border border-gray-700 rounded-lg text-xs md:text-sm font-medium transition"
        >
          Reset
        </button>
        <button
          onClick={() => setShowTemplateSelector(true)}
          className="flex-1 md:flex-none px-3 md:px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg text-xs md:text-sm font-medium transition flex items-center justify-center gap-1.5"
        >
          🔄 Change Template
        </button>
      </div>
    </div>

    <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-3 md:p-4 mb-4 md:mb-6">
      <p className="text-blue-400 text-xs md:text-sm">
        Template: <strong className="capitalize">{formData.template === 'visionary' ? '🚀 The Visionary' : '🎨 The Storyteller'}</strong>
      </p>
      <p className="text-blue-300 text-xs mt-0.5">
        {formData.template === 'visionary' ? 'Bold & Inspiring (Light Theme)' : 'Warm & Personal (Dark Theme)'}
      </p>
    </div>

    <div className="grid grid-cols-2 md:grid-cols-2 gap-4 md:gap-6">
      <SelectInput label="Title Font" value={formData.design.titleFont} onChange={e => updateNested('design', 'titleFont', e.target.value)} options={['Afacad', 'Poppins', 'Inter', 'Montserrat']} />
      <SelectInput label="Body Font" value={formData.design.bodyFont} onChange={e => updateNested('design', 'bodyFont', e.target.value)} options={['Poppins', 'Inter', 'Roboto']} />
      <ColorPicker label="Primary Color" value={formData.design.primaryColor} onChange={(color) => updateNested('design', 'primaryColor', color)} />
      <ColorPicker label="Secondary Color" value={formData.design.secondaryColor} onChange={(color) => updateNested('design', 'secondaryColor', color)} />
    </div>
  </div>
)}

          {activeTab === 'basicInfo' && (
            <div className="space-y-4 md:space-y-6">
              <h2 className="text-lg md:text-2xl font-semibold text-white mb-4 md:mb-6">Basic Information</h2>
              <div className="grid md:grid-cols-2 gap-4 md:gap-6">
                <ImageUpload label="Logo (Square · 500×500px)" id="logo-upload" onUpload={file => handleImageUpload(file, 'basicInfo.logoUrl')} imageUrl={formData.basicInfo.logoUrl} uploading={uploading} />
                <ImageUpload label="Hero Image (1920×1080px)" id="hero-upload" onUpload={file => handleImageUpload(file, 'basicInfo.heroImageUrl')} imageUrl={formData.basicInfo.heroImageUrl} uploading={uploading} />
                <TextInput className="md:col-span-2" label="Username *" value={formData.username} prefix="personify-alpha.vercel.app/" onChange={e => setFormData({ ...formData, username: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '') })} />
                <TextInput label="Name" value={formData.basicInfo.name} onChange={e => updateNested('basicInfo', 'name', e.target.value)} />
                <TextInput label="Professional Title" value={formData.basicInfo.title} onChange={e => updateNested('basicInfo', 'title', e.target.value)} />
                <TextArea className="md:col-span-2" label="About" value={formData.basicInfo.about1} onChange={e => updateNested('basicInfo', 'about1', e.target.value)} rows={4} />
              </div>
            </div>
          )}

          {activeTab === 'contact' && (
            <div className="space-y-4 md:space-y-6">
              <h2 className="text-lg md:text-2xl font-semibold text-white mb-4 md:mb-6">Contact Information</h2>
              <div className="grid md:grid-cols-2 gap-4 md:gap-6">
                <TextInput type="email" label="Email" placeholder="hello@example.com" value={formData.contact.email} onChange={e => updateNested('contact', 'email', e.target.value)} />
                <TextInput type="tel" label="Phone" placeholder="+1 (555) 123-4567" value={formData.contact.phone} onChange={e => updateNested('contact', 'phone', e.target.value)} />
                <TextInput className="md:col-span-2" label="Location" placeholder="New York, NY" value={formData.contact.location} onChange={e => updateNested('contact', 'location', e.target.value)} />
                <TextInput label="Social Handle 01" placeholder="@yourhandle" value={formData.contact.social1} onChange={e => updateNested('contact', 'social1', e.target.value)} />
                <TextInput label="Social Handle 02" placeholder="@yourhandle" value={formData.contact.social2} onChange={e => updateNested('contact', 'social2', e.target.value)} />
                <TextInput className="md:col-span-2" label="CTA Text" placeholder="Let's Work Together" value={formData.contact.ctaText} onChange={e => updateNested('contact', 'ctaText', e.target.value)} />
                <TextArea className="md:col-span-2" label="CTA Description" placeholder="Available for bookings..." value={formData.contact.ctaDescription} onChange={e => updateNested('contact', 'ctaDescription', e.target.value)} />
              </div>
            </div>
          )}

          {activeTab === 'services' && (
            <div className="space-y-4 md:space-y-6">
              <div className="flex justify-between items-center mb-4 md:mb-6">
                <div>
                  <h2 className="text-lg md:text-2xl font-semibold text-white">Services</h2>
                  <p className="text-gray-400 text-xs md:text-sm mt-0.5">Minimum 2 required</p>
                </div>
                <button onClick={() => addArrayItem('services', { title: '', description: '' })} className="px-4 md:px-6 py-2 md:py-3 bg-white text-black rounded-lg text-sm font-semibold hover:bg-gray-200 transition">+ Add</button>
              </div>
              {formData.services.map((service, index) => (
                <div key={service.id} className="bg-black/20 rounded-xl p-4 md:p-6 border border-gray-700 space-y-3 md:space-y-4">
                  <div className="flex justify-between items-start">
                    <h3 className="text-white text-sm md:text-base font-semibold">Service {index + 1}</h3>
                    {formData.services.length > 2 && (
                      <button onClick={() => deleteArrayItem('services', service.id, 2)} className="text-red-400 hover:text-red-300 text-sm">🗑️</button>
                    )}
                  </div>
                  <TextInput label="Title" placeholder="Consulting" value={service.title} onChange={e => updateArray('services', service.id, 'title', e.target.value)} />
                  <TextArea label="Description" placeholder="Describe this service..." value={service.description} onChange={e => updateArray('services', service.id, 'description', e.target.value)} />
                </div>
              ))}
            </div>
          )}

          {activeTab === 'portfolio' && (
            <div className="space-y-4 md:space-y-6">
              <div className="mb-4 md:mb-6">
                <h2 className="text-lg md:text-2xl font-semibold text-white">Gallery</h2>
                <p className="text-xs md:text-sm text-gray-400 mt-0.5">Square images (1:1) · 1000×1000px recommended</p>
              </div>
              <div className="grid grid-cols-3 md:grid-cols-2 gap-3 md:gap-6">
                {[...Array(6)].map((_, index) => (
                  <ImageUpload key={index} label={`${index + 1}`} id={`portfolio-${index}`} onUpload={file => handlePortfolioUpload(file, index)} imageUrl={formData.portfolio.images?.[index]?.url} uploading={uploading} isSquare />
                ))}
              </div>
            </div>
          )}

          {activeTab === 'featured' && (
            <div className="space-y-4 md:space-y-6">
              <div className="flex justify-between items-center mb-4 md:mb-6">
                <div>
                  <h2 className="text-lg md:text-2xl font-semibold text-white">Featured Work</h2>
                  <p className="text-gray-400 text-xs md:text-sm mt-0.5">Showcase your best projects</p>
                </div>
                <button onClick={() => addArrayItem('featured', { title: '', subtitle: '', year: '', imageUrl: '' })} className="px-4 md:px-6 py-2 md:py-3 bg-white text-black rounded-lg text-sm font-semibold hover:bg-gray-200 transition">+ Add</button>
              </div>
              {formData.featured.length === 0 ? (
                <div className="text-center py-10 md:py-12 text-gray-500 text-sm">No featured work yet. Tap "+ Add" to get started.</div>
              ) : (
                formData.featured.map((work, index) => (
                  <div key={work.id} className="bg-black/20 rounded-xl p-4 md:p-6 border border-gray-700 space-y-3 md:space-y-4">
                    <div className="flex justify-between items-start">
                      <h3 className="text-white text-sm md:text-base font-semibold">Project {index + 1}</h3>
                      <button onClick={() => deleteArrayItem('featured', work.id)} className="text-red-400 hover:text-red-300 text-sm">🗑️</button>
                    </div>
                    <div className="grid grid-cols-2 gap-3 md:gap-4 md:grid-cols-none md:space-y-4">
                      <TextInput label="Title" placeholder="Vogue Magazine" value={work.title} onChange={e => updateArray('featured', work.id, 'title', e.target.value)} />
                      <TextInput label="Subtitle" placeholder="Editorial Feature" value={work.subtitle} onChange={e => updateArray('featured', work.id, 'subtitle', e.target.value)} />
                    </div>
                    <TextInput label="Year" placeholder="2024" value={work.year} onChange={e => updateArray('featured', work.id, 'year', e.target.value)} />
                    <ImageUpload label="Project Image (1200×800px)" id={`featured-${work.id}`} onUpload={file => handleFeaturedImageUpload(file, work.id)} imageUrl={work.imageUrl} uploading={uploading} />
                  </div>
                ))
              )}
            </div>
          )}

          <div className="flex justify-between mt-6 md:mt-8 pt-4 md:pt-6 border-t border-gray-700">
            <button onClick={() => setActiveTab(tabs[tabs.indexOf(activeTab) - 1])} disabled={activeTab === tabs[0]} className="px-4 md:px-6 py-2.5 md:py-3 bg-white/10 hover:bg-white/20 text-white rounded-lg text-sm font-semibold transition disabled:opacity-50">← Prev</button>
            <button onClick={() => handleAction('save')} disabled={saving} className="px-4 md:px-6 py-2.5 md:py-3 bg-white/10 hover:bg-white/20 text-white rounded-lg text-sm font-semibold transition">{saving ? 'Saving...' : 'Save Draft'}</button>
            <button onClick={() => setActiveTab(tabs[tabs.indexOf(activeTab) + 1])} disabled={activeTab === tabs[tabs.length - 1]} className="px-4 md:px-6 py-2.5 md:py-3 bg-white text-black rounded-lg text-sm font-semibold hover:bg-gray-200 transition disabled:opacity-50">Next →</button>
          </div>
        </div>
      </div>
    </Layout>
  );
}