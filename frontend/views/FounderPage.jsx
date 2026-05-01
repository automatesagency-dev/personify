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
    featured: [],
    faq: []
  });

  const tabs = ['design', 'basicInfo', 'contact', 'services', 'portfolio', 'featured', 'faq'];
  const tabLabels = { design: 'Design', basicInfo: 'Basic Info', contact: 'Contact', services: 'Services', portfolio: 'Portfolio', featured: 'Featured', faq: 'FAQ' };
  const tabLabelsMobile = { design: 'Design', basicInfo: 'Info', contact: 'Contact', services: 'Services', portfolio: 'Gallery', featured: 'Featured', faq: 'FAQ' };

  const FAQ_PRESETS = [
    { value: 'connections', label: 'How will your connections help me grow my business?' },
    { value: 'contact', label: 'Where can I contact you?' },
    { value: 'custom', label: 'Other (write your own)' },
  ];

  useEffect(() => { loadFounderPage(); }, []);

  const loadFounderPage = async () => {
    try {
      setLoading(true);
      const { data } = await founderPageAPI.get();
      if (data.founderPage) {
        const fp = data.founderPage;
        setFormData(prev => ({
          ...prev,
          ...fp,
          services: fp.services?.length ? fp.services : prev.services,
          featured: Array.isArray(fp.featured) ? fp.featured : [],
          faq: Array.isArray(fp.faq) ? fp.faq : [],
          portfolio: { images: Array.isArray(fp.portfolio?.images) ? fp.portfolio.images : [] }
        }));
        setShowTemplateSelector(!fp.template);
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
  const updateArray = (arrName, id, field, value) => setFormData(prev => ({ ...prev, [arrName]: (prev[arrName] || []).map(item => item.id === id ? { ...item, [field]: value } : item) }));
  const deleteArrayItem = (arrName, id, min = 0) => {
    if ((formData[arrName] || []).length <= min) return alert(`You must have at least ${min} items`);
    setFormData(prev => ({ ...prev, [arrName]: (prev[arrName] || []).filter(item => item.id !== id) }));
  };
  const addArrayItem = (arrName, defaultObj) => setFormData(prev => ({ ...prev, [arrName]: [...(prev[arrName] || []), { id: Date.now().toString(), ...defaultObj }] }));

  if (loading) return <Layout><div className="p-8 flex items-center justify-center min-h-screen text-white">Loading...</div></Layout>;

  if (showTemplateSelector) {
    const activeTemplates = [
      {
        id: 'visionary',
        icon: '🚀',
        title: 'The Visionary',
        subtitle: 'Light · Professional · Bold',
        subtitleColor: 'text-emerald-400',
        description: 'Clean white layout with strong typography. Split hero, service cards, gradient CTA. Perfect for founders & thought leaders.',
        preview: (
          <div className="mt-4 rounded-xl overflow-hidden ring-1 ring-white/10 bg-white text-black select-none pointer-events-none">
            {/* Nav */}
            <div className="flex items-center justify-between px-3 py-2 border-b border-gray-200 bg-white">
              <div className="flex items-center gap-1.5">
                <div className="w-4 h-4 rounded-full bg-[#623437]" />
                <div className="w-10 h-1.5 bg-gray-700 rounded" />
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-5 h-1 bg-gray-300 rounded" /><div className="w-5 h-1 bg-gray-300 rounded" /><div className="w-5 h-1 bg-gray-300 rounded" />
                <div className="w-10 h-2.5 bg-[#623437] rounded-md" />
              </div>
            </div>
            {/* Hero */}
            <div className="bg-gray-50 px-3 py-4 flex gap-3">
              <div className="flex-1 space-y-1.5">
                <div className="w-16 h-1 bg-[#623437]/40 rounded" />
                <div className="w-20 h-4 bg-[#623437] rounded" />
                <div className="w-12 h-1.5 bg-[#f5a623]/80 rounded" />
                <div className="w-full h-1 bg-gray-300 rounded mt-1" />
                <div className="w-4/5 h-1 bg-gray-300 rounded" />
                <div className="w-3/4 h-1 bg-gray-200 rounded" />
                <div className="flex gap-1.5 mt-2">
                  <div className="w-12 h-3 bg-[#623437] rounded-lg" />
                  <div className="w-12 h-3 border border-gray-300 rounded-lg" />
                </div>
              </div>
              <div className="w-16 h-24 rounded-xl bg-gradient-to-br from-gray-200 to-gray-300 flex-shrink-0 relative overflow-hidden">
                <div className="absolute bottom-0 left-0 right-0 h-8 bg-gradient-to-t from-[#623437]/40 to-transparent" />
                <div className="absolute bottom-1 left-1 right-1 bg-white rounded-lg p-1">
                  <div className="w-full h-0.5 bg-[#623437]/60 rounded" />
                  <div className="w-3/4 h-0.5 bg-gray-300 rounded mt-0.5" />
                </div>
              </div>
            </div>
            {/* Services */}
            <div className="px-3 py-3 bg-white">
              <div className="w-8 h-0.5 bg-[#623437]/50 rounded mb-1" />
              <div className="w-14 h-2 bg-gray-800 rounded mb-2.5" />
              <div className="grid grid-cols-3 gap-1.5">
                {[0,1,2].map(i => (
                  <div key={i} className="bg-white border border-gray-200 rounded-lg p-1.5 shadow-sm space-y-1">
                    <div className="w-4 h-4 rounded bg-[#623437]/10 flex items-center justify-center">
                      <div className="w-1.5 h-2 bg-[#623437]/50 rounded-sm" />
                    </div>
                    <div className="w-full h-0.5 bg-gray-300 rounded" />
                    <div className="w-3/4 h-0.5 bg-gray-200 rounded" />
                    <div className="w-1/2 h-0.5 bg-gray-200 rounded" />
                  </div>
                ))}
              </div>
            </div>
            {/* CTA gradient */}
            <div className="px-3 py-4 text-center" style={{ background: 'linear-gradient(135deg, #623437 0%, #f5a623 100%)' }}>
              <div className="w-20 h-2.5 bg-white/60 rounded mx-auto mb-1.5" />
              <div className="w-28 h-1 bg-white/30 rounded mx-auto mb-3" />
              <div className="w-16 h-3 bg-white rounded-xl mx-auto" />
            </div>
          </div>
        )
      },
      {
        id: 'storyteller',
        icon: '✍️',
        title: 'The Storyteller',
        subtitle: 'Dark · Cinematic · Editorial',
        subtitleColor: 'text-amber-400',
        description: 'Full-screen dark hero with dramatic typography. Grayscale-to-color gallery, editorial story layout. Great for creatives & speakers.',
        preview: (
          <div className="mt-4 rounded-xl overflow-hidden ring-1 ring-white/10 bg-[#080808] select-none pointer-events-none">
            {/* Hero */}
            <div className="relative px-3 py-5 flex flex-col items-center justify-center text-center overflow-hidden" style={{ background: 'linear-gradient(to bottom, rgba(98,52,55,0.35) 0%, #080808 100%)' }}>
              <div className="absolute inset-0 opacity-15" style={{ backgroundImage: 'radial-gradient(circle at 50% 50%, #f5a623 1px, transparent 1px)', backgroundSize: '12px 12px' }} />
              <div className="w-5 h-5 rounded-full bg-white/10 border border-white/20 mb-1.5 relative z-10" />
              <div className="w-3 h-0.5 bg-[#f5a623]/60 rounded mb-2 relative z-10" />
              <div className="w-24 h-5 bg-[#f5a623]/80 rounded mb-1 relative z-10" />
              <div className="w-16 h-1 bg-white/20 rounded mb-3 relative z-10" />
              <div className="w-14 h-3 rounded-full bg-[#f5a623] relative z-10" />
            </div>
            {/* Story section */}
            <div className="px-3 py-3 border-t border-white/5">
              <div className="w-6 h-0.5 bg-[#f5a623]/50 rounded mb-2" />
              <div className="space-y-1">
                <div className="w-full h-1 bg-white/12 rounded italic" />
                <div className="w-full h-1 bg-white/12 rounded" />
                <div className="w-3/4 h-1 bg-white/8 rounded" />
              </div>
            </div>
            {/* Visuals grid */}
            <div className="px-3 py-2">
              <div className="grid grid-cols-3 gap-1" style={{ gridTemplateRows: 'auto auto' }}>
                <div className="row-span-2 bg-zinc-700/60 rounded-lg" style={{ height: '44px' }} />
                <div className="bg-zinc-800 rounded-lg" style={{ height: '20px' }} />
                <div className="bg-zinc-700/50 rounded-lg" style={{ height: '20px' }} />
                <div className="bg-zinc-700/50 rounded-lg" style={{ height: '20px' }} />
                <div className="bg-zinc-800 rounded-lg" style={{ height: '20px' }} />
              </div>
            </div>
            {/* Services */}
            <div className="px-3 py-2 grid grid-cols-2 gap-1.5">
              {[0,1].map(i => (
                <div key={i} className="bg-zinc-900/80 rounded-lg p-2 border-l-2 border-[#f5a623]/60">
                  <div className="w-6 h-0.5 bg-[#f5a623]/40 rounded mb-1" />
                  <div className="w-full h-0.5 bg-white/10 rounded" />
                  <div className="w-3/4 h-0.5 bg-white/8 rounded mt-0.5" />
                </div>
              ))}
            </div>
            {/* CTA */}
            <div className="px-3 py-4 text-center border-t border-white/5" style={{ background: 'radial-gradient(ellipse at 50% 50%, rgba(98,52,55,0.25) 0%, transparent 70%)' }}>
              <div className="w-16 h-2.5 bg-white/50 rounded mx-auto mb-1.5" />
              <div className="w-24 h-1 bg-white/15 rounded mx-auto mb-3" />
              <div className="w-16 h-3 bg-white rounded-full mx-auto" />
            </div>
          </div>
        )
      }
      ,
      {
        id: 'executive',
        icon: '⚡',
        title: 'The Executive',
        subtitle: 'Dark · Premium · Full-Bleed',
        subtitleColor: 'text-yellow-400',
        description: 'Full-screen hero with giant name overlay, numbered service cards, fan photo gallery, and a cinematic dark aesthetic. Built for personal brand powerhouses.',
        preview: (
          <div className="mt-4 rounded-xl overflow-hidden ring-1 ring-white/10 bg-[#0c0c0c] select-none pointer-events-none">
            {/* Nav */}
            <div className="flex items-center justify-between px-3 py-2" style={{ background: 'linear-gradient(to bottom, rgba(0,0,0,0.6), transparent)' }}>
              <div className="w-12 h-1.5 bg-white/70 rounded" />
              <div className="w-5 h-3.5 flex flex-col justify-between"><div className="w-full h-0.5 bg-white/40 rounded"/><div className="w-full h-0.5 bg-white/40 rounded"/><div className="w-full h-0.5 bg-white/40 rounded"/></div>
            </div>
            {/* Hero */}
            <div className="relative px-3 pt-2 pb-0 overflow-hidden" style={{ height: '80px', background: 'linear-gradient(135deg, rgba(98,52,55,0.4) 0%, rgba(12,12,12,0.9) 100%)' }}>
              {/* Top row */}
              <div className="flex justify-between items-start mb-2">
                <div>
                  <div className="w-12 h-1 bg-white/20 rounded-full mb-1" />
                  <div className="w-16 h-1.5 bg-white/60 rounded" />
                </div>
                <div className="flex flex-col items-end gap-1">
                  <div className="w-14 h-0.5 bg-white/20 rounded" />
                  <div className="w-10 h-0.5 bg-white/15 rounded" />
                  <div className="w-10 h-2 rounded-full" style={{ backgroundColor: '#f5a623' }} />
                </div>
              </div>
              {/* Giant name */}
              <div className="w-full h-5 bg-white/80 rounded" style={{ marginTop: '14px' }} />
            </div>
            {/* Photo grid */}
            <div className="px-3 py-2 grid grid-cols-3 gap-1">
              {[0,1,2].map(i => <div key={i} className="bg-zinc-800 rounded-lg aspect-[3/4]" />)}
            </div>
            {/* Service cards */}
            <div className="px-3 py-2 grid grid-cols-3 gap-1">
              {[0,1,2].map(i => (
                <div key={i} className="bg-[#141414] rounded-lg p-1.5 border border-white/5">
                  <div className="text-[8px] font-bold mb-1" style={{ color: '#f5a623' }}>{String(i+1).padStart(2,'0')}</div>
                  <div className="w-full h-0.5 bg-white/20 rounded mb-0.5" />
                  <div className="w-3/4 h-0.5 bg-white/10 rounded" />
                </div>
              ))}
            </div>
            {/* Fan promo */}
            <div className="px-3 py-3 text-center border-t border-white/5 relative overflow-hidden">
              <div className="flex justify-center items-end h-8 mb-2 relative">
                {[-20,-8,4,16].map((r, i) => (
                  <div key={i} className="absolute w-5 h-7 bg-zinc-700 rounded border border-white/10"
                    style={{ transform: `rotate(${r}deg) translateX(${(i-1.5)*14}px)`, zIndex: i }} />
                ))}
              </div>
              <div className="w-20 h-2 bg-white/40 rounded mx-auto mb-1.5" />
              <div className="w-16 h-3 rounded-full mx-auto" style={{ backgroundColor: '#f5a623' }} />
            </div>
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

        {/* Mobile stepper */}
        <div className="md:hidden mb-4">
          <div className="flex items-center justify-between mb-2">
            <button
              onClick={() => activeTab !== tabs[0] && setActiveTab(tabs[tabs.indexOf(activeTab) - 1])}
              disabled={activeTab === tabs[0]}
              className="w-9 h-9 flex items-center justify-center rounded-full bg-white/10 text-white disabled:opacity-30 active:bg-white/20 transition"
            >
              ‹
            </button>
            <div className="text-center">
              <p className="text-white font-semibold text-sm">{tabLabels[activeTab]}</p>
              <p className="text-gray-500 text-xs">{tabs.indexOf(activeTab) + 1} of {tabs.length}</p>
            </div>
            {activeTab === tabs[tabs.length - 1] ? (
              <button
                onClick={() => handleAction('publish', true)}
                disabled={saving}
                className="w-9 h-9 flex items-center justify-center rounded-full bg-white text-black disabled:opacity-50 text-lg active:bg-gray-200 transition"
              >
                🚀
              </button>
            ) : (
              <button
                onClick={() => setActiveTab(tabs[tabs.indexOf(activeTab) + 1])}
                className="w-9 h-9 flex items-center justify-center rounded-full bg-white/10 text-white active:bg-white/20 transition"
              >
                ›
              </button>
            )}
          </div>
          <div className="flex gap-1">
            {tabs.map((tab, i) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`h-1 rounded-full flex-1 transition-all ${activeTab === tab ? 'bg-white' : i < tabs.indexOf(activeTab) ? 'bg-gray-500' : 'bg-gray-700'}`}
              />
            ))}
          </div>
        </div>

        {/* Desktop tab bar */}
        <div className="hidden md:block mb-8">
          <div className="bg-dark-card rounded-xl p-1.5 inline-flex gap-1">
            {tabs.map(tab => (
              <button key={tab} onClick={() => setActiveTab(tab)} className={`px-6 py-3 rounded-lg text-sm font-medium transition whitespace-nowrap ${activeTab === tab ? 'bg-white text-black' : 'text-gray-400 hover:text-white'}`}>
                {tabLabels[tab]}
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
        Template: <strong className="capitalize">{formData.template === 'visionary' ? '🚀 The Visionary' : formData.template === 'executive' ? '⚡ The Executive' : '✍️ The Storyteller'}</strong>
      </p>
      <p className="text-blue-300 text-xs mt-0.5">
        {formData.template === 'visionary' ? 'Bold & Inspiring (Light Theme)' : formData.template === 'executive' ? 'Dark & Premium (Full-Bleed)' : 'Warm & Personal (Dark Theme)'}
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
                <TextInput className="md:col-span-2" label="Username *" value={formData.username} prefix="personify.so/" onChange={e => setFormData({ ...formData, username: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '') })} />
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

          {activeTab === 'faq' && (
            <div className="space-y-4 md:space-y-6">
              <div className="flex justify-between items-center mb-4 md:mb-6">
                <div>
                  <h2 className="text-lg md:text-2xl font-semibold text-white">FAQ</h2>
                  <p className="text-gray-400 text-xs md:text-sm mt-0.5">Up to 4 custom questions — shown after the 2 standard ones</p>
                </div>
                {(formData.faq || []).length < 4 && (
                  <button
                    onClick={() => addArrayItem('faq', { type: 'connections', customQuestion: '', answer: '' })}
                    className="px-4 md:px-6 py-2 md:py-3 bg-white text-black rounded-lg text-sm font-semibold hover:bg-gray-200 transition"
                  >+ Add</button>
                )}
              </div>

              {/* Static previews */}
              <div className="space-y-3">
                <p className="text-xs text-gray-500 uppercase tracking-wider font-semibold">Always shown on your page</p>
                {[
                  'What is Personify?',
                  'What is a Founder Page?',
                ].map((q, i) => (
                  <div key={i} className="bg-black/10 rounded-xl p-4 border border-gray-800 flex items-center gap-3 opacity-60">
                    <span className="text-gray-500 text-xs">Q{i + 1}</span>
                    <p className="text-sm text-gray-400">{q}</p>
                    <span className="ml-auto text-[10px] text-gray-600 bg-gray-800 px-2 py-0.5 rounded">Static</span>
                  </div>
                ))}
              </div>

              {/* User FAQs */}
              {(formData.faq || []).length === 0 ? (
                <div className="text-center py-8 text-gray-500 text-sm">No custom FAQs yet. Tap "+ Add" to add one.</div>
              ) : (
                (formData.faq || []).map((item, index) => (
                  <div key={item.id} className="bg-black/20 rounded-xl p-4 md:p-6 border border-gray-700 space-y-3 md:space-y-4">
                    <div className="flex justify-between items-start">
                      <h3 className="text-white text-sm md:text-base font-semibold">FAQ {index + 1}</h3>
                      <button onClick={() => deleteArrayItem('faq', item.id)} className="text-red-400 hover:text-red-300 text-sm">🗑️</button>
                    </div>
                    <div>
                      <label className="block text-xs md:text-sm font-medium text-white mb-1.5">Question</label>
                      <select
                        value={item.type}
                        onChange={e => updateArray('faq', item.id, 'type', e.target.value)}
                        className="w-full px-3 md:px-4 py-2.5 md:py-3 bg-black/40 border border-gray-700 rounded-lg text-sm text-white focus:border-brand-pink focus:ring-1 focus:ring-brand-pink outline-none transition"
                      >
                        {FAQ_PRESETS.map(p => <option key={p.value} value={p.value}>{p.label}</option>)}
                      </select>
                    </div>
                    {item.type === 'custom' && (
                      <TextInput
                        label="Your question"
                        placeholder="Type your question here..."
                        value={item.customQuestion}
                        onChange={e => updateArray('faq', item.id, 'customQuestion', e.target.value)}
                      />
                    )}
                    <TextArea
                      label="Your answer"
                      placeholder="Write your answer here..."
                      value={item.answer}
                      onChange={e => updateArray('faq', item.id, 'answer', e.target.value)}
                      rows={3}
                    />
                  </div>
                ))
              )}
            </div>
          )}

          {/* Mobile: save draft only */}
          <div className="md:hidden mt-6 pt-4 border-t border-gray-700">
            <button onClick={() => handleAction('save')} disabled={saving} className="w-full py-2.5 bg-white/10 hover:bg-white/20 text-white rounded-lg text-sm font-semibold transition">
              {saving ? 'Saving...' : 'Save Draft'}
            </button>
          </div>

          {/* Desktop: full prev/save/next row */}
          <div className="hidden md:flex justify-between mt-8 pt-6 border-t border-gray-700">
            <button onClick={() => setActiveTab(tabs[tabs.indexOf(activeTab) - 1])} disabled={activeTab === tabs[0]} className="px-6 py-3 bg-white/10 hover:bg-white/20 text-white rounded-lg text-sm font-semibold transition disabled:opacity-50">← Prev</button>
            <button onClick={() => handleAction('save')} disabled={saving} className="px-6 py-3 bg-white/10 hover:bg-white/20 text-white rounded-lg text-sm font-semibold transition">{saving ? 'Saving...' : 'Save Draft'}</button>
            {activeTab === tabs[tabs.length - 1]
              ? <button onClick={() => handleAction('publish', true)} disabled={saving} className="px-6 py-3 bg-white text-black rounded-lg text-sm font-semibold hover:bg-gray-200 transition disabled:opacity-50">🚀 Publish</button>
              : <button onClick={() => setActiveTab(tabs[tabs.indexOf(activeTab) + 1])} className="px-6 py-3 bg-white text-black rounded-lg text-sm font-semibold hover:bg-gray-200 transition">Next →</button>
            }
          </div>
        </div>
      </div>
    </Layout>
  );
}