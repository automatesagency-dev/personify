'use client'

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Layout from '../components/Layout';
import { useAuth } from '../context/AuthContext';
import { authAPI } from '../services/api';

const ADMIN_EMAIL = 'admin@automatesagency.com';

export default function AdminUsers() {
  const { user } = useAuth();
  const router = useRouter();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [sort, setSort] = useState('newest');

  useEffect(() => {
    if (user && user.email !== ADMIN_EMAIL) {
      router.push('/dashboard');
      return;
    }
    if (user) loadUsers();
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
        <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-semibold text-white">Users</h1>
            <p className="text-gray-400 text-sm mt-1">{users.length} total signups</p>
          </div>
          <button
            onClick={copyEmails}
            className="px-4 py-2 bg-white text-black rounded-lg font-semibold text-sm hover:bg-gray-200 transition"
          >
            Copy {filtered.length} Emails
          </button>
        </div>

        {/* Stats strip */}
        <div className="grid grid-cols-3 gap-4 mb-6">
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

        {/* Filters */}
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

        {/* Table */}
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
      </div>
    </Layout>
  );
}
