'use client'

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { personaAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';

const STEPS = ['welcome', 'images', 'industry', 'audience', 'brandTone', 'review'];
const STEP_LABELS = { welcome: 'Welcome', images: 'Your Images', industry: 'Industry', audience: 'Audience', brandTone: 'Brand Tone', review: 'Review' };

const INDUSTRIES = ['Fashion & Beauty', 'Tech & Lifestyle', 'Fitness & Wellness', 'Food & Cooking', 'Travel & Adventure', 'Business & Finance', 'Art & Design', 'Education', 'Entertainment', 'Other'];
const AGE_RANGES = ['18-24', '25-34', '35-44', '45-54', '55+'];
const DEMOGRAPHICS = ['Gen Z', 'Millennials', 'Professionals', 'Parents', 'Students', 'Entrepreneurs'];
const BRAND_TONES = ['Professional', 'Casual & Fun', 'Luxury', 'Bold & Edgy', 'Minimal & Clean', 'Warm and Friendly', 'Creative & Artistic', 'Authentic & Raw'];

const STEP_ICONS = {
  welcome:   <img src="/images/icon-welcome.png"   alt="" className="w-4 h-4 sm:w-5 sm:h-5" />,
  images:    <img src="/images/icon-images.png"    alt="" className="w-4 h-4 sm:w-5 sm:h-5" />,
  industry:  <img src="/images/icon-industry.png"  alt="" className="w-4 h-4 sm:w-5 sm:h-5" />,
  audience:  <img src="/images/icon-audience.png"  alt="" className="w-4 h-4 sm:w-5 sm:h-5" />,
  brandTone: <img src="/images/icon-brandtone.png" alt="" className="w-4 h-4 sm:w-5 sm:h-5" />,
  review:    <img src="/images/icon-review.png"    alt="" className="w-4 h-4 sm:w-5 sm:h-5" />,
};

export default function Onboarding() {
  const router = useRouter();
  const { user } = useAuth();
  const fileInputRef = useRef(null);

  const [stepIndex, setStepIndex] = useState(0);
  const [maxStep, setMaxStep] = useState(0);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState('');
  const [showCommunity, setShowCommunity] = useState(false);

  // Images queued locally — uploaded only after persona is created at the end
  const [imageFiles, setImageFiles] = useState([]);
  const [imagePreviews, setImagePreviews] = useState([]);

  const [industry, setIndustry] = useState('');
  const [niche, setNiche] = useState('');
  const [ageRange, setAgeRange] = useState('');
  const [demographic, setDemographic] = useState('');
  const [selectedTones, setSelectedTones] = useState([]);
  const [bio, setBio] = useState('');

  // Skip or already onboarded — redirect to dashboard
  useEffect(() => {
    if (!user) return;
    const key = `personify_onboarded_${user.id}`;
    if (localStorage.getItem(key)) {
      router.replace('/dashboard');
    }
  }, [user, router]);

  const markDone = () => {
    if (user) localStorage.setItem(`personify_onboarded_${user.id}`, 'true');
  };

  const handleSkip = () => {
    markDone();
    router.replace('/dashboard');
  };

  const handleImageAdd = (files) => {
    const valid = Array.from(files).filter(
      f => f.type.startsWith('image/') && f.size <= 5 * 1024 * 1024
    );
    setImageFiles(prev => [...prev, ...valid]);
    setImagePreviews(prev => [...prev, ...valid.map(f => URL.createObjectURL(f))]);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleRemoveImage = (index) => {
    URL.revokeObjectURL(imagePreviews[index]);
    setImageFiles(prev => prev.filter((_, i) => i !== index));
    setImagePreviews(prev => prev.filter((_, i) => i !== index));
  };

  const toggleTone = (tone) => {
    setSelectedTones(prev =>
      prev.includes(tone)
        ? prev.filter(t => t !== tone)
        : prev.length < 3 ? [...prev, tone] : prev
    );
  };

  const handleCreatePersona = async () => {
    setSaving(true);
    try {
      const industryValue = [industry, niche].filter(Boolean).join(' - ');
      const audienceValue = [ageRange, demographic].filter(Boolean).join(', ');
      const toneValue = selectedTones.join(', ');

      // Create persona first
      await personaAPI.create({
        bio,
        industry: industryValue,
        targetAudience: audienceValue,
        brandTone: toneValue
      });

      // Upload queued images — non-fatal if they fail (can add from Persona page)
      for (const file of imageFiles) {
        try {
          const data = new FormData();
          data.append('image', file);
          await personaAPI.uploadImage(data);
        } catch (imgErr) {
          console.warn('Image upload skipped:', imgErr.message);
        }
      }

      markDone();
      setShowCommunity(true);
    } catch (err) {
      console.error('Create persona error:', err);
      setSaveError(err.response?.data?.error || 'Something went wrong. Please try again.');
      setSaving(false);
    }
  };

  const currentStep = STEPS[stepIndex];
  const isFirst = stepIndex === 0;
  const isLast = stepIndex === STEPS.length - 1;

  if (showCommunity) {
    return (
      <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center px-6 py-12">
        <div className="w-full max-w-sm">
          {/* Checkmark badge */}
          <div className="flex justify-center mb-6">
            <div className="w-14 h-14 rounded-full bg-white/10 border border-gray-700 flex items-center justify-center">
              <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
              </svg>
            </div>
          </div>

          <p className="text-center text-gray-400 text-sm mb-8">Your persona is ready. One last thing —</p>

          {/* Community card */}
          <div className="bg-white/5 border border-gray-800 rounded-2xl p-6 text-center">
            {/* WhatsApp icon */}
            <div className="flex justify-center mb-4">
              <div className="w-12 h-12 rounded-full bg-[#25D366]/15 flex items-center justify-center">
                <svg className="w-6 h-6" viewBox="0 0 24 24" fill="#25D366">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                </svg>
              </div>
            </div>

            <h2 className="text-xl font-bold text-white mb-2">Join the Personify Community</h2>
            <p className="text-gray-400 text-sm leading-relaxed mb-6">
              Get tips, share your work, and connect with other creators building their personal brand with AI.
            </p>

            {/* QR code */}
            <div className="flex justify-center mb-4">
              <img
                src="/images/whatsapp-qr.png"
                alt="WhatsApp QR code"
                className="w-40 h-40 rounded-xl object-cover border border-gray-700"
              />
            </div>

            <p className="text-xs text-gray-500 mb-5">Scan with your WhatsApp camera to join</p>

            <a
              href="https://chat.whatsapp.com/L4wfh1pqe6vAE8vpGFGxEu"
              target="_blank"
              rel="noopener noreferrer"
              className="block w-full py-3 rounded-xl font-semibold text-white text-sm transition"
              style={{ backgroundColor: '#25D366' }}
            >
              Join on WhatsApp
            </a>
          </div>

          <button
            onClick={() => router.replace('/dashboard')}
            className="mt-5 w-full text-center text-gray-500 hover:text-gray-300 text-sm transition"
          >
            Skip for now →
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white flex flex-col">
      {/* Header */}
      <div className="px-4 sm:px-8 py-4 sm:py-6 flex items-center justify-between border-b border-gray-900">
        <Link href="/" className="flex items-center gap-2">
          <img src="/images/logo.png" alt="Personify" className="w-7 h-7" />
          <span className="text-lg font-semibold">Personify</span>
        </Link>
        <div className="flex items-center gap-3 sm:gap-6">
          <span className="text-gray-400 text-xs sm:text-sm">{stepIndex + 1}/{STEPS.length}</span>
          <button onClick={handleSkip} className="text-gray-500 hover:text-gray-300 text-sm transition">
            Skip
          </button>
        </div>
      </div>

      {/* Progress Steps */}
      <div className="px-4 sm:px-8 py-4 sm:py-6 flex items-start justify-center gap-0">
        {STEPS.map((step, i) => {
          const isActive = i === stepIndex;
          const isVisited = i <= maxStep;
          const isClickable = isVisited && !isActive;
          return (
            <div key={step} className="flex items-start">
              <div className="flex flex-col items-center">
                <div
                  onClick={() => isClickable && setStepIndex(i)}
                  className={`w-7 h-7 sm:w-10 sm:h-10 rounded-full flex items-center justify-center transition-all ${
                    isActive ? 'bg-white text-black' :
                    isVisited ? 'bg-white text-black' :
                    'bg-gray-800 text-gray-600'
                  } ${isClickable ? 'cursor-pointer hover:opacity-75' : ''}`}
                >
                  {isVisited && !isActive
                    ? <svg className="w-3 h-3 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" /></svg>
                    : <span className="[&>svg]:w-3 [&>svg]:h-3 sm:[&>svg]:w-5 sm:[&>svg]:h-5">{STEP_ICONS[step]}</span>
                  }
                </div>
                <span
                  onClick={() => isClickable && setStepIndex(i)}
                  className={`hidden sm:block text-xs mt-2 font-medium whitespace-nowrap transition-colors ${
                    isActive ? 'text-white' : isVisited ? 'text-gray-400 cursor-pointer hover:text-white' : 'text-gray-600'
                  }`}
                >
                  {STEP_LABELS[step]}
                </span>
              </div>
              {i < STEPS.length - 1 && (
                <div className={`h-px w-6 sm:w-16 mt-3.5 sm:mt-5 mx-0.5 sm:mx-1 transition-all ${i < maxStep + 1 ? 'bg-white' : 'bg-gray-800'}`} />
              )}
            </div>
          );
        })}
      </div>

      {/* Step Content */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 py-8 max-w-3xl mx-auto w-full">

        {/* STEP 1: Welcome */}
        {currentStep === 'welcome' && (
          <div className="text-center w-full">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/10 rounded-full text-sm mb-8">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
              </svg>
              Build Your Digital Persona
            </div>
            <h1 className="text-3xl sm:text-5xl font-bold mb-4 sm:mb-6 leading-tight">
              Your Creative Journey<br />Starts With You
            </h1>
            <p className="text-gray-400 text-base sm:text-lg mb-8 sm:mb-12 max-w-xl mx-auto">
              Create a personalised AI persona that understands your style, audience and brand.
              Generate stunning content that truly represents who you are.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 mb-8 sm:mb-12">
              {[
                { icon: '👤', title: 'Your Identity', desc: 'Upload your photos and define your unique style' },
                { icon: '🎯', title: 'Your Audience', desc: 'Define who you create content for' },
                { icon: '✨', title: 'AI Magic', desc: 'Generate personalised content instantly' }
              ].map(card => (
                <div key={card.title} className="bg-white/5 border border-gray-800 rounded-xl p-6 text-left">
                  <span className="text-2xl mb-3 block">{card.icon}</span>
                  <p className="font-semibold mb-1">{card.title}</p>
                  <p className="text-gray-400 text-sm">{card.desc}</p>
                </div>
              ))}
            </div>
            <p className="text-gray-500 text-sm">This will take 3-4 minutes</p>
          </div>
        )}

        {/* STEP 2: Your Images */}
        {currentStep === 'images' && (
          <div className="w-full">
            <div className="text-center mb-10">
              <h1 className="text-2xl sm:text-4xl font-bold mb-4">Upload Your Reference Images</h1>
              <p className="text-gray-400 max-w-md mx-auto">
                These photos will help AI understand your appearance and style.
                Upload 3–10 clear photos of yourself in different settings.
              </p>
            </div>

            {/* Image previews */}
            {imagePreviews.length > 0 && (
              <div className="flex gap-3 flex-wrap mb-6 justify-center">
                {imagePreviews.map((url, i) => (
                  <div key={i} className="relative group">
                    <img src={url} alt="" className="w-20 h-20 rounded-lg object-cover border border-gray-700" />
                    <button
                      onClick={() => handleRemoveImage(i)}
                      className="absolute -top-2 -right-2 w-5 h-5 bg-red-500 text-white rounded-full text-xs flex items-center justify-center opacity-0 group-hover:opacity-100 transition"
                    >✕</button>
                  </div>
                ))}
              </div>
            )}

            <input ref={fileInputRef} type="file" accept="image/*" multiple className="hidden"
              onChange={(e) => handleImageAdd(e.target.files)} />

            <div
              onClick={() => fileInputRef.current?.click()}
              onDrop={(e) => { e.preventDefault(); handleImageAdd(e.dataTransfer.files); }}
              onDragOver={(e) => e.preventDefault()}
              className="border-2 border-dashed border-gray-700 rounded-xl p-8 sm:p-16 text-center cursor-pointer hover:border-gray-500 transition mb-6"
            >
              <svg className="w-10 h-10 mx-auto mb-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
              </svg>
              <p className="text-white font-medium mb-1">Click to upload images</p>
              <p className="text-gray-500 text-sm">or drag and drop</p>
              <p className="text-gray-600 text-xs mt-2">PNG, JPG up to 5MB each</p>
            </div>

            <div className="bg-white/5 border border-gray-800 rounded-xl p-5">
              <p className="font-semibold mb-3">Tips for Best Results</p>
              <ul className="space-y-1 text-sm text-gray-400">
                <li>Use high quality, well-lit photos</li>
                <li>Include variety: close-ups, full body, different angles</li>
                <li>Avoid group or photos with filters</li>
              </ul>
            </div>
          </div>
        )}

        {/* STEP 3: Industry */}
        {currentStep === 'industry' && (
          <div className="w-full">
            <div className="text-center mb-10">
              <h1 className="text-2xl sm:text-4xl font-bold mb-4">What's Your Industry</h1>
              <p className="text-gray-400">These photos will help AI understand your appearance and style. Upload 3-10 clear photos of yourself in different settings.</p>
            </div>
            <div className="grid grid-cols-2 gap-3 mb-6">
              {INDUSTRIES.map(ind => (
                <button
                  key={ind}
                  onClick={() => setIndustry(ind === industry ? '' : ind)}
                  className={`px-5 py-4 rounded-xl border text-left font-medium transition ${
                    industry === ind
                      ? 'border-white bg-white/10 text-white'
                      : 'border-gray-700 text-gray-300 hover:border-gray-500'
                  }`}
                >
                  {ind}
                </button>
              ))}
            </div>
            <div className="bg-white/5 border border-gray-700 rounded-xl px-5 py-4">
              <p className="text-gray-500 text-sm mb-2">Describe your niche (optional)</p>
              <input
                type="text"
                value={niche}
                onChange={(e) => setNiche(e.target.value)}
                placeholder="e.g. Sustainable fashion for millennials, tech reviews for devs"
                className="w-full bg-transparent text-white text-sm outline-none placeholder-gray-600"
              />
            </div>
          </div>
        )}

        {/* STEP 4: Audience */}
        {currentStep === 'audience' && (
          <div className="w-full">
            <div className="text-center mb-10">
              <h1 className="text-2xl sm:text-4xl font-bold mb-4">Who's Your Audience?</h1>
              <p className="text-gray-400">Understanding your audience helps create more targeted content</p>
            </div>
            <div className="mb-8">
              <p className="text-sm font-medium text-gray-300 mb-4">Age Range</p>
              <div className="flex gap-3 flex-wrap">
                {AGE_RANGES.map(age => (
                  <button
                    key={age}
                    onClick={() => setAgeRange(age === ageRange ? '' : age)}
                    className={`px-6 py-3 rounded-xl border font-medium transition ${
                      ageRange === age
                        ? 'border-white bg-white/10 text-white'
                        : 'border-gray-700 text-gray-300 hover:border-gray-500'
                    }`}
                  >
                    {age}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-300 mb-4">Demographics</p>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {DEMOGRAPHICS.map(dem => (
                  <button
                    key={dem}
                    onClick={() => setDemographic(dem === demographic ? '' : dem)}
                    className={`px-5 py-4 rounded-xl border font-medium transition text-left ${
                      demographic === dem
                        ? 'border-white bg-white/10 text-white'
                        : 'border-gray-700 text-gray-300 hover:border-gray-500'
                    }`}
                  >
                    {dem}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* STEP 5: Brand Tone */}
        {currentStep === 'brandTone' && (
          <div className="w-full">
            <div className="text-center mb-10">
              <h1 className="text-2xl sm:text-4xl font-bold mb-4">Define Your Brand Tone</h1>
              <p className="text-gray-400">Select 1-3 tones that best describe your content style</p>
            </div>
            <div className="grid grid-cols-2 gap-3 mb-6">
              {BRAND_TONES.map(tone => (
                <button
                  key={tone}
                  onClick={() => toggleTone(tone)}
                  className={`px-5 py-4 rounded-xl border font-medium transition text-left ${
                    selectedTones.includes(tone)
                      ? 'border-white bg-white/10 text-white'
                      : 'border-gray-700 text-gray-300 hover:border-gray-500'
                  }`}
                >
                  {tone}
                </button>
              ))}
            </div>
            <div className="bg-white/5 border border-gray-700 rounded-xl p-5">
              <p className="text-gray-400 text-sm mb-3">Creator Bio (optional)</p>
              <textarea
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                rows={4}
                placeholder="Tell us about yourself, your journey, and what makes your content unique...."
                className="w-full bg-transparent text-white text-sm outline-none resize-none placeholder-gray-600"
              />
            </div>
          </div>
        )}

        {/* STEP 6: Review */}
        {currentStep === 'review' && (
          <div className="w-full">
            <div className="text-center mb-10">
              <h1 className="text-2xl sm:text-4xl font-bold mb-4">Review Your Persona</h1>
              <p className="text-gray-400">Make sure everything looks good before we create your AI persona</p>
            </div>
            <div className="space-y-4 mb-6">
              <div className="bg-white/5 border border-gray-800 rounded-xl p-5">
                <p className="text-gray-500 text-sm mb-2">Reference Images</p>
                {imagePreviews.length > 0 ? (
                  <div className="flex gap-2 flex-wrap">
                    {imagePreviews.map((url, i) => (
                      <img key={i} src={url} alt="" className="w-12 h-12 rounded-lg object-cover border border-gray-700" />
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-600 text-sm">No images uploaded</p>
                )}
              </div>

              <div className="bg-white/5 border border-gray-800 rounded-xl p-5">
                <p className="text-gray-500 text-sm mb-2">Industry & Niche</p>
                <p className="text-white font-semibold">{industry || <span className="text-gray-600">Not specified</span>}</p>
                {niche && <p className="text-gray-400 text-sm mt-1">{niche}</p>}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="bg-white/5 border border-gray-800 rounded-xl p-5">
                  <p className="text-gray-500 text-sm mb-2">Target Audience</p>
                  <p className="text-white font-semibold">{[ageRange, demographic].filter(Boolean).join(', ') || <span className="text-gray-600">Not specified</span>}</p>
                </div>
                <div className="bg-white/5 border border-gray-800 rounded-xl p-5">
                  <p className="text-gray-500 text-sm mb-2">Brand Tone</p>
                  <p className="text-white font-semibold">{selectedTones.length ? selectedTones.join(', ') : <span className="text-gray-600">Not specified</span>}</p>
                </div>
              </div>

              <div className="bg-white/5 border border-gray-800 rounded-xl p-5 flex items-start gap-3">
                <span className="text-xl">✦</span>
                <div>
                  <p className="font-semibold mb-1">You're all set!</p>
                  <p className="text-gray-400 text-sm">Your persona will be used to enhance all your AI-generated content. You can edit these details anytime from your settings.</p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Footer nav */}
      <div className="px-4 sm:px-8 py-4 sm:py-6 flex items-center justify-between border-t border-gray-900 max-w-3xl mx-auto w-full">
        <button
          onClick={() => setStepIndex(i => i - 1)}
          disabled={isFirst}
          className={`px-8 py-3 rounded-xl font-semibold transition ${
            isFirst
              ? 'bg-white/5 text-gray-600 cursor-not-allowed'
              : 'bg-white/10 hover:bg-white/20 text-white'
          }`}
        >
          Back
        </button>

        {isLast ? (
          <div className="flex flex-col items-end gap-2">
            {saveError && <p className="text-red-400 text-sm">{saveError}</p>}
            <button
              onClick={handleCreatePersona}
              disabled={saving}
              className="px-8 py-3 bg-white text-black rounded-xl font-semibold hover:bg-gray-200 transition disabled:opacity-50 flex items-center gap-2"
            >
              {saving ? 'Creating...' : 'Create My Persona'}
              {!saving && <span>✦</span>}
            </button>
          </div>
        ) : (
          <button
            onClick={() => {
              const next = stepIndex + 1;
              setStepIndex(next);
              setMaxStep(prev => Math.max(prev, next));
            }}
            className="px-8 py-3 bg-white text-black rounded-xl font-semibold hover:bg-gray-200 transition flex items-center gap-2"
          >
            Continue
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        )}
      </div>
    </div>
  );
}
