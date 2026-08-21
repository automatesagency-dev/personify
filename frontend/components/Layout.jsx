'use client'

import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { authAPI, billingAPI } from '../services/api';

function EmailVerifyBanner() {
  const { user } = useAuth();
  const [state, setState] = useState('idle'); // idle | sending | sent | error

  // Only show when we positively know the email is unverified.
  if (!user || user.emailVerified !== false) return null;

  const resend = async () => {
    setState('sending');
    try {
      await authAPI.resendVerification();
      setState('sent');
    } catch {
      setState('error');
    }
  };

  return (
    <div className="bg-amber-500/10 border-b border-amber-500/20 px-4 py-2.5 flex flex-col sm:flex-row items-center justify-center gap-x-3 gap-y-1 text-center text-sm">
      <span className="text-amber-300">⚠️ Please verify your email to unlock content generation.</span>
      {state === 'sent' ? (
        <span className="text-green-400 font-medium">Verification email sent ✓</span>
      ) : (
        <button
          onClick={resend}
          disabled={state === 'sending'}
          className="text-amber-200 underline font-medium hover:text-white disabled:opacity-50"
        >
          {state === 'sending' ? 'Sending…' : 'Resend email'}
        </button>
      )}
      {state === 'error' && <span className="text-red-400">Couldn't send — try again.</span>}
    </div>
  );
}

function NavIcon({ paths, className = 'w-5 h-5 flex-shrink-0' }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      {paths.map((d, i) => (
        <path key={i} strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d={d} />
      ))}
    </svg>
  );
}

const SIDEBAR_ITEMS = [
  {
    name: 'Dashboard', path: '/dashboard',
    paths: ['M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6'],
  },
  {
    name: 'Generate', path: '/generate',
    paths: ['M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z'],
  },
  {
    name: 'History', path: '/history',
    paths: ['M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z'],
  },
  {
    name: 'Persona', path: '/persona',
    paths: ['M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z'],
  },
  {
    name: 'Settings', path: '/settings',
    paths: [
      'M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z',
      'M15 12a3 3 0 11-6 0 3 3 0 016 0z',
    ],
  },
];

const MOBILE_TAB_ITEMS = [
  {
    name: 'Home', path: '/dashboard',
    paths: ['M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6'],
  },
  {
    name: 'Persona', path: '/persona',
    paths: ['M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z'],
  },
  {
    name: 'Founder', path: '/founder-page',
    paths: [
      'M3 5a2 2 0 012-2h14a2 2 0 012 2v3H3V5z',
      'M3 8h6v13H5a2 2 0 01-2-2V8zm6 0h12v11a2 2 0 01-2 2H9V8z',
    ],
  },
  {
    name: 'More', path: null,
    paths: ['M4 6h16M4 12h16M4 18h16'],
  },
];

function PastDueBanner() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  if (!user || user.subscriptionStatus !== 'past_due') return null;

  const openPortal = async () => {
    setLoading(true);
    try {
      const { data } = await billingAPI.portal();
      window.location.href = data.url;
    } catch {
      setLoading(false);
    }
  };

  return (
    <div className="bg-red-500/10 border-b border-red-500/20 px-4 py-2.5 flex flex-col sm:flex-row items-center justify-center gap-x-3 gap-y-1 text-center text-sm">
      <span className="text-red-300">⚠️ Your last payment failed — paid features are paused.</span>
      <button onClick={openPortal} disabled={loading} className="text-red-200 underline font-medium hover:text-white disabled:opacity-50">
        {loading ? 'Opening…' : 'Update payment method'}
      </button>
    </div>
  );
}

const PLAN_LABELS = { free: 'Free', starter: 'Starter', pro: 'Pro', studio: 'Studio' };

function PlanBadge({ plan }) {
  const key = PLAN_LABELS[plan] ? plan : 'free';
  const paid = key !== 'free';
  return (
    <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold ${paid ? 'bg-brand-pink/20 text-brand-pink' : 'bg-gray-700/50 text-gray-400'}`}>
      {PLAN_LABELS[key]}
    </span>
  );
}

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

  const getInitials = (name) => {
    if (!name) return 'U';
    return name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
  };

  return (
    <div className="min-h-screen bg-dark-bg flex">

      {/* ── Desktop Sidebar ── */}
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
          {SIDEBAR_ITEMS.map((item) => {
            const isActive = pathname === item.path;
            return (
              <Link
                key={item.path}
                href={item.path}
                className={`flex items-center gap-3 px-4 py-3 rounded-lg transition ${
                  isActive ? 'bg-white/10 text-white' : 'text-gray-400 hover:bg-white/5 hover:text-white'
                }`}
              >
                <span className={`transition-opacity ${isActive ? 'opacity-100' : 'opacity-40'}`}>
                  <NavIcon paths={item.paths} />
                </span>
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
            <span className={`transition-opacity ${pathname === '/founder-page' ? 'opacity-100' : 'opacity-40'}`}>
              <NavIcon paths={[
                'M3 5a2 2 0 012-2h14a2 2 0 012 2v3H3V5z',
                'M3 8h6v13H5a2 2 0 01-2-2V8zm6 0h12v11a2 2 0 01-2 2H9V8z',
              ]} />
            </span>
            <span>Founder Page</span>
          </Link>

          <Link
            href="/community"
            className={`flex items-center gap-3 px-4 py-3 rounded-lg transition ${
              pathname === '/community' ? 'bg-white/10 text-white' : 'text-gray-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <span className={`transition-opacity ${pathname === '/community' ? 'opacity-100' : 'opacity-40'}`}>
              <NavIcon paths={[
                'M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z',
              ]} />
            </span>
            <span className="font-medium">Community</span>
          </Link>

          {user?.isAdmin && (
            <Link
              href="/admin"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-3 px-4 py-3 rounded-lg transition text-gray-400 hover:text-white hover:bg-white/5"
            >
              <span className={`transition-opacity ${pathname === '/admin' ? 'opacity-100' : 'opacity-40'}`}>
                <NavIcon paths={['M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z']} />
              </span>
              <span className="font-medium">Admin ↗</span>
            </Link>
          )}
        </nav>

        {/* User Profile */}
        <div className="p-4 border-t border-gray-800">
          <div className="flex items-center gap-3 p-3 rounded-lg bg-white/5">
            <div className="w-10 h-10 bg-gradient-to-br from-brand-pink to-purple-600 rounded-full flex items-center justify-center text-white font-semibold flex-shrink-0">
              {getInitials(user?.name || user?.email)}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-white truncate">{user?.name || 'User'}</p>
              <div className="mt-0.5"><PlanBadge plan={user?.plan} /></div>
            </div>
            <button onClick={handleLogout} className="text-gray-400 hover:text-white transition" title="Logout">
              <NavIcon paths={['M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1']} />
            </button>
          </div>
          <div className="flex justify-center gap-3 mt-3">
            <Link href="/terms" className="text-[11px] text-gray-600 hover:text-gray-400 transition">Terms</Link>
            <span className="text-gray-700 text-[11px]">·</span>
            <Link href="/privacy" className="text-[11px] text-gray-600 hover:text-gray-400 transition">Privacy</Link>
          </div>
        </div>
      </aside>

      {/* ── Main Content ── */}
      <main className="flex-1 overflow-auto pb-24 lg:pb-0">
        <PastDueBanner />
        <EmailVerifyBanner />
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
                <div className="flex items-center gap-2">
                  <p className="text-sm font-semibold text-white">{user?.name || 'User'}</p>
                  <PlanBadge plan={user?.plan} />
                </div>
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
                <span className="opacity-70">
                  <NavIcon paths={[
                    'M3 5a2 2 0 012-2h14a2 2 0 012 2v3H3V5z',
                    'M3 8h6v13H5a2 2 0 01-2-2V8zm6 0h12v11a2 2 0 01-2 2H9V8z',
                  ]} />
                </span>
                <span className="font-medium">Founder Page</span>
              </Link>

              <Link
                href="/history"
                onClick={() => setSheetOpen(false)}
                className={`flex items-center gap-4 px-4 py-3.5 rounded-xl transition-colors ${
                  pathname === '/history' ? 'bg-white/10 text-white' : 'text-gray-300 hover:bg-white/5'
                }`}
              >
                <span className="opacity-70">
                  <NavIcon paths={['M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z']} />
                </span>
                <span className="font-medium">History</span>
              </Link>

              <Link
                href="/community"
                onClick={() => setSheetOpen(false)}
                className={`flex items-center gap-4 px-4 py-3.5 rounded-xl transition-colors ${
                  pathname === '/community' ? 'bg-white/10 text-white' : 'text-gray-300 hover:bg-white/5'
                }`}
              >
                <span className="opacity-70">
                  <NavIcon paths={[
                    'M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z',
                  ]} />
                </span>
                <span className="font-medium">Community</span>
              </Link>

              <Link
                href="/settings"
                onClick={() => setSheetOpen(false)}
                className={`flex items-center gap-4 px-4 py-3.5 rounded-xl transition-colors ${
                  pathname === '/settings' ? 'bg-white/10 text-white' : 'text-gray-300 hover:bg-white/5'
                }`}
              >
                <span className="opacity-70">
                  <NavIcon paths={[
                    'M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z',
                    'M15 12a3 3 0 11-6 0 3 3 0 016 0z',
                  ]} />
                </span>
                <span className="font-medium">Settings</span>
              </Link>

              {user?.isAdmin && (
                <Link
                  href="/admin"
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() => setSheetOpen(false)}
                  className="flex items-center gap-4 px-4 py-3.5 rounded-xl transition-colors text-gray-300 hover:bg-white/5"
                >
                  <span className="opacity-70">
                    <NavIcon paths={['M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z']} />
                  </span>
                  <span className="font-medium">Admin ↗</span>
                </Link>
              )}

              <button
                onClick={handleLogout}
                className="w-full flex items-center gap-4 px-4 py-3.5 rounded-xl text-red-400 hover:bg-red-500/10 transition-colors"
              >
                <NavIcon paths={['M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1']} />
                <span className="font-medium">Logout</span>
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Mobile bottom bar */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 z-30">
        <nav className="bg-[#0A0A0A] border-t border-gray-800 flex items-stretch h-16">
          {/* Left two tabs */}
          {MOBILE_TAB_ITEMS.slice(0, 2).map((item) => {
            const isActive = pathname === item.path;
            return (
              <Link
                key={item.path}
                href={item.path}
                className={`flex-1 flex flex-col items-center justify-center gap-1 transition-colors ${
                  isActive ? 'text-white' : 'text-gray-500'
                }`}
              >
                <span className={`transition-opacity ${isActive ? 'opacity-100' : 'opacity-40'}`}>
                  <NavIcon paths={item.paths} className="w-6 h-6 flex-shrink-0" />
                </span>
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
                pathname === '/generate' ? 'bg-brand-pink' : 'bg-gradient-to-br from-brand-pink to-purple-600'
              }`}
            >
              <NavIcon
                paths={['M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z']}
                className="w-7 h-7 flex-shrink-0"
              />
            </Link>
            <span className={`text-[10px] font-medium mt-0.5 ${pathname === '/generate' ? 'text-white' : 'text-gray-500'}`}>Generate</span>
          </div>

          {/* Right two tabs */}
          {MOBILE_TAB_ITEMS.slice(2).map((item) => {
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
                <span className={`transition-opacity ${sheetOpen ? 'opacity-100' : 'opacity-40'}`}>
                  <NavIcon paths={item.paths} className="w-6 h-6 flex-shrink-0" />
                </span>
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
                <span className={`transition-opacity ${isActive ? 'opacity-100' : 'opacity-40'}`}>
                  <NavIcon paths={item.paths} className="w-6 h-6 flex-shrink-0" />
                </span>
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
