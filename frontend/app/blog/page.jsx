import Link from 'next/link';
import { LandingNavbar } from '../../components/landing/LandingNavbar';
import { LandingFooter } from '../../components/landing/LandingFooter';
import { BLOG_POSTS } from '../../lib/blogPosts';

const CATEGORY_COLORS = {
  'Getting Started': 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
  'AI Images': 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
  'AI Text': 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  'Founder Page': 'bg-pink-100 text-pink-700 dark:bg-pink-900/30 dark:text-pink-400',
};

export const metadata = {
  title: 'Blog — Personify',
  description: 'Tutorials and guides on how to use Personify to build your personal brand with AI.'
};

export default function BlogPage() {
  const [featured, ...rest] = BLOG_POSTS;

  return (
    <div className="min-h-screen bg-white dark:bg-zinc-950">
      <LandingNavbar isAuthenticated={false} />

      <main className="pt-24 pb-20 px-6">
        <div className="max-w-5xl mx-auto">

          {/* Header */}
          <div className="text-center mb-14">
            <span className="inline-block px-3 py-1 bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 text-xs font-semibold rounded-full mb-4 tracking-wider uppercase">
              Tutorials & Guides
            </span>
            <h1 className="text-4xl md:text-5xl font-bold text-zinc-900 dark:text-white mb-4">
              Learn Personify
            </h1>
            <p className="text-zinc-500 dark:text-zinc-400 text-lg max-w-xl mx-auto">
              Step-by-step guides to help you get the most out of AI-powered personal branding.
            </p>
          </div>

          {/* Featured post */}
          <Link href={`/blog/${featured.slug}`} className="group block mb-10">
            <div className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 p-8 hover:border-zinc-400 dark:hover:border-zinc-600 transition-all hover:shadow-lg">
              <div className="flex flex-wrap items-center gap-3 mb-4">
                <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${CATEGORY_COLORS[featured.category] || 'bg-zinc-100 text-zinc-600'}`}>
                  {featured.category}
                </span>
                <span className="text-xs text-zinc-400">{featured.readTime}</span>
                <span className="text-xs text-zinc-400">{featured.date}</span>
              </div>
              <h2 className="text-2xl md:text-3xl font-bold text-zinc-900 dark:text-white mb-3 group-hover:text-brand-pink transition-colors">
                {featured.title}
              </h2>
              <p className="text-zinc-500 dark:text-zinc-400 text-base leading-relaxed mb-6 max-w-2xl">
                {featured.description}
              </p>
              <span className="text-sm font-semibold text-zinc-900 dark:text-white group-hover:text-brand-pink transition-colors">
                Read guide →
              </span>
            </div>
          </Link>

          {/* Rest of posts */}
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {rest.map(post => (
              <Link key={post.slug} href={`/blog/${post.slug}`} className="group block">
                <div className="h-full rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-6 hover:border-zinc-400 dark:hover:border-zinc-600 transition-all hover:shadow-md flex flex-col">
                  <div className="flex items-center gap-2 mb-3">
                    <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${CATEGORY_COLORS[post.category] || 'bg-zinc-100 text-zinc-600'}`}>
                      {post.category}
                    </span>
                    <span className="text-xs text-zinc-400">{post.readTime}</span>
                  </div>
                  <h3 className="text-lg font-bold text-zinc-900 dark:text-white mb-2 group-hover:text-brand-pink transition-colors leading-snug">
                    {post.title}
                  </h3>
                  <p className="text-sm text-zinc-500 dark:text-zinc-400 leading-relaxed flex-1">
                    {post.description}
                  </p>
                  <span className="mt-4 text-sm font-semibold text-zinc-700 dark:text-zinc-300 group-hover:text-brand-pink transition-colors">
                    Read →
                  </span>
                </div>
              </Link>
            ))}
          </div>

          {/* CTA */}
          <div className="mt-16 text-center rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 py-12 px-6">
            <h2 className="text-2xl font-bold text-zinc-900 dark:text-white mb-3">Ready to build your brand?</h2>
            <p className="text-zinc-500 dark:text-zinc-400 mb-6">Start for free. No credit card required.</p>
            <Link
              href="/register"
              className="inline-block px-8 py-3 bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 rounded-full font-semibold hover:opacity-90 transition"
            >
              Get Started Free
            </Link>
          </div>

        </div>
      </main>

      <LandingFooter />
    </div>
  );
}
