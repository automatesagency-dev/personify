'use client'

import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../context/AuthContext';

export default function Layout({ children }) {
  const { user, logout } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [sheetOpen, setSheetOpen] = useState(false);

  const handleLogout = () => {
    setSheetOpen(false);
    logout();
    router.push('/');
  };

  // ── Desktop sidebar items (unchanged) ──
  const sidebarItems = [
    { name: 'Dashboard', path: '/dashboard', icon: '/images/icon-dashboard.png' },
    { name: 'Generate', path: '/generate', icon: '/images/icon-generate.png' },
    { name: 'History', path: '/history', icon: '/images/icon-history.png' },
    { name: 'Persona', path: '/persona', icon: '/images/icon-persona.png' },
    { name: 'Settings', path: '/settings', icon: '/images/icon-settings.png' },
  ];

  // ── Mobile bottom bar tabs (4 tabs + center FAB) ──
  const mobileTabItems = [
    { name: 'Home', path: '/dashboard', icon: '/images/icon-dashboard.png' },
    { name: 'Persona', path: '/persona', icon: '/images/icon-persona.png' },
    { name: 'History', path: '/history', icon: '/images/icon-history.png' },
    { name: 'More', path: null, icon: null },
  ];

  const getInitials = (name) => {
    if (!name) return 'U';
    return name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
  };

  return (
    <div className="min-h-screen bg-dark-bg flex">

      {/* ── Desktop Sidebar (hidden on mobile) — UNCHANGED ── */}
      <aside className="hidden lg:flex w-64 bg-dark-bg border-r border-gray-800 flex-col h-screen sticky top-0">
        {/* Logo */}
        <div className="p-6 border-b border-gray-800">
          <Link href="/dashboard" className="flex items-center gap-2">
            <img src="/images/logo.png" alt="Personify" className="w-8 h-8" />
            <span className="text-xl font-semibold text-white">Personify</span>
          </Link>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          {sidebarItems.map((item) => {
            const isActive = pathname === item.path;
            return (
              <Link
                key={item.path}
                href={item.path}
                className={`flex items-center gap-3 px-4 py-3 rounded-lg transition ${
                  isActive ? 'bg-white/10 text-white' : 'text-gray-400 hover:bg-white/5 hover:text-white'
                }`}
              >
                <img src={item.icon} alt="" className={`w-5 h-5 flex-shrink-0 transition-opacity ${isActive ? 'opacity-100' : 'opacity-40'}`} />
                <span className="font-medium">{item.name}</span>
              </Link>
            );
          })}

          <Link
            href="/founder-page"
            className={`flex items-center gap-3 px-4 py-3 rounded-lg transition ${
              pathname === '/founder-page' ? 'bg-white/10 text-white' : 'text-gray-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <svg className={`w-5 h-5 flex-shrink-0 transition-opacity ${pathname === '/founder-page' ? 'opacity-100' : 'opacity-40'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 5a2 2 0 012-2h14a2 2 0 012 2v3H3V5z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 8h6v13H5a2 2 0 01-2-2V8zm6 0h12v11a2 2 0 01-2 2H9V8z" />
            </svg>
            <span>Founder Page</span>
            <span className="ml-auto bg-green-500 text-white text-xs px-2 py-0.5 rounded">NEW</span>
          </Link>

          <a
            href="https://chat.whatsapp.com/L4wfh1pqe6vAE8vpGFGxEu"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-3 px-4 py-3 rounded-lg transition text-gray-400 hover:text-white hover:bg-white/5 group"
          >
            <svg className="w-5 h-5 flex-shrink-0 opacity-40 group-hover:opacity-100 transition-opacity" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            <span className="font-medium">Community</span>
          </a>
        </nav>

        {/* User Profile */}
        <div className="p-4 border-t border-gray-800">
          <div className="flex items-center gap-3 p-3 rounded-lg bg-white/5">
            <div className="w-10 h-10 bg-gradient-to-br from-brand-pink to-purple-600 rounded-full flex items-center justify-center text-white font-semibold flex-shrink-0">
              {getInitials(user?.name || user?.email)}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-white truncate">{user?.name || 'User'}</p>
              <p className="text-xs text-gray-400">Creator</p>
            </div>
            <button onClick={handleLogout} className="text-gray-400 hover:text-white transition" title="Logout">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
            </button>
          </div>
        </div>
      </aside>

      {/* ── Main Content ── */}
      <main className="flex-1 overflow-auto pb-24 lg:pb-0">
        {children}
      </main>

      {/* ════════════════════════════════════════
          MOBILE ONLY — Bottom bar + FAB + Sheet
          ════════════════════════════════════════ */}

      {/* Slide-up sheet backdrop */}
      <AnimatePresence>
        {sheetOpen && (
          <motion.div
            key="backdrop"
            className="lg:hidden fixed inset-0 bg-black/60 z-40"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setSheetOpen(false)}
          />
        )}
      </AnimatePresence>

      {/* Slide-up sheet */}
      <AnimatePresence>
        {sheetOpen && (
          <motion.div
            key="sheet"
            className="lg:hidden fixed bottom-0 left-0 right-0 z-50 bg-[#111] rounded-t-3xl border-t border-gray-800 pb-8"
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
          >
            {/* Drag handle */}
            <div className="flex justify-center pt-3 pb-2">
              <div className="w-10 h-1 bg-gray-700 rounded-full" />
            </div>

            {/* User info */}
            <div className="flex items-center gap-3 px-6 py-4 border-b border-gray-800">
              <div className="w-10 h-10 bg-gradient-to-br from-brand-pink to-purple-600 rounded-full flex items-center justify-center text-white font-semibold flex-shrink-0">
                {getInitials(user?.name || user?.email)}
              </div>
              <div>
                <p className="text-sm font-semibold text-white">{user?.name || 'User'}</p>
                <p className="text-xs text-gray-400">{user?.email}</p>
              </div>
            </div>

            {/* Sheet items */}
            <div className="px-4 pt-3 space-y-1">
              <Link
                href="/founder-page"
                onClick={() => setSheetOpen(false)}
                className={`flex items-center gap-4 px-4 py-3.5 rounded-xl transition-colors ${
                  pathname === '/founder-page' ? 'bg-white/10 text-white' : 'text-gray-300 hover:bg-white/5'
                }`}
              >
                <svg className="w-5 h-5 flex-shrink-0 opacity-70" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 5a2 2 0 012-2h14a2 2 0 012 2v3H3V5z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 8h6v13H5a2 2 0 01-2-2V8zm6 0h12v11a2 2 0 01-2 2H9V8z" />
                </svg>
                <span className="font-medium">Founder Page</span>
                <span className="ml-auto bg-green-500 text-white text-xs px-2 py-0.5 rounded">NEW</span>
              </Link>

              <a
                href="https://chat.whatsapp.com/L4wfh1pqe6vAE8vpGFGxEu"
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => setSheetOpen(false)}
                className="flex items-center gap-4 px-4 py-3.5 rounded-xl transition-colors text-gray-300 hover:bg-white/5"
              >
                <svg className="w-5 h-5 flex-shrink-0 opacity-70" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                <span className="font-medium">Community</span>
              </a>

              <Link
                href="/settings"
                onClick={() => setSheetOpen(false)}
                className={`flex items-center gap-4 px-4 py-3.5 rounded-xl transition-colors ${
                  pathname === '/settings' ? 'bg-white/10 text-white' : 'text-gray-300 hover:bg-white/5'
                }`}
              >
                <img src="/images/icon-settings.png" alt="" className="w-5 h-5 opacity-70" />
                <span className="font-medium">Settings</span>
              </Link>

              <button
                onClick={handleLogout}
                className="w-full flex items-center gap-4 px-4 py-3.5 rounded-xl text-red-400 hover:bg-red-500/10 transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
                <span className="font-medium">Logout</span>
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Mobile bottom bar */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 z-30">
        {/* Tab bar */}
        <nav className="bg-[#0A0A0A] border-t border-gray-800 flex items-stretch h-16">
          {/* Left two tabs */}
          {mobileTabItems.slice(0, 2).map((item) => {
            const isActive = pathname === item.path;
            return (
              <Link
                key={item.path}
                href={item.path}
                className={`flex-1 flex flex-col items-center justify-center gap-1 transition-colors ${
                  isActive ? 'text-white' : 'text-gray-500'
                }`}
              >
                <img src={item.icon} alt="" className={`w-6 h-6 transition-opacity ${isActive ? 'opacity-100' : 'opacity-40'}`} />
                <span className="text-[10px] font-medium">{item.name}</span>
                {isActive && <span className="w-1 h-1 bg-white rounded-full" />}
              </Link>
            );
          })}

          {/* Center: FAB + Generate label */}
          <div className="flex-1 flex flex-col items-center justify-end pb-1">
            <Link
              href="/generate"
              className={`flex items-center justify-center w-14 h-14 rounded-full shadow-lg shadow-brand-pink/30 transition-transform active:scale-95 -mt-6 ${
                pathname === '/generate'
                  ? 'bg-brand-pink'
                  : 'bg-gradient-to-br from-brand-pink to-purple-600'
              }`}
            >
              <img src="/images/icon-generate.png" alt="" className="w-7 h-7" />
            </Link>
            <span className={`text-[10px] font-medium mt-0.5 ${pathname === '/generate' ? 'text-white' : 'text-gray-500'}`}>Generate</span>
          </div>

          {/* Right two tabs */}
          {mobileTabItems.slice(2).map((item) => {
            const isActive = item.path ? pathname === item.path : sheetOpen;
            const isMore = item.path === null;
            return isMore ? (
              <button
                key="more"
                onClick={() => setSheetOpen(true)}
                className={`flex-1 flex flex-col items-center justify-center gap-1 transition-colors ${
                  sheetOpen ? 'text-white' : 'text-gray-500'
                }`}
              >
                <svg className={`w-6 h-6 transition-opacity ${sheetOpen ? 'opacity-100' : 'opacity-40'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
                <span className="text-[10px] font-medium">{item.name}</span>
              </button>
            ) : (
              <Link
                key={item.path}
                href={item.path}
                className={`flex-1 flex flex-col items-center justify-center gap-1 transition-colors ${
                  isActive ? 'text-white' : 'text-gray-500'
                }`}
              >
                <img src={item.icon} alt="" className={`w-6 h-6 transition-opacity ${isActive ? 'opacity-100' : 'opacity-40'}`} />
                <span className="text-[10px] font-medium">{item.name}</span>
                {isActive && <span className="w-1 h-1 bg-white rounded-full" />}
              </Link>
            );
          })}
        </nav>
      </div>

    </div>
  );
}
