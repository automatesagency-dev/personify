'use client'

import { useAuth } from '../context/AuthContext';
import { useRouter } from 'next/navigation';

function Icon({ paths, className = 'w-4 h-4' }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      {paths.map((d, i) => (
        <path key={i} strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d={d} />
      ))}
    </svg>
  );
}

const NAV = [
  {
    id: 'overview', label: 'Overview',
    paths: ['M4 5a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1H5a1 1 0 01-1-1V5zm10 0a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 01-1-1V5zM4 15a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1H5a1 1 0 01-1-1v-4zm10 0a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 01-1-1v-4z'],
  },
  {
    id: 'users', label: 'Users',
    paths: ['M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z'],
  },
  {
    id: 'generations', label: 'Generations',
    paths: ['M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z'],
  },
  {
    id: 'revenue', label: 'Revenue',
    paths: ['M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z'],
  },
  {
    id: 'ai-models', label: 'AI Models',
    paths: ['M9 3H5a2 2 0 00-2 2v4m6-6h10a2 2 0 012 2v4M9 3v18m0 0h10a2 2 0 002-2V9M9 21H5a2 2 0 01-2-2V9m0 0h18'],
  },
  {
    id: 'moderation', label: 'Moderation',
    paths: ['M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z'],
  },
  {
    id: 'referrals', label: 'Referrals',
    paths: ['M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z'],
  },
  {
    id: 'grants', label: 'Grants',
    paths: ['M21 11.25v8.25a1.5 1.5 0 01-1.5 1.5H5.25a1.5 1.5 0 01-1.5-1.5v-8.25M12 4.875A2.625 2.625 0 109.375 7.5H12m0-2.625V7.5m0-2.625A2.625 2.625 0 1114.625 7.5H12m0 0V21m-8.625-9.75h18.75a1.125 1.125 0 001.125-1.125v-1.5a1.125 1.125 0 00-1.125-1.125H3.375A1.125 1.125 0 002.25 8.625v1.5c0 .621.504 1.125 1.125 1.125z'],
  },
  {
    id: 'settings', label: 'Settings',
    paths: [
      'M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z',
      'M15 12a3 3 0 11-6 0 3 3 0 016 0z',
    ],
  },
];

export default function AdminLayout({ children, activeSection, onSectionChange, badges = {} }) {
  const { user, logout } = useAuth();
  const router = useRouter();

  const initials = (name) => {
    if (!name) return 'AD';
    return name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a] flex">

      {/* ── Sidebar ── */}
      <aside className="w-[230px] flex-shrink-0 border-r border-white/[0.07] flex flex-col h-screen sticky top-0">

        {/* Logo */}
        <div className="px-5 py-4 border-b border-white/[0.07]">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-white flex items-center justify-center flex-shrink-0">
              <span className="text-[11px] font-bold text-black">P</span>
            </div>
            <div>
              <p className="text-white font-semibold text-[13px] leading-tight">Personify</p>
              <p className="text-gray-600 text-[10px] leading-tight">Admin Console</p>
            </div>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 p-3 overflow-y-auto">
          <p className="text-[10px] font-semibold text-gray-700 uppercase tracking-wider px-2 mb-2 mt-1">Main Menu</p>
          <div className="space-y-0.5">
            {NAV.map(item => {
              const isActive = activeSection === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => onSectionChange(item.id)}
                  className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-[13px] transition-colors group ${
                    isActive ? 'bg-white/10 text-white' : 'text-gray-500 hover:bg-white/[0.05] hover:text-white'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <span className={isActive ? 'opacity-100' : 'opacity-50 group-hover:opacity-80'}>
                      <Icon paths={item.paths} />
                    </span>
                    <span className="font-medium">{item.label}</span>
                  </div>
                  <div className="flex items-center gap-1.5 flex-shrink-0">
                    {badges[item.id] > 0 && (
                      <span className="bg-white/15 text-white text-[10px] font-bold rounded-full min-w-[18px] h-[18px] flex items-center justify-center px-1">
                        {badges[item.id]}
                      </span>
                    )}
                    {isActive && (
                      <svg className="w-3 h-3 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
                      </svg>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        </nav>

        {/* User */}
        <div className="p-3 border-t border-white/[0.07]">
          <div className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl bg-white/[0.05]">
            <div className="w-7 h-7 bg-gradient-to-br from-brand-pink to-purple-600 rounded-full flex items-center justify-center text-white text-[10px] font-semibold flex-shrink-0">
              {initials(user?.name || user?.email)}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-white text-[12px] font-medium truncate">{user?.name || 'Admin'}</p>
              <p className="text-gray-600 text-[10px] truncate">{user?.email}</p>
            </div>
            <button
              onClick={() => { logout(); router.push('/'); }}
              className="text-gray-700 hover:text-white transition flex-shrink-0"
              title="Logout"
            >
              <Icon paths={['M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1']} />
            </button>
          </div>
        </div>
      </aside>

      {/* ── Main content ── */}
      <div className="flex-1 min-w-0 flex flex-col">

        {/* Top bar */}
        <header className="sticky top-0 z-20 bg-[#0a0a0a] border-b border-white/[0.07] h-[52px] px-6 flex items-center gap-4">
          <div className="relative flex-1 max-w-xs">
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="text"
              placeholder="Search anything..."
              className="w-full pl-9 pr-4 py-1.5 bg-white/[0.04] border border-white/[0.07] rounded-lg text-sm text-white placeholder-gray-600 outline-none focus:border-white/20 transition"
            />
          </div>

          <div className="ml-auto flex items-center gap-3">
            <button className="relative w-8 h-8 bg-white/[0.04] border border-white/[0.07] rounded-lg flex items-center justify-center text-gray-500 hover:text-white transition">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
              </svg>
              <span className="absolute top-1 right-1 w-1.5 h-1.5 bg-brand-pink rounded-full" />
            </button>

            <div className="flex items-center gap-2.5 pl-3 border-l border-white/[0.07]">
              <div className="w-7 h-7 bg-gradient-to-br from-brand-pink to-purple-600 rounded-full flex items-center justify-center text-white text-[10px] font-semibold flex-shrink-0">
                {initials(user?.name || user?.email)}
              </div>
              <div>
                <p className="text-white text-[12px] font-semibold leading-tight">{user?.name || 'Admin'}</p>
                <p className="text-gray-600 text-[10px] leading-tight">Super Admin</p>
              </div>
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
