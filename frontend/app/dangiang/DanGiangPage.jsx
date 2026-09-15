'use client'

// Standalone, one-off page for Dan Giang. Deliberately independent of the
// Founder Page builder (own fonts, own styling, own hardcoded content and
// local image assets) — see the code comment in app/dangiang/page.jsx for why.

import { useState } from 'react'
import Image from 'next/image'
import { Playfair_Display, Inter } from 'next/font/google'

const playfair = Playfair_Display({ subsets: ['latin'], weight: ['400', '500', '600', '700'], variable: '--font-playfair' })
const inter = Inter({ subsets: ['latin'], weight: ['400', '500', '600'], variable: '--font-inter' })

const NAV_LINKS = [
  { label: 'About', href: '#about' },
  { label: 'Gallery', href: '#gallery' },
  { label: 'Vision', href: '#vision' },
  { label: 'FAQs', href: '#faqs' },
]

const HERO_POINTS = [
  'AI Infrastructure & Scalable Systems',
  'Personal Brand & Authenticity at Scale',
  'Content Systems That Compound',
]

const STATS = [
  { value: '50+', label: 'Keynote Presentations' },
  { value: '15+', label: 'Countries Reached' },
  { value: '10K+', label: 'Professionals Trained' },
]

const GALLERY_IMAGES = [
  { src: '/dangiang/gallery-1-crowd.png', alt: 'Dan Giang speaking to a large conference audience', className: 'row-span-2' },
  { src: '/dangiang/gallery-2-ai-education.png', alt: 'Dan Giang presenting "AI in Education: Innovation & Impact"' },
  { src: '/dangiang/gallery-3-boardroom.png', alt: 'Dan Giang leading a boardroom discussion' },
  { src: '/dangiang/gallery-4-product-demo.png', alt: 'Dan Giang presenting a product demo on stage' },
  { src: '/dangiang/gallery-5-mic-address.png', alt: 'Dan Giang addressing the Tech & Education Summit' },
]

const VISION_CARDS = [
  {
    image: '/dangiang/vision-1-ai-infrastructure.png',
    title: 'AI as Infrastructure',
    description: 'Building systems that leverage AI without losing human judgment and taste in the process.',
  },
  {
    image: '/dangiang/vision-2-authentic-scale.png',
    title: 'Authentic Scale',
    description: 'Frameworks for scaling personal brands and content systems without losing authenticity.',
  },
  {
    image: '/dangiang/vision-3-systems-compound.png',
    title: 'Systems That Compound',
    description: 'Building infrastructure that creates leverage and grows stronger over time.',
  },
]

const LEADERSHIP_POINTS = [
  'Strategic AI Implementation',
  'Content System Architecture',
  'Building in Public Frameworks',
]

const FAQS = [
  {
    question: "What's the best way to get started?",
    answer: 'Reach out with a bit of context about your goals — from there we can figure out the right format, whether that’s a keynote, workshop, or advisory session.',
  },
  {
    question: 'Do you work with teams as well as individuals?',
    answer: 'Yes — sessions range from 1:1 advisory work to full team workshops and larger keynote audiences.',
  },
  {
    question: 'How far in advance should I reach out?',
    answer: "A few weeks' notice is usually enough, but earlier is always better for scheduling flexibility.",
  },
  {
    question: 'Is remote collaboration an option?',
    answer: 'Absolutely — virtual sessions and async advisory work are both available alongside in-person engagements.',
  },
  {
    question: 'Can sessions be tailored to a specific industry?',
    answer: 'Yes, every session is adapted to the audience and industry context beforehand.',
  },
  {
    question: 'What happens after I reach out?',
    answer: "You'll hear back to schedule a quick call, align on goals, and map out the right format together.",
  },
]

function Eyebrow({ children }) {
  return <p className="text-xs font-medium tracking-[0.2em] uppercase text-white/40">{children}</p>
}

function SectionHeading({ children, className = '' }) {
  return (
    <h2 className={`${playfair.className} text-4xl md:text-5xl font-medium text-white ${className}`}>
      {children}
    </h2>
  )
}

// Rendered, fully-styled, but intentionally inert — no href/onClick yet.
function DeadButton({ children, className = '' }) {
  return (
    <button
      type="button"
      onClick={(e) => e.preventDefault()}
      className={`inline-flex items-center justify-center px-8 py-4 bg-white text-black text-xs font-semibold tracking-[0.15em] uppercase hover:bg-white/90 transition ${className}`}
    >
      {children}
    </button>
  )
}

function FaqItem({ question, answer }) {
  const [open, setOpen] = useState(false)
  return (
    <div className="border-b border-white/10">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className="w-full flex items-center justify-between gap-6 py-6 text-left"
      >
        <span className={`${playfair.className} text-lg md:text-xl text-white`}>{question}</span>
        <svg
          className={`w-5 h-5 flex-shrink-0 text-white/50 transition-transform duration-300 ${open ? 'rotate-180' : ''}`}
          fill="none" stroke="currentColor" viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      <div className={`grid transition-all duration-300 ease-in-out ${open ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'}`}>
        <div className="overflow-hidden">
          <p className="pb-6 pr-10 text-sm md:text-base text-white/50 leading-relaxed">{answer}</p>
        </div>
      </div>
    </div>
  )
}

export default function DanGiangPage() {
  const [menuOpen, setMenuOpen] = useState(false)

  return (
    <div className={`${inter.className} bg-[#0a0a0a] text-white antialiased`}>

      {/* ── Nav ── */}
      <header className="sticky top-0 z-40 bg-[#0a0a0a]/90 backdrop-blur border-b border-white/10">
        <div className="max-w-[1400px] mx-auto px-6 md:px-10 lg:px-16 h-20 flex items-center justify-between">
          <span className={`${inter.className} text-sm font-semibold tracking-[0.2em] uppercase`}>Dan</span>
          <nav className="hidden md:flex items-center gap-10">
            {NAV_LINKS.map((link) => (
              <a key={link.href} href={link.href} className="text-xs font-medium tracking-[0.15em] uppercase text-white/60 hover:text-white transition">
                {link.label}
              </a>
            ))}
          </nav>
          <div className="flex items-center gap-3">
            <a href="#contact" className="px-6 py-3 bg-white text-black text-xs font-semibold tracking-[0.15em] uppercase hover:bg-white/90 transition">
              Contact
            </a>
            <button
              type="button"
              onClick={() => setMenuOpen((v) => !v)}
              aria-expanded={menuOpen}
              aria-label="Toggle menu"
              className="md:hidden p-2 -mr-2 text-white"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                {menuOpen ? (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6 18L18 6M6 6l12 12" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 6h16M4 12h16M4 18h16" />
                )}
              </svg>
            </button>
          </div>
        </div>
        {menuOpen && (
          <nav className="md:hidden border-t border-white/10 px-6 py-4 flex flex-col gap-4">
            {NAV_LINKS.map((link) => (
              <a
                key={link.href}
                href={link.href}
                onClick={() => setMenuOpen(false)}
                className="text-xs font-medium tracking-[0.15em] uppercase text-white/60 hover:text-white transition"
              >
                {link.label}
              </a>
            ))}
          </nav>
        )}
      </header>

      {/* ── Hero ── */}
      <section id="about" className="max-w-[1400px] mx-auto px-6 md:px-10 lg:px-16 py-16 md:py-24">
        <div className="grid md:grid-cols-2 gap-12 md:gap-16 items-center">
          <div>
            <Eyebrow>Portfolio / Website</Eyebrow>
            <h1 className={`${playfair.className} mt-6 text-7xl md:text-8xl font-medium leading-none`}>DAN G</h1>
            <p className={`${playfair.className} italic text-3xl md:text-4xl text-white/80 mt-4`}>Dan Giang</p>

            <ul className="mt-8 space-y-3">
              {HERO_POINTS.map((point) => (
                <li key={point} className="flex items-start gap-3 text-white/70 text-sm md:text-base">
                  <span className="mt-2 w-1 h-1 rounded-full bg-white/50 flex-shrink-0" />
                  {point}
                </li>
              ))}
            </ul>

            <div className="mt-10">
              <DeadButton>Book a Talk</DeadButton>
            </div>
          </div>

          <div className="relative aspect-[4/5] w-full max-w-md mx-auto md:mx-0 md:ml-auto overflow-hidden">
            <Image src="/dangiang/hero-portrait.png" alt="Dan Giang" fill priority sizes="(min-width: 768px) 40vw, 90vw" className="object-cover" />
          </div>
        </div>
      </section>

      {/* ── Journey / Stats ── */}
      <section className="border-t border-white/10">
        <div className="max-w-[1400px] mx-auto px-6 md:px-10 lg:px-16 py-16 md:py-24 grid md:grid-cols-2 gap-12 md:gap-16">
          <div>
            <Eyebrow>About Me</Eyebrow>
            <SectionHeading className="mt-6">Journey Through Experience</SectionHeading>
            <p className="mt-6 text-white/60 leading-relaxed max-w-lg">
              With over a decade of experience navigating the intersection of technology, creativity, and human connection, I help organizations understand how to build AI-first systems without losing their soul.
            </p>
            <p className="mt-4 text-white/60 leading-relaxed max-w-lg">
              My work focuses on practical frameworks for founder-creators and digital teams who want to leverage AI as infrastructure while maintaining authenticity and human judgment.
            </p>
          </div>

          <div className="space-y-8">
            {STATS.map((stat) => (
              <div key={stat.label} className="pb-8 border-b border-white/10 last:border-b-0 flex items-baseline gap-4">
                <span className={`${playfair.className} text-6xl md:text-7xl font-medium`}>{stat.value}</span>
                <span className="text-xs font-medium tracking-[0.15em] uppercase text-white/40">{stat.label}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Gallery ── */}
      <section id="gallery" className="border-t border-white/10">
        <div className="max-w-[1400px] mx-auto px-6 md:px-10 lg:px-16 py-16 md:py-24">
          <Eyebrow>Speaking Events</Eyebrow>
          <SectionHeading className="mt-6 mb-10 md:mb-14">Gallery</SectionHeading>

          <div className="grid grid-cols-2 md:grid-cols-3 gap-3 md:gap-4 auto-rows-[180px] md:auto-rows-[220px]">
            {GALLERY_IMAGES.map((img) => (
              <div key={img.src} className={`relative overflow-hidden col-span-2 md:col-span-1 ${img.className || ''}`}>
                <Image src={img.src} alt={img.alt} fill sizes="(min-width: 768px) 33vw, 100vw" className="object-cover" />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Vision ── */}
      <section id="vision" className="border-t border-white/10">
        <div className="max-w-[1400px] mx-auto px-6 md:px-10 lg:px-16 py-16 md:py-24">
          <Eyebrow>Where AI Meets</Eyebrow>
          <SectionHeading className="mt-6 mb-10 md:mb-14">Vision</SectionHeading>

          <div className="grid md:grid-cols-3 gap-8 md:gap-10">
            {VISION_CARDS.map((card) => (
              <div key={card.title}>
                <div className="relative aspect-[4/5] w-full overflow-hidden mb-6">
                  <Image src={card.image} alt={card.title} fill sizes="(min-width: 768px) 33vw, 100vw" className="object-cover" />
                </div>
                <h3 className={`${playfair.className} text-2xl font-medium mb-2`}>{card.title}</h3>
                <p className="text-white/50 text-sm leading-relaxed">{card.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Leadership ── */}
      <section className="border-t border-white/10">
        <div className="max-w-[1400px] mx-auto px-6 md:px-10 lg:px-16 py-16 md:py-24 grid md:grid-cols-2 gap-12 md:gap-16 items-center">
          <div className="relative aspect-[4/5] w-full overflow-hidden">
            <Image src="/dangiang/leadership.png" alt="Dan Giang speaking at the Tech & Education Summit" fill sizes="(min-width: 768px) 40vw, 90vw" className="object-cover" />
          </div>

          <div>
            <Eyebrow>We Change</Eyebrow>
            <SectionHeading className="mt-6">Leadership</SectionHeading>
            <p className="mt-6 text-white/60 leading-relaxed">
              I believe the future belongs to those who can work in the middle—not obsessed with AI and forgetting the human, not obsessed with authenticity and ignoring scale.
            </p>
            <p className="mt-4 text-white/60 leading-relaxed">
              Through keynotes, workshops, and advisory sessions, I help teams build AI-first infrastructure while maintaining the judgment, taste, and decision-making that makes work meaningful.
            </p>

            <ul className="mt-8 space-y-4">
              {LEADERSHIP_POINTS.map((point) => (
                <li key={point} className="flex items-center gap-4 text-white/70 text-sm">
                  <span className="w-8 h-px bg-white/30 flex-shrink-0" />
                  {point}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* ── FAQs ── */}
      <section id="faqs" className="border-t border-white/10">
        <div className="max-w-[1400px] mx-auto px-6 md:px-10 lg:px-16 py-16 md:py-24">
          <Eyebrow>Common Questions</Eyebrow>
          <SectionHeading className="mt-6 mb-10 md:mb-14">FAQs</SectionHeading>

          <div>
            {FAQS.map((faq) => (
              <FaqItem key={faq.question} {...faq} />
            ))}
          </div>
        </div>
      </section>

      {/* ── Get In Touch ── */}
      <section id="contact" className="border-t border-white/10">
        <div className="max-w-[1400px] mx-auto px-6 md:px-10 lg:px-16 py-16 md:py-24 grid md:grid-cols-2 gap-12 md:gap-16">
          <div>
            <Eyebrow>Let's Collaborate</Eyebrow>
            <SectionHeading className="mt-6">Get In Touch</SectionHeading>
            <p className="mt-6 text-white/60 leading-relaxed max-w-md">
              Available for keynotes, panels, workshops, and advisory sessions on AI, content systems, and building for the long-term.
            </p>
            <div className="mt-10">
              <DeadButton>Book a Talk</DeadButton>
            </div>
          </div>

          <div>
            <p className="text-xs font-medium tracking-[0.15em] uppercase text-white/40 mb-4">Contact Information</p>
            <a href="mailto:dan@automatesagency.com" className="block text-lg text-white/80 hover:text-white transition mb-2">
              dan@automatesagency.com
            </a>
            <a href="tel:+61468314737" className="block text-lg text-white/80 hover:text-white transition">
              +61 468 314 737
            </a>
          </div>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="border-t border-white/10">
        <div className="max-w-[1400px] mx-auto px-6 md:px-10 lg:px-16 py-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-white/40">
          <span>© {new Date().getFullYear()} All Rights Reserved</span>
          <div className="flex items-center gap-6">
            <a href="/privacy" className="hover:text-white transition">Privacy Policy</a>
            <a href="/terms" className="hover:text-white transition">Terms of Service</a>
          </div>
        </div>
      </footer>
    </div>
  )
}
