import { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import { useAuth } from '../context/AuthContext';
import { generationAPI } from '../services/api';

export default function Settings() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('account');
  const [generations, setGenerations] = useState([]);
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

  // Preferences state (dummy toggles for now)
  const [preferences, setPreferences] = useState({
    autoEnhancePrompts: true,
    saveToHistory: true,
    highQualityMode: false
  });

  // Notifications state (dummy toggles for now)
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
  }, []);

  const loadUserData = () => {
    if (user) {
      setAccountForm({
        name: user.name || '',
        email: user.email || '',
        username: user.email?.split('@')[0] || ''
      });
    }
  };

  const loadStats = async () => {
    try {
      const response = await generationAPI.getAll();
      const allGenerations = response.data.generations || [];
      setGenerations(allGenerations);

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

  const handleAccountSubmit = (e) => {
    e.preventDefault();
    alert('Account update functionality coming soon!');
  };

  const handlePasswordSubmit = (e) => {
    e.preventDefault();
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      alert('Passwords do not match!');
      return;
    }
    alert('Password update functionality coming soon!');
  };

  const handleDeleteAccount = () => {
    if (confirm('Are you sure you want to delete your account? This action cannot be undone.')) {
      alert('Account deletion functionality coming soon!');
    }
  };

  return (
    <Layout>
      <div className="p-8 max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-semibold text-white mb-2">Settings</h1>
          <p className="text-gray-400">Manage your account and preferences</p>
        </div>

        {/* Tabs */}
        <div className="flex gap-6 mb-8 border-b border-gray-800 overflow-x-auto">
          {['account', 'preferences', 'aimodel', 'usage', 'pricing', 'notifications'].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`pb-4 px-2 font-medium whitespace-nowrap transition ${
                activeTab === tab
                  ? 'text-white border-b-2 border-white'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              {tab === 'account' && 'Account'}
              {tab === 'preferences' && 'Preferences'}
              {tab === 'aimodel' && 'AI Model'}
              {tab === 'usage' && 'Usage & Limits'}
              {tab === 'pricing' && 'Pricing'}
              {tab === 'notifications' && 'Notifications'}
            </button>
          ))}
        </div>

        {/* Account Tab */}
        {activeTab === 'account' && (
          <div className="space-y-6">
            {/* Profile Information */}
            <div className="bg-dark-card rounded-xl p-6 border border-gray-800">
              <h2 className="text-xl font-semibold text-white mb-2">Prompt Information</h2>
              <p className="text-sm text-gray-400 mb-6">Update your account details and profile picture</p>

              <form onSubmit={handleAccountSubmit}>
                {/* Profile Picture */}
                <div className="flex items-center gap-4 mb-6">
                  <div className="w-20 h-20 rounded-full bg-gradient-to-br from-brand-pink to-purple-600 flex items-center justify-center text-white text-2xl font-bold">
                    {user?.name?.charAt(0).toUpperCase() || 'U'}
                  </div>
                  <div>
                    <p className="text-white font-medium mb-1">Profile Picture</p>
                    <p className="text-sm text-gray-400 mb-3">JPG or PNG. Max size 5MB</p>
                    <button
                      type="button"
                      className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg text-sm font-medium transition"
                    >
                      Upload New Picture
                    </button>
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

                {/* Buttons */}
                <div className="flex gap-4 mt-6">
                  <button
                    type="submit"
                    className="px-6 py-3 bg-white text-black rounded-lg font-semibold hover:bg-gray-200 transition"
                  >
                    Save Changes
                  </button>
                  <button
                    type="button"
                    className="px-6 py-3 bg-white/10 hover:bg-white/20 text-white rounded-lg font-semibold transition"
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
            {/* Prompt Information */}
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
            {/* Daily Usage */}
            <div className="bg-dark-card rounded-xl p-6 border border-gray-800">
              <h2 className="text-xl font-semibold text-white mb-2">Daily Usage</h2>
              <p className="text-sm text-gray-400 mb-6">Track your generation usage for today</p>

              <div className="grid md:grid-cols-2 gap-6">
                <div className="bg-black/40 rounded-xl p-6">
                  <p className="text-gray-400 text-sm mb-2">Image Generations</p>
                  <p className="text-3xl font-bold text-white mb-4">{stats.imagesUsedToday}/10</p>
                  <div className="w-full bg-gray-700 rounded-full h-2">
                    <div
                      className="bg-purple-500 h-2 rounded-full transition-all"
                      style={{ width: `${(stats.imagesUsedToday / 10) * 100}%` }}
                    ></div>
                  </div>
                </div>

                <div className="bg-black/40 rounded-xl p-6">
                  <p className="text-gray-400 text-sm mb-2">Text Generations</p>
                  <p className="text-3xl font-bold text-white mb-4">{stats.textUsedToday}/50</p>
                  <div className="w-full bg-gray-700 rounded-full h-2">
                    <div
                      className="bg-green-500 h-2 rounded-full transition-all"
                      style={{ width: `${(stats.textUsedToday / 50) * 100}%` }}
                    ></div>
                  </div>
                </div>
              </div>
            </div>

            {/* Total Statistics */}
            <div className="bg-dark-card rounded-xl p-6 border border-gray-800">
              <h2 className="text-xl font-semibold text-white mb-2">Total Statistics</h2>
              <p className="text-sm text-gray-400 mb-6">Your all-time generation statistics</p>

              <div className="grid md:grid-cols-4 gap-6">
                <div className="bg-black/40 rounded-xl p-6">
                  <p className="text-gray-400 text-sm mb-2">Total Generations</p>
                  <p className="text-3xl font-bold text-white">{stats.totalGenerations}</p>
                </div>

                <div className="bg-black/40 rounded-xl p-6">
                  <p className="text-gray-400 text-sm mb-2">Images Created</p>
                  <p className="text-3xl font-bold text-white">{stats.imagesCreated}</p>
                </div>

                <div className="bg-black/40 rounded-xl p-6">
                  <p className="text-gray-400 text-sm mb-2">Text Generated</p>
                  <p className="text-3xl font-bold text-white">{stats.textGenerated}</p>
                </div>

                <div className="bg-black/40 rounded-xl p-6">
                  <p className="text-gray-400 text-sm mb-2">Member Since</p>
                  <p className="text-3xl font-bold text-white">{stats.memberSince}</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Pricing Tab */}
        {activeTab === 'pricing' && (
          <div>
            <div className="text-center mb-8">
              <h2 className="text-3xl font-semibold text-white mb-3">Choose Your Plan</h2>
              <p className="text-gray-400">Select the perfect plan for your creative needs</p>
            </div>

            <div className="grid md:grid-cols-3 gap-6">
              {/* Free Plan */}
              <div className="bg-dark-card rounded-xl p-6 border border-gray-800">
                <h3 className="text-2xl font-semibold text-white mb-4">Free</h3>
                <div className="mb-6">
                  <span className="text-5xl font-bold text-white">$0</span>
                </div>
                <p className="text-gray-400 text-sm mb-6">Perfect for getting started</p>

                <ul className="space-y-3 mb-8">
                  <li className="flex items-start gap-2 text-sm">
                    <span className="text-green-500 mt-0.5">✓</span>
                    <span className="text-gray-300">5 image generations per day</span>
                  </li>
                  <li className="flex items-start gap-2 text-sm">
                    <span className="text-green-500 mt-0.5">✓</span>
                    <span className="text-gray-300">30 text generations per day</span>
                  </li>
                  <li className="flex items-start gap-2 text-sm">
                    <span className="text-green-500 mt-0.5">✓</span>
                    <span className="text-gray-300">Basic AI models access</span>
                  </li>
                  <li className="flex items-start gap-2 text-sm">
                    <span className="text-green-500 mt-0.5">✓</span>
                    <span className="text-gray-300">7-day generation history</span>
                  </li>
                  <li className="flex items-start gap-2 text-sm">
                    <span className="text-green-500 mt-0.5">✓</span>
                    <span className="text-gray-300">1 persona</span>
                  </li>
                </ul>

                <button className="w-full py-3 bg-white text-black rounded-lg font-semibold hover:bg-gray-200 transition">
                  Current Plan
                </button>
              </div>

              {/* Pro Plan */}
              <div className="bg-dark-card rounded-xl p-6 border-2 border-brand-pink relative">
                <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                  <span className="bg-white text-black px-4 py-1 rounded-full text-sm font-semibold">
                    Most Popular
                  </span>
                </div>

                <h3 className="text-2xl font-semibold text-white mb-4">Pro</h3>
                <div className="mb-2">
                  <span className="text-5xl font-bold text-white">Coming Soon</span>
                </div>
                <p className="text-gray-400 text-sm mb-6">For serious creators</p>

                <ul className="space-y-3 mb-8">
                  <li className="flex items-start gap-2 text-sm">
                    <span className="text-green-500 mt-0.5">✓</span>
                    <span className="text-gray-300">50 image generations per day</span>
                  </li>
                  <li className="flex items-start gap-2 text-sm">
                    <span className="text-green-500 mt-0.5">✓</span>
                    <span className="text-gray-300">150 text generations per day</span>
                  </li>
                  <li className="flex items-start gap-2 text-sm">
                    <span className="text-green-500 mt-0.5">✓</span>
                    <span className="text-gray-300">All AI models including premium</span>
                  </li>
                  <li className="flex items-start gap-2 text-sm">
                    <span className="text-green-500 mt-0.5">✓</span>
                    <span className="text-gray-300">Unlimited generation history</span>
                  </li>
                  <li className="flex items-start gap-2 text-sm">
                    <span className="text-green-500 mt-0.5">✓</span>
                    <span className="text-gray-300">5 personas</span>
                  </li>
                  <li className="flex items-start gap-2 text-sm">
                    <span className="text-green-500 mt-0.5">✓</span>
                    <span className="text-gray-300">Priority Support</span>
                  </li>
                  <li className="flex items-start gap-2 text-sm">
                    <span className="text-green-500 mt-0.5">✓</span>
                    <span className="text-gray-300">Advanced style presets</span>
                  </li>
                </ul>

                <button className="w-full py-3 bg-white text-black rounded-lg font-semibold hover:bg-gray-200 transition">
                  Upgrade to Pro
                </button>
              </div>

              {/* Expert Plan */}
              <div className="bg-dark-card rounded-xl p-6 border border-gray-800">
                <h3 className="text-2xl font-semibold text-white mb-4">Expert</h3>
                <div className="mb-2">
                  <span className="text-5xl font-bold text-white">Coming Soon</span>
                </div>
                <p className="text-gray-400 text-sm mb-6">Maximum creative power</p>

                <ul className="space-y-3 mb-8">
                  <li className="flex items-start gap-2 text-sm">
                    <span className="text-green-500 mt-0.5">✓</span>
                    <span className="text-gray-300">150 image generations per day</span>
                  </li>
                  <li className="flex items-start gap-2 text-sm">
                    <span className="text-green-500 mt-0.5">✓</span>
                    <span className="text-gray-300">Unlimited text generations</span>
                  </li>
                  <li className="flex items-start gap-2 text-sm">
                    <span className="text-green-500 mt-0.5">✓</span>
                    <span className="text-gray-300">All AI models + early access to new models</span>
                  </li>
                  <li className="flex items-start gap-2 text-sm">
                    <span className="text-green-500 mt-0.5">✓</span>
                    <span className="text-gray-300">Unlimited generation history</span>
                  </li>
                  <li className="flex items-start gap-2 text-sm">
                    <span className="text-green-500 mt-0.5">✓</span>
                    <span className="text-gray-300">Unlimited personas</span>
                  </li>
                  <li className="flex items-start gap-2 text-sm">
                    <span className="text-green-500 mt-0.5">✓</span>
                    <span className="text-gray-300">Dedicated support & training</span>
                  </li>
                  <li className="flex items-start gap-2 text-sm">
                    <span className="text-green-500 mt-0.5">✓</span>
                    <span className="text-gray-300">Custom AI model fine-tuning</span>
                  </li>
                  <li className="flex items-start gap-2 text-sm">
                    <span className="text-green-500 mt-0.5">✓</span>
                    <span className="text-gray-300">API access</span>
                  </li>
                </ul>

                <button className="w-full py-3 bg-white text-black rounded-lg font-semibold hover:bg-gray-200 transition">
                  Upgrade to Expert
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Notifications Tab */}
        {activeTab === 'notifications' && (
          <div className="space-y-6">
            {/* Email Notifications */}
            <div className="bg-dark-card rounded-xl p-6 border border-gray-800">
              <h2 className="text-xl font-semibold text-white mb-2">Email Notifications</h2>
              <p className="text-sm text-gray-400 mb-6">Manage your email notification preferences</p>

              <div className="space-y-6">
                <div className="flex items-center justify-between py-4 border-b border-gray-700">
                  <div>
                    <p className="text-white font-medium mb-1">Generation completed</p>
                    <p className="text-sm text-gray-400">
                      Receive email when your generation is complete
                    </p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={notifications.generationCompleted}
                      onChange={(e) => setNotifications({...notifications, generationCompleted: e.target.checked})}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-700 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-brand-pink rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-brand-pink"></div>
                  </label>
                </div>

                <div className="flex items-center justify-between py-4 border-b border-gray-700">
                  <div>
                    <p className="text-white font-medium mb-1">Weekly summary</p>
                    <p className="text-sm text-gray-400">
                      Get a weekly report of your activity
                    </p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={notifications.weeklySummary}
                      onChange={(e) => setNotifications({...notifications, weeklySummary: e.target.checked})}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-700 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-brand-pink rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-brand-pink"></div>
                  </label>
                </div>

                <div className="flex items-center justify-between py-4 border-b border-gray-700">
                  <div>
                    <p className="text-white font-medium mb-1">Product Updates</p>
                    <p className="text-sm text-gray-400">
                      Stay informed about new features and improvements
                    </p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={notifications.productUpdates}
                      onChange={(e) => setNotifications({...notifications, productUpdates: e.target.checked})}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-700 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-brand-pink rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-brand-pink"></div>
                  </label>
                </div>

                <div className="flex items-center justify-between py-4">
                  <div>
                    <p className="text-white font-medium mb-1">Marketing emails</p>
                    <p className="text-sm text-gray-400">
                      Receive tips, tutorials, and promotional content
                    </p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={notifications.marketingEmails}
                      onChange={(e) => setNotifications({...notifications, marketingEmails: e.target.checked})}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-700 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-brand-pink rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-brand-pink"></div>
                  </label>
                </div>
              </div>
            </div>

            {/* Push Notifications */}
            <div className="bg-dark-card rounded-xl p-6 border border-gray-800">
              <h2 className="text-xl font-semibold text-white mb-2">Push Notifications</h2>
              <p className="text-sm text-gray-400 mb-6">Manage browser push notifications</p>

              <div className="flex items-center justify-between py-4">
                <div>
                  <p className="text-white font-medium mb-1">Enable push notifications</p>
                  <p className="text-sm text-gray-400">
                    Receive real-time updates in your browser
                  </p>
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
        )}
      </div>
    </Layout>
  );
}