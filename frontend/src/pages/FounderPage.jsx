import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../components/Layout';
import founderPageAPI from '../services/founderPageAPI';
import { uploadAPI } from '../services/api';
import ColorPicker from '../components/ColorPicker';

// --- HELPER COMPONENTS ---

const TextInput = ({ label, value, onChange, placeholder, type = "text", note, prefix, className = "" }) => (
  <div className={className}>
    <label className="block text-sm font-medium text-white mb-2">{label}</label>
    <div className={prefix ? "flex items-center gap-2" : ""}>
      {prefix && <span className="text-gray-400 text-sm">{prefix}</span>}
      <input type={type} value={value} onChange={onChange} placeholder={placeholder} className="flex-1 w-full px-4 py-3 bg-black/40 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:border-brand-pink focus:ring-1 focus:ring-brand-pink outline-none transition" />
    </div>
    {note && <p className="text-xs text-gray-500 mt-2">{note}</p>}
  </div>
);

const TextArea = ({ label, value, onChange, placeholder, rows = 3, className = "" }) => (
  <div className={className}>
    <label className="block text-sm font-medium text-white mb-2">{label}</label>
    <textarea value={value} onChange={onChange} rows={rows} placeholder={placeholder} className="w-full px-4 py-3 bg-black/40 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:border-brand-pink focus:ring-1 focus:ring-brand-pink outline-none transition resize-none" />
  </div>
);

const ImageUpload = ({ label, id, onUpload, imageUrl, uploading, isSquare = false }) => (
  <div>
    {label && <label className="block text-sm font-medium text-white mb-2">{label}</label>}
    <input type="file" accept="image/*" onChange={(e) => e.target.files[0] && onUpload(e.target.files[0])} className="hidden" id={id} disabled={uploading} />
    <label htmlFor={id} className={`block border-2 border-dashed border-gray-700 rounded-lg p-8 text-center hover:border-brand-pink transition cursor-pointer ${uploading ? 'opacity-50' : ''} ${isSquare ? 'aspect-square flex items-center justify-center' : ''}`}>
      {imageUrl ? (
        <img src={imageUrl} alt="Upload preview" className={`${isSquare ? 'w-full h-full object-cover' : 'max-h-32 mx-auto'} rounded`} />
      ) : (
        <div>
          <span className="text-brand-pink text-2xl">📤</span>
          <p className="text-white text-sm mt-2">Click To <span className="text-brand-pink">Upload</span> Or Drag And Drop</p>
        </div>
      )}
    </label>
  </div>
);

const SelectInput = ({ label, value, onChange, options }) => (
  <div>
    <label className="block text-sm font-medium text-white mb-2">{label}</label>
    <select value={value} onChange={onChange} className="w-full px-4 py-3 bg-black/40 border border-gray-700 rounded-lg text-white focus:border-brand-pink focus:ring-1 focus:ring-brand-pink outline-none transition">
      {options.map(opt => <option key={opt} value={opt}>{opt}</option>)}
    </select>
  </div>
);

// --- MAIN COMPONENT ---

export default function FounderPage() {
  const navigate = useNavigate();
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
        <div className="p-8 max-w-6xl mx-auto">
          <button onClick={() => navigate('/dashboard')} className="text-gray-400 hover:text-white mb-4 flex items-center gap-2">← Back</button>
          <h1 className="text-3xl font-semibold text-white mb-2">Founder Page</h1>
          <p className="text-gray-400 mb-8">Choose a template to get started.</p>

          <div className="grid md:grid-cols-2 gap-6">
            {/* Active templates */}
            {activeTemplates.map(t => (
              <button
                key={t.id}
                onClick={() => { setFormData({ ...formData, template: t.id }); setShowTemplateSelector(false); }}
                className="bg-dark-card rounded-xl p-6 border-2 border-gray-800 hover:border-white transition text-left group"
              >
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-12 h-12 rounded-lg bg-gray-800 flex items-center justify-center text-2xl">{t.icon}</div>
                  <div>
                    <h3 className="text-lg font-semibold text-white">{t.title}</h3>
                    <p className={`text-sm font-medium ${t.subtitleColor}`}>{t.subtitle}</p>
                  </div>
                </div>
                <p className="text-gray-400 text-sm leading-relaxed">{t.description}</p>
                {t.preview}
              </button>
            ))}

            {/* Coming soon templates */}
            {comingSoonTemplates.map(t => (
              <div
                key={t.id}
                className="bg-dark-card rounded-xl p-6 border-2 border-gray-800 text-left opacity-60 cursor-not-allowed relative"
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-lg bg-gray-800 flex items-center justify-center text-2xl">{t.icon}</div>
                    <div>
                      <h3 className="text-lg font-semibold text-white">{t.title}</h3>
                      <p className={`text-sm font-medium ${t.subtitleColor}`}>{t.subtitle}</p>
                    </div>
                  </div>
                  <span className="text-xs font-semibold bg-gray-700 text-gray-300 px-3 py-1 rounded-full">Coming Soon</span>
                </div>
                <p className="text-gray-500 text-sm leading-relaxed">{t.description}</p>
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
      <div className="p-8 max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <div>
            <button onClick={() => navigate('/dashboard')} className="text-gray-400 hover:text-white mb-4 flex items-center gap-2">← Back</button>
            <h1 className="text-3xl font-semibold text-white mb-2">Founder Page Builder</h1>
          </div>
          <div className="flex gap-4">
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
  className="px-6 py-3 bg-white/10 hover:bg-white/20 text-white rounded-lg font-semibold transition flex items-center gap-2 disabled:opacity-50"
>
  {saving ? '💾 Saving...' : '👁️ Preview Page'}
</button>
            <button onClick={() => handleAction('publish', true)} disabled={saving} className="px-6 py-3 bg-white text-black rounded-lg font-semibold hover:bg-gray-200 transition disabled:opacity-50">🚀 Publish</button>
          </div>
        </div>

        <div className="mb-8 overflow-x-auto">
          <div className="bg-dark-card rounded-xl p-2 inline-flex gap-2">
            {tabs.map(tab => (
              <button key={tab} onClick={() => setActiveTab(tab)} className={`px-6 py-3 rounded-lg font-medium transition whitespace-nowrap ${activeTab === tab ? 'bg-white text-black' : 'text-gray-400 hover:text-white'}`}>
                {tabLabels[tab]}
              </button>
            ))}
          </div>
        </div>

        <div className="bg-dark-card rounded-xl p-8 border border-gray-800">
          
          {activeTab === 'design' && (
  <div className="space-y-6">
    <div className="flex justify-between items-center mb-6">
      <h2 className="text-2xl font-semibold text-white">Design Settings</h2>
      <div className="flex gap-3">
        <button
          onClick={() => setFormData(prev => ({ ...prev, design: { titleFont: 'Afacad', bodyFont: 'Poppins', primaryColor: '#623437', secondaryColor: '#f5a623' } }))}
          className="px-4 py-2 bg-white/5 hover:bg-white/10 text-gray-300 border border-gray-700 rounded-lg text-sm font-medium transition"
        >
          Reset to Default
        </button>
        <button
          onClick={() => setShowTemplateSelector(true)}
          className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg text-sm font-medium transition flex items-center gap-2"
        >
          🔄 Change Template
        </button>
      </div>
    </div>
    
    <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4 mb-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-blue-400 text-sm">
            Current Template: <strong className="capitalize">{formData.template === 'visionary' ? '🚀 The Visionary' : '🎨 The Storyteller'}</strong>
          </p>
          <p className="text-blue-300 text-xs mt-1">
            {formData.template === 'visionary' ? 'Bold & Inspiring (Light Theme)' : 'Warm & Personal (Dark Theme)'}
          </p>
        </div>
      </div>
    </div>
    
    <div className="grid md:grid-cols-2 gap-6">
      <SelectInput label="Title Font" value={formData.design.titleFont} onChange={e => updateNested('design', 'titleFont', e.target.value)} options={['Afacad', 'Poppins', 'Inter', 'Montserrat']} />
      <SelectInput label="Body Font" value={formData.design.bodyFont} onChange={e => updateNested('design', 'bodyFont', e.target.value)} options={['Poppins', 'Inter', 'Roboto']} />
      <ColorPicker label="Primary Color" value={formData.design.primaryColor} onChange={(color) => updateNested('design', 'primaryColor', color)} />
      <ColorPicker label="Secondary Color" value={formData.design.secondaryColor} onChange={(color) => updateNested('design', 'secondaryColor', color)} />
    </div>
  </div>
)}

          {activeTab === 'basicInfo' && (
            <div className="space-y-6">
              <h2 className="text-2xl font-semibold text-white mb-6">Basic Information</h2>
              <div className="grid md:grid-cols-2 gap-6">
                <ImageUpload label="Logo Upload (Square - 500x500px recommended)" id="logo-upload" onUpload={file => handleImageUpload(file, 'basicInfo.logoUrl')} imageUrl={formData.basicInfo.logoUrl} uploading={uploading} />
                <ImageUpload label="Hero Image (Landscape - 1920x1080px recommended)" id="hero-upload" onUpload={file => handleImageUpload(file, 'basicInfo.heroImageUrl')} imageUrl={formData.basicInfo.heroImageUrl} uploading={uploading} />
                <TextInput className="md:col-span-2" label="Username *" value={formData.username} prefix="personify-alpha.vercel.app/" onChange={e => setFormData({ ...formData, username: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '') })} />
                <TextInput label="Name" value={formData.basicInfo.name} onChange={e => updateNested('basicInfo', 'name', e.target.value)} />
                <TextInput label="Professional Title" value={formData.basicInfo.title} onChange={e => updateNested('basicInfo', 'title', e.target.value)} />
                <TextArea className="md:col-span-2" label="About - Paragraph 1" value={formData.basicInfo.about1} onChange={e => updateNested('basicInfo', 'about1', e.target.value)} rows={4} />
              </div>
            </div>
          )}

          {activeTab === 'contact' && (
            <div className="space-y-6">
              <h2 className="text-2xl font-semibold text-white mb-6">Contact Information</h2>
              <div className="grid md:grid-cols-2 gap-6">
                <TextInput type="email" label="Email Address" placeholder="hello@example.com" value={formData.contact.email} onChange={e => updateNested('contact', 'email', e.target.value)} />
                <TextInput type="tel" label="Phone Number" placeholder="+1 (555) 123-4567" value={formData.contact.phone} onChange={e => updateNested('contact', 'phone', e.target.value)} />
                <TextInput className="md:col-span-2" label="Location" placeholder="New York, NY" value={formData.contact.location} onChange={e => updateNested('contact', 'location', e.target.value)} />
                <TextInput label="Social Handle 01" placeholder="@yourhandle" value={formData.contact.social1} onChange={e => updateNested('contact', 'social1', e.target.value)} />
                <TextInput label="Social Handle 02" placeholder="@yourhandle" value={formData.contact.social2} onChange={e => updateNested('contact', 'social2', e.target.value)} />
                <TextInput className="md:col-span-2" label="Call-To-Action Text" placeholder="Let's Work Together" value={formData.contact.ctaText} onChange={e => updateNested('contact', 'ctaText', e.target.value)} />
                <TextArea className="md:col-span-2" label="CTA Description" placeholder="Available for bookings..." value={formData.contact.ctaDescription} onChange={e => updateNested('contact', 'ctaDescription', e.target.value)} />
              </div>
            </div>
          )}

          {activeTab === 'services' && (
            <div className="space-y-6">
              <div className="flex justify-between items-center mb-6">
                <div><h2 className="text-2xl font-semibold text-white">Services</h2><p className="text-gray-400 text-sm mt-1">Minimum 2 services required</p></div>
                <button onClick={() => addArrayItem('services', { title: '', description: '' })} className="px-6 py-3 bg-white text-black rounded-lg font-semibold hover:bg-gray-200 transition">Add Service</button>
              </div>
              {formData.services.map((service, index) => (
                <div key={service.id} className="bg-black/20 rounded-xl p-6 border border-gray-700 space-y-4">
                  <div className="flex justify-between items-start">
                    <h3 className="text-white font-semibold">Service {index + 1}</h3>
                    {formData.services.length > 2 && (
                      <button onClick={() => deleteArrayItem('services', service.id, 2)} className="text-red-400 hover:text-red-300">🗑️</button>
                    )}
                  </div>
                  <TextInput label="Service Title" placeholder="Consulting" value={service.title} onChange={e => updateArray('services', service.id, 'title', e.target.value)} />
                  <TextArea label="Service Description" placeholder="Describe this service..." value={service.description} onChange={e => updateArray('services', service.id, 'description', e.target.value)} />
                </div>
              ))}
            </div>
          )}

          {activeTab === 'portfolio' && (
            <div className="space-y-6">
              <h2 className="text-2xl font-semibold text-white mb-6">Portfolio Images</h2>
              <p className="text-sm text-gray-400 mb-4">📐 Square images (1:1 ratio) work best - recommended 1000x1000px</p>
              <div className="grid md:grid-cols-2 gap-6">
                {[...Array(6)].map((_, index) => (
                  <ImageUpload key={index} label={`Image ${index + 1}`} id={`portfolio-${index}`} onUpload={file => handlePortfolioUpload(file, index)} imageUrl={formData.portfolio.images?.[index]?.url} uploading={uploading} isSquare />
                ))}
              </div>
            </div>
          )}

          {activeTab === 'featured' && (
            <div className="space-y-6">
              <div className="flex justify-between items-center mb-6">
                <div><h2 className="text-2xl font-semibold text-white">Featured Work</h2><p className="text-gray-400 text-sm mt-1">Showcase your best projects</p></div>
                <button onClick={() => addArrayItem('featured', { title: '', subtitle: '', year: '', imageUrl: '' })} className="px-6 py-3 bg-white text-black rounded-lg font-semibold hover:bg-gray-200 transition">Add Project</button>
              </div>
              {formData.featured.length === 0 ? (
                <div className="text-center py-12 text-gray-500">No featured work yet. Click "Add Project" to get started.</div>
              ) : (
                formData.featured.map((work, index) => (
                  <div key={work.id} className="bg-black/20 rounded-xl p-6 border border-gray-700 space-y-4">
                    <div className="flex justify-between items-start">
                      <h3 className="text-white font-semibold">Featured Work {index + 1}</h3>
                      <button onClick={() => deleteArrayItem('featured', work.id)} className="text-red-400 hover:text-red-300">🗑️</button>
                    </div>
                    <TextInput label="Project Title" placeholder="Vogue Magazine" value={work.title} onChange={e => updateArray('featured', work.id, 'title', e.target.value)} />
                    <TextInput label="Subtitle" placeholder="Editorial Feature" value={work.subtitle} onChange={e => updateArray('featured', work.id, 'subtitle', e.target.value)} />
                    <TextInput label="Year" placeholder="2024" value={work.year} onChange={e => updateArray('featured', work.id, 'year', e.target.value)} />
                    <ImageUpload label="Project Image (Landscape - 1200x800px recommended)" id={`featured-${work.id}`} onUpload={file => handleFeaturedImageUpload(file, work.id)} imageUrl={work.imageUrl} uploading={uploading} />
                  </div>
                ))
              )}
            </div>
          )}

          <div className="flex justify-between mt-8 pt-6 border-t border-gray-700">
            <button onClick={() => setActiveTab(tabs[tabs.indexOf(activeTab) - 1])} disabled={activeTab === tabs[0]} className="px-6 py-3 bg-white/10 hover:bg-white/20 text-white rounded-lg font-semibold transition disabled:opacity-50">← Previous</button>
            <button onClick={() => handleAction('save')} disabled={saving} className="px-6 py-3 bg-white/10 hover:bg-white/20 text-white rounded-lg font-semibold transition">{saving ? 'Saving...' : 'Save Draft'}</button>
            <button onClick={() => setActiveTab(tabs[tabs.indexOf(activeTab) + 1])} disabled={activeTab === tabs[tabs.length - 1]} className="px-6 py-3 bg-white text-black rounded-lg font-semibold hover:bg-gray-200 transition disabled:opacity-50">Next →</button>
          </div>
        </div>
      </div>
    </Layout>
  );
}