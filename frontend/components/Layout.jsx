'use client'

import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '../context/AuthContext';

export default function Layout({ children }) {
  const { user, logout } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  const handleLogout = () => {
    logout();
    router.push('/');
  };

  const navItems = [
    { name: 'Dashboard', path: '/dashboard', icon: '🏠' },
    { name: 'Generate', path: '/generate', icon: '✨' },
    { name: 'History', path: '/history', icon: '🕒' },
    { name: 'Persona', path: '/persona', icon: '👤' },
    { name: 'Page', path: '/founder-page', icon: '🚀' },
    { name: 'Settings', path: '/settings', icon: '⚙️' },
  ];

  const sidebarItems = [
    { name: 'Dashboard', path: '/dashboard', icon: '🏠' },
    { name: 'Generate', path: '/generate', icon: '✨' },
    { name: 'History', path: '/history', icon: '🕒' },
    { name: 'Persona', path: '/persona', icon: '👤' },
    { name: 'Settings', path: '/settings', icon: '⚙️' },
  ];

  const getInitials = (name) => {
    if (!name) return 'U';
    return name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
  };

  return (
    <div className="min-h-screen bg-dark-bg flex">

      {/* ── Desktop Sidebar (hidden on mobile) ── */}
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
                <span className="text-xl">{item.icon}</span>
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
            <span className="text-xl">✨</span>
            <span>Founder Page</span>
            <span className="ml-auto bg-green-500 text-white text-xs px-2 py-0.5 rounded">NEW</span>
          </Link>
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
      <main className="flex-1 overflow-auto pb-16 lg:pb-0">
        {children}
      </main>

      {/* ── Mobile Bottom Tab Bar (hidden on desktop) ── */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 bg-dark-bg border-t border-gray-800 z-50 flex items-stretch">
        {navItems.map((item) => {
          const isActive = pathname === item.path || (item.path === '/founder-page' && pathname === '/founder-page');
          return (
            <Link
              key={item.path}
              href={item.path}
              className={`flex-1 flex flex-col items-center justify-center py-2 gap-0.5 transition-colors ${
                isActive ? 'text-white' : 'text-gray-500 hover:text-gray-300'
              }`}
            >
              <span className="text-xl leading-none">{item.icon}</span>
              <span className="text-[9px] font-medium leading-none">{item.name}</span>
              {isActive && <span className="w-1 h-1 bg-white rounded-full mt-0.5" />}
            </Link>
          );
        })}
      </nav>

    </div>
  );
}
