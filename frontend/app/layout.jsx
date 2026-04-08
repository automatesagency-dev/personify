import './globals.css'
import { AuthProvider } from '../context/AuthContext'
import { Analytics } from '@vercel/analytics/next'
import { GoogleAnalytics } from '@next/third-parties/google'

export const metadata = { title: 'Personify', description: 'AI-powered personal branding' }

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <AuthProvider>{children}</AuthProvider>
        <Analytics />
      </body>
      <GoogleAnalytics gaId="G-LMF067PMPW" />
    </html>
  )
}
