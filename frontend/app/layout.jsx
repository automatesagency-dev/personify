import './globals.css'
import { AuthProvider } from '../context/AuthContext'
import { Analytics } from '@vercel/analytics/next'
import Script from 'next/script'
import { Questrial, Poppins } from 'next/font/google'
import { ThemeProvider } from '../components/landing/ThemeProvider'
import { GoogleOAuthProvider } from '@react-oauth/google'
import { SITE_URL, SITE_NAME, SITE_TITLE, SITE_DESCRIPTION } from '../lib/site'

const questrial = Questrial({
  variable: '--font-questrial',
  subsets: ['latin'],
  weight: ['400'],
});

const poppins = Poppins({
  variable: '--font-poppins',
  subsets: ['latin'],
  weight: ['300', '400', '500', '600', '800'],
});

export const metadata = {
  // Required for Next to emit absolute URLs in canonicals and og:image.
  // Without it those come out relative and link unfurlers reject them.
  metadataBase: new URL(SITE_URL),
  title: {
    default: SITE_TITLE,
    // Pages set a bare title ("Blog") and get "Blog | Personify".
    template: `%s | ${SITE_NAME}`,
  },
  description: SITE_DESCRIPTION,
  applicationName: SITE_NAME,
  alternates: { canonical: '/' },
  openGraph: {
    type: 'website',
    siteName: SITE_NAME,
    url: '/',
    title: SITE_TITLE,
    description: SITE_DESCRIPTION,
    locale: 'en_US',
    // og:image comes from app/opengraph-image.jsx automatically.
  },
  twitter: {
    card: 'summary_large_image',
    title: SITE_TITLE,
    description: SITE_DESCRIPTION,
  },
  // These files already existed in /public/favicon but nothing referenced
  // them, so the site shipped with no icon at all.
  icons: {
    icon: [
      { url: '/favicon/favicon-32x32.png', sizes: '32x32', type: 'image/png' },
      { url: '/favicon/favicon-16x16.png', sizes: '16x16', type: 'image/png' },
      { url: '/favicon/favicon.ico' },
    ],
    apple: [{ url: '/favicon/apple-touch-icon.png', sizes: '180x180' }],
  },
  manifest: '/favicon/site.webmanifest',
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true, 'max-image-preview': 'large', 'max-snippet': -1 },
  },
}

export default function RootLayout({ children }) {
  return (
    <html lang="en" suppressHydrationWarning className={`${questrial.variable} ${poppins.variable}`}>
      <head>
        <Script
          src="https://www.googletagmanager.com/gtag/js?id=G-LMF067PMPW"
          strategy="afterInteractive"
        />
        <Script id="ga4-init" strategy="afterInteractive">
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', 'G-LMF067PMPW');
          `}
        </Script>
      </head>
      <body>
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
          <GoogleOAuthProvider clientId={process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID}>
            <AuthProvider>{children}</AuthProvider>
          </GoogleOAuthProvider>
        </ThemeProvider>
        <Analytics />
      </body>
    </html>
  )
}
