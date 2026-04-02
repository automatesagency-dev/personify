import { useState, useEffect, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { personaAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';

const STEPS = ['welcome', 'images', 'industry', 'audience', 'brandTone', 'review'];
const STEP_LABELS = { welcome: 'Welcome', images: 'Your Images', industry: 'Industry', audience: 'Audience', brandTone: 'Brand Tone', review: 'Review' };

const INDUSTRIES = ['Fashion & Beauty', 'Tech & Lifestyle', 'Fitness & Wellness', 'Food & Cooking', 'Travel & Adventure', 'Business & Finance', 'Art & Design', 'Education', 'Entertainment', 'Other'];
const AGE_RANGES = ['18-24', '25-34', '35-44', '45-54', '55+'];
const DEMOGRAPHICS = ['Gen Z', 'Millennials', 'Professionals', 'Parents', 'Students', 'Entrepreneurs'];
const BRAND_TONES = ['Professional', 'Casual & Fun', 'Luxury', 'Bold & Edgy', 'Minimal & Clean', 'Warm and Friendly', 'Creative & Artistic', 'Authentic & Raw'];

const STEP_ICONS = {
  welcome: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
    </svg>
  ),
  images: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
    </svg>
  ),
  industry: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
    </svg>
  ),
  audience: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
  ),
  brandTone: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" />
    </svg>
  ),
  review: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
    </svg>
  )
};

export default function Onboarding() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const fileInputRef = useRef(null);

  const [stepIndex, setStepIndex] = useState(0);
  const [maxStep, setMaxStep] = useState(0);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState('');

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
      navigate('/dashboard', { replace: true });
    }
  }, [user, navigate]);

  const markDone = () => {
    if (user) localStorage.setItem(`personify_onboarded_${user.id}`, 'true');
  };

  const handleSkip = () => {
    markDone();
    navigate('/dashboard', { replace: true });
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
      navigate('/dashboard', { replace: true });
    } catch (err) {
      console.error('Create persona error:', err);
      setSaveError(err.response?.data?.error || 'Something went wrong. Please try again.');
      setSaving(false);
    }
  };

  const currentStep = STEPS[stepIndex];
  const isFirst = stepIndex === 0;
  const isLast = stepIndex === STEPS.length - 1;

  return (
    <div className="min-h-screen bg-black text-white flex flex-col">
      {/* Header */}
      <div className="px-8 py-6 flex items-center justify-between border-b border-gray-900">
        <Link to="/" className="flex items-center gap-2">
          <img src="/images/logo.png" alt="Personify" className="w-7 h-7" />
          <span className="text-lg font-semibold">Personify</span>
        </Link>
        <div className="flex items-center gap-6">
          <span className="text-gray-400 text-sm">Step {stepIndex + 1} of {STEPS.length}</span>
          <button onClick={handleSkip} className="text-gray-500 hover:text-gray-300 text-sm transition">
            Skip for now
          </button>
        </div>
      </div>

      {/* Progress Steps */}
      <div className="px-8 py-6 flex items-start justify-center gap-0">
        {STEPS.map((step, i) => {
          const isActive = i === stepIndex;
          const isVisited = i <= maxStep;
          const isClickable = isVisited && !isActive;
          return (
            <div key={step} className="flex items-start">
              <div className="flex flex-col items-center">
                <div
                  onClick={() => isClickable && setStepIndex(i)}
                  className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${
                    isActive ? 'bg-white text-black' :
                    isVisited ? 'bg-white text-black' :
                    'bg-gray-800 text-gray-600'
                  } ${isClickable ? 'cursor-pointer hover:opacity-75' : ''}`}
                >
                  {isVisited && !isActive
                    ? <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" /></svg>
                    : STEP_ICONS[step]
                  }
                </div>
                <span
                  onClick={() => isClickable && setStepIndex(i)}
                  className={`text-xs mt-2 font-medium whitespace-nowrap transition-colors ${
                    isActive ? 'text-white' : isVisited ? 'text-gray-400 cursor-pointer hover:text-white' : 'text-gray-600'
                  }`}
                >
                  {STEP_LABELS[step]}
                </span>
              </div>
              {i < STEPS.length - 1 && (
                <div className={`h-px w-16 mt-5 mx-1 transition-all ${i < maxStep + 1 ? 'bg-white' : 'bg-gray-800'}`} />
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
            <h1 className="text-5xl font-bold mb-6 leading-tight">
              Your Creative Journey<br />Starts With You
            </h1>
            <p className="text-gray-400 text-lg mb-12 max-w-xl mx-auto">
              Create a personalised AI persona that understands your style, audience and brand.
              Generate stunning content that truly represents who you are.
            </p>
            <div className="grid grid-cols-3 gap-4 mb-12">
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
              <h1 className="text-4xl font-bold mb-4">Upload Your Reference Images</h1>
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
              className="border-2 border-dashed border-gray-700 rounded-xl p-16 text-center cursor-pointer hover:border-gray-500 transition mb-6"
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
              <h1 className="text-4xl font-bold mb-4">What's Your Industry</h1>
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
              <h1 className="text-4xl font-bold mb-4">Who's Your Audience?</h1>
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
              <div className="grid grid-cols-3 gap-3">
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
              <h1 className="text-4xl font-bold mb-4">Define Your Brand Tone</h1>
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
              <h1 className="text-4xl font-bold mb-4">Review Your Persona</h1>
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

              <div className="grid grid-cols-2 gap-4">
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
      <div className="px-8 py-6 flex items-center justify-between border-t border-gray-900 max-w-3xl mx-auto w-full">
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
