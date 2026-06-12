import Image from 'next/image';
import Link from 'next/link';

export function LandingFooter() {
  return (
    <footer className="py-12 px-6 bg-white dark:bg-zinc-950 border-t border-zinc-200 dark:border-zinc-800">
      <div className="max-w-6xl mx-auto">
        <div className="flex flex-col items-center gap-4">
          <div className="flex items-center gap-2 relative">
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
            <span className="ml-10 text-xl font-bold tracking-wide">Personify</span>
          </div>
          <div className="flex items-center gap-6 text-sm">
            <Link href="/blog" className="text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white transition-colors">Blog</Link>
            <Link href="/login" className="text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white transition-colors">Login</Link>
            <Link href="/register" className="text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white transition-colors">Sign Up</Link>
          </div>
          <div className="flex items-center gap-4 text-xs text-zinc-500 dark:text-zinc-500">
            <Link href="/terms" className="hover:text-zinc-800 dark:hover:text-zinc-300 transition-colors">Terms of Service</Link>
            <span>·</span>
            <Link href="/privacy" className="hover:text-zinc-800 dark:hover:text-zinc-300 transition-colors">Privacy Policy</Link>
          </div>
          <p className="text-sm text-zinc-600 dark:text-zinc-400 text-center">
            AI-Powered Personal Branding That Makes You Stand Out.
          </p>
          <p className="text-xs text-zinc-500 dark:text-zinc-500">
            © 2026 Personify - All Rights Reserved
          </p>
        </div>
      </div>
    </footer>
  );
}
