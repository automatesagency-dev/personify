import Link from 'next/link';
import { Typography } from './Typography';

export function CTASection({ isAuthenticated }) {
  return (
    <section className="pb-20 px-6">
      <div className="py-10 md:py-20 px-6 max-w-6xl mx-auto bg-gradient-to-b from-[#F7B758]/10 via-[#B62161]/10 to-[#B62161]/10 dark:from-zinc-700 dark:via-zinc-800 dark:to-zinc-900 rounded-3xl">
        <div className="max-w-4xl mx-auto text-center">
          <Typography variant="heading" className="mb-6 leading-snug">
            Transform Your Personal Brand <br />Starting Today
          </Typography>
          <Typography variant="title" className="mb-8 max-w-2xl mx-auto">
            Not Everything Is Possible In Reality, But What If You Can Generate Your Image Anywhere. Don't Hesitate, And Transform Your Social Market To The Next Level.
          </Typography>
          {isAuthenticated ? (
            <Link
              href="/dashboard"
              className="inline-block px-8 py-3 rounded-full bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 font-medium text-sm hover:opacity-90 transition-opacity"
            >
              Go to Dashboard
            </Link>
          ) : (
            <Link
              href="/register"
              className="inline-block px-8 py-3 rounded-full bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 font-medium text-sm hover:opacity-90 transition-opacity"
            >
              Get Started Free
            </Link>
          )}
        </div>
      </div>
    </section>
  );
}
