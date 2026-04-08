import Link from 'next/link';
import { PhotoGallery } from './PhotoGallery';
import { Typography } from './Typography';

export function HeroSection({ isAuthenticated }) {
  return (
    <section className="relative pt-28 md:pt-36 pb-20 px-6 overflow-hidden bg-gradient-to-br from-pink-50 via-purple-50 to-blue-50 dark:from-zinc-950 dark:via-zinc-900 dark:to-zinc-950 rounded-b-[2rem]">
      <div className="absolute inset-0 bg-gradient-radial from-pink-200/20 via-transparent to-transparent dark:from-purple-900/20"></div>

      <div className="max-w-6xl mx-auto relative">
        <div className="flex items-center gap-2 justify-center mb-6">
          <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse"></span>
          <Typography className="text-sm font-medium">AI That Makes You Stand Out</Typography>
        </div>

        <Typography variant="heading" className="text-4xl md:text-6xl mb-2 md:mb-4">
          Level Up Your Personal Brand
        </Typography>
        <Typography variant="subHeading" className="text-4xl md:text-6xl mb-6 md:mb-8">
          with Stunning AI Photos
        </Typography>

        <PhotoGallery />

        <Typography variant="paragraph" className="max-w-2xl mx-auto mb-8 text-zinc-600 dark:text-zinc-400">
          Skip The Photoshoot Hassle! We Generate Highly Realistic Images Of You Anywhere. Office, Beach, Studio Photoshoot... You Name It. Take Your Social Media To The Next Level.
        </Typography>

        {/* CTA buttons — login/register instead of waitlist */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 max-w-md mx-auto mb-6">
          {isAuthenticated ? (
            <Link
              href="/dashboard"
              className="w-full sm:w-auto px-8 py-3 rounded-full bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 font-medium text-sm hover:opacity-90 transition-opacity text-center"
            >
              Go to Dashboard
            </Link>
          ) : (
            <>
              <Link
                href="/register"
                className="w-full sm:w-auto px-8 py-3 rounded-full bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 font-medium text-sm hover:opacity-90 transition-opacity text-center"
              >
                Start Creating Free
              </Link>
              <Link
                href="/login"
                className="w-full sm:w-auto px-8 py-3 rounded-full border border-zinc-300 dark:border-zinc-700 text-zinc-900 dark:text-white font-medium text-sm hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors text-center"
              >
                Sign In
              </Link>
            </>
          )}
        </div>

        <Typography variant="muted">
          Join 10,000+ Early-Birds Who Are Getting AI Photos
        </Typography>
      </div>
    </section>
  );
}
