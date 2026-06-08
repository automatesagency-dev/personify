'use client'

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Layout from '../components/Layout';
import founderPageAPI from '../services/founderPageAPI';
import { uploadAPI } from '../services/api';
import ColorPicker from '../components/ColorPicker';

// ── Helper Components ──────────────────────────────────────────────────────────

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

const ImageUpload = ({ label, id, onUpload, imageUrl, uploading, isSquare = false, note }) => (
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
    {note && <p className="text-xs text-gray-500 mt-1.5">{note}</p>}
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

// ── Constants ──────────────────────────────────────────────────────────────────

const ECOMMERCE_TEMPLATES = ['ecommerce-classic', 'ecommerce-bold'];
const PERSONAL_TEMPLATES = ['visionary', 'storyteller', 'executive'];

const DEFAULT_ECOMMERCE = {
  brandName: '', tagline: '', heroImageUrl: '', logoUrl: '', founderPhotoUrl: '',
  founderName: '', founderTitle: '', brandStory: '', shopUrl: '',
  videoSectionTitle: 'Our Videos', socialInstagram: '', socialTiktok: '', socialYoutube: '',
  standards: [
    { id: '1', title: 'Dermatologist Tested', description: 'Clinically validated for sensitive and acne-prone skin.' },
    { id: '2', title: 'Cruelty Free', description: 'No animal testing, ever. We care about all living beings.' },
    { id: '3', title: 'Science Backed', description: 'Every formula developed with leading cosmetic scientists.' },
  ],
  featuredProduct: { name: '', price: '', badge: 'Best Seller', description: '', imageUrl: '', bullet1: '', bullet2: '', bullet3: '' },
  collection: [],
  videos: [],
  reviews: [],
};

const TEMPLATE_META = {
  visionary:        { icon: '🚀', label: 'The Visionary',  style: 'Light · Professional · Bold',   color: 'text-emerald-400' },
  storyteller:      { icon: '✍️', label: 'The Storyteller', style: 'Dark · Cinematic · Editorial',  color: 'text-amber-400'   },
  executive:        { icon: '⚡', label: 'The Executive',   style: 'Dark · Premium · Full-Bleed',   color: 'text-yellow-400'  },
  'ecommerce-classic': { icon: '🌿', label: 'Natural & Soft',  style: 'Light · Warm · Organic',     color: 'text-rose-300'    },
  'ecommerce-bold':    { icon: '💎', label: 'Bold & Dramatic', style: 'Dark · Luxury · High-Impact', color: 'text-fuchsia-400' },
};

// ── Main Component ─────────────────────────────────────────────────────────────

export default function FounderPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [activeTab, setActiveTab] = useState('design');
  const [showTemplateSelector, setShowTemplateSelector] = useState(false);
  const [selectorCategory, setSelectorCategory] = useState('personal');
  const [showCategoryWarnModal, setShowCategoryWarnModal] = useState(false);
  const [pendingTemplateId, setPendingTemplateId] = useState(null);

  const [formData, setFormData] = useState({
    username: '', template: '', published: false,
    design: { titleFont: 'Afacad', bodyFont: 'Poppins', primaryColor: '#623437', secondaryColor: '#f5a623' },
    basicInfo: { name: '', title: '', tagline: '', about1: '', about2: '', heroImageUrl: '', logoUrl: '' },
    contact: { email: '', phone: '', location: '', social1: '', social2: '', ctaText: "Let's Work Together", ctaDescription: '' },
    services: [{ id: '1', title: '', description: '' }, { id: '2', title: '', description: '' }],
    portfolio: { images: [] },
    featured: [],
    faq: [],
    ecommerce: { ...DEFAULT_ECOMMERCE },
  });

  const isEcommerce = ECOMMERCE_TEMPLATES.includes(formData.template);
  const personalTabs = ['design', 'basicInfo', 'contact', 'services', 'portfolio', 'featured', 'faq'];
  const ecommerceTabs = ['design', 'brand', 'shop', 'videos', 'reviews', 'contact', 'faq'];
  const tabs = isEcommerce ? ecommerceTabs : personalTabs;
  const tabLabels = {
    design: 'Design', basicInfo: 'Basic Info', contact: 'Contact',
    services: 'Services', portfolio: 'Portfolio', featured: 'Featured', faq: 'FAQ',
    brand: 'Brand', shop: 'Shop', videos: 'Videos', reviews: 'Reviews',
  };

  const FAQ_PRESETS = [
    { value: 'connections', label: 'How will your connections help me grow my business?' },
    { value: 'contact', label: 'Where can I contact you?' },
    { value: 'custom', label: 'Other (write your own)' },
  ];

  useEffect(() => {
    const cat = searchParams?.get('category');
    if (cat === 'ecommerce' || cat === 'personal') setSelectorCategory(cat);
    loadFounderPage();
  }, []);

  const loadFounderPage = async () => {
    try {
      setLoading(true);
      const { data } = await founderPageAPI.get();
      if (data.founderPage) {
        const fp = data.founderPage;
        setFormData(prev => ({
          ...prev, ...fp,
          services: fp.services?.length ? fp.services : prev.services,
          featured: Array.isArray(fp.featured) ? fp.featured : [],
          faq: Array.isArray(fp.faq) ? fp.faq : [],
          portfolio: { images: Array.isArray(fp.portfolio?.images) ? fp.portfolio.images : [] },
          ecommerce: fp.ecommerce ? { ...DEFAULT_ECOMMERCE, ...fp.ecommerce } : prev.ecommerce,
        }));
        setShowTemplateSelector(!fp.template);
        if (fp.template) setSelectorCategory(ECOMMERCE_TEMPLATES.includes(fp.template) ? 'ecommerce' : 'personal');
      } else {
        setShowTemplateSelector(true);
      }
    } catch { setShowTemplateSelector(true); }
    finally { setLoading(false); }
  };

  const executeUpload = async (file, onSuccess) => {
    try {
      setUploading(true);
      const fd = new FormData();
      fd.append('image', file);
      const { data } = await uploadAPI.uploadImage(fd);
      onSuccess(data.image.imageUrl);
    } catch { alert('Failed to upload image.'); }
    finally { setUploading(false); }
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
    const imgs = [...(formData.portfolio.images || [])];
    imgs[index] = { id: Date.now().toString(), url };
    setFormData(prev => ({ ...prev, portfolio: { images: imgs } }));
  });

  const handleFeaturedImageUpload = (file, workId) => executeUpload(file, (url) => {
    setFormData(prev => ({ ...prev, featured: prev.featured.map(w => w.id === workId ? { ...w, imageUrl: url } : w) }));
  });

  const handleEcommerceUpload = (file, field) => executeUpload(file, (url) => {
    setFormData(prev => ({ ...prev, ecommerce: { ...prev.ecommerce, [field]: url } }));
  });

  const handleFeaturedProductImageUpload = (file) => executeUpload(file, (url) => {
    setFormData(prev => ({ ...prev, ecommerce: { ...prev.ecommerce, featuredProduct: { ...prev.ecommerce.featuredProduct, imageUrl: url } } }));
  });

  const handleCollectionImageUpload = (file, itemId) => executeUpload(file, (url) => {
    setFormData(prev => ({
      ...prev,
      ecommerce: { ...prev.ecommerce, collection: prev.ecommerce.collection.map(c => c.id === itemId ? { ...c, imageUrl: url } : c) }
    }));
  });

  const updateNested = (parent, field, value) => setFormData(prev => ({ ...prev, [parent]: { ...prev[parent], [field]: value } }));
  const updateArray = (arrName, id, field, value) => setFormData(prev => ({ ...prev, [arrName]: (prev[arrName] || []).map(item => item.id === id ? { ...item, [field]: value } : item) }));
  const deleteArrayItem = (arrName, id, min = 0) => {
    if ((formData[arrName] || []).length <= min) return alert(`You must have at least ${min} items`);
    setFormData(prev => ({ ...prev, [arrName]: (prev[arrName] || []).filter(item => item.id !== id) }));
  };
  const addArrayItem = (arrName, defaultObj) => setFormData(prev => ({ ...prev, [arrName]: [...(prev[arrName] || []), { id: Date.now().toString(), ...defaultObj }] }));

  const updateEcommerce = (field, value) => setFormData(prev => ({ ...prev, ecommerce: { ...prev.ecommerce, [field]: value } }));
  const updateFeaturedProduct = (field, value) => setFormData(prev => ({ ...prev, ecommerce: { ...prev.ecommerce, featuredProduct: { ...prev.ecommerce.featuredProduct, [field]: value } } }));
  const updateStandard = (id, field, value) => setFormData(prev => ({ ...prev, ecommerce: { ...prev.ecommerce, standards: prev.ecommerce.standards.map(s => s.id === id ? { ...s, [field]: value } : s) } }));
  const updateCollectionItem = (id, field, value) => setFormData(prev => ({ ...prev, ecommerce: { ...prev.ecommerce, collection: prev.ecommerce.collection.map(c => c.id === id ? { ...c, [field]: value } : c) } }));
  const deleteEcommerceItem = (field, id) => setFormData(prev => ({ ...prev, ecommerce: { ...prev.ecommerce, [field]: prev.ecommerce[field].filter(x => x.id !== id) } }));
  const addEcommerceItem = (field, defaults) => setFormData(prev => ({ ...prev, ecommerce: { ...prev.ecommerce, [field]: [...prev.ecommerce[field], { id: Date.now().toString(), ...defaults }] } }));

  // ── Template selection ────────────────────────────────────────────────────────

  const handleTemplateSelect = (templateId) => {
    const newIsEcom = ECOMMERCE_TEMPLATES.includes(templateId);
    const curIsEcom = ECOMMERCE_TEMPLATES.includes(formData.template);
    if (formData.template && newIsEcom !== curIsEcom) {
      setPendingTemplateId(templateId);
      setShowCategoryWarnModal(true);
      return;
    }
    applyTemplate(templateId);
  };

  const applyTemplate = (id) => {
    setFormData(prev => ({ ...prev, template: id }));
    setShowTemplateSelector(false);
    setPendingTemplateId(null);
    setActiveTab('design');
  };

  const confirmCategorySwitch = () => {
    const newIsEcom = ECOMMERCE_TEMPLATES.includes(pendingTemplateId);
    setFormData(prev => ({
      ...prev,
      template: pendingTemplateId,
      ...(newIsEcom
        ? { ecommerce: { ...DEFAULT_ECOMMERCE } }
        : {
            basicInfo: { name: '', title: '', tagline: '', about1: '', about2: '', heroImageUrl: '', logoUrl: '' },
            contact: { email: '', phone: '', location: '', social1: '', social2: '', ctaText: "Let's Work Together", ctaDescription: '' },
            services: [{ id: '1', title: '', description: '' }, { id: '2', title: '', description: '' }],
            portfolio: { images: [] }, featured: [], faq: [],
          }),
    }));
    setShowCategoryWarnModal(false);
    setShowTemplateSelector(false);
    setPendingTemplateId(null);
    setActiveTab('design');
  };

  const handleAction = async (action, isPublish = false) => {
    try {
      if (isPublish && !formData.username) {
        alert('Please enter a username');
        return setActiveTab(isEcommerce ? 'brand' : 'basicInfo');
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

  if (loading) return <Layout><div className="p-8 flex items-center justify-center min-h-screen text-white">Loading...</div></Layout>;

  // ── TEMPLATE SELECTOR ─────────────────────────────────────────────────────────

  if (showTemplateSelector) {
    const personalTemplates = [
      {
        id: 'visionary', icon: '🚀', title: 'The Visionary', subtitle: 'Light · Professional · Bold', subtitleColor: 'text-emerald-400',
        description: 'Clean white layout with strong typography. Split hero, service cards, gradient CTA. Perfect for founders & thought leaders.',
        preview: (
          <div className="mt-4 rounded-xl overflow-hidden ring-1 ring-white/10 bg-white text-black select-none pointer-events-none">
            <div className="flex items-center justify-between px-3 py-2 border-b border-gray-200 bg-white">
              <div className="flex items-center gap-1.5"><div className="w-4 h-4 rounded-full bg-[#623437]" /><div className="w-10 h-1.5 bg-gray-700 rounded" /></div>
              <div className="flex items-center gap-1.5"><div className="w-5 h-1 bg-gray-300 rounded" /><div className="w-5 h-1 bg-gray-300 rounded" /><div className="w-5 h-1 bg-gray-300 rounded" /><div className="w-10 h-2.5 bg-[#623437] rounded-md" /></div>
            </div>
            <div className="bg-gray-50 px-3 py-4 flex gap-3">
              <div className="flex-1 space-y-1.5">
                <div className="w-16 h-1 bg-[#623437]/40 rounded" /><div className="w-20 h-4 bg-[#623437] rounded" /><div className="w-12 h-1.5 bg-[#f5a623]/80 rounded" />
                <div className="w-full h-1 bg-gray-300 rounded mt-1" /><div className="w-4/5 h-1 bg-gray-300 rounded" /><div className="w-3/4 h-1 bg-gray-200 rounded" />
                <div className="flex gap-1.5 mt-2"><div className="w-12 h-3 bg-[#623437] rounded-lg" /><div className="w-12 h-3 border border-gray-300 rounded-lg" /></div>
              </div>
              <div className="w-16 h-24 rounded-xl bg-gradient-to-br from-gray-200 to-gray-300 flex-shrink-0" />
            </div>
            <div className="px-3 py-4 text-center" style={{ background: 'linear-gradient(135deg, #623437 0%, #f5a623 100%)' }}>
              <div className="w-20 h-2.5 bg-white/60 rounded mx-auto mb-1.5" /><div className="w-16 h-3 bg-white rounded-xl mx-auto" />
            </div>
          </div>
        ),
      },
      {
        id: 'storyteller', icon: '✍️', title: 'The Storyteller', subtitle: 'Dark · Cinematic · Editorial', subtitleColor: 'text-amber-400',
        description: 'Full-screen dark hero with dramatic typography. Grayscale-to-color gallery, editorial story layout. Great for creatives & speakers.',
        preview: (
          <div className="mt-4 rounded-xl overflow-hidden ring-1 ring-white/10 bg-[#080808] select-none pointer-events-none">
            <div className="relative px-3 py-5 flex flex-col items-center justify-center text-center overflow-hidden" style={{ background: 'linear-gradient(to bottom, rgba(98,52,55,0.35) 0%, #080808 100%)' }}>
              <div className="w-5 h-5 rounded-full bg-white/10 border border-white/20 mb-1.5" />
              <div className="w-24 h-5 bg-[#f5a623]/80 rounded mb-1" /><div className="w-16 h-1 bg-white/20 rounded mb-3" /><div className="w-14 h-3 rounded-full bg-[#f5a623]" />
            </div>
            <div className="px-3 py-3 border-t border-white/5 space-y-1">
              <div className="w-full h-1 bg-white/12 rounded" /><div className="w-3/4 h-1 bg-white/8 rounded" />
            </div>
            <div className="px-3 py-4 text-center border-t border-white/5" style={{ background: 'radial-gradient(ellipse at 50% 50%, rgba(98,52,55,0.25) 0%, transparent 70%)' }}>
              <div className="w-16 h-3 bg-white rounded-full mx-auto" />
            </div>
          </div>
        ),
      },
      {
        id: 'executive', icon: '⚡', title: 'The Executive', subtitle: 'Dark · Premium · Full-Bleed', subtitleColor: 'text-yellow-400',
        description: 'Full-screen hero with giant name overlay, numbered service cards, fan photo gallery. Built for personal brand powerhouses.',
        preview: (
          <div className="mt-4 rounded-xl overflow-hidden ring-1 ring-white/10 bg-[#0c0c0c] select-none pointer-events-none">
            <div className="relative px-3 pt-2 pb-0 overflow-hidden" style={{ height: '80px', background: 'linear-gradient(135deg, rgba(98,52,55,0.4) 0%, rgba(12,12,12,0.9) 100%)' }}>
              <div className="w-full h-5 bg-white/80 rounded mt-10" />
            </div>
            <div className="px-3 py-2 grid grid-cols-3 gap-1">
              {[0,1,2].map(i => <div key={i} className="bg-zinc-800 rounded-lg aspect-[3/4]" />)}
            </div>
            <div className="px-3 py-2 grid grid-cols-3 gap-1">
              {[0,1,2].map(i => (
                <div key={i} className="bg-[#141414] rounded-lg p-1.5 border border-white/5">
                  <div className="text-[8px] font-bold mb-1" style={{ color: '#f5a623' }}>{String(i+1).padStart(2,'0')}</div>
                  <div className="w-full h-0.5 bg-white/20 rounded mb-0.5" />
                </div>
              ))}
            </div>
          </div>
        ),
      },
    ];

    const ecommerceTemplates = [
      {
        id: 'ecommerce-classic', icon: '🌿', title: 'Natural & Soft', subtitle: 'Light · Warm · Organic', subtitleColor: 'text-rose-300',
        description: 'Cream-toned e-commerce layout with founder story, product showcase, video feed, and reviews. Ideal for beauty, wellness & lifestyle brands.',
        preview: (
          <div className="mt-4 rounded-xl overflow-hidden ring-1 ring-white/10 bg-[#faf8f5] select-none pointer-events-none">
            <div className="flex items-center justify-between px-3 py-2 border-b border-gray-200">
              <div className="w-10 h-1.5 bg-gray-800 rounded" />
              <div className="flex gap-2"><div className="w-8 h-1 bg-gray-400 rounded" /><div className="w-8 h-1 bg-gray-400 rounded" /><div className="w-8 h-1 bg-gray-400 rounded" /></div>
            </div>
            <div className="px-3 py-3 flex gap-2">
              <div className="flex-1 space-y-1.5">
                <div className="w-16 h-3 bg-gray-800 rounded font-bold" /><div className="w-24 h-2 bg-gray-800 rounded" />
                <div className="w-20 h-1 bg-gray-400 rounded" />
                <div className="flex gap-1 mt-2"><div className="w-1.5 h-1.5 rounded-full bg-yellow-400" /><div className="w-1.5 h-1.5 rounded-full bg-yellow-400" /><div className="w-1.5 h-1.5 rounded-full bg-yellow-400" /><div className="w-1.5 h-1.5 rounded-full bg-yellow-400" /><div className="w-1.5 h-1.5 rounded-full bg-yellow-400" /></div>
                <div className="flex gap-1 mt-1"><div className="w-10 h-2.5 bg-gray-900 rounded text-[5px] text-white flex items-center justify-center">Shop</div><div className="w-10 h-2.5 border border-gray-400 rounded" /></div>
              </div>
              <div className="w-14 h-20 rounded-lg bg-gradient-to-b from-stone-200 to-stone-300 flex-shrink-0" />
            </div>
            <div className="px-3 py-2 bg-stone-100 border-t border-stone-200">
              <div className="flex gap-2">
                <div className="w-10 h-14 bg-stone-300 rounded-lg flex-shrink-0" />
                <div className="flex-1 space-y-1 pt-1"><div className="w-full h-1.5 bg-gray-700 rounded" /><div className="w-3/4 h-1 bg-gray-400 rounded" /><div className="w-8 h-1.5 bg-gray-800 rounded mt-2" /></div>
              </div>
            </div>
            <div className="px-3 py-2 bg-gray-800">
              <div className="w-16 h-1.5 bg-white/50 rounded mb-1.5" />
              <div className="grid grid-cols-3 gap-1">
                {[0,1,2].map(i => <div key={i} className="bg-white/10 rounded aspect-[9/16]" />)}
              </div>
            </div>
            <div className="px-3 py-2">
              <div className="w-20 h-1.5 bg-gray-700 rounded mb-1.5" />
              <div className="grid grid-cols-3 gap-1">
                {[0,1,2].map(i => <div key={i} className="bg-stone-200 rounded aspect-square" />)}
              </div>
            </div>
          </div>
        ),
      },
      {
        id: 'ecommerce-bold', icon: '💎', title: 'Bold & Dramatic', subtitle: 'Dark · Luxury · High-Impact', subtitleColor: 'text-fuchsia-400',
        description: 'Dark luxury e-commerce template with high-contrast visuals, cinematic product reveal, video grid, and testimonials. Perfect for premium & fashion brands.',
        preview: (
          <div className="mt-4 rounded-xl overflow-hidden ring-1 ring-white/10 bg-[#0a0a0a] select-none pointer-events-none">
            <div className="flex items-center justify-between px-3 py-2 border-b border-white/10">
              <div className="w-10 h-1.5 bg-white/70 rounded" />
              <div className="flex gap-2"><div className="w-8 h-1 bg-white/30 rounded" /><div className="w-8 h-1 bg-white/30 rounded" /><div className="w-8 h-1 bg-white/30 rounded" /></div>
            </div>
            <div className="px-3 py-3 flex gap-2" style={{ background: 'linear-gradient(135deg, rgba(180,0,80,0.15) 0%, transparent 100%)' }}>
              <div className="flex-1 space-y-1.5">
                <div className="w-16 h-3 bg-white rounded" /><div className="w-20 h-2 bg-white/60 rounded" />
                <div className="flex gap-1 mt-1"><div className="w-1.5 h-1.5 rounded-full bg-yellow-400" /><div className="w-1.5 h-1.5 rounded-full bg-yellow-400" /><div className="w-1.5 h-1.5 rounded-full bg-yellow-400" /><div className="w-1.5 h-1.5 rounded-full bg-yellow-400" /><div className="w-1.5 h-1.5 rounded-full bg-yellow-400" /></div>
                <div className="flex gap-1 mt-1"><div className="w-10 h-2.5 bg-white rounded" /><div className="w-10 h-2.5 border border-white/30 rounded" /></div>
              </div>
              <div className="w-14 h-20 rounded-lg bg-gradient-to-b from-rose-900 to-gray-900 flex-shrink-0" />
            </div>
            <div className="px-3 py-2 border-t border-white/5">
              <div className="flex gap-2">
                <div className="w-10 h-14 bg-zinc-800 rounded-lg flex-shrink-0" />
                <div className="flex-1 space-y-1 pt-1"><div className="w-full h-1.5 bg-white/60 rounded" /><div className="w-3/4 h-1 bg-white/30 rounded" /><div className="w-8 h-1.5 bg-white rounded mt-2" /></div>
              </div>
            </div>
            <div className="px-3 py-2 bg-zinc-900/50">
              <div className="w-16 h-1.5 bg-white/30 rounded mb-1.5" />
              <div className="grid grid-cols-3 gap-1">
                {[0,1,2].map(i => <div key={i} className="bg-white/10 rounded aspect-[9/16]" />)}
              </div>
            </div>
            <div className="px-3 py-2">
              <div className="w-20 h-1.5 bg-white/30 rounded mb-1.5" />
              <div className="grid grid-cols-3 gap-1">
                {[0,1,2].map(i => <div key={i} className="bg-zinc-800 rounded aspect-square" />)}
              </div>
            </div>
          </div>
        ),
      },
    ];

    const shown = selectorCategory === 'ecommerce' ? ecommerceTemplates : personalTemplates;

    return (
      <Layout>
        <div className="p-4 md:p-8 max-w-6xl mx-auto">
          <button onClick={() => router.push('/dashboard')} className="text-gray-400 hover:text-white mb-4 flex items-center gap-2 text-sm">← Back</button>
          <h1 className="text-2xl md:text-3xl font-semibold text-white mb-1">Choose Your Template</h1>
          <p className="text-gray-400 text-sm md:text-base mb-6">Pick a style that fits your brand.</p>

          {/* Category tabs */}
          <div className="flex gap-2 mb-8">
            <button
              onClick={() => setSelectorCategory('personal')}
              className={`px-5 py-2.5 rounded-xl text-sm font-semibold transition ${selectorCategory === 'personal' ? 'bg-white text-black' : 'bg-white/10 text-gray-300 hover:bg-white/15'}`}
            >
              Personal Branding
            </button>
            <button
              onClick={() => setSelectorCategory('ecommerce')}
              className={`px-5 py-2.5 rounded-xl text-sm font-semibold transition ${selectorCategory === 'ecommerce' ? 'bg-white text-black' : 'bg-white/10 text-gray-300 hover:bg-white/15'}`}
            >
              E-Commerce
            </button>
          </div>

          <div className="grid md:grid-cols-2 gap-4 md:gap-6">
            {shown.map(t => (
              <button
                key={t.id}
                onClick={() => handleTemplateSelect(t.id)}
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
          </div>
        </div>
      </Layout>
    );
  }

  // ── EDITOR ────────────────────────────────────────────────────────────────────

  const meta = TEMPLATE_META[formData.template] || {};

  return (
    <Layout>

      {/* Category switch warning modal */}
      {showCategoryWarnModal && (
        <div className="fixed inset-0 z-[100] bg-black/80 flex items-center justify-center p-4">
          <div className="bg-[#111] rounded-2xl p-6 max-w-md w-full border border-gray-800">
            <h3 className="text-lg font-bold text-white mb-2">Switch Template Type?</h3>
            <p className="text-gray-400 text-sm leading-relaxed mb-6">
              Switching to a different type of template will clear your current page data. This cannot be undone.
            </p>
            <div className="flex gap-3">
              <button onClick={() => { setShowCategoryWarnModal(false); setPendingTemplateId(null); }} className="flex-1 px-4 py-2.5 bg-white/10 hover:bg-white/15 text-white rounded-lg text-sm font-medium transition">Cancel</button>
              <button onClick={confirmCategorySwitch} className="flex-1 px-4 py-2.5 bg-red-500 hover:bg-red-400 text-white rounded-lg text-sm font-semibold transition">Switch & Reset</button>
            </div>
          </div>
        </div>
      )}

      <div className="p-4 md:p-8 max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-3 mb-6 md:mb-8">
          <div>
            <button onClick={() => router.push('/dashboard')} className="text-gray-400 hover:text-white mb-2 md:mb-4 flex items-center gap-2 text-sm">← Back</button>
            <h1 className="text-2xl md:text-3xl font-semibold text-white">Founder Page Builder</h1>
          </div>
          <div className="flex gap-2 md:gap-4">
            <button
              onClick={async () => {
                if (!formData.username) { alert('Please enter a username first to preview your page'); setActiveTab(isEcommerce ? 'brand' : 'basicInfo'); return; }
                try {
                  setSaving(true);
                  await founderPageAPI.upsert(formData);
                  await new Promise(r => setTimeout(r, 500));
                  window.open(`/${formData.username}?preview=true`, '_blank');
                } catch { alert('Failed to save changes before preview. Please try again.'); }
                finally { setSaving(false); }
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
            <button onClick={() => activeTab !== tabs[0] && setActiveTab(tabs[tabs.indexOf(activeTab) - 1])} disabled={activeTab === tabs[0]} className="w-9 h-9 flex items-center justify-center rounded-full bg-white/10 text-white disabled:opacity-30 active:bg-white/20 transition">‹</button>
            <div className="text-center">
              <p className="text-white font-semibold text-sm">{tabLabels[activeTab]}</p>
              <p className="text-gray-500 text-xs">{tabs.indexOf(activeTab) + 1} of {tabs.length}</p>
            </div>
            {activeTab === tabs[tabs.length - 1] ? (
              <button onClick={() => handleAction('publish', true)} disabled={saving} className="w-9 h-9 flex items-center justify-center rounded-full bg-white text-black disabled:opacity-50 text-lg active:bg-gray-200 transition">🚀</button>
            ) : (
              <button onClick={() => setActiveTab(tabs[tabs.indexOf(activeTab) + 1])} className="w-9 h-9 flex items-center justify-center rounded-full bg-white/10 text-white active:bg-white/20 transition">›</button>
            )}
          </div>
          <div className="flex gap-1">
            {tabs.map((tab, i) => (
              <button key={tab} onClick={() => setActiveTab(tab)} className={`h-1 rounded-full flex-1 transition-all ${activeTab === tab ? 'bg-white' : i < tabs.indexOf(activeTab) ? 'bg-gray-500' : 'bg-gray-700'}`} />
            ))}
          </div>
        </div>

        {/* Desktop tab bar */}
        <div className="hidden md:block mb-8">
          <div className="bg-dark-card rounded-xl p-1.5 inline-flex gap-1 flex-wrap">
            {tabs.map(tab => (
              <button key={tab} onClick={() => setActiveTab(tab)} className={`px-5 py-3 rounded-lg text-sm font-medium transition whitespace-nowrap ${activeTab === tab ? 'bg-white text-black' : 'text-gray-400 hover:text-white'}`}>
                {tabLabels[tab]}
              </button>
            ))}
          </div>
        </div>

        <div className="bg-dark-card rounded-xl p-4 md:p-8 border border-gray-800 mb-4">

          {/* ── DESIGN TAB ── */}
          {activeTab === 'design' && (
            <div className="space-y-4 md:space-y-6">
              <div className="flex flex-col gap-3 md:flex-row md:justify-between md:items-center mb-4 md:mb-6">
                <h2 className="text-lg md:text-2xl font-semibold text-white">Design Settings</h2>
                <div className="flex gap-2">
                  <button onClick={() => setFormData(prev => ({ ...prev, design: { titleFont: 'Afacad', bodyFont: 'Poppins', primaryColor: '#623437', secondaryColor: '#f5a623' } }))} className="flex-1 md:flex-none px-3 md:px-4 py-2 bg-white/5 hover:bg-white/10 text-gray-300 border border-gray-700 rounded-lg text-xs md:text-sm font-medium transition">Reset</button>
                  <button onClick={() => { setSelectorCategory(isEcommerce ? 'ecommerce' : 'personal'); setShowTemplateSelector(true); }} className="flex-1 md:flex-none px-3 md:px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg text-xs md:text-sm font-medium transition flex items-center justify-center gap-1.5">🔄 Change Template</button>
                </div>
              </div>
              <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-3 md:p-4 mb-4 md:mb-6">
                <p className="text-blue-400 text-xs md:text-sm">Template: <strong>{meta.icon} {meta.label}</strong></p>
                <p className="text-blue-300 text-xs mt-0.5">{meta.style}</p>
              </div>
              <div className="grid grid-cols-2 gap-4 md:gap-6">
                <SelectInput label="Title Font" value={formData.design.titleFont} onChange={e => updateNested('design', 'titleFont', e.target.value)} options={['Afacad', 'Poppins', 'Inter', 'Montserrat']} />
                <SelectInput label="Body Font" value={formData.design.bodyFont} onChange={e => updateNested('design', 'bodyFont', e.target.value)} options={['Poppins', 'Inter', 'Roboto']} />
                <ColorPicker label="Primary Color" value={formData.design.primaryColor} onChange={c => updateNested('design', 'primaryColor', c)} />
                <ColorPicker label="Secondary Color" value={formData.design.secondaryColor} onChange={c => updateNested('design', 'secondaryColor', c)} />
              </div>
            </div>
          )}

          {/* ── PERSONAL: BASIC INFO ── */}
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

          {/* ── PERSONAL: CONTACT ── */}
          {activeTab === 'contact' && !isEcommerce && (
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

          {/* ── PERSONAL: SERVICES ── */}
          {activeTab === 'services' && (
            <div className="space-y-4 md:space-y-6">
              <div className="flex justify-between items-center mb-4 md:mb-6">
                <div><h2 className="text-lg md:text-2xl font-semibold text-white">Services</h2><p className="text-gray-400 text-xs md:text-sm mt-0.5">Minimum 2 required</p></div>
                <button onClick={() => addArrayItem('services', { title: '', description: '' })} className="px-4 md:px-6 py-2 md:py-3 bg-white text-black rounded-lg text-sm font-semibold hover:bg-gray-200 transition">+ Add</button>
              </div>
              {formData.services.map((service, index) => (
                <div key={service.id} className="bg-black/20 rounded-xl p-4 md:p-6 border border-gray-700 space-y-3 md:space-y-4">
                  <div className="flex justify-between items-start">
                    <h3 className="text-white text-sm md:text-base font-semibold">Service {index + 1}</h3>
                    {formData.services.length > 2 && <button onClick={() => deleteArrayItem('services', service.id, 2)} className="text-red-400 hover:text-red-300 text-sm">🗑️</button>}
                  </div>
                  <TextInput label="Title" placeholder="Consulting" value={service.title} onChange={e => updateArray('services', service.id, 'title', e.target.value)} />
                  <TextArea label="Description" placeholder="Describe this service..." value={service.description} onChange={e => updateArray('services', service.id, 'description', e.target.value)} />
                </div>
              ))}
            </div>
          )}

          {/* ── PERSONAL: PORTFOLIO ── */}
          {activeTab === 'portfolio' && (
            <div className="space-y-4 md:space-y-6">
              <div className="mb-4 md:mb-6">
                <h2 className="text-lg md:text-2xl font-semibold text-white">Gallery</h2>
                <p className="text-xs md:text-sm text-gray-400 mt-0.5">Square images (1:1) · 1000×1000px recommended</p>
              </div>
              <div className="grid grid-cols-3 md:grid-cols-2 gap-3 md:gap-6">
                {[...Array(6)].map((_, i) => (
                  <ImageUpload key={i} label={`${i + 1}`} id={`portfolio-${i}`} onUpload={file => handlePortfolioUpload(file, i)} imageUrl={formData.portfolio.images?.[i]?.url} uploading={uploading} isSquare />
                ))}
              </div>
            </div>
          )}

          {/* ── PERSONAL: FEATURED ── */}
          {activeTab === 'featured' && (
            <div className="space-y-4 md:space-y-6">
              <div className="flex justify-between items-center mb-4 md:mb-6">
                <div><h2 className="text-lg md:text-2xl font-semibold text-white">Featured Work</h2><p className="text-gray-400 text-xs md:text-sm mt-0.5">Showcase your best projects</p></div>
                <button onClick={() => addArrayItem('featured', { title: '', subtitle: '', year: '', imageUrl: '' })} className="px-4 md:px-6 py-2 md:py-3 bg-white text-black rounded-lg text-sm font-semibold hover:bg-gray-200 transition">+ Add</button>
              </div>
              {formData.featured.length === 0 ? (
                <div className="text-center py-10 text-gray-500 text-sm">No featured work yet. Tap "+ Add" to get started.</div>
              ) : formData.featured.map((work, index) => (
                <div key={work.id} className="bg-black/20 rounded-xl p-4 md:p-6 border border-gray-700 space-y-3 md:space-y-4">
                  <div className="flex justify-between items-start">
                    <h3 className="text-white text-sm md:text-base font-semibold">Project {index + 1}</h3>
                    <button onClick={() => deleteArrayItem('featured', work.id)} className="text-red-400 hover:text-red-300 text-sm">🗑️</button>
                  </div>
                  <div className="grid grid-cols-2 gap-3 md:gap-4">
                    <TextInput label="Title" placeholder="Vogue Magazine" value={work.title} onChange={e => updateArray('featured', work.id, 'title', e.target.value)} />
                    <TextInput label="Subtitle" placeholder="Editorial Feature" value={work.subtitle} onChange={e => updateArray('featured', work.id, 'subtitle', e.target.value)} />
                  </div>
                  <TextInput label="Year" placeholder="2024" value={work.year} onChange={e => updateArray('featured', work.id, 'year', e.target.value)} />
                  <ImageUpload label="Project Image (1200×800px)" id={`featured-${work.id}`} onUpload={file => handleFeaturedImageUpload(file, work.id)} imageUrl={work.imageUrl} uploading={uploading} />
                </div>
              ))}
            </div>
          )}

          {/* ── ECOMMERCE: BRAND ── */}
          {activeTab === 'brand' && (
            <div className="space-y-4 md:space-y-6">
              <h2 className="text-lg md:text-2xl font-semibold text-white mb-4 md:mb-6">Brand Information</h2>
              <div className="grid md:grid-cols-2 gap-4 md:gap-6">
                <ImageUpload
                  label="Logo (Square · 500×500px)"
                  note="Displayed in the header navigation"
                  id="ec-logo" onUpload={file => handleEcommerceUpload(file, 'logoUrl')} imageUrl={formData.ecommerce.logoUrl} uploading={uploading}
                />
                <ImageUpload
                  label="Hero/Banner Image (1920×1080px)"
                  note="Full-width background image for the hero section"
                  id="ec-hero" onUpload={file => handleEcommerceUpload(file, 'heroImageUrl')} imageUrl={formData.ecommerce.heroImageUrl} uploading={uploading}
                />
                <ImageUpload
                  label="Founder Portrait (800×1000px · 4:5)"
                  note="Shown in the hero and philosophy sections alongside your brand story"
                  id="ec-founder" onUpload={file => handleEcommerceUpload(file, 'founderPhotoUrl')} imageUrl={formData.ecommerce.founderPhotoUrl} uploading={uploading}
                />
                <div className="space-y-4">
                  <TextInput className="md:col-span-2" label="Username *" value={formData.username} prefix="personify.so/" onChange={e => setFormData({ ...formData, username: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '') })} />
                  <TextInput label="Brand Name" placeholder="AUREA" value={formData.ecommerce.brandName} onChange={e => updateEcommerce('brandName', e.target.value)} />
                  <TextInput label="Tagline" placeholder="Quiet Luxury, Rooted in Science" value={formData.ecommerce.tagline} onChange={e => updateEcommerce('tagline', e.target.value)} />
                </div>
                <TextInput label="Founder Name" placeholder="Jane Doe" value={formData.ecommerce.founderName} onChange={e => updateEcommerce('founderName', e.target.value)} />
                <TextInput label="Founder Title" placeholder="Founder & CEO" value={formData.ecommerce.founderTitle} onChange={e => updateEcommerce('founderTitle', e.target.value)} />
                <TextArea className="md:col-span-2" label="Brand Story / Philosophy" placeholder="Share the story behind your brand — what inspired you, what you stand for, and what makes your products unique..." rows={5} value={formData.ecommerce.brandStory} onChange={e => updateEcommerce('brandStory', e.target.value)} />
                <TextInput label="Shop URL" placeholder="https://yourshop.com" value={formData.ecommerce.shopUrl} onChange={e => updateEcommerce('shopUrl', e.target.value)} />
              </div>

              <div className="border-t border-gray-700 pt-6">
                <h3 className="text-white font-semibold mb-1">Social Links</h3>
                <p className="text-gray-400 text-xs mb-4">Shown in the footer and hero section</p>
                <div className="grid md:grid-cols-3 gap-4">
                  <TextInput label="Instagram" placeholder="@yourbrand" value={formData.ecommerce.socialInstagram} onChange={e => updateEcommerce('socialInstagram', e.target.value)} />
                  <TextInput label="TikTok" placeholder="@yourbrand" value={formData.ecommerce.socialTiktok} onChange={e => updateEcommerce('socialTiktok', e.target.value)} />
                  <TextInput label="YouTube" placeholder="@yourchannel" value={formData.ecommerce.socialYoutube} onChange={e => updateEcommerce('socialYoutube', e.target.value)} />
                </div>
              </div>

              <div className="border-t border-gray-700 pt-6">
                <h3 className="text-white font-semibold mb-1">Brand Standards</h3>
                <p className="text-gray-400 text-xs mb-4">3 values or certifications that define your brand (e.g. Cruelty Free, Organic, etc.)</p>
                <div className="space-y-3">
                  {formData.ecommerce.standards.map((s, i) => (
                    <div key={s.id} className="bg-black/20 rounded-xl p-4 border border-gray-700 grid md:grid-cols-2 gap-3">
                      <TextInput label={`Standard ${i + 1} Title`} placeholder="Cruelty Free" value={s.title} onChange={e => updateStandard(s.id, 'title', e.target.value)} />
                      <TextInput label="Description" placeholder="Short description..." value={s.description} onChange={e => updateStandard(s.id, 'description', e.target.value)} />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ── ECOMMERCE: SHOP ── */}
          {activeTab === 'shop' && (
            <div className="space-y-6 md:space-y-8">

              {/* Featured Product */}
              <div>
                <h2 className="text-lg md:text-2xl font-semibold text-white mb-1">Featured Product</h2>
                <p className="text-gray-400 text-xs md:text-sm mb-5">The hero product displayed prominently above the fold</p>
                <div className="bg-black/20 rounded-xl p-4 md:p-6 border border-gray-700 space-y-4">
                  <div className="grid md:grid-cols-2 gap-4">
                    <ImageUpload
                      label="Product Image (800×800px · Square)"
                      note="Square crop works best. Use a clean, well-lit product photo."
                      id="ec-fp-img" onUpload={handleFeaturedProductImageUpload} imageUrl={formData.ecommerce.featuredProduct.imageUrl} uploading={uploading}
                    />
                    <div className="space-y-3">
                      <TextInput label="Product Name" placeholder="Lumière Botanique" value={formData.ecommerce.featuredProduct.name} onChange={e => updateFeaturedProduct('name', e.target.value)} />
                      <TextInput label="Price" placeholder="$84.00" value={formData.ecommerce.featuredProduct.price} onChange={e => updateFeaturedProduct('price', e.target.value)} />
                      <TextInput label="Badge (optional)" placeholder="Best Seller" value={formData.ecommerce.featuredProduct.badge} onChange={e => updateFeaturedProduct('badge', e.target.value)} />
                    </div>
                  </div>
                  <TextArea label="Product Description" placeholder="A brief, compelling description of this product..." rows={3} value={formData.ecommerce.featuredProduct.description} onChange={e => updateFeaturedProduct('description', e.target.value)} />
                  <div>
                    <label className="block text-xs md:text-sm font-medium text-white mb-2">Key Features (3 bullet points)</label>
                    <div className="space-y-2">
                      <TextInput placeholder="e.g. Formulated with 12 rare plant extracts" value={formData.ecommerce.featuredProduct.bullet1} onChange={e => updateFeaturedProduct('bullet1', e.target.value)} />
                      <TextInput placeholder="e.g. Suited for all skin types including sensitive" value={formData.ecommerce.featuredProduct.bullet2} onChange={e => updateFeaturedProduct('bullet2', e.target.value)} />
                      <TextInput placeholder="e.g. Science-backed and dermatologist tested" value={formData.ecommerce.featuredProduct.bullet3} onChange={e => updateFeaturedProduct('bullet3', e.target.value)} />
                    </div>
                  </div>
                </div>
              </div>

              {/* Product Collection */}
              <div className="border-t border-gray-700 pt-6">
                <div className="flex justify-between items-center mb-1">
                  <h3 className="text-white font-semibold">Product Collection</h3>
                  {formData.ecommerce.collection.length < 6 && (
                    <button onClick={() => addEcommerceItem('collection', { name: '', price: '', badge: '', imageUrl: '' })} className="px-4 py-2 bg-white text-black rounded-lg text-sm font-semibold hover:bg-gray-200 transition">+ Add</button>
                  )}
                </div>
                <p className="text-gray-400 text-xs mb-5">Up to 6 products displayed in your collection grid</p>
                {formData.ecommerce.collection.length === 0 ? (
                  <div className="text-center py-8 text-gray-500 text-sm">No products yet. Tap "+ Add" to start building your collection.</div>
                ) : (
                  <div className="space-y-3">
                    {formData.ecommerce.collection.map((item, i) => (
                      <div key={item.id} className="bg-black/20 rounded-xl p-4 border border-gray-700">
                        <div className="flex justify-between items-center mb-3">
                          <span className="text-white text-sm font-semibold">Product {i + 1}</span>
                          <button onClick={() => deleteEcommerceItem('collection', item.id)} className="text-red-400 hover:text-red-300 text-sm">🗑️</button>
                        </div>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                          <ImageUpload
                            label="Image (600×600px)"
                            note="Square"
                            id={`ec-col-${item.id}`} onUpload={file => handleCollectionImageUpload(file, item.id)} imageUrl={item.imageUrl} uploading={uploading} isSquare
                          />
                          <div className="col-span-1 md:col-span-3 grid md:grid-cols-3 gap-3 content-start">
                            <TextInput label="Product Name" placeholder="Crème Riche" value={item.name} onChange={e => updateCollectionItem(item.id, 'name', e.target.value)} />
                            <TextInput label="Price" placeholder="$64.00" value={item.price} onChange={e => updateCollectionItem(item.id, 'price', e.target.value)} />
                            <TextInput label="Badge (optional)" placeholder="New · Sale · etc." value={item.badge} onChange={e => updateCollectionItem(item.id, 'badge', e.target.value)} />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ── ECOMMERCE: VIDEOS ── */}
          {activeTab === 'videos' && (
            <div className="space-y-4 md:space-y-6">
              <div>
                <h2 className="text-lg md:text-2xl font-semibold text-white mb-1">Video Feed</h2>
                <p className="text-gray-400 text-xs md:text-sm mb-5">Up to 4 videos — YouTube, TikTok, or Instagram Reels. The layout adjusts automatically based on how many you add.</p>
              </div>
              <TextInput label="Section Title" placeholder="TikTok Rituals" value={formData.ecommerce.videoSectionTitle} onChange={e => updateEcommerce('videoSectionTitle', e.target.value)} />

              <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-3 text-blue-300 text-xs leading-relaxed">
                <strong className="text-blue-400">Supported URL formats:</strong><br />
                YouTube: <code>youtube.com/watch?v=...</code> or <code>youtu.be/...</code><br />
                TikTok: <code>tiktok.com/@username/video/...</code><br />
                Instagram: <code>instagram.com/reel/...</code> or <code>instagram.com/p/...</code>
              </div>

              <div className="space-y-3">
                {formData.ecommerce.videos.length === 0 && (
                  <div className="text-center py-8 text-gray-500 text-sm">No videos yet. Tap "+ Add Video" below.</div>
                )}
                {formData.ecommerce.videos.map((v, i) => (
                  <div key={v.id} className="bg-black/20 rounded-xl p-4 border border-gray-700 flex gap-3 items-center">
                    <span className="text-gray-500 text-sm w-5 flex-shrink-0">{i + 1}</span>
                    <input
                      type="url"
                      placeholder="Paste YouTube, TikTok, or Instagram URL..."
                      value={v.url}
                      onChange={e => setFormData(prev => ({ ...prev, ecommerce: { ...prev.ecommerce, videos: prev.ecommerce.videos.map(x => x.id === v.id ? { ...x, url: e.target.value } : x) } }))}
                      className="flex-1 px-3 py-2.5 bg-black/40 border border-gray-700 rounded-lg text-sm text-white placeholder-gray-500 focus:border-brand-pink focus:ring-1 focus:ring-brand-pink outline-none transition"
                    />
                    <button onClick={() => deleteEcommerceItem('videos', v.id)} className="text-red-400 hover:text-red-300 text-sm flex-shrink-0">🗑️</button>
                  </div>
                ))}
                {formData.ecommerce.videos.length < 4 && (
                  <button onClick={() => addEcommerceItem('videos', { url: '' })} className="w-full py-3 border-2 border-dashed border-gray-700 hover:border-brand-pink text-gray-400 hover:text-white rounded-xl text-sm font-medium transition">
                    + Add Video {formData.ecommerce.videos.length > 0 ? `(${formData.ecommerce.videos.length}/4)` : ''}
                  </button>
                )}
                {formData.ecommerce.videos.length >= 4 && (
                  <p className="text-center text-gray-500 text-xs">Maximum 4 videos reached</p>
                )}
              </div>
            </div>
          )}

          {/* ── ECOMMERCE: REVIEWS ── */}
          {activeTab === 'reviews' && (
            <div className="space-y-4 md:space-y-6">
              <div className="flex justify-between items-center mb-1">
                <div>
                  <h2 className="text-lg md:text-2xl font-semibold text-white">Customer Reviews</h2>
                  <p className="text-gray-400 text-xs md:text-sm mt-0.5">Up to 6 reviews displayed on your page</p>
                </div>
                {formData.ecommerce.reviews.length < 6 && (
                  <button onClick={() => addEcommerceItem('reviews', { name: '', rating: 5, text: '' })} className="px-4 py-2 bg-white text-black rounded-lg text-sm font-semibold hover:bg-gray-200 transition">+ Add</button>
                )}
              </div>
              {formData.ecommerce.reviews.length === 0 ? (
                <div className="text-center py-10 text-gray-500 text-sm">No reviews yet. Tap "+ Add" to add a customer review.</div>
              ) : (
                formData.ecommerce.reviews.map((r, i) => (
                  <div key={r.id} className="bg-black/20 rounded-xl p-4 md:p-6 border border-gray-700 space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-white text-sm font-semibold">Review {i + 1}</span>
                      <button onClick={() => deleteEcommerceItem('reviews', r.id)} className="text-red-400 hover:text-red-300 text-sm">🗑️</button>
                    </div>
                    <div className="grid md:grid-cols-2 gap-3">
                      <TextInput label="Customer Name" placeholder="Sarah M." value={r.name} onChange={e => setFormData(prev => ({ ...prev, ecommerce: { ...prev.ecommerce, reviews: prev.ecommerce.reviews.map(x => x.id === r.id ? { ...x, name: e.target.value } : x) } }))} />
                      <div>
                        <label className="block text-xs md:text-sm font-medium text-white mb-1.5">Star Rating</label>
                        <div className="flex gap-2">
                          {[1,2,3,4,5].map(n => (
                            <button key={n} onClick={() => setFormData(prev => ({ ...prev, ecommerce: { ...prev.ecommerce, reviews: prev.ecommerce.reviews.map(x => x.id === r.id ? { ...x, rating: n } : x) } }))} className={`text-2xl transition ${n <= r.rating ? 'text-yellow-400' : 'text-gray-600'}`}>★</button>
                          ))}
                        </div>
                      </div>
                    </div>
                    <TextArea label="Review Text" placeholder="This product completely transformed my skincare routine..." rows={3} value={r.text} onChange={e => setFormData(prev => ({ ...prev, ecommerce: { ...prev.ecommerce, reviews: prev.ecommerce.reviews.map(x => x.id === r.id ? { ...x, text: e.target.value } : x) } }))} />
                  </div>
                ))
              )}
            </div>
          )}

          {/* ── ECOMMERCE: CONTACT ── */}
          {activeTab === 'contact' && isEcommerce && (
            <div className="space-y-4 md:space-y-6">
              <h2 className="text-lg md:text-2xl font-semibold text-white mb-4 md:mb-6">Contact & CTA</h2>
              <div className="grid md:grid-cols-2 gap-4 md:gap-6">
                <TextInput type="email" label="Email" placeholder="hello@yourbrand.com" value={formData.contact.email} onChange={e => updateNested('contact', 'email', e.target.value)} />
                <TextInput type="tel" label="Phone" placeholder="+1 (555) 123-4567" value={formData.contact.phone} onChange={e => updateNested('contact', 'phone', e.target.value)} />
                <TextInput className="md:col-span-2" label="Location" placeholder="New York, NY" value={formData.contact.location} onChange={e => updateNested('contact', 'location', e.target.value)} />
                <TextInput className="md:col-span-2" label="CTA Button Text" placeholder="Shop The Collection" value={formData.contact.ctaText} onChange={e => updateNested('contact', 'ctaText', e.target.value)} />
              </div>
            </div>
          )}

          {/* ── FAQ (shared) ── */}
          {activeTab === 'faq' && (
            <div className="space-y-4 md:space-y-6">
              <div className="flex justify-between items-center mb-4 md:mb-6">
                <div>
                  <h2 className="text-lg md:text-2xl font-semibold text-white">FAQ</h2>
                  <p className="text-gray-400 text-xs md:text-sm mt-0.5">Up to 4 custom questions — shown after the 2 standard ones</p>
                </div>
                {(formData.faq || []).length < 4 && (
                  <button onClick={() => addArrayItem('faq', { type: 'connections', customQuestion: '', answer: '' })} className="px-4 md:px-6 py-2 md:py-3 bg-white text-black rounded-lg text-sm font-semibold hover:bg-gray-200 transition">+ Add</button>
                )}
              </div>
              <div className="space-y-3">
                <p className="text-xs text-gray-500 uppercase tracking-wider font-semibold">Always shown on your page</p>
                {['What is Personify?', 'What is a Founder Page?'].map((q, i) => (
                  <div key={i} className="bg-black/10 rounded-xl p-4 border border-gray-800 flex items-center gap-3 opacity-60">
                    <span className="text-gray-500 text-xs">Q{i + 1}</span>
                    <p className="text-sm text-gray-400">{q}</p>
                    <span className="ml-auto text-[10px] text-gray-600 bg-gray-800 px-2 py-0.5 rounded">Static</span>
                  </div>
                ))}
              </div>
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
                      <select value={item.type} onChange={e => updateArray('faq', item.id, 'type', e.target.value)} className="w-full px-3 md:px-4 py-2.5 md:py-3 bg-black/40 border border-gray-700 rounded-lg text-sm text-white focus:border-brand-pink focus:ring-1 focus:ring-brand-pink outline-none transition">
                        {FAQ_PRESETS.map(p => <option key={p.value} value={p.value}>{p.label}</option>)}
                      </select>
                    </div>
                    {item.type === 'custom' && (
                      <TextInput label="Your question" placeholder="Type your question here..." value={item.customQuestion} onChange={e => updateArray('faq', item.id, 'customQuestion', e.target.value)} />
                    )}
                    <TextArea label="Your answer" placeholder="Write your answer here..." value={item.answer} onChange={e => updateArray('faq', item.id, 'answer', e.target.value)} rows={3} />
                  </div>
                ))
              )}
            </div>
          )}

          {/* Mobile save */}
          <div className="md:hidden mt-6 pt-4 border-t border-gray-700">
            <button onClick={() => handleAction('save')} disabled={saving} className="w-full py-2.5 bg-white/10 hover:bg-white/20 text-white rounded-lg text-sm font-semibold transition">
              {saving ? 'Saving...' : 'Save Draft'}
            </button>
          </div>

          {/* Desktop nav */}
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
