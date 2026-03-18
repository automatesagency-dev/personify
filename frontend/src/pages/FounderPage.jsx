import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../components/Layout';
import founderPageAPI from '../services/founderPageAPI';
import { personaAPI } from '../services/api';
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

const ImageUpload = ({ label, id, onUpload, imageUrl, uploading, backendUrl, isSquare = false }) => (
  <div>
    {label && <label className="block text-sm font-medium text-white mb-2">{label}</label>}
    <input type="file" accept="image/*" onChange={(e) => e.target.files[0] && onUpload(e.target.files[0])} className="hidden" id={id} disabled={uploading} />
    <label htmlFor={id} className={`block border-2 border-dashed border-gray-700 rounded-lg p-8 text-center hover:border-brand-pink transition cursor-pointer ${uploading ? 'opacity-50' : ''} ${isSquare ? 'aspect-square flex items-center justify-center' : ''}`}>
      {imageUrl ? (
        <img src={`${backendUrl}${imageUrl}`} alt="Upload preview" className={`${isSquare ? 'w-full h-full object-cover' : 'max-h-32 mx-auto'} rounded`} />
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
  const [previewMode, setPreviewMode] = useState(false);

  const [formData, setFormData] = useState({
    username: '', template: '', published: false,
    design: { titleFont: 'Afacad', bodyFont: 'Poppins', primaryColor: '#623437', secondaryColor: '#f5a623' },
    basicInfo: { name: '', title: '', tagline: '', about1: '', about2: '', heroImageUrl: '', logoUrl: '' },
    contact: { email: '', phone: '', location: '', social1: '', social2: '', ctaText: "Let's Work Together", ctaDescription: 'Available for bookings and collaborations. Feel free to reach out for editorial, commercial, or creative projects.' },
    services: [{ id: '1', title: '', description: '' }, { id: '2', title: '', description: '' }],
    portfolio: { images: [] },
    featured: []
  });

  const getBackendUrl = () => window.location.hostname === 'localhost' ? 'http://localhost:5000' : 'https://personify-backend-k04y.onrender.com';
  const backendUrl = getBackendUrl();
  const tabs = ['design', 'basicInfo', 'contact', 'services', 'portfolio', 'featured'];
  
  // Clean mapping for labels
  const colorLabels = {
    primaryColor: 'Primary Color',
    secondaryColor: 'Secondary Color'
  };

  const tabLabels = {
    design: 'Design',
    basicInfo: 'Basic Info',
    contact: 'Contact',
    services: 'Services',
    portfolio: 'Portfolio',
    featured: 'Featured'
  };

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
      const { data } = await personaAPI.uploadImage(uploadData);
      onSuccess(data.image.imageUrl);
      alert('Image uploaded successfully!');
    } catch (error) {
      console.error('Upload failed:', error);
      alert('Failed to upload image. Please try again.');
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
        navigate(`/${formData.username}`);
      } else {
        alert('Founder page saved successfully!');
      }
    } catch (error) {
      alert(error.response?.data?.error || `Failed to ${isPublish ? 'publish' : 'save'}.`);
    } finally { setSaving(false); }
  };

  // State Updaters
  const updateNested = (parent, field, value) => setFormData(prev => ({ ...prev, [parent]: { ...prev[parent], [field]: value } }));
  const updateArray = (arrName, id, field, value) => setFormData(prev => ({ ...prev, [arrName]: prev[arrName].map(item => item.id === id ? { ...item, [field]: value } : item) }));
  const deleteArrayItem = (arrName, id, min = 0) => {
    if (formData[arrName].length <= min) return alert(`You must have at least ${min} items`);
    setFormData(prev => ({ ...prev, [arrName]: prev[arrName].filter(item => item.id !== id) }));
  };
  const addArrayItem = (arrName, defaultObj) => setFormData(prev => ({ ...prev, [arrName]: [...prev[arrName], { id: Date.now().toString(), ...defaultObj }] }));

  if (loading) return <Layout><div className="p-8 flex items-center justify-center min-h-screen text-white">Loading...</div></Layout>;

  if (showTemplateSelector) {
    const templates = [
      { id: 'visionary', icon: '🚀', title: 'The Visionary', desc: 'Bold & Inspiring', details: 'Large hero headline, minimal layout. Perfect for thought leaders & startup founders.', colors: ['bg-gray-600', 'w-24 bg-gray-600', 'w-16 bg-gray-700'] },
      { id: 'storyteller', icon: '🎨', title: 'The Storyteller', desc: 'Warm & Personal', details: 'Narrative-driven bio with a warm, human feel. Great for coaches & speakers.', colors: ['bg-gray-600', 'w-32 bg-gray-600', 'w-20 bg-gray-700'] }
    ];
    return (
      <Layout>
        <div className="p-8 max-w-6xl mx-auto">
          <button onClick={() => navigate('/dashboard')} className="text-gray-400 hover:text-white mb-4 flex items-center gap-2">← Back</button>
          <h1 className="text-3xl font-semibold text-white mb-2">Founder Page</h1>
          <p className="text-gray-400 mb-8">Choose a template to get started.</p>
          <div className="grid md:grid-cols-2 gap-6">
            {templates.map(t => (
              <button key={t.id} onClick={() => { setFormData({ ...formData, template: t.id }); setShowTemplateSelector(false); }} className="bg-dark-card rounded-xl p-6 border-2 border-gray-800 hover:border-brand-pink transition text-left group">
                <div className="flex items-center gap-3 mb-4">
                  <div className={`w-12 h-12 rounded-lg bg-gradient-to-br ${t.id === 'visionary' ? 'from-purple-500 to-pink-500' : 'from-orange-500 to-red-500'} flex items-center justify-center text-2xl`}>{t.icon}</div>
                  <div><h3 className="text-xl font-semibold text-white">{t.title}</h3><p className="text-sm text-gray-400">{t.desc}</p></div>
                </div>
                <p className="text-gray-400 text-sm mb-4">{t.details}</p>
                <div className="bg-black/40 rounded-lg p-4 h-32 flex items-center justify-center border border-gray-700">
                  <div className="text-center"><div className={`w-8 h-8 rounded-full mx-auto mb-2 ${t.colors[0]}`}></div><div className={`h-2 rounded mx-auto mb-1 ${t.colors[1]}`}></div><div className={`h-1 rounded mx-auto ${t.colors[2]}`}></div></div>
                </div>
              </button>
            ))}
            {/* Coming Soon Templates */}
            {[{ icon: '📊', title: 'The Expert', desc: 'Clean & Professional', colors: 'from-blue-500 to-cyan-500' }, { icon: '🎬', title: 'The Creator', desc: 'Vibrant & Media-First', colors: 'from-green-500 to-emerald-500' }].map(t => (
              <div key={t.title} className="bg-dark-card rounded-xl p-6 border-2 border-gray-800 opacity-50 cursor-not-allowed text-left relative">
                <span className="absolute top-4 right-4 bg-gray-700 text-gray-400 text-xs px-2 py-1 rounded">Coming Soon</span>
                <div className="flex items-center gap-3 mb-4"><div className={`w-12 h-12 rounded-lg bg-gradient-to-br ${t.colors} flex items-center justify-center text-2xl`}>{t.icon}</div><div><h3 className="text-xl font-semibold text-white">{t.title}</h3><p className="text-sm text-gray-400">{t.desc}</p></div></div>
                <div className="bg-black/40 rounded-lg p-4 h-32 flex items-center justify-center border border-gray-700"><p className="text-gray-500 text-sm">Coming Soon</p></div>
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
            <p className="text-gray-400">Customize the template according to your needs and preview the final look.</p>
          </div>
          <div className="flex gap-4">
            <button onClick={() => setPreviewMode(!previewMode)} className="px-6 py-3 bg-white/10 hover:bg-white/20 text-white rounded-lg font-semibold transition flex items-center gap-2">👁️ Preview Portfolio</button>
            <button onClick={() => handleAction('publish', true)} disabled={saving} className="px-6 py-3 bg-white text-black rounded-lg font-semibold hover:bg-gray-200 transition disabled:opacity-50">{saving ? 'Publishing...' : '🚀 Publish to Personify'}</button>
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
              <h2 className="text-2xl font-semibold text-white mb-6">Design Settings</h2>
              <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4 mb-6">
                <p className="text-blue-400 text-sm">Selected Template: <strong className="capitalize">{formData.template}</strong></p>
                <button onClick={() => setShowTemplateSelector(true)} className="text-blue-400 text-sm mt-2 hover:underline">Change Template</button>
              </div>
              <div className="grid md:grid-cols-2 gap-6">
                <SelectInput label="Title Font" value={formData.design.titleFont} onChange={e => updateNested('design', 'titleFont', e.target.value)} options={['Afacad', 'Poppins', 'Inter', 'Montserrat', 'Playfair Display']} />
                <SelectInput label="Body Font" value={formData.design.bodyFont} onChange={e => updateNested('design', 'bodyFont', e.target.value)} options={['Poppins', 'Inter', 'Roboto', 'Open Sans']} />
                
                {['primaryColor', 'secondaryColor'].map(colorKey => (
                  <div key={colorKey}>
                    <label className="block text-sm font-medium text-white mb-2">
                      {colorLabels[colorKey]}
                    </label>
                    <div className="flex gap-3">
                      <div 
                        className="w-12 h-12 rounded-lg border-2 border-gray-700" 
                        style={{ backgroundColor: formData.design[colorKey] }}
                      ></div>
                      <input 
                        type="text" 
                        value={formData.design[colorKey]} 
                        onChange={e => updateNested('design', colorKey, e.target.value)} 
                        className="flex-1 px-4 py-3 bg-black/40 border border-gray-700 rounded-lg text-white" 
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'basicInfo' && (
            <div className="space-y-6">
              <h2 className="text-2xl font-semibold text-white mb-6">Basic Information</h2>
              <div className="grid md:grid-cols-2 gap-6">
                <ImageUpload label="Logo Upload" id="logo-upload" onUpload={file => handleImageUpload(file, 'basicInfo.logoUrl')} imageUrl={formData.basicInfo.logoUrl} uploading={uploading} backendUrl={backendUrl} />
                <ImageUpload label="Hero Image (Main Banner)" id="hero-upload" onUpload={file => handleImageUpload(file, 'basicInfo.heroImageUrl')} imageUrl={formData.basicInfo.heroImageUrl} uploading={uploading} backendUrl={backendUrl} />
                <TextInput className="md:col-span-2" label="Username *" value={formData.username} prefix="personify-alpha.vercel.app/" note="Lowercase letters, numbers, and hyphens only." onChange={e => setFormData({ ...formData, username: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '') })} />
                <TextInput label="Name" placeholder="Sarah Chen" value={formData.basicInfo.name} onChange={e => updateNested('basicInfo', 'name', e.target.value)} />
                <TextInput label="Professional Title" placeholder="Editorial & Fashion Model" value={formData.basicInfo.title} onChange={e => updateNested('basicInfo', 'title', e.target.value)} />
                <TextInput className="md:col-span-2" label="Tagline" placeholder="Based in New York..." value={formData.basicInfo.tagline} onChange={e => updateNested('basicInfo', 'tagline', e.target.value)} />
                <TextArea className="md:col-span-2" label="About - Paragraph 1" placeholder="I'm a professional model..." value={formData.basicInfo.about1} onChange={e => updateNested('basicInfo', 'about1', e.target.value)} rows={4} />
                <TextArea className="md:col-span-2" label="About - Paragraph 2" placeholder="My approach combines..." value={formData.basicInfo.about2} onChange={e => updateNested('basicInfo', 'about2', e.target.value)} rows={4} />
              </div>
            </div>
          )}

          {activeTab === 'contact' && (
            <div className="space-y-6">
              <h2 className="text-2xl font-semibold text-white mb-6">Contact Information</h2>
              <div className="grid md:grid-cols-2 gap-6">
                <TextInput type="email" label="Email Address" placeholder="Hello@Sarachen.Com" value={formData.contact.email} onChange={e => updateNested('contact', 'email', e.target.value)} />
                <TextInput type="tel" label="Phone Number" placeholder="+1 (555) 123-4567" value={formData.contact.phone} onChange={e => updateNested('contact', 'phone', e.target.value)} />
                <TextInput className="md:col-span-2" label="Location" placeholder="New York, NY" value={formData.contact.location} onChange={e => updateNested('contact', 'location', e.target.value)} />
                <TextInput label="Social Handle 01" placeholder="@Sarachen" value={formData.contact.social1} onChange={e => updateNested('contact', 'social1', e.target.value)} />
                <TextInput label="Social Handle 02" placeholder="@Sarachen" value={formData.contact.social2} onChange={e => updateNested('contact', 'social2', e.target.value)} />
                <TextInput className="md:col-span-2" label="Call-To-Action Text" placeholder="Let's Work Together" value={formData.contact.ctaText} onChange={e => updateNested('contact', 'ctaText', e.target.value)} />
                <TextArea className="md:col-span-2" label="CTA Description" placeholder="Available For Bookings..." value={formData.contact.ctaDescription} onChange={e => updateNested('contact', 'ctaDescription', e.target.value)} />
              </div>
            </div>
          )}

          {activeTab === 'services' && (
            <div className="space-y-6">
              <div className="flex justify-between items-center mb-6">
                <div><h2 className="text-2xl font-semibold text-white">Services</h2><p className="text-gray-400 text-sm mt-1">Minimum 2 Services Required</p></div>
                <button onClick={() => addArrayItem('services', { title: '', description: '' })} className="px-6 py-3 bg-white text-black rounded-lg font-semibold hover:bg-gray-200 transition">Add Service</button>
              </div>
              {formData.services.map((service, index) => (
                <div key={service.id} className="bg-black/20 rounded-xl p-6 border border-gray-700 relative space-y-4">
                  <div className="flex justify-between items-start mb-2"><h3 className="text-white font-semibold">Service {index + 1}</h3>{formData.services.length > 2 && <button onClick={() => deleteArrayItem('services', service.id, 2)} className="text-red-400 hover:text-red-300">🗑️</button>}</div>
                  <TextInput label="Service Title" placeholder="Runway" value={service.title} onChange={e => updateArray('services', service.id, 'title', e.target.value)} />
                  <TextArea label="Service Description" placeholder="High-Fashion Editorial Shoots..." value={service.description} onChange={e => updateArray('services', service.id, 'description', e.target.value)} />
                </div>
              ))}
            </div>
          )}

          {activeTab === 'portfolio' && (
            <div className="space-y-6">
              <h2 className="text-2xl font-semibold text-white mb-6">Portfolio Images</h2>
              <div className="grid md:grid-cols-2 gap-6">
                {[...Array(6)].map((_, index) => (
                  <ImageUpload key={index} label={`Portfolio Image ${String(index + 1).padStart(2, '0')}`} id={`portfolio-${index}`} onUpload={file => handlePortfolioUpload(file, index)} imageUrl={formData.portfolio.images?.[index]?.url} uploading={uploading} backendUrl={backendUrl} isSquare />
                ))}
              </div>
            </div>
          )}

          {activeTab === 'featured' && (
            <div className="space-y-6">
              <div className="flex justify-between items-center mb-6">
                <div><h2 className="text-2xl font-semibold text-white">Featured Work</h2><p className="text-gray-400 text-sm mt-1">Showcase Your Best Work</p></div>
                <button onClick={() => addArrayItem('featured', { title: '', subtitle: '', year: '', imageUrl: '' })} className="px-6 py-3 bg-white text-black rounded-lg font-semibold hover:bg-gray-200 transition">Add Project</button>
              </div>
              {formData.featured.length === 0 ? (
                <div className="text-center py-12 text-gray-500">No featured work yet. Click "Add Project" to get started.</div>
              ) : formData.featured.map((work, index) => (
                <div key={work.id} className="bg-black/20 rounded-xl p-6 border border-gray-700 relative space-y-4">
                  <div className="flex justify-between items-start mb-2"><h3 className="text-white font-semibold">Featured Work {index + 1}</h3><button onClick={() => deleteArrayItem('featured', work.id)} className="text-red-400 hover:text-red-300">🗑️</button></div>
                  <TextInput label="Project Title" placeholder="Vogue Magazine" value={work.title} onChange={e => updateArray('featured', work.id, 'title', e.target.value)} />
                  <TextInput label="Subtitle" placeholder="Editorial Fashion" value={work.subtitle} onChange={e => updateArray('featured', work.id, 'subtitle', e.target.value)} />
                  <TextInput label="Year" placeholder="2024" value={work.year} onChange={e => updateArray('featured', work.id, 'year', e.target.value)} />
                  <ImageUpload label="Project Image" id={`featured-${work.id}`} onUpload={file => handleFeaturedImageUpload(file, work.id)} imageUrl={work.imageUrl} uploading={uploading} backendUrl={backendUrl} />
                </div>
              ))}
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