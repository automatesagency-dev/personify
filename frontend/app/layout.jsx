import './globals.css'
import { AuthProvider } from '../context/AuthContext'
import { Analytics } from '@vercel/analytics/next'
import Script from 'next/script'
import { Questrial, Poppins } from 'next/font/google'
import { ThemeProvider } from '../components/landing/ThemeProvider'
import { GoogleOAuthProvider } from '@react-oauth/google'

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

export const metadata = { title: 'Personify', description: 'AI-powered personal branding' }

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
