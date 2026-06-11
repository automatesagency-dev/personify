'use client'

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Layout from '../components/Layout';
import { useAuth } from '../context/AuthContext';
import { authAPI, referralAPI } from '../services/api';

const ADMIN_EMAIL = 'admin@automatesagency.com';

export default function AdminUsers() {
  const { user } = useAuth();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('users');
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [sort, setSort] = useState('newest');

  // Referral codes state
  const [codes, setCodes] = useState([]);
  const [codesLoading, setCodesLoading] = useState(false);
  const [stats, setStats] = useState(null);
  const [genCount, setGenCount] = useState(1);
  const [genMaxUses, setGenMaxUses] = useState(5);
  const [generating, setGenerating] = useState(false);
  const [generatedCodes, setGeneratedCodes] = useState([]);

  useEffect(() => {
    if (user && user.email !== ADMIN_EMAIL) {
      router.push('/dashboard');
      return;
    }
    if (user) {
      loadUsers();
      loadReferralData();
    }
  }, [user]);

  const loadUsers = async () => {
    try {
      const { data } = await authAPI.getAdminUsers();
      setUsers(data.users);
    } catch {
      router.push('/dashboard');
    } finally {
      setLoading(false);
    }
  };

  const loadReferralData = async () => {
    setCodesLoading(true);
    try {
      const [codesRes, statsRes] = await Promise.all([
        referralAPI.adminGetCodes(),
        referralAPI.adminStats()
      ]);
      setCodes(codesRes.data.codes);
      setStats(statsRes.data);
    } catch (e) {
      console.error('Failed to load referral data', e);
    } finally {
      setCodesLoading(false);
    }
  };

  const handleGenerateCodes = async () => {
    setGenerating(true);
    setGeneratedCodes([]);
    try {
      const { data } = await referralAPI.adminGenerateCodes({ count: genCount, maxUses: genMaxUses });
      setGeneratedCodes(data.codes.map(c => c.code));
      await loadReferralData();
    } catch (e) {
      alert('Failed to generate codes');
    } finally {
      setGenerating(false);
    }
  };

  const handleToggleCode = async (id) => {
    try {
      await referralAPI.adminToggleCode(id);
      await loadReferralData();
    } catch (e) {
      alert('Failed to toggle code');
    }
  };

  const copyAllGenerated = () => {
    navigator.clipboard.writeText(generatedCodes.join('\n'));
    alert(`Copied ${generatedCodes.length} codes`);
  };

  const copyEmails = () => {
    const emails = filtered.map(u => u.email).join('\n');
    navigator.clipboard.writeText(emails);
    alert(`Copied ${filtered.length} emails to clipboard`);
  };

  const filtered = users
    .filter(u => {
      if (!search) return true;
      const q = search.toLowerCase();
      return u.email.toLowerCase().includes(q) || (u.name || '').toLowerCase().includes(q);
    })
    .sort((a, b) => {
      if (sort === 'newest') return new Date(b.createdAt) - new Date(a.createdAt);
      if (sort === 'oldest') return new Date(a.createdAt) - new Date(b.createdAt);
      if (sort === 'generations') return (b._count?.generations || 0) - (a._count?.generations || 0);
      return 0;
    });

  if (loading) return (
    <Layout>
      <div className="flex items-center justify-center h-screen text-white">Loading...</div>
    </Layout>
  );

  return (
    <Layout>
      <div className="p-4 md:p-8 max-w-7xl mx-auto">
        <div className="mb-6">
          <h1 className="text-2xl md:text-3xl font-semibold text-white">Admin Panel</h1>
          <p className="text-gray-400 text-sm mt-1">Manage users and referral codes</p>
        </div>

        {/* Tab switcher */}
        <div className="flex gap-2 mb-6 border-b border-gray-800">
          {['users', 'referrals'].map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2.5 text-sm font-medium capitalize transition border-b-2 -mb-px ${
                activeTab === tab
                  ? 'border-brand-pink text-white'
                  : 'border-transparent text-gray-400 hover:text-white'
              }`}
            >
              {tab === 'users' ? `Users (${users.length})` : 'Referral Codes'}
            </button>
          ))}
        </div>

        {/* ── USERS TAB ── */}
        {activeTab === 'users' && (
          <>
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
              <div className="grid grid-cols-3 gap-4 flex-1">
                <div className="bg-dark-card rounded-xl p-4 border border-gray-800 text-center">
                  <p className="text-2xl font-bold text-white">{users.length}</p>
                  <p className="text-xs text-gray-400 mt-1">Total Users</p>
                </div>
                <div className="bg-dark-card rounded-xl p-4 border border-gray-800 text-center">
                  <p className="text-2xl font-bold text-white">{users.filter(u => u.googleId).length}</p>
                  <p className="text-xs text-gray-400 mt-1">Google Signups</p>
                </div>
                <div className="bg-dark-card rounded-xl p-4 border border-gray-800 text-center">
                  <p className="text-2xl font-bold text-white">{users.filter(u => u.founderPage?.published).length}</p>
                  <p className="text-xs text-gray-400 mt-1">Live Pages</p>
                </div>
              </div>
              <button onClick={copyEmails} className="px-4 py-2 bg-white text-black rounded-lg font-semibold text-sm hover:bg-gray-200 transition shrink-0">
                Copy {filtered.length} Emails
              </button>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 mb-4">
              <input
                type="text"
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Search by name or email..."
                className="flex-1 px-4 py-2.5 bg-dark-card border border-gray-700 rounded-lg text-sm text-white placeholder-gray-500 outline-none focus:border-brand-pink transition"
              />
              <select
                value={sort}
                onChange={e => setSort(e.target.value)}
                className="px-4 py-2.5 bg-dark-card border border-gray-700 rounded-lg text-sm text-white outline-none focus:border-brand-pink transition"
              >
                <option value="newest">Newest First</option>
                <option value="oldest">Oldest First</option>
                <option value="generations">Most Generations</option>
              </select>
            </div>

            <div className="bg-dark-card rounded-xl border border-gray-800 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-800 text-left">
                      <th className="px-4 py-3 text-gray-400 font-medium">User</th>
                      <th className="px-4 py-3 text-gray-400 font-medium">Email</th>
                      <th className="px-4 py-3 text-gray-400 font-medium">Joined</th>
                      <th className="px-4 py-3 text-gray-400 font-medium">Gens</th>
                      <th className="px-4 py-3 text-gray-400 font-medium">Page</th>
                      <th className="px-4 py-3 text-gray-400 font-medium">Auth</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map((u, i) => (
                      <tr key={u.id} className={`border-b border-gray-800/50 hover:bg-white/5 transition ${i % 2 === 0 ? '' : 'bg-white/[0.02]'}`}>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-3">
                            {u.profilePictureUrl ? (
                              <img src={u.profilePictureUrl} alt="" className="w-8 h-8 rounded-full object-cover flex-shrink-0" />
                            ) : (
                              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-brand-pink to-purple-600 flex items-center justify-center text-white text-xs font-semibold flex-shrink-0">
                                {(u.name || u.email).charAt(0).toUpperCase()}
                              </div>
                            )}
                            <span className="text-white font-medium truncate max-w-[120px]">{u.name || '—'}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-gray-300">{u.email}</td>
                        <td className="px-4 py-3 text-gray-400 whitespace-nowrap">
                          {new Date(u.createdAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: '2-digit' })}
                        </td>
                        <td className="px-4 py-3 text-gray-300">{u._count?.generations || 0}</td>
                        <td className="px-4 py-3">
                          {u.founderPage ? (
                            <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${u.founderPage.published ? 'bg-green-500/20 text-green-400' : 'bg-yellow-500/20 text-yellow-400'}`}>
                              {u.founderPage.published ? 'Live' : 'Draft'}
                            </span>
                          ) : (
                            <span className="text-gray-600 text-xs">None</span>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${u.googleId ? 'bg-blue-500/20 text-blue-400' : 'bg-gray-700 text-gray-400'}`}>
                            {u.googleId ? 'Google' : 'Email'}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {filtered.length === 0 && (
                  <div className="text-center py-12 text-gray-500">No users found</div>
                )}
              </div>
            </div>
          </>
        )}

        {/* ── REFERRALS TAB ── */}
        {activeTab === 'referrals' && (
          <>
            {/* Stats */}
            {stats && (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
                {[
                  { label: 'Total Users', value: stats.totalUsers },
                  { label: 'Verified Users', value: stats.verifiedUsers },
                  { label: 'Admin Codes', value: stats.totalCodes },
                  { label: 'Total Redemptions', value: stats.totalRedemptions },
                ].map(s => (
                  <div key={s.label} className="bg-dark-card rounded-xl p-4 border border-gray-800 text-center">
                    <p className="text-2xl font-bold text-white">{s.value}</p>
                    <p className="text-xs text-gray-400 mt-1">{s.label}</p>
                  </div>
                ))}
              </div>
            )}

            {/* Generate codes form */}
            <div className="bg-dark-card rounded-xl border border-gray-800 p-5 mb-6">
              <h2 className="text-white font-semibold mb-4">Generate Campaign Codes</h2>
              <div className="flex flex-wrap gap-4 items-end">
                <div>
                  <label className="block text-xs text-gray-400 mb-1.5">Number of codes</label>
                  <input
                    type="number"
                    min={1}
                    max={100}
                    value={genCount}
                    onChange={e => setGenCount(Math.max(1, Math.min(100, Number(e.target.value))))}
                    className="w-28 px-3 py-2 bg-dark-bg border border-gray-700 rounded-lg text-sm text-white outline-none focus:border-brand-pink transition"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-400 mb-1.5">Max uses per code</label>
                  <select
                    value={genMaxUses}
                    onChange={e => setGenMaxUses(Number(e.target.value))}
                    className="px-3 py-2 bg-dark-bg border border-gray-700 rounded-lg text-sm text-white outline-none focus:border-brand-pink transition"
                  >
                    <option value={1}>1 use</option>
                    <option value={5}>5 uses</option>
                    <option value={10}>10 uses</option>
                    <option value={50}>50 uses</option>
                    <option value={100}>100 uses</option>
                    <option value={0}>Unlimited</option>
                  </select>
                </div>
                <button
                  onClick={handleGenerateCodes}
                  disabled={generating}
                  className="px-5 py-2 bg-brand-pink text-white rounded-lg text-sm font-semibold hover:opacity-90 transition disabled:opacity-50"
                >
                  {generating ? 'Generating...' : `Generate ${genCount} Code${genCount > 1 ? 's' : ''}`}
                </button>
              </div>

              {generatedCodes.length > 0 && (
                <div className="mt-4">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-xs text-gray-400">{generatedCodes.length} code{generatedCodes.length > 1 ? 's' : ''} generated</p>
                    <button onClick={copyAllGenerated} className="text-xs text-brand-pink hover:underline">Copy all</button>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {generatedCodes.map(c => (
                      <button
                        key={c}
                        onClick={() => { navigator.clipboard.writeText(c); }}
                        className="px-3 py-1.5 bg-dark-bg border border-gray-700 rounded-lg text-sm font-mono text-white hover:border-brand-pink transition"
                        title="Click to copy"
                      >
                        {c}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Codes table */}
            <div className="bg-dark-card rounded-xl border border-gray-800 overflow-hidden">
              <div className="px-5 py-4 border-b border-gray-800">
                <h2 className="text-white font-semibold">All Campaign Codes</h2>
              </div>
              {codesLoading ? (
                <div className="text-center py-8 text-gray-500 text-sm">Loading...</div>
              ) : codes.length === 0 ? (
                <div className="text-center py-8 text-gray-500 text-sm">No campaign codes yet</div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-gray-800 text-left">
                        <th className="px-4 py-3 text-gray-400 font-medium">Code</th>
                        <th className="px-4 py-3 text-gray-400 font-medium">Uses</th>
                        <th className="px-4 py-3 text-gray-400 font-medium">Max</th>
                        <th className="px-4 py-3 text-gray-400 font-medium">Created</th>
                        <th className="px-4 py-3 text-gray-400 font-medium">Status</th>
                        <th className="px-4 py-3 text-gray-400 font-medium">Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {codes.map((c, i) => (
                        <tr key={c.id} className={`border-b border-gray-800/50 hover:bg-white/5 transition ${i % 2 === 0 ? '' : 'bg-white/[0.02]'}`}>
                          <td className="px-4 py-3">
                            <button
                              onClick={() => navigator.clipboard.writeText(c.code)}
                              className="font-mono text-white hover:text-brand-pink transition"
                              title="Click to copy"
                            >
                              {c.code}
                            </button>
                          </td>
                          <td className="px-4 py-3 text-gray-300">{c.usedCount}</td>
                          <td className="px-4 py-3 text-gray-300">{c.maxUses === -1 ? '∞' : c.maxUses}</td>
                          <td className="px-4 py-3 text-gray-400 whitespace-nowrap">
                            {new Date(c.createdAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: '2-digit' })}
                          </td>
                          <td className="px-4 py-3">
                            <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${c.isActive ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
                              {c.isActive ? 'Active' : 'Revoked'}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            <button
                              onClick={() => handleToggleCode(c.id)}
                              className={`text-xs font-medium hover:underline ${c.isActive ? 'text-red-400' : 'text-green-400'}`}
                            >
                              {c.isActive ? 'Revoke' : 'Reactivate'}
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </Layout>
  );
}
