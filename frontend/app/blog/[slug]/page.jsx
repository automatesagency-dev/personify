import Link from 'next/link';
import { notFound } from 'next/navigation';
import { LandingNavbar } from '../../../components/landing/LandingNavbar';
import { LandingFooter } from '../../../components/landing/LandingFooter';
import { getPost, BLOG_POSTS } from '../../../lib/blogPosts';

export function generateStaticParams() {
  return BLOG_POSTS.map(post => ({ slug: post.slug }));
}

export function generateMetadata({ params }) {
  const post = getPost(params.slug);
  if (!post) return {};
  // Bare title: the root layout's template appends " | Personify".
  return {
    title: post.title,
    description: post.description,
    alternates: { canonical: `/blog/${post.slug}` }
  };
}

function renderMarkdown(content) {
  const lines = content.trim().split('\n');
  const elements = [];
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];

    if (line.startsWith('## ')) {
      elements.push(
        <h2 key={i} className="text-2xl font-bold text-zinc-900 dark:text-white mt-10 mb-4">
          {line.slice(3)}
        </h2>
      );
    } else if (line.startsWith('- ')) {
      const items = [];
      while (i < lines.length && lines[i].startsWith('- ')) {
        items.push(<li key={i} className="mb-1">{renderInline(lines[i].slice(2))}</li>);
        i++;
      }
      elements.push(<ul key={`ul-${i}`} className="list-disc list-inside space-y-1 text-zinc-600 dark:text-zinc-400 mb-4 ml-2">{items}</ul>);
      continue;
    } else if (line.startsWith('**') && line.endsWith('**') && line.length > 4) {
      elements.push(
        <p key={i} className="font-semibold text-zinc-900 dark:text-white mb-2 mt-6">
          {line.slice(2, -2)}
        </p>
      );
    } else if (line.trim() === '') {
      // skip blank lines
    } else {
      elements.push(
        <p key={i} className="text-zinc-600 dark:text-zinc-400 leading-relaxed mb-4">
          {renderInline(line)}
        </p>
      );
    }
    i++;
  }

  return elements;
}

function renderInline(text) {
  const parts = text.split(/(\*\*[^*]+\*\*|`[^`]+`)/g);
  return parts.map((part, i) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return <strong key={i} className="font-semibold text-zinc-900 dark:text-white">{part.slice(2, -2)}</strong>;
    }
    if (part.startsWith('`') && part.endsWith('`')) {
      return <code key={i} className="px-1.5 py-0.5 bg-zinc-100 dark:bg-zinc-800 rounded text-sm font-mono text-pink-600 dark:text-pink-400">{part.slice(1, -1)}</code>;
    }
    return part;
  });
}

const CATEGORY_COLORS = {
  'Getting Started': 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
  'AI Images': 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
  'AI Text': 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  'Founder Page': 'bg-pink-100 text-pink-700 dark:bg-pink-900/30 dark:text-pink-400',
};

export default function BlogPostPage({ params }) {
  const post = getPost(params.slug);
  if (!post) notFound();

  const otherPosts = BLOG_POSTS.filter(p => p.slug !== post.slug).slice(0, 3);

  return (
    <div className="min-h-screen bg-white dark:bg-zinc-950">
      <LandingNavbar isAuthenticated={false} />

      <main className="pt-24 pb-20 px-6">
        <div className="max-w-2xl mx-auto">

          {/* Back */}
          <Link href="/blog" className="inline-flex items-center gap-2 text-sm text-zinc-500 hover:text-zinc-900 dark:hover:text-white transition-colors mb-10">
            ← Back to Blog
          </Link>

          {/* Header */}
          <div className="mb-10">
            <div className="flex flex-wrap items-center gap-3 mb-5">
              <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${CATEGORY_COLORS[post.category] || ''}`}>
                {post.category}
              </span>
              <span className="text-xs text-zinc-400">{post.readTime}</span>
              <span className="text-xs text-zinc-400">{post.date}</span>
            </div>
            <h1 className="text-3xl md:text-4xl font-bold text-zinc-900 dark:text-white leading-tight mb-4">
              {post.title}
            </h1>
            <p className="text-zinc-500 dark:text-zinc-400 text-lg leading-relaxed">
              {post.description}
            </p>
          </div>

          <hr className="border-zinc-200 dark:border-zinc-800 mb-10" />

          {/* Content */}
          <div className="prose-custom">
            {renderMarkdown(post.content)}
          </div>

          <hr className="border-zinc-200 dark:border-zinc-800 mt-12 mb-10" />

          {/* CTA */}
          <div className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 p-8 text-center mb-14">
            <h3 className="text-xl font-bold text-zinc-900 dark:text-white mb-2">Try it yourself</h3>
            <p className="text-zinc-500 dark:text-zinc-400 text-sm mb-5">Free to start. No credit card needed.</p>
            <Link
              href="/register"
              className="inline-block px-7 py-3 bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 rounded-full font-semibold hover:opacity-90 transition text-sm"
            >
              Create Your Account →
            </Link>
          </div>

          {/* More posts */}
          {otherPosts.length > 0 && (
            <div>
              <h3 className="text-lg font-bold text-zinc-900 dark:text-white mb-5">More Guides</h3>
              <div className="space-y-3">
                {otherPosts.map(p => (
                  <Link key={p.slug} href={`/blog/${p.slug}`} className="group flex items-center justify-between p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 hover:border-zinc-400 dark:hover:border-zinc-600 transition">
                    <div>
                      <p className="text-sm font-semibold text-zinc-900 dark:text-white group-hover:text-brand-pink transition-colors">{p.title}</p>
                      <p className="text-xs text-zinc-400 mt-0.5">{p.readTime} · {p.category}</p>
                    </div>
                    <span className="text-zinc-400 group-hover:text-brand-pink transition-colors">→</span>
                  </Link>
                ))}
              </div>
            </div>
          )}

        </div>
      </main>

      <LandingFooter />
    </div>
  );
}
