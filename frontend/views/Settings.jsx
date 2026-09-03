'use client'

import { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import PricingPlans from '../components/PricingPlans';
import { useAuth } from '../context/AuthContext';
import { generationAPI, authAPI, referralAPI, grantAPI } from '../services/api';
import ReferralEarnings from '../components/ReferralEarnings';
import CreditsWallet from '../components/CreditsWallet';

const SETTINGS_SECTIONS = [
  {
    id: 'account',
    label: 'Profile & security',
    description: 'Your details, photo and password',
  },
  {
    id: 'plan',
    label: 'Plan & usage',
    description: 'Billing, credit and activity',
  },
  {
    id: 'founder',
    label: 'Founder access',
    description: 'Invite codes and earnings',
  },
  {
    id: 'advanced',
    label: 'Advanced',
    description: 'Upcoming preferences and alerts',
  },
];

const SECTION_ICONS = {
  account: '👤',
  plan: '💳',
  founder: '🎁',
  advanced: '⚙️',
};

const PLAN_TABS = ['pricing', 'credits', 'usage'];
const ADVANCED_TABS = ['preferences', 'notifications', 'aimodel'];

export default function Settings() {
  const { user, refreshUser } = useAuth();
  const [activeSection, setActiveSection] = useState('account');
  const [activePlanTab, setActivePlanTab] = useState('pricing');
  const [activeAdvancedTab, setActiveAdvancedTab] = useState('preferences');
  // Mobile only: whether a section has been opened (drill-down nav). Desktop
  // always shows the active section regardless of this flag.
  const [mobileDrilledIn, setMobileDrilledIn] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [accountMsg, setAccountMsg] = useState(null);
  const [passwordMsg, setPasswordMsg] = useState(null);

  // Open a specific tab when linked via ?tab= (e.g. after Stripe checkout)
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const tab = new URLSearchParams(window.location.search).get('tab');
      if (PLAN_TABS.includes(tab)) {
        setActiveSection('plan');
        setActivePlanTab(tab);
        setMobileDrilledIn(true);
      } else if (ADVANCED_TABS.includes(tab)) {
        setActiveSection('advanced');
        setActiveAdvancedTab(tab);
        setMobileDrilledIn(true);
      } else if (tab === 'referrals') {
        setActiveSection('founder');
        setMobileDrilledIn(true);
      }
    }
  }, []);

  // Referrals state
  const [referralCode, setReferralCode] = useState(null);
  const [referralLoading, setReferralLoading] = useState(false);
  const [grantCodeInput, setGrantCodeInput] = useState('');
  const [grantRedeeming, setGrantRedeeming] = useState(false);
  const [grantMsg, setGrantMsg] = useState(null);
  const [referralCodeInput, setReferralCodeInput] = useState('');
  const [applyingReferralCode, setApplyingReferralCode] = useState(false);
  const [referralApplyMsg, setReferralApplyMsg] = useState(null);
  const [stats, setStats] = useState({
    imagesUsedToday: 0,
    textUsedToday: 0,
    totalGenerations: 0,
    imagesCreated: 0,
    textGenerated: 0,
    memberSince: ''
  });

  // Account form state
  const [accountForm, setAccountForm] = useState({
    name: '',
    email: '',
    currentPassword: ''
  });

  // Password form state
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  useEffect(() => {
    loadUserData();
  }, [user]);

  useEffect(() => {
    if (activeSection === 'founder' && !referralCode) loadReferralCode();
  }, [activeSection, referralCode]);

  useEffect(() => {
    if (activeSection === 'plan' && activePlanTab === 'usage') loadStats();
  }, [activeSection, activePlanTab, user?.id]);

  const loadReferralCode = async () => {
    setReferralLoading(true);
    try {
      const { data } = await referralAPI.getMyCode();
      setReferralCode(data.referralCode);
    } catch (e) {
      console.error('Failed to load referral code', e);
    } finally {
      setReferralLoading(false);
    }
  };

  const handleApplyReferralCode = async (e) => {
    e.preventDefault();
    setReferralApplyMsg(null);
    setApplyingReferralCode(true);
    try {
      await referralAPI.useCode(referralCodeInput.trim());
      await refreshUser();
      setReferralApplyMsg({ type: 'success', text: 'Referral code applied — thanks for joining through an invite!' });
      setReferralCodeInput('');
    } catch (err) {
      setReferralApplyMsg({ type: 'error', text: err.response?.data?.error || 'Invalid code.' });
    } finally {
      setApplyingReferralCode(false);
    }
  };

  const loadUserData = () => {
    if (user) {
      setAccountForm({
        name: user.name || '',
        email: user.email || '',
        currentPassword: ''
      });
    }
  };


  const handleProfilePictureUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Validate file size (5MB)
    if (file.size > 5 * 1024 * 1024) {
      alert('File size must be less than 5MB');
      return;
    }

    try {
      setUploading(true);
      const formData = new FormData();
      formData.append('image', file);

      // Step 1: Upload to R2
    const { uploadAPI } = await import('../services/api');
    const uploadResponse = await uploadAPI.uploadImage(formData);
    const imageUrl = uploadResponse.data.image.imageUrl;

    // Step 2: Save URL to user profile
    const { authAPI } = await import('../services/api');
    await authAPI.updateProfilePicture(imageUrl);

    // Step 3: Update local user context (refresh user data)
    await refreshUser();
    
    alert('Profile picture updated successfully!');
    
  } catch (error) {
    console.error('Upload failed:', error);
    alert('Failed to upload profile picture. Please try again.');
  } finally {
    setUploading(false);
    e.target.value = '';
  }
};

  const loadStats = async () => {
    try {
      const response = await generationAPI.getAll();
      const allGenerations = response.data.generations || [];

      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const todayGenerations = allGenerations.filter(g =>
        new Date(g.createdAt) >= today
      );

      const imagesUsedToday = todayGenerations.filter(g => g.type === 'image').length;
      const textUsedToday = todayGenerations.filter(g => g.type === 'text').length;
      const imagesCreated = allGenerations.filter(g => g.type === 'image').length;
      const textGenerated = allGenerations.filter(g => g.type === 'text').length;

      setStats({
        imagesUsedToday,
        textUsedToday,
        totalGenerations: allGenerations.length,
        imagesCreated,
        textGenerated,
        memberSince: user?.createdAt ? new Date(user.createdAt).toLocaleDateString('en-US', { month: 'short', year: 'numeric' }) : 'Jan 2025'
      });
    } catch (error) {
      console.error('Failed to load stats:', error);
    }
  };

  const handleAccountSubmit = async (e) => {
    e.preventDefault();
    setAccountMsg(null);
    const emailChanged = accountForm.email.trim().toLowerCase() !== (user?.email || '').toLowerCase();
    if (emailChanged && !accountForm.currentPassword) {
      setAccountMsg({ type: 'error', text: 'Enter your current password to change your email address.' });
      return;
    }
    try {
      const response = await authAPI.updateProfile({
        name: accountForm.name,
        email: accountForm.email,
        ...(emailChanged ? { currentPassword: accountForm.currentPassword } : {})
      });
      await refreshUser();
      setAccountForm(current => ({ ...current, currentPassword: '' }));
      setAccountMsg({ type: 'success', text: response.data.message || 'Profile updated successfully!' });
    } catch (error) {
      setAccountMsg({ type: 'error', text: error.response?.data?.error || 'Failed to update profile' });
    }
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    setPasswordMsg(null);
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setPasswordMsg({ type: 'error', text: 'Passwords do not match!' });
      return;
    }
    try {
      await authAPI.updatePassword({
        currentPassword: passwordForm.currentPassword,
        newPassword: passwordForm.newPassword
      });
      setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
      setPasswordMsg({ type: 'success', text: 'Password updated successfully!' });
    } catch (error) {
      setPasswordMsg({ type: 'error', text: error.response?.data?.error || 'Failed to update password' });
    }
  };

  const handleDeleteAccount = () => {
    if (confirm('Are you sure you want to delete your account? This action cannot be undone.')) {
      alert('Account deletion is not available in the app yet. Please contact Personify support for help with your account.');
    }
  };

  return (
    <Layout>
      <div className="p-4 md:p-8 max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-5 md:mb-8">
          <h1 className="text-2xl md:text-3xl font-semibold text-white mb-1 md:mb-2">Settings</h1>
          <p className="text-gray-400 text-sm md:text-base">Manage your profile, plan and access in one place.</p>
        </div>

        {/* Nav elements below are direct children of this full-height page
            container (not a short wrapper) so that sticky has room to stay
            pinned for the whole scroll, not just the height of the nav itself. */}

        {/* Desktop: underline tabs, sticky so they stay reachable while scrolling a long section */}
        <nav aria-label="Settings sections" className="sticky top-0 z-20 mb-6 hidden border-b border-gray-800 bg-dark-bg md:mb-8 lg:block">
          <div className="flex gap-6">
            {SETTINGS_SECTIONS.map((section) => {
              const isActive = activeSection === section.id;
              return (
                <button
                  key={section.id}
                  type="button"
                  onClick={() => setActiveSection(section.id)}
                  aria-current={isActive ? 'page' : undefined}
                  className={`relative pb-3 text-sm font-medium transition ${
                    isActive ? 'text-white' : 'text-gray-400 hover:text-white'
                  }`}
                >
                  {section.label}
                  {isActive && <span className="absolute inset-x-0 -bottom-px h-0.5 rounded-full bg-brand-pink" />}
                </button>
              );
            })}
          </div>
        </nav>

        {/* Mobile: section list — tap a row to drill into it */}
        <nav aria-label="Settings sections" className={`mb-6 lg:hidden ${mobileDrilledIn ? 'hidden' : 'block'}`}>
          <div className="divide-y divide-gray-800 overflow-hidden rounded-2xl border border-gray-800 bg-dark-card">
            {SETTINGS_SECTIONS.map((section) => (
              <button
                key={section.id}
                type="button"
                onClick={() => { setActiveSection(section.id); setMobileDrilledIn(true); }}
                className="flex w-full items-center gap-3 px-4 py-4 text-left transition hover:bg-white/5"
              >
                <span className="text-xl">{SECTION_ICONS[section.id]}</span>
                <span className="min-w-0 flex-1">
                  <span className="block text-sm font-semibold text-white">{section.label}</span>
                  <span className="block truncate text-xs text-gray-500">{section.description}</span>
                </span>
                <span className="text-gray-600">›</span>
              </button>
            ))}
          </div>
        </nav>

        {/* Mobile: sticky back header, shown once a section is open */}
        {mobileDrilledIn && (
          <div className="sticky top-0 z-20 -mx-4 mb-6 flex items-center gap-3 border-b border-gray-800 bg-dark-bg px-4 py-3 lg:hidden">
            <button
              type="button"
              onClick={() => setMobileDrilledIn(false)}
              aria-label="Back to settings"
              className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg text-gray-300 transition hover:bg-white/10"
            >
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <span className="text-base font-semibold text-white">
              {SETTINGS_SECTIONS.find((s) => s.id === activeSection)?.label}
            </span>
          </div>
        )}

        <div className={`min-w-0 ${mobileDrilledIn ? 'block' : 'hidden lg:block'}`}>
        {/* Profile & security */}
        {activeSection === 'account' && (
          <div className="space-y-5 md:space-y-6">
            <div className="bg-dark-card rounded-xl p-6 border border-gray-800">
              <h2 className="text-xl font-semibold text-white mb-2">Profile</h2>
              <p className="text-sm text-gray-400 mb-6">Update your account details and profile picture</p>

              <form onSubmit={handleAccountSubmit} className="md:grid md:grid-cols-[13rem_minmax(0,1fr)] md:gap-8">
                {/* Profile Picture */}
                <div className="mb-6 border-b border-gray-800 pb-6 md:mb-0 md:border-b-0 md:border-r md:pb-0 md:pr-8">
                  <div className="flex items-center gap-4 md:flex-col md:items-start">
                    <div className="w-20 h-20 rounded-full bg-gradient-to-br from-brand-pink to-purple-600 flex items-center justify-center text-white text-2xl font-bold overflow-hidden">
                      {user?.profilePictureUrl ? (
                        <img src={user.profilePictureUrl} alt="Profile" className="w-full h-full object-cover" />
                      ) : (
                        user?.name?.charAt(0).toUpperCase() || 'U'
                      )}
                    </div>
                    <div>
                      <p className="text-white font-medium mb-1">Profile Picture</p>
                      <p className="text-sm text-gray-400 mb-3">JPG or PNG. Max size 5MB</p>
                      <input
                        type="file"
                        id="profile-picture-upload"
                        accept="image/*"
                        onChange={handleProfilePictureUpload}
                        className="hidden"
                        disabled={uploading}
                      />
                      <label
                        htmlFor="profile-picture-upload"
                        className={`inline-block min-h-11 px-4 py-2.5 bg-white/10 hover:bg-white/20 text-white rounded-lg text-sm font-medium transition cursor-pointer ${uploading ? 'opacity-50 cursor-not-allowed' : ''}`}
                      >
                        {uploading ? 'Uploading...' : 'Upload new picture'}
                      </label>
                    </div>
                  </div>
                </div>

                <div>
                  {/* Form Fields */}
                  <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-white mb-2">
                      Full Name
                    </label>
                    <input
                      type="text"
                      value={accountForm.name}
                      onChange={(e) => setAccountForm({...accountForm, name: e.target.value})}
                      className="w-full px-4 py-3 bg-black/40 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:border-brand-pink focus:ring-1 focus:ring-brand-pink outline-none transition"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-white mb-2">
                      Email Address
                    </label>
                    <input
                      type="email"
                      value={accountForm.email}
                      onChange={(e) => setAccountForm({...accountForm, email: e.target.value})}
                      className="w-full px-4 py-3 bg-black/40 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:border-brand-pink focus:ring-1 focus:ring-brand-pink outline-none transition"
                    />
                  </div>

                  {accountForm.email.trim().toLowerCase() !== (user?.email || '').toLowerCase() && (
                    <div>
                      <label className="block text-sm font-medium text-white mb-2">
                        Current Password
                      </label>
                      <input
                        type="password"
                        value={accountForm.currentPassword}
                        onChange={(e) => setAccountForm({...accountForm, currentPassword: e.target.value})}
                        placeholder="Required to change your email"
                        autoComplete="current-password"
                        className="w-full px-4 py-3 bg-black/40 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:border-brand-pink focus:ring-1 focus:ring-brand-pink outline-none transition"
                      />
                      <p className="mt-2 text-xs text-gray-400">We’ll ask you to verify the new address before email-gated features can be used.</p>
                    </div>
                  )}

                  </div>

                  {accountMsg && (
                    <p className={`mt-4 text-sm ${accountMsg.type === 'success' ? 'text-green-400' : 'text-red-400'}`}>
                      {accountMsg.text}
                    </p>
                  )}

                  {/* Buttons */}
                  <div className="flex flex-wrap gap-3 mt-6">
                    <button
                      type="submit"
                      className="flex-1 sm:flex-none px-6 py-3 bg-white text-black rounded-lg font-semibold hover:bg-gray-200 transition"
                    >
                      Save Changes
                    </button>
                    <button
                      type="button"
                      onClick={loadUserData}
                      className="flex-1 sm:flex-none px-6 py-3 bg-white/10 hover:bg-white/20 text-white rounded-lg font-semibold transition"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              </form>
            </div>

            {/* Password Section */}
            <div className="bg-dark-card rounded-xl p-6 border border-gray-800">
              <h2 className="text-xl font-semibold text-white mb-2">Password</h2>
              <p className="text-sm text-gray-400 mb-6">Update your password to keep your account secure</p>

              <form onSubmit={handlePasswordSubmit}>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-white mb-2">
                      Current Password
                    </label>
                    <input
                      type="password"
                      value={passwordForm.currentPassword}
                      onChange={(e) => setPasswordForm({...passwordForm, currentPassword: e.target.value})}
                      placeholder="Enter current password"
                      className="w-full px-4 py-3 bg-black/40 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:border-brand-pink focus:ring-1 focus:ring-brand-pink outline-none transition"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-white mb-2">
                      New Password
                    </label>
                    <input
                      type="password"
                      value={passwordForm.newPassword}
                      onChange={(e) => setPasswordForm({...passwordForm, newPassword: e.target.value})}
                      placeholder="Enter new password"
                      className="w-full px-4 py-3 bg-black/40 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:border-brand-pink focus:ring-1 focus:ring-brand-pink outline-none transition"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-white mb-2">
                      Confirm New Password
                    </label>
                    <input
                      type="password"
                      value={passwordForm.confirmPassword}
                      onChange={(e) => setPasswordForm({...passwordForm, confirmPassword: e.target.value})}
                      placeholder="Confirm new password"
                      className="w-full px-4 py-3 bg-black/40 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:border-brand-pink focus:ring-1 focus:ring-brand-pink outline-none transition"
                    />
                  </div>
                </div>

                {passwordMsg && (
                  <p className={`mt-4 text-sm ${passwordMsg.type === 'success' ? 'text-green-400' : 'text-red-400'}`}>
                    {passwordMsg.text}
                  </p>
                )}

                <button
                  type="submit"
                  className="mt-6 px-6 py-3 bg-white text-black rounded-lg font-semibold hover:bg-gray-200 transition"
                >
                  Update Password
                </button>
              </form>
            </div>

            <details className="rounded-xl border border-red-500/20 bg-red-500/5">
              <summary className="cursor-pointer list-none px-5 py-4 text-sm font-semibold text-red-300 marker:hidden [&::-webkit-details-marker]:hidden">
                <span className="flex items-center justify-between gap-4">
                  Danger zone
                  <span className="text-xs font-medium text-red-300/70">Delete account</span>
                </span>
              </summary>
              <div className="border-t border-red-500/20 px-5 pb-5 pt-4">
                <p className="text-sm text-gray-400 mb-4">Permanently delete your account and all associated data.</p>
                <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-4 mb-4">
                  <div className="flex gap-2">
                    <span className="text-yellow-500">⚠️</span>
                    <p className="text-yellow-500 text-sm">This action cannot be undone. Generations and personas will be permanently deleted.</p>
                  </div>
                </div>
                <button
                  onClick={handleDeleteAccount}
                  className="min-h-11 px-5 py-2.5 bg-red-500/20 hover:bg-red-500/30 text-red-400 rounded-lg text-sm font-semibold transition border border-red-500/30"
                >
                  Delete my account
                </button>
              </div>
            </details>
          </div>
        )}

        {activeSection === 'advanced' && (
          <div className="mb-5 grid grid-cols-3 gap-2 rounded-xl border border-gray-800 bg-dark-card p-2">
            {[
              ['preferences', 'Preferences'],
              ['notifications', 'Alerts'],
              ['aimodel', 'AI models'],
            ].map(([tab, label]) => (
              <button
                key={tab}
                type="button"
                onClick={() => setActiveAdvancedTab(tab)}
                className={`min-h-11 rounded-lg px-2 py-2 text-xs font-semibold transition sm:text-sm ${
                  activeAdvancedTab === tab ? 'bg-white text-black' : 'text-gray-400 hover:bg-white/10 hover:text-white'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        )}

        {/* Advanced: preferences */}
        {activeSection === 'advanced' && activeAdvancedTab === 'preferences' && (
          <div className="space-y-6">
            <div className="bg-dark-card rounded-xl p-6 border border-gray-800">
              <div className="flex flex-wrap items-center gap-2 mb-2">
                <h2 className="text-xl font-semibold text-white">Generation preferences</h2>
                <span className="rounded-full bg-yellow-500/10 px-2 py-0.5 text-xs font-medium text-yellow-400">Coming soon</span>
              </div>
              <p className="text-sm text-gray-400 mb-6">These controls will be available once they are connected to your account and generation workflow.</p>

              <div className="space-y-6 opacity-60">
                <div className="flex items-center justify-between py-4 border-b border-gray-700">
                  <div>
                    <p className="text-white font-medium mb-1">Auto-enhance prompts</p>
                    <p className="text-sm text-gray-400">
                      Automatically enhance prompts with your persona data
                    </p>
                  </div>
                  <label className="relative inline-flex items-center cursor-not-allowed">
                    <input
                      type="checkbox"
                      checked
                      disabled
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-700 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-brand-pink rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-brand-pink"></div>
                  </label>
                </div>

                <div className="flex items-center justify-between py-4 border-b border-gray-700">
                  <div>
                    <p className="text-white font-medium mb-1">Save to history automatically</p>
                    <p className="text-sm text-gray-400">
                      Save all generations to your history by default
                    </p>
                  </div>
                  <label className="relative inline-flex items-center cursor-not-allowed">
                    <input
                      type="checkbox"
                      checked
                      disabled
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-700 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-brand-pink rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-brand-pink"></div>
                  </label>
                </div>

                <div className="flex items-center justify-between py-4">
                  <div>
                    <p className="text-white font-medium mb-1">High quality Mode</p>
                    <p className="text-sm text-gray-400">
                      Use maximum quality settings for all generations
                    </p>
                    <div className="mt-2 bg-brand-pink/10 border border-brand-pink/30 rounded-lg p-3">
                      <p className="text-brand-pink text-sm">
                        <strong>Note:</strong> This mode uses 2 generations per request to deliver superior quality output. Plan your usage accordingly.
                      </p>
                    </div>
                  </div>
                  <label className="relative inline-flex items-center cursor-not-allowed">
                    <input
                      type="checkbox"
                      checked={false}
                      disabled
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-700 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-brand-pink rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-brand-pink"></div>
                  </label>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Advanced: AI models */}
        {activeSection === 'advanced' && activeAdvancedTab === 'aimodel' && (
          <div className="bg-dark-card rounded-xl p-6 border border-gray-800 text-center py-12">
            <div className="text-6xl mb-4">🚀</div>
            <h2 className="text-2xl font-semibold text-white mb-3">Coming Soon</h2>
            <p className="text-gray-400 mb-2">Gemini and Claude AI models</p>
            <p className="text-sm text-gray-500">We're working on integrating more AI providers to give you more options</p>
          </div>
        )}

        {activeSection === 'plan' && (
          <div className="mb-5 grid grid-cols-3 gap-2 rounded-xl border border-gray-800 bg-dark-card p-2">
            {[
              ['pricing', 'Plan'],
              ['credits', 'Credits'],
              ['usage', 'Activity'],
            ].map(([tab, label]) => (
              <button
                key={tab}
                type="button"
                onClick={() => setActivePlanTab(tab)}
                className={`min-h-11 rounded-lg px-2 py-2 text-xs font-semibold transition sm:text-sm ${
                  activePlanTab === tab ? 'bg-white text-black' : 'text-gray-400 hover:bg-white/10 hover:text-white'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        )}

        {/* Plan & usage: activity */}
        {activeSection === 'plan' && activePlanTab === 'usage' && (
          <div className="space-y-6">
            {/* Redeem a bonus-generation code */}
            <div className="bg-dark-card rounded-xl p-6 border border-gray-800">
              <h2 className="text-xl font-semibold text-white mb-2">Redeem a code</h2>
              <p className="text-sm text-gray-400 mb-4">Have a code for bonus generations? Enter it to add them to your account.</p>
              <form
                onSubmit={async (e) => {
                  e.preventDefault();
                  if (!grantCodeInput.trim()) return;
                  setGrantRedeeming(true);
                  setGrantMsg(null);
                  try {
                    const { data } = await grantAPI.redeem(grantCodeInput.trim());
                    setGrantMsg({ type: 'success', text: `Success! Added ${data.grantedImages} image and ${data.grantedTexts} text generations.` });
                    setGrantCodeInput('');
                  } catch (err) {
                    setGrantMsg({ type: 'error', text: err.response?.data?.error || 'Invalid code.' });
                  } finally {
                    setGrantRedeeming(false);
                  }
                }}
                className="flex flex-col sm:flex-row gap-3"
              >
                <input
                  type="text"
                  value={grantCodeInput}
                  onChange={(e) => setGrantCodeInput(e.target.value.toUpperCase())}
                  placeholder="Enter code"
                  maxLength={8}
                  className="flex-1 px-4 py-2.5 bg-black border border-gray-700 rounded-xl text-white font-mono tracking-widest text-center sm:text-left placeholder:font-sans placeholder:tracking-normal outline-none focus:border-brand-pink"
                />
                <button
                  type="submit"
                  disabled={grantRedeeming || !grantCodeInput.trim()}
                  className="px-6 py-2.5 bg-brand-pink text-white rounded-xl font-semibold hover:opacity-90 transition disabled:opacity-40"
                >
                  {grantRedeeming ? 'Redeeming…' : 'Redeem'}
                </button>
              </form>
              {grantMsg && (
                <p className={`text-sm mt-3 ${grantMsg.type === 'success' ? 'text-green-400' : 'text-red-400'}`}>{grantMsg.text}</p>
              )}
            </div>

            <div className="bg-dark-card rounded-xl p-6 border border-gray-800">
              <h2 className="text-xl font-semibold text-white mb-2">Today&apos;s activity</h2>
              <p className="text-sm text-gray-400 mb-6">See what you&apos;ve generated today.</p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 md:gap-6">
                <div className="bg-black/40 rounded-xl p-4 md:p-6">
                  <p className="text-gray-400 text-xs md:text-sm mb-1 md:mb-2">Images created</p>
                  <p className="text-2xl md:text-3xl font-bold text-white">{stats.imagesUsedToday}</p>
                </div>

                <div className="bg-black/40 rounded-xl p-4 md:p-6">
                  <p className="text-gray-400 text-xs md:text-sm mb-1 md:mb-2">Text generated</p>
                  <p className="text-2xl md:text-3xl font-bold text-white">{stats.textUsedToday}</p>
                </div>
              </div>
            </div>

            <div className="bg-dark-card rounded-xl p-6 border border-gray-800">
              <h2 className="text-xl font-semibold text-white mb-2">Total Statistics</h2>
              <p className="text-sm text-gray-400 mb-6">Your all-time generation statistics</p>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-6">
                <div className="bg-black/40 rounded-xl p-3 md:p-6">
                  <p className="text-gray-400 text-xs md:text-sm mb-1 md:mb-2">Total</p>
                  <p className="text-xl md:text-3xl font-bold text-white">{stats.totalGenerations}</p>
                </div>

                <div className="bg-black/40 rounded-xl p-3 md:p-6">
                  <p className="text-gray-400 text-xs md:text-sm mb-1 md:mb-2">Images</p>
                  <p className="text-xl md:text-3xl font-bold text-white">{stats.imagesCreated}</p>
                </div>

                <div className="bg-black/40 rounded-xl p-3 md:p-6">
                  <p className="text-gray-400 text-xs md:text-sm mb-1 md:mb-2">Texts</p>
                  <p className="text-xl md:text-3xl font-bold text-white">{stats.textGenerated}</p>
                </div>

                <div className="bg-black/40 rounded-xl p-3 md:p-6">
                  <p className="text-gray-400 text-xs md:text-sm mb-1 md:mb-2">Since</p>
                  <p className="text-base md:text-2xl font-bold text-white">{stats.memberSince}</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Plan & usage: billing */}
        {activeSection === 'plan' && activePlanTab === 'pricing' && <PricingPlans />}

        {/* Plan & usage: credits */}
        {activeSection === 'plan' && activePlanTab === 'credits' && <CreditsWallet />}

        {/* Advanced: notifications */}
        {activeSection === 'advanced' && activeAdvancedTab === 'notifications' && (
          <div className="space-y-6">
            <div className="bg-dark-card rounded-xl p-6 border border-gray-800">
              <div className="flex flex-wrap items-center gap-2 mb-2">
                <h2 className="text-xl font-semibold text-white">Notifications</h2>
                <span className="rounded-full bg-yellow-500/10 px-2 py-0.5 text-xs font-medium text-yellow-400">Coming soon</span>
              </div>
              <p className="mb-5 text-sm text-gray-400">Notification controls will appear here when they are available.</p>
              <div className="space-y-6">
                <div className="flex items-center justify-between rounded-lg border border-gray-800 bg-black/20 px-4 py-4 opacity-60">
                  <div>
                    <p className="text-white font-medium mb-1">Enable push notifications</p>
                    <p className="text-sm text-gray-400">Receive real-time updates in your browser</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-not-allowed">
                    <input
                      type="checkbox"
                      checked={false}
                      disabled
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-700 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-brand-pink rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-brand-pink"></div>
                  </label>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Founder access */}
        {activeSection === 'founder' && (
          <div className="space-y-5 md:space-y-6">

            {/* Referral earnings dashboard */}
            <ReferralEarnings />

            {/* Apply a referral code (doesn't gate any feature — it just links
                you to whoever invited you, so they can earn a commission if
                you later subscribe). */}
            <div className="bg-dark-card rounded-xl p-6 border border-gray-800">
              <div className="flex items-center gap-3 mb-1">
                <h2 className="text-xl font-semibold text-white">Referral Code</h2>
                {user?.referralVerified && (
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-green-500/20 text-green-400">
                    Applied
                  </span>
                )}
              </div>
              <p className="text-sm text-gray-400 mb-5">
                {user?.referralVerified
                  ? "You've already applied a referral code."
                  : 'Have a referral code from a friend? Apply it to credit them.'}
              </p>

              {!user?.referralVerified && (
                <form onSubmit={handleApplyReferralCode} className="flex flex-col gap-3 sm:flex-row">
                  <input
                    type="text"
                    value={referralCodeInput}
                    onChange={e => setReferralCodeInput(e.target.value.toUpperCase())}
                    placeholder="Enter referral code"
                    maxLength={8}
                    className="flex-1 px-4 py-2.5 bg-dark-bg border border-gray-700 rounded-lg text-sm font-mono text-white placeholder:text-gray-600 placeholder:font-sans outline-none focus:border-brand-pink transition"
                  />
                  <button
                    type="submit"
                    disabled={applyingReferralCode || !referralCodeInput.trim()}
                    className="min-h-11 w-full px-5 py-2.5 bg-brand-pink text-white rounded-lg text-sm font-semibold hover:opacity-90 transition disabled:opacity-40 sm:w-auto"
                  >
                    {applyingReferralCode ? 'Checking...' : 'Apply'}
                  </button>
                </form>
              )}
              {referralApplyMsg && (
                <p className={`mt-3 text-sm ${referralApplyMsg.type === 'success' ? 'text-green-400' : 'text-red-400'}`}>
                  {referralApplyMsg.text}
                </p>
              )}
            </div>

            {/* Personal referral code */}
            <div className="bg-dark-card rounded-xl p-6 border border-gray-800">
              <h2 className="text-xl font-semibold text-white mb-1">Your Invite Code</h2>
              <p className="text-sm text-gray-400 mb-5">Share this code with up to 5 people — you'll earn a commission if they subscribe.</p>

              {referralLoading ? (
                <div className="text-gray-500 text-sm">Loading...</div>
              ) : referralCode ? (
                <>
                  <div className="flex flex-col gap-3 mb-6 sm:flex-row">
                    <div className="w-full flex-1 px-4 py-3 bg-dark-bg border border-gray-700 rounded-lg font-mono text-xl text-white tracking-widest text-center">
                      {referralCode.code}
                    </div>
                    <button
                      onClick={() => { navigator.clipboard.writeText(referralCode.code); alert('Code copied!'); }}
                      className="min-h-11 w-full px-4 py-3 bg-dark-bg border border-gray-700 rounded-lg text-gray-400 hover:text-white hover:border-gray-500 transition text-sm sm:w-auto"
                    >
                      Copy
                    </button>
                    <button
                      onClick={() => {
                        const url = `${window.location.origin}/register?ref=${referralCode.code}`;
                        navigator.clipboard.writeText(url);
                        alert('Invite link copied!');
                      }}
                      className="min-h-11 w-full px-4 py-3 bg-brand-pink/10 border border-brand-pink/30 rounded-lg text-brand-pink hover:bg-brand-pink/20 transition text-sm font-medium sm:w-auto"
                    >
                      Copy Link
                    </button>
                  </div>

                  {/* Invite slots */}
                  <div>
                    <p className="text-xs text-gray-400 mb-3">{referralCode.usedCount} / {referralCode.maxUses} invites used</p>
                    <div className="grid grid-cols-1 sm:grid-cols-5 gap-2">
                      {Array.from({ length: referralCode.maxUses }).map((_, i) => {
                        const use = referralCode.uses?.[i];
                        return (
                          <div
                            key={i}
                            className={`rounded-lg p-3 border text-center ${use ? 'bg-white/5 border-gray-700' : 'border-dashed border-gray-800'}`}
                          >
                            {use ? (
                              <>
                                <div className="w-8 h-8 rounded-full bg-brand-pink/20 flex items-center justify-center text-brand-pink text-sm font-semibold mx-auto mb-1">
                                  {(use.user?.name || use.user?.email || '?').charAt(0).toUpperCase()}
                                </div>
                                <p className="text-white text-xs font-medium truncate">{use.user?.name || '—'}</p>
                                <p className="text-gray-500 text-[10px] mt-0.5">
                                  {new Date(use.usedAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
                                </p>
                              </>
                            ) : (
                              <>
                                <div className="w-8 h-8 rounded-full border-2 border-dashed border-gray-700 flex items-center justify-center text-gray-600 text-lg mx-auto mb-1">+</div>
                                <p className="text-gray-600 text-xs">Available</p>
                              </>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </>
              ) : null}
            </div>
          </div>
        )}
          </div>
      </div>
    </Layout>
  );
}
