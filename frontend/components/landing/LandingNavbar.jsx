import Image from 'next/image';
import Link from 'next/link';
import { ThemeToggle } from './ThemeToggle';

export function LandingNavbar({ isAuthenticated }) {
  return (
    <header className="fixed top-0 left-0 right-0 z-50 px-6 py-4 backdrop-blur-md bg-white/80 dark:bg-zinc-950/80 border-b border-zinc-200/50 dark:border-zinc-800/50">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Image
            className="h-8 w-8 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0"
            src="/logo/light.png"
            alt="Logo"
            width={32}
            height={32}
          />
          <Image
            className="h-8 w-8 absolute rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100"
            src="/logo/dark.png"
            alt="Logo"
            width={32}
            height={32}
          />
          <span className="text-xl font-bold tracking-wide">Personify</span>
        </div>

        <div className="flex items-center gap-3">
          <ThemeToggle />
          {isAuthenticated ? (
            <Link
              href="/dashboard"
              className="px-5 py-2 rounded-full bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 text-sm font-medium hover:opacity-90 transition-opacity"
            >
              Dashboard
            </Link>
          ) : (
            <>
              <Link
                href="/login"
                className="px-5 py-2 text-sm font-medium text-zinc-700 dark:text-zinc-300 hover:text-zinc-900 dark:hover:text-white transition-colors"
              >
                Login
              </Link>
              <Link
                href="/register"
                className="px-5 py-2 rounded-full bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 text-sm font-medium hover:opacity-90 transition-opacity"
              >
                Get Started
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
