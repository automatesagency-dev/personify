'use client'

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../context/AuthContext';
import AdminLayout from '../components/AdminLayout';
import { authAPI, referralAPI } from '../services/api';

const ADMIN_EMAIL = 'admin@automatesagency.com';

// ── Utilities ─────────────────────────────────────────────────────────────────

function timeAgo(date) {
  const diff = (Date.now() - new Date(date)) / 1000;
  if (diff < 60) return `${Math.floor(diff)}s ago`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

function fmtNum(n) {
  if (n >= 1000000) return `${(n / 1000000).toFixed(1)}M`;
  if (n >= 1000) return `${(n / 1000).toFixed(1)}K`;
  return String(n);
}

// ── Stat Card ─────────────────────────────────────────────────────────────────

function StatCard({ title, value, sub, icon }) {
  return (
    <div className="bg-[#111] rounded-2xl p-5 border border-white/[0.07]">
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1 min-w-0 pr-2">
          <p className="text-xs text-gray-500 mb-1">{title}</p>
          <p className="text-2xl font-bold text-white leading-none">{value}</p>
        </div>
        <div className="w-9 h-9 bg-white/[0.06] rounded-xl flex items-center justify-center text-base flex-shrink-0">
          {icon}
        </div>
      </div>
      {sub && <p className="text-[11px] text-gray-600 leading-snug">{sub}</p>}
    </div>
  );
}

// ── Chart: Line (SVG, no deps) ────────────────────────────────────────────────

function LineChart({ data, keys, colors }) {
  if (!data?.length) return <div className="w-full h-full bg-white/[0.03] rounded animate-pulse" />;
  const W = 400, H = 80, PAD = 3;
  const maxVal = Math.max(...data.flatMap(d => keys.map(k => d[k] || 0)), 1);
  const getX = i => PAD + (i / (data.length - 1)) * (W - PAD * 2);
  const getY = v => H - PAD - ((v / maxVal) * (H - PAD * 2));

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-full" preserveAspectRatio="none">
      <defs>
        {keys.map((_, ki) => (
          <linearGradient key={ki} id={`alg${ki}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={colors[ki]} stopOpacity="0.25" />
            <stop offset="100%" stopColor={colors[ki]} stopOpacity="0" />
          </linearGradient>
        ))}
      </defs>
      {keys.map((key, ki) => {
        const pts = data.map((d, i) => [getX(i), getY(d[key] || 0)]);
        const polyline = pts.map(p => p.join(',')).join(' ');
        const area = `M${pts[0][0]},${H} ${pts.map(p => `L${p[0]},${p[1]}`).join(' ')} L${pts[pts.length - 1][0]},${H} Z`;
        return (
          <g key={key}>
            <path d={area} fill={`url(#alg${ki})`} />
            <polyline points={polyline} fill="none" stroke={colors[ki]} strokeWidth="1.5" strokeLinejoin="round" strokeLinecap="round" />
          </g>
        );
      })}
    </svg>
  );
}

// ── Chart: Donut (SVG, no deps) ───────────────────────────────────────────────

function DonutChart({ segments }) {
  const total = segments.reduce((s, v) => s + v.value, 0) || 1;
  const R = 32, CX = 40, CY = 40, SW = 13;
  const circumference = 2 * Math.PI * R;
  let cum = 0;
  return (
    <svg width={80} height={80} viewBox="0 0 80 80" className="-rotate-90">
      <circle cx={CX} cy={CY} r={R} fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth={SW} />
      {segments.map((s, i) => {
        const pct = s.value / total;
        const dash = pct * circumference;
        const offset = -cum * circumference;
        cum += pct;
        return (
          <circle key={i} cx={CX} cy={CY} r={R} fill="none" stroke={s.color}
            strokeWidth={SW} strokeDasharray={`${dash} ${circumference - dash}`} strokeDashoffset={offset} />
        );
      })}
    </svg>
  );
}

// ── Skeleton ──────────────────────────────────────────────────────────────────

function Skeleton({ className = '' }) {
  return <div className={`bg-white/[0.05] rounded animate-pulse ${className}`} />;
}

// ── SECTION: Overview ─────────────────────────────────────────────────────────

function OverviewSection({ data, loading }) {
  if (loading) {
    return (
      <div className="p-6 space-y-6">
        <Skeleton className="h-8 w-40" />
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-28 rounded-2xl" />)}
        </div>
        <div className="grid grid-cols-3 gap-4">
          <Skeleton className="col-span-2 h-52 rounded-2xl" />
          <Skeleton className="h-52 rounded-2xl" />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <Skeleton className="h-64 rounded-2xl" />
          <Skeleton className="h-64 rounded-2xl" />
        </div>
      </div>
    );
  }

  const userSegments = [
    { value: data?.users?.google || 0, color: '#3b82f6', label: 'Google' },
    { value: Math.max((data?.users?.total || 0) - (data?.users?.google || 0), 0), color: '#ec4899', label: 'Email' },
  ];

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white">Overview</h1>
        <p className="text-gray-500 text-sm mt-0.5">Platform analytics and key performance metrics</p>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard title="Total Users" value={fmtNum(data?.users?.total || 0)} sub={`${data?.users?.newThisWeek || 0} new this week`} icon="👥" />
        <StatCard title="Total Generations" value={fmtNum(data?.generations?.total || 0)} sub={`${data?.generations?.todayTotal || 0} today`} icon="⚡" />
        <StatCard title="Monthly Revenue" value="—" sub="No payment provider connected" icon="💳" />
        <StatCard title="Avg Session Time" value="—" sub="Analytics not connected" icon="⏱️" />
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">

        {/* Daily generations line chart */}
        <div className="lg:col-span-2 bg-[#111] rounded-2xl p-5 border border-white/[0.07]">
          <div className="flex items-start justify-between mb-4">
            <div>
              <p className="text-white font-semibold text-sm">Daily Generations</p>
              <p className="text-gray-600 text-xs mt-0.5">Images vs Text — this week</p>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-brand-pink flex-shrink-0" />
                <span className="text-[11px] text-gray-500">Images</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-gray-600 flex-shrink-0" />
                <span className="text-[11px] text-gray-500">Text</span>
              </div>
            </div>
          </div>
          <div className="h-20 mb-3">
            <LineChart data={data?.dailyCounts || []} keys={['images', 'text']} colors={['#ec4899', '#4b5563']} />
          </div>
          <div className="flex justify-between px-0.5">
            {(data?.dailyCounts || []).map((d, i) => (
              <span key={i} className="text-[10px] text-gray-700">{d.label}</span>
            ))}
          </div>
        </div>

        {/* User distribution donut */}
        <div className="bg-[#111] rounded-2xl p-5 border border-white/[0.07]">
          <p className="text-white font-semibold text-sm mb-0.5">User Distribution</p>
          <p className="text-gray-600 text-xs mb-5">Signup methods</p>
          <div className="flex items-center gap-5">
            <DonutChart segments={userSegments} />
            <div className="space-y-2.5">
              {userSegments.map((s, i) => (
                <div key={i} className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: s.color }} />
                  <span className="text-xs text-gray-400">{s.label}</span>
                  <span className="text-xs text-white font-bold ml-2">{s.value}</span>
                </div>
              ))}
              <div className="pt-1 border-t border-white/[0.07]">
                <p className="text-[10px] text-gray-700">Total: {data?.users?.total || 0}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Model usage + recent activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">

        {/* Model usage */}
        <div className="bg-[#111] rounded-2xl p-5 border border-white/[0.07]">
          <p className="text-white font-semibold text-sm mb-0.5">Model Usage</p>
          <p className="text-gray-600 text-xs mb-5">Share of all generations</p>
          {(data?.modelUsage || []).length === 0 ? (
            <p className="text-gray-700 text-sm">No generations yet</p>
          ) : (
            <div className="space-y-4">
              {(data?.modelUsage || []).map((m, i) => (
                <div key={i}>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-sm text-white">{m.model}</span>
                    <span className="text-sm text-gray-500">{m.pct}%</span>
                  </div>
                  <div className="h-1.5 bg-white/[0.05] rounded-full overflow-hidden">
                    <div className="h-full bg-white/40 rounded-full" style={{ width: `${m.pct}%` }} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recent activity */}
        <div className="bg-[#111] rounded-2xl p-5 border border-white/[0.07]">
          <p className="text-white font-semibold text-sm mb-0.5">Recent Activity</p>
          <p className="text-gray-600 text-xs mb-5">Latest platform events</p>
          {(data?.recentActivity || []).length === 0 ? (
            <p className="text-gray-700 text-sm">No recent activity</p>
          ) : (
            <div className="space-y-3">
              {(data?.recentActivity || []).map((a, i) => (
                <div key={i} className="flex items-center gap-3">
                  <div className="w-7 h-7 bg-white/[0.06] rounded-lg flex items-center justify-center flex-shrink-0 text-sm">
                    {a.type === 'image' ? '🖼️' : '✍️'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-white text-xs font-medium truncate">
                      {a.user?.name || a.user?.email?.split('@')[0] || 'Unknown'}
                    </p>
                    <p className="text-gray-600 text-[11px]">Generated {a.type}</p>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    {a.model && (
                      <span className="text-[10px] px-1.5 py-0.5 bg-white/[0.06] text-gray-500 rounded">
                        {a.model}
                      </span>
                    )}
                    <span className="text-[10px] text-gray-700 whitespace-nowrap">{timeAgo(a.createdAt)}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ── SECTION: Users ────────────────────────────────────────────────────────────

function UsersSection({ users, loading, onCopyEmails }) {
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all');
  const [sort, setSort] = useState('newest');

  const FILTERS = [
    { id: 'all', label: 'All' },
    { id: 'google', label: 'Google' },
    { id: 'email', label: 'Email' },
    { id: 'persona', label: 'Has Persona' },
    { id: 'page', label: 'Has Page' },
  ];

  const filtered = users
    .filter(u => {
      const q = search.toLowerCase();
      if (q && !u.email.toLowerCase().includes(q) && !(u.name || '').toLowerCase().includes(q)) return false;
      if (filter === 'google') return !!u.googleId;
      if (filter === 'email') return !u.googleId;
      if (filter === 'persona') return !!u.persona;
      if (filter === 'page') return !!u.founderPage?.published;
      return true;
    })
    .sort((a, b) => {
      if (sort === 'newest') return new Date(b.createdAt) - new Date(a.createdAt);
      if (sort === 'oldest') return new Date(a.createdAt) - new Date(b.createdAt);
      if (sort === 'generations') return (b._count?.generations || 0) - (a._count?.generations || 0);
      return 0;
    });

  return (
    <div className="p-6">
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white">Users</h1>
          <p className="text-gray-500 text-sm mt-0.5">Manage and monitor all user accounts</p>
        </div>
        <button
          onClick={() => onCopyEmails(filtered)}
          className="px-4 py-2 bg-white text-black rounded-xl text-sm font-semibold hover:bg-gray-200 transition"
        >
          Copy {filtered.length} Emails
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard title="Total Users" value={fmtNum(users.length)} sub="All time" icon="👥" />
        <StatCard title="Google Signups" value={fmtNum(users.filter(u => u.googleId).length)} sub="OAuth logins" icon="🔗" />
        <StatCard title="With Persona" value={fmtNum(users.filter(u => u.persona).length)} sub="Active personas" icon="👤" />
        <StatCard title="Live Pages" value={fmtNum(users.filter(u => u.founderPage?.published).length)} sub="Published founder pages" icon="🚀" />
      </div>

      {/* Search + filters */}
      <div className="flex flex-wrap items-center gap-3 mb-4">
        <div className="relative flex-1 min-w-48 max-w-sm">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search users..."
            className="w-full pl-9 pr-4 py-2 bg-[#111] border border-white/[0.07] rounded-xl text-sm text-white placeholder-gray-600 outline-none focus:border-white/20 transition"
          />
        </div>
        <div className="flex items-center gap-0.5 bg-[#111] border border-white/[0.07] rounded-xl p-1">
          {FILTERS.map(f => (
            <button
              key={f.id}
              onClick={() => setFilter(f.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition ${filter === f.id ? 'bg-white text-black' : 'text-gray-500 hover:text-white'}`}
            >
              {f.label}
            </button>
          ))}
        </div>
        <select
          value={sort}
          onChange={e => setSort(e.target.value)}
          className="px-3 py-2 bg-[#111] border border-white/[0.07] rounded-xl text-sm text-white outline-none appearance-none"
        >
          <option value="newest">Newest First</option>
          <option value="oldest">Oldest First</option>
          <option value="generations">Most Generations</option>
        </select>
      </div>

      {/* Table */}
      <div className="bg-[#111] rounded-2xl border border-white/[0.07] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/[0.06]">
                {['User', 'Plan', 'Status', 'Generations', 'Persona', 'Joined', 'Last Active'].map(h => (
                  <th key={h} className="px-5 py-3.5 text-left text-[11px] font-semibold text-gray-600 uppercase tracking-wider whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.04]">
              {loading ? (
                [...Array(6)].map((_, i) => (
                  <tr key={i}><td colSpan={7} className="px-5 py-4"><Skeleton className="h-4" /></td></tr>
                ))
              ) : filtered.map(u => (
                <tr key={u.id} className="hover:bg-white/[0.02] transition">
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-3">
                      {u.profilePictureUrl ? (
                        <img src={u.profilePictureUrl} alt="" className="w-8 h-8 rounded-full object-cover flex-shrink-0" />
                      ) : (
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-brand-pink to-purple-600 flex items-center justify-center text-white text-xs font-semibold flex-shrink-0">
                          {(u.name || u.email).charAt(0).toUpperCase()}
                        </div>
                      )}
                      <div className="min-w-0">
                        <p className="text-white text-xs font-medium truncate max-w-[130px]">{u.name || '—'}</p>
                        <p className="text-gray-600 text-[11px] truncate max-w-[130px]">{u.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-3.5">
                    <span className="px-2 py-0.5 bg-white/[0.07] text-gray-400 text-[11px] rounded-full">Free</span>
                  </td>
                  <td className="px-5 py-3.5">
                    <span className="px-2 py-0.5 bg-green-500/20 text-green-400 text-[11px] rounded-full font-medium">active</span>
                  </td>
                  <td className="px-5 py-3.5 text-gray-300 font-semibold text-sm">{u._count?.generations || 0}</td>
                  <td className="px-5 py-3.5">
                    {u.persona ? (
                      <p className="text-green-400 text-xs">{u.persona.industry || 'Set up'}</p>
                    ) : (
                      <span className="text-gray-700 text-xs">None</span>
                    )}
                  </td>
                  <td className="px-5 py-3.5 text-gray-600 text-xs whitespace-nowrap">
                    {new Date(u.createdAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: '2-digit' })}
                  </td>
                  <td className="px-5 py-3.5 text-gray-700 text-xs">—</td>
                </tr>
              ))}
            </tbody>
          </table>
          {!loading && filtered.length === 0 && (
            <div className="text-center py-12 text-gray-700 text-sm">No users found</div>
          )}
        </div>
        {!loading && (
          <div className="px-5 py-3 border-t border-white/[0.05]">
            <p className="text-[11px] text-gray-700">Showing {filtered.length} of {users.length} users</p>
          </div>
        )}
      </div>
    </div>
  );
}

// ── SECTION: Generations ──────────────────────────────────────────────────────

function GenerationsSection({ generations, loading }) {
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all');

  const today = new Date(); today.setHours(0, 0, 0, 0);
  const todayGens = generations.filter(g => new Date(g.createdAt) >= today);
  const failed = generations.filter(g => g.status === 'failed').length;
  const models = new Set(generations.map(g => g.model)).size;

  const filtered = generations.filter(g => {
    if (filter !== 'all' && g.type !== filter) return false;
    if (search) {
      const q = search.toLowerCase();
      return g.prompt.toLowerCase().includes(q) ||
        (g.user?.name || '').toLowerCase().includes(q) ||
        (g.user?.email || '').toLowerCase().includes(q);
    }
    return true;
  });

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white">Generations</h1>
        <p className="text-gray-500 text-sm mt-0.5">All AI generations across the platform</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
        <StatCard title="Today Total" value={todayGens.length} sub={`${fmtNum(generations.length)} all time`} icon="📊" />
        <StatCard title="Images" value={todayGens.filter(g => g.type === 'image').length} sub="Today" icon="🖼️" />
        <StatCard title="Text" value={todayGens.filter(g => g.type === 'text').length} sub="Today" icon="✍️" />
        <StatCard title="Failed" value={failed} sub="All time" icon="⚠️" />
        <StatCard title="Models Used" value={models} sub="Distinct" icon="🤖" />
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3 mb-4">
        <div className="relative flex-1 max-w-sm">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search by prompt or user..."
            className="w-full pl-9 pr-4 py-2 bg-[#111] border border-white/[0.07] rounded-xl text-sm text-white placeholder-gray-600 outline-none focus:border-white/20 transition"
          />
        </div>
        <div className="flex items-center gap-0.5 bg-[#111] border border-white/[0.07] rounded-xl p-1">
          {[{ id: 'all', label: 'All' }, { id: 'image', label: 'Image' }, { id: 'text', label: 'Text' }].map(f => (
            <button
              key={f.id}
              onClick={() => setFilter(f.id)}
              className={`px-4 py-1.5 rounded-lg text-xs font-medium transition ${filter === f.id ? 'bg-white text-black' : 'text-gray-500 hover:text-white'}`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="bg-[#111] rounded-2xl border border-white/[0.07] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/[0.06]">
                {['User', 'Prompt', 'Type', 'Model', 'Status', 'Time'].map(h => (
                  <th key={h} className="px-5 py-3.5 text-left text-[11px] font-semibold text-gray-600 uppercase tracking-wider">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.04]">
              {loading ? (
                [...Array(8)].map((_, i) => (
                  <tr key={i}><td colSpan={6} className="px-5 py-4"><Skeleton className="h-4" /></td></tr>
                ))
              ) : filtered.map(g => (
                <tr key={g.id} className="hover:bg-white/[0.02] transition">
                  <td className="px-5 py-3.5 whitespace-nowrap">
                    <p className="text-white text-xs font-medium">{g.user?.name || g.user?.email?.split('@')[0] || '—'}</p>
                    <p className="text-gray-700 text-[11px]">{g.user?.email}</p>
                  </td>
                  <td className="px-5 py-3.5 max-w-[220px]">
                    <p className="text-gray-400 text-xs truncate">{g.prompt}</p>
                  </td>
                  <td className="px-5 py-3.5">
                    <span className={`px-2 py-0.5 text-[11px] rounded font-semibold ${g.type === 'image' ? 'bg-purple-500/20 text-purple-400' : 'bg-green-500/20 text-green-400'}`}>
                      {g.type.toUpperCase()}
                    </span>
                  </td>
                  <td className="px-5 py-3.5">
                    <span className="px-2 py-0.5 bg-white/[0.06] text-gray-400 text-[11px] rounded">{g.model}</span>
                  </td>
                  <td className="px-5 py-3.5">
                    <span className={`px-2 py-0.5 text-[11px] rounded font-medium ${
                      g.status === 'completed' ? 'bg-green-500/20 text-green-400' :
                      g.status === 'failed' ? 'bg-red-500/20 text-red-400' :
                      'bg-yellow-500/20 text-yellow-400'
                    }`}>
                      {g.status}
                    </span>
                  </td>
                  <td className="px-5 py-3.5 text-gray-700 text-[11px] whitespace-nowrap">{timeAgo(g.createdAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {!loading && filtered.length === 0 && (
            <div className="text-center py-12 text-gray-700 text-sm">No generations found</div>
          )}
        </div>
        {!loading && (
          <div className="px-5 py-3 border-t border-white/[0.05]">
            <p className="text-[11px] text-gray-700">Showing {filtered.length} of {generations.length} generations</p>
          </div>
        )}
      </div>
    </div>
  );
}

// ── SECTION: AI Models ────────────────────────────────────────────────────────

const MODEL_META = {
  'dall-e-3':    { color: '#8b5cf6', type: 'Image Generation', provider: 'OpenAI' },
  'dall-e-2':    { color: '#6366f1', type: 'Image Generation', provider: 'OpenAI' },
  'gpt-4o':      { color: '#3b82f6', type: 'Text Generation',  provider: 'OpenAI' },
  'gpt-4o-mini': { color: '#0ea5e9', type: 'Text Generation',  provider: 'OpenAI' },
  'nano-banana-2': { color: '#ec4899', type: 'Image Generation', provider: 'Fal.ai' },
  'seedream':    { color: '#f43f5e', type: 'Image Generation', provider: 'Fal.ai' },
};

function AIModelsSection({ modelUsage, totalGenerations, loading }) {
  if (loading) {
    return (
      <div className="p-6 space-y-6">
        <Skeleton className="h-8 w-36" />
        <div className="grid grid-cols-4 gap-4"><Skeleton className="h-28 rounded-2xl" /><Skeleton className="h-28 rounded-2xl" /><Skeleton className="h-28 rounded-2xl" /><Skeleton className="h-28 rounded-2xl" /></div>
        <div className="grid grid-cols-3 gap-4">{[...Array(3)].map((_, i) => <Skeleton key={i} className="h-44 rounded-2xl" />)}</div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white">AI Models</h1>
        <p className="text-gray-500 text-sm mt-0.5">Monitor AI model usage and performance</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard title="Active Models" value={modelUsage.length} sub="In use" icon="🧠" />
        <StatCard title="Total Generations" value={fmtNum(totalGenerations)} sub="All time" icon="⚡" />
        <StatCard title="Avg Latency" value="—" sub="Not tracked" icon="⏱️" />
        <StatCard title="Avg Success Rate" value="—" sub="Not tracked" icon="✅" />
      </div>

      {modelUsage.length === 0 ? (
        <div className="bg-[#111] rounded-2xl p-16 border border-white/[0.07] text-center">
          <p className="text-gray-700 text-sm">No model usage data yet</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {modelUsage.map((m, i) => {
            const meta = MODEL_META[m.model] || { color: '#6b7280', type: 'Generation', provider: 'Unknown' };
            return (
              <div key={i} className="bg-[#111] rounded-2xl p-5 border border-white/[0.07]">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <p className="text-white font-semibold text-sm">{m.model}</p>
                    <p className="text-gray-600 text-xs mt-0.5">{meta.provider} · {meta.type}</p>
                  </div>
                  <span className="px-2 py-0.5 bg-green-500/20 text-green-400 text-[10px] font-semibold rounded-full flex-shrink-0">active</span>
                </div>
                <div className="grid grid-cols-2 gap-3 mb-4">
                  <div className="bg-black/30 rounded-xl p-3">
                    <p className="text-gray-600 text-[10px] mb-1">Usage Share</p>
                    <p className="text-white font-bold text-lg leading-none">{m.pct}%</p>
                  </div>
                  <div className="bg-black/30 rounded-xl p-3">
                    <p className="text-gray-600 text-[10px] mb-1">Total Calls</p>
                    <p className="text-white font-bold text-lg leading-none">{fmtNum(m.count)}</p>
                  </div>
                </div>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-gray-700 text-[11px]">Usage share</span>
                  <span className="text-gray-500 text-[11px]">{m.pct}%</span>
                </div>
                <div className="h-1.5 bg-white/[0.05] rounded-full overflow-hidden">
                  <div className="h-full rounded-full transition-all" style={{ width: `${m.pct}%`, background: meta.color }} />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ── SECTION: Referrals ────────────────────────────────────────────────────────

function ReferralsSection({ codes, stats, codesLoading, onGenerateCodes, onToggleCode, genCount, setGenCount, genMaxUses, setGenMaxUses, generating, generatedCodes }) {
  const copyAll = () => {
    navigator.clipboard.writeText(generatedCodes.join('\n'));
    alert(`Copied ${generatedCodes.length} codes`);
  };

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white">Referrals</h1>
        <p className="text-gray-500 text-sm mt-0.5">Manage referral codes and track redemptions</p>
      </div>

      {stats && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <StatCard title="Total Users" value={fmtNum(stats.totalUsers)} sub="Registered" icon="👥" />
          <StatCard title="Verified" value={fmtNum(stats.verifiedUsers)} sub="With referral code" icon="✅" />
          <StatCard title="Campaign Codes" value={fmtNum(stats.totalCodes)} sub="Admin generated" icon="🎫" />
          <StatCard title="Total Redemptions" value={fmtNum(stats.totalRedemptions)} sub="All time" icon="🔑" />
        </div>
      )}

      {/* Generate form */}
      <div className="bg-[#111] rounded-2xl border border-white/[0.07] p-5 mb-6">
        <h2 className="text-white font-semibold text-sm mb-4">Generate Campaign Codes</h2>
        <div className="flex flex-wrap gap-4 items-end">
          <div>
            <label className="block text-[11px] text-gray-600 mb-1.5">Number of codes</label>
            <input
              type="number" min={1} max={100} value={genCount}
              onChange={e => setGenCount(Math.max(1, Math.min(100, Number(e.target.value))))}
              className="w-28 px-3 py-2 bg-black/40 border border-white/[0.07] rounded-lg text-sm text-white outline-none focus:border-white/20"
            />
          </div>
          <div>
            <label className="block text-[11px] text-gray-600 mb-1.5">Max uses per code</label>
            <select
              value={genMaxUses}
              onChange={e => setGenMaxUses(Number(e.target.value))}
              className="px-3 py-2 bg-black/40 border border-white/[0.07] rounded-lg text-sm text-white outline-none"
            >
              {[1, 5, 10, 50, 100].map(n => <option key={n} value={n}>{n} use{n > 1 ? 's' : ''}</option>)}
              <option value={0}>Unlimited</option>
            </select>
          </div>
          <button
            onClick={onGenerateCodes} disabled={generating}
            className="px-5 py-2 bg-white text-black rounded-lg text-sm font-semibold hover:bg-gray-200 transition disabled:opacity-50"
          >
            {generating ? 'Generating...' : `Generate ${genCount} Code${genCount > 1 ? 's' : ''}`}
          </button>
        </div>
        {generatedCodes.length > 0 && (
          <div className="mt-4">
            <div className="flex items-center justify-between mb-2">
              <p className="text-[11px] text-gray-600">{generatedCodes.length} code{generatedCodes.length > 1 ? 's' : ''} generated</p>
              <button onClick={copyAll} className="text-[11px] text-brand-pink hover:underline">Copy all</button>
            </div>
            <div className="flex flex-wrap gap-2">
              {generatedCodes.map(c => (
                <button key={c} onClick={() => navigator.clipboard.writeText(c)}
                  className="px-3 py-1.5 bg-black/40 border border-white/[0.07] rounded-lg text-xs font-mono text-white hover:border-brand-pink transition"
                  title="Click to copy"
                >{c}</button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Codes table */}
      <div className="bg-[#111] rounded-2xl border border-white/[0.07] overflow-hidden">
        <div className="px-5 py-4 border-b border-white/[0.06]">
          <h2 className="text-white font-semibold text-sm">All Campaign Codes</h2>
        </div>
        {codesLoading ? (
          <div className="text-center py-8 text-gray-700 text-sm">Loading...</div>
        ) : codes.length === 0 ? (
          <div className="text-center py-12 text-gray-700 text-sm">No campaign codes yet</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/[0.06]">
                  {['Code', 'Uses', 'Max', 'Created', 'Status', 'Action'].map(h => (
                    <th key={h} className="px-5 py-3.5 text-left text-[11px] font-semibold text-gray-600 uppercase tracking-wider">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.04]">
                {codes.map(c => (
                  <tr key={c.id} className="hover:bg-white/[0.02] transition">
                    <td className="px-5 py-3.5">
                      <button
                        onClick={() => navigator.clipboard.writeText(c.code)}
                        className="font-mono text-white text-xs hover:text-brand-pink transition"
                        title="Click to copy"
                      >{c.code}</button>
                    </td>
                    <td className="px-5 py-3.5 text-gray-400 text-sm">{c.usedCount}</td>
                    <td className="px-5 py-3.5 text-gray-400 text-sm">{c.maxUses === -1 ? '∞' : c.maxUses}</td>
                    <td className="px-5 py-3.5 text-gray-600 text-xs whitespace-nowrap">
                      {new Date(c.createdAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: '2-digit' })}
                    </td>
                    <td className="px-5 py-3.5">
                      <span className={`px-2 py-0.5 text-[11px] rounded-full font-medium ${c.isActive ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
                        {c.isActive ? 'Active' : 'Revoked'}
                      </span>
                    </td>
                    <td className="px-5 py-3.5">
                      <button
                        onClick={() => onToggleCode(c.id)}
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
    </div>
  );
}

// ── SECTION: Placeholder ──────────────────────────────────────────────────────

function PlaceholderSection({ title, description, icon, note }) {
  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white">{title}</h1>
        <p className="text-gray-500 text-sm mt-0.5">{description}</p>
      </div>
      <div className="bg-[#111] rounded-2xl border border-white/[0.07] p-20 flex flex-col items-center justify-center text-center">
        <span className="text-5xl mb-5">{icon}</span>
        <p className="text-white font-semibold text-base mb-2">{note}</p>
        <p className="text-gray-600 text-sm max-w-xs">{description}</p>
      </div>
    </div>
  );
}

// ── Main Admin Component ──────────────────────────────────────────────────────

export default function Admin() {
  const { user } = useAuth();
  const router = useRouter();

  const [activeSection, setActiveSection] = useState('overview');
  const [overviewData, setOverviewData] = useState(null);
  const [overviewLoading, setOverviewLoading] = useState(true);
  const [users, setUsers] = useState([]);
  const [usersLoading, setUsersLoading] = useState(true);
  const [generations, setGenerations] = useState([]);
  const [generationsLoading, setGenerationsLoading] = useState(true);
  const [codes, setCodes] = useState([]);
  const [codesLoading, setCodesLoading] = useState(false);
  const [referralStats, setReferralStats] = useState(null);
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
      Promise.all([loadOverview(), loadUsers(), loadGenerations(), loadReferralData()]);
    }
  }, [user]);

  const loadOverview = async () => {
    try {
      setOverviewLoading(true);
      const { data } = await authAPI.adminOverview();
      setOverviewData(data);
    } catch (e) {
      console.error('Failed to load overview', e);
    } finally {
      setOverviewLoading(false);
    }
  };

  const loadUsers = async () => {
    try {
      const { data } = await authAPI.getAdminUsers();
      setUsers(data.users);
    } catch {
      router.push('/dashboard');
    } finally {
      setUsersLoading(false);
    }
  };

  const loadGenerations = async () => {
    try {
      setGenerationsLoading(true);
      const { data } = await authAPI.adminAllGenerations();
      setGenerations(data.generations);
    } catch (e) {
      console.error('Failed to load generations', e);
    } finally {
      setGenerationsLoading(false);
    }
  };

  const loadReferralData = async () => {
    setCodesLoading(true);
    try {
      const [codesRes, statsRes] = await Promise.all([referralAPI.adminGetCodes(), referralAPI.adminStats()]);
      setCodes(codesRes.data.codes);
      setReferralStats(statsRes.data);
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
    } catch {
      alert('Failed to generate codes');
    } finally {
      setGenerating(false);
    }
  };

  const handleToggleCode = async (id) => {
    try {
      await referralAPI.adminToggleCode(id);
      await loadReferralData();
    } catch {
      alert('Failed to toggle code');
    }
  };

  const handleCopyEmails = (filteredUsers) => {
    navigator.clipboard.writeText(filteredUsers.map(u => u.email).join('\n'));
    alert(`Copied ${filteredUsers.length} emails`);
  };

  if (!user) return null;

  return (
    <AdminLayout activeSection={activeSection} onSectionChange={setActiveSection}>
      {activeSection === 'overview' && (
        <OverviewSection data={overviewData} loading={overviewLoading} />
      )}
      {activeSection === 'users' && (
        <UsersSection users={users} loading={usersLoading} onCopyEmails={handleCopyEmails} />
      )}
      {activeSection === 'generations' && (
        <GenerationsSection generations={generations} loading={generationsLoading} />
      )}
      {activeSection === 'revenue' && (
        <PlaceholderSection
          title="Revenue"
          description="Subscriptions, MRR, and financial analytics will appear here once a payment provider is connected."
          icon="💳"
          note="Connect a payment provider"
        />
      )}
      {activeSection === 'ai-models' && (
        <AIModelsSection
          modelUsage={overviewData?.modelUsage || []}
          totalGenerations={overviewData?.generations?.total || 0}
          loading={overviewLoading}
        />
      )}
      {activeSection === 'moderation' && (
        <PlaceholderSection
          title="Moderation"
          description="Review and action flagged content across the platform. Content moderation requires a moderation system to be set up."
          icon="🛡️"
          note="No moderation system configured"
        />
      )}
      {activeSection === 'referrals' && (
        <ReferralsSection
          codes={codes}
          stats={referralStats}
          codesLoading={codesLoading}
          onGenerateCodes={handleGenerateCodes}
          onToggleCode={handleToggleCode}
          genCount={genCount}
          setGenCount={setGenCount}
          genMaxUses={genMaxUses}
          setGenMaxUses={setGenMaxUses}
          generating={generating}
          generatedCodes={generatedCodes}
        />
      )}
      {activeSection === 'settings' && (
        <PlaceholderSection
          title="Settings"
          description="Configure platform-wide settings, generation limits, and feature flags."
          icon="⚙️"
          note="Settings panel coming soon"
        />
      )}
    </AdminLayout>
  );
}
