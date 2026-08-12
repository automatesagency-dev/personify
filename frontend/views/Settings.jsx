'use client'

import { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import PricingPlans from '../components/PricingPlans';
import { useAuth } from '../context/AuthContext';
import { generationAPI, authAPI, referralAPI } from '../services/api';
import ReferralEarnings from '../components/ReferralEarnings';
import CreditsWallet from '../components/CreditsWallet';

export default function Settings() {
  const { user, refreshUser } = useAuth();
  const [activeTab, setActiveTab] = useState('account');
  const [uploading, setUploading] = useState(false);
  const [accountMsg, setAccountMsg] = useState(null);
  const [passwordMsg, setPasswordMsg] = useState(null);

  // Open a specific tab when linked via ?tab= (e.g. after Stripe checkout)
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const tab = new URLSearchParams(window.location.search).get('tab');
      if (tab) setActiveTab(tab);
    }
  }, []);

  // Referrals state
  const [referralCode, setReferralCode] = useState(null);
  const [referralLoading, setReferralLoading] = useState(false);
  const [unlockCode, setUnlockCode] = useState('');
  const [unlockLoading, setUnlockLoading] = useState(false);
  const [unlockMsg, setUnlockMsg] = useState(null);
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
    username: ''
  });

  // Password form state
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  // Preferences state
  const [preferences, setPreferences] = useState({
    autoEnhancePrompts: true,
    saveToHistory: true,
    highQualityMode: false
  });

  // Notifications state
  const [notifications, setNotifications] = useState({
    generationCompleted: true,
    weeklySummary: true,
    productUpdates: false,
    marketingEmails: false,
    pushNotifications: true
  });

  useEffect(() => {
    loadUserData();
    loadStats();
    if (activeTab === 'referrals') loadReferralCode();
  }, [user]);

  useEffect(() => {
    if (activeTab === 'referrals' && !referralCode) loadReferralCode();
  }, [activeTab]);

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

  const handleUnlockAccess = async (e) => {
    e.preventDefault();
    setUnlockMsg(null);
    setUnlockLoading(true);
    try {
      await referralAPI.useCode(unlockCode.trim());
      await refreshUser();
      setUnlockMsg({ type: 'success', text: 'Access unlocked! You can now use the Founder Page.' });
      setUnlockCode('');
    } catch (err) {
      setUnlockMsg({ type: 'error', text: err.response?.data?.error || 'Invalid code.' });
    } finally {
      setUnlockLoading(false);
    }
  };

  const loadUserData = () => {
    if (user) {
      setAccountForm({
        name: user.name || '',
        email: user.email || '',
        username: user.email?.split('@')[0] || ''
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
    try {
      await authAPI.updateProfile({ name: accountForm.name, email: accountForm.email });
      await refreshUser();
      setAccountMsg({ type: 'success', text: 'Profile updated successfully!' });
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
      alert('Account deletion functionality coming soon!');
    }
  };

  return (
    <Layout>
      <div className="p-4 md:p-8 max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-6 md:mb-8">
          <h1 className="text-2xl md:text-3xl font-semibold text-white mb-1 md:mb-2">Settings</h1>
          <p className="text-gray-400 text-sm md:text-base">Manage your account and preferences</p>
        </div>

        {/* Tabs */}
        <div className="flex gap-3 md:gap-6 mb-6 md:mb-8 border-b border-gray-800 overflow-x-auto scrollbar-hide -mx-4 px-4 md:mx-0 md:px-0">
          {['account', 'preferences', 'aimodel', 'usage', 'pricing', 'credits', 'notifications', 'referrals'].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`pb-3 md:pb-4 px-1 text-xs md:text-sm font-medium whitespace-nowrap transition flex-shrink-0 ${
                activeTab === tab
                  ? 'text-white border-b-2 border-white'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              {tab === 'account' && 'Account'}
              {tab === 'preferences' && 'Preferences'}
              {tab === 'aimodel' && 'AI Model'}
              {tab === 'usage' && 'Usage'}
              {tab === 'pricing' && 'Pricing'}
              {tab === 'credits' && 'Credits'}
              {tab === 'notifications' && 'Alerts'}
              {tab === 'referrals' && 'Referrals'}
            </button>
          ))}
        </div>

        {/* Account Tab */}
        {activeTab === 'account' && (
          <div className="space-y-6">
            <div className="bg-dark-card rounded-xl p-6 border border-gray-800">
              <h2 className="text-xl font-semibold text-white mb-2">Prompt Information</h2>
              <p className="text-sm text-gray-400 mb-6">Update your account details and profile picture</p>

              <form onSubmit={handleAccountSubmit}>
                {/* Profile Picture */}
                <div className="flex items-center gap-4 mb-6">
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
                      className={`inline-block px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg text-sm font-medium transition cursor-pointer ${uploading ? 'opacity-50 cursor-not-allowed' : ''}`}
                    >
                      {uploading ? 'Uploading...' : 'Upload New Picture'}
                    </label>
                  </div>
                </div>

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

                  <div>
                    <label className="block text-sm font-medium text-white mb-2">
                      Username
                    </label>
                    <input
                      type="text"
                      value={accountForm.username}
                      onChange={(e) => setAccountForm({...accountForm, username: e.target.value})}
                      className="w-full px-4 py-3 bg-black/40 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:border-brand-pink focus:ring-1 focus:ring-brand-pink outline-none transition"
                    />
                  </div>
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

            {/* Delete Account */}
            <div className="bg-dark-card rounded-xl p-6 border border-gray-800">
              <h2 className="text-xl font-semibold text-white mb-2">Delete Account</h2>
              <p className="text-sm text-gray-400 mb-4">
                Permanently delete your account and all associated data
              </p>

              <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-4 mb-4">
                <div className="flex gap-2">
                  <span className="text-yellow-500">⚠️</span>
                  <p className="text-yellow-500 text-sm">
                    <strong>Warning:</strong> This action cannot be undone. All your data, including generations and personas will be permanently deleted.
                  </p>
                </div>
              </div>

              <button
                onClick={handleDeleteAccount}
                className="px-6 py-3 bg-red-500/20 hover:bg-red-500/30 text-red-400 rounded-lg font-semibold transition border border-red-500/30"
              >
                Delete My Account
              </button>
            </div>
          </div>
        )}

        {/* Preferences Tab */}
        {activeTab === 'preferences' && (
          <div className="space-y-6">
            <div className="bg-dark-card rounded-xl p-6 border border-gray-800">
              <h2 className="text-xl font-semibold text-white mb-2">Prompt Information</h2>
              <p className="text-sm text-gray-400 mb-6">Update your account details and profile picture</p>

              <div className="space-y-6">
                <div className="flex items-center justify-between py-4 border-b border-gray-700">
                  <div>
                    <p className="text-white font-medium mb-1">Auto-enhance prompts</p>
                    <p className="text-sm text-gray-400">
                      Automatically enhance prompts with your persona data
                    </p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={preferences.autoEnhancePrompts}
                      onChange={(e) => setPreferences({...preferences, autoEnhancePrompts: e.target.checked})}
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
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={preferences.saveToHistory}
                      onChange={(e) => setPreferences({...preferences, saveToHistory: e.target.checked})}
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
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={preferences.highQualityMode}
                      onChange={(e) => setPreferences({...preferences, highQualityMode: e.target.checked})}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-700 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-brand-pink rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-brand-pink"></div>
                  </label>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* AI Model Tab */}
        {activeTab === 'aimodel' && (
          <div className="bg-dark-card rounded-xl p-6 border border-gray-800 text-center py-12">
            <div className="text-6xl mb-4">🚀</div>
            <h2 className="text-2xl font-semibold text-white mb-3">Coming Soon</h2>
            <p className="text-gray-400 mb-2">Gemini and Claude AI models</p>
            <p className="text-sm text-gray-500">We're working on integrating more AI providers to give you more options</p>
          </div>
        )}

        {/* Usage & Limits Tab */}
        {activeTab === 'usage' && (
          <div className="space-y-6">
            <div className="bg-dark-card rounded-xl p-6 border border-gray-800">
              <h2 className="text-xl font-semibold text-white mb-2">Daily Usage</h2>
              <p className="text-sm text-gray-400 mb-6">Track your generation usage for today</p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 md:gap-6">
                <div className="bg-black/40 rounded-xl p-4 md:p-6">
                  <p className="text-gray-400 text-xs md:text-sm mb-1 md:mb-2">Image Generations</p>
                  <p className="text-2xl md:text-3xl font-bold text-white mb-3 md:mb-4">{stats.imagesUsedToday}/10</p>
                  <div className="w-full bg-gray-700 rounded-full h-2">
                    <div
                      className="bg-purple-500 h-2 rounded-full transition-all"
                      style={{ width: `${(stats.imagesUsedToday / 10) * 100}%` }}
                    ></div>
                  </div>
                </div>

                <div className="bg-black/40 rounded-xl p-4 md:p-6">
                  <p className="text-gray-400 text-xs md:text-sm mb-1 md:mb-2">Text Generations</p>
                  <p className="text-2xl md:text-3xl font-bold text-white mb-3 md:mb-4">{stats.textUsedToday}/50</p>
                  <div className="w-full bg-gray-700 rounded-full h-2">
                    <div
                      className="bg-green-500 h-2 rounded-full transition-all"
                      style={{ width: `${(stats.textUsedToday / 50) * 100}%` }}
                    ></div>
                  </div>
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

        {/* Pricing Tab */}
        {activeTab === 'pricing' && <PricingPlans />}

        {activeTab === 'credits' && <CreditsWallet />}

        {/* Notifications Tab */}
        {activeTab === 'notifications' && (
          <div className="space-y-6">
            <div className="bg-dark-card rounded-xl p-6 border border-gray-800">
              <h2 className="text-xl font-semibold text-white mb-2">Email Notifications</h2>
              <div className="space-y-6">
                {/* Toggles... */}
                <div className="flex items-center justify-between py-4">
                  <div>
                    <p className="text-white font-medium mb-1">Enable push notifications</p>
                    <p className="text-sm text-gray-400">Receive real-time updates in your browser</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={notifications.pushNotifications}
                      onChange={(e) => setNotifications({...notifications, pushNotifications: e.target.checked})}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-700 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-brand-pink rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-brand-pink"></div>
                  </label>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Referrals Tab */}
        {activeTab === 'referrals' && (
          <div className="space-y-6">

            {/* Referral earnings dashboard */}
            <ReferralEarnings />

            {/* Founder Page access status */}
            <div className="bg-dark-card rounded-xl p-6 border border-gray-800">
              <div className="flex items-center gap-3 mb-1">
                <h2 className="text-xl font-semibold text-white">Founder Page Access</h2>
                <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${user?.referralVerified ? 'bg-green-500/20 text-green-400' : 'bg-yellow-500/20 text-yellow-400'}`}>
                  {user?.referralVerified ? 'Unlocked' : 'Locked'}
                </span>
              </div>
              <p className="text-sm text-gray-400 mb-5">
                {user?.referralVerified
                  ? 'You have full access to the Founder Page builder.'
                  : 'Enter an access code to unlock the Founder Page feature.'}
              </p>

              {!user?.referralVerified && (
                <form onSubmit={handleUnlockAccess} className="flex gap-3">
                  <input
                    type="text"
                    value={unlockCode}
                    onChange={e => setUnlockCode(e.target.value.toUpperCase())}
                    placeholder="Enter access code"
                    maxLength={8}
                    className="flex-1 px-4 py-2.5 bg-dark-bg border border-gray-700 rounded-lg text-sm font-mono text-white placeholder:text-gray-600 placeholder:font-sans outline-none focus:border-brand-pink transition"
                  />
                  <button
                    type="submit"
                    disabled={unlockLoading || !unlockCode.trim()}
                    className="px-5 py-2.5 bg-brand-pink text-white rounded-lg text-sm font-semibold hover:opacity-90 transition disabled:opacity-40"
                  >
                    {unlockLoading ? 'Checking...' : 'Unlock'}
                  </button>
                </form>
              )}
              {unlockMsg && (
                <p className={`mt-3 text-sm ${unlockMsg.type === 'success' ? 'text-green-400' : 'text-red-400'}`}>
                  {unlockMsg.text}
                </p>
              )}
            </div>

            {/* Personal referral code */}
            <div className="bg-dark-card rounded-xl p-6 border border-gray-800">
              <h2 className="text-xl font-semibold text-white mb-1">Your Invite Code</h2>
              <p className="text-sm text-gray-400 mb-5">Share this code with up to 5 people to give them access to the Founder Page.</p>

              {referralLoading ? (
                <div className="text-gray-500 text-sm">Loading...</div>
              ) : referralCode ? (
                <>
                  <div className="flex gap-3 mb-6">
                    <div className="flex-1 px-4 py-3 bg-dark-bg border border-gray-700 rounded-lg font-mono text-xl text-white tracking-widest text-center">
                      {referralCode.code}
                    </div>
                    <button
                      onClick={() => { navigator.clipboard.writeText(referralCode.code); alert('Code copied!'); }}
                      className="px-4 py-3 bg-dark-bg border border-gray-700 rounded-lg text-gray-400 hover:text-white hover:border-gray-500 transition text-sm"
                    >
                      Copy
                    </button>
                    <button
                      onClick={() => {
                        const url = `${window.location.origin}/register?ref=${referralCode.code}`;
                        navigator.clipboard.writeText(url);
                        alert('Invite link copied!');
                      }}
                      className="px-4 py-3 bg-brand-pink/10 border border-brand-pink/30 rounded-lg text-brand-pink hover:bg-brand-pink/20 transition text-sm font-medium"
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
    </Layout>
  );
}