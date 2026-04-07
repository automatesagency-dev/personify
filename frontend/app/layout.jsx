import './globals.css'
import { AuthProvider } from '../context/AuthContext'
import { Analytics } from '@vercel/analytics/next'
import PostHogProvider from '../components/PostHogProvider'

export const metadata = { title: 'Personify', description: 'AI-powered personal branding' }

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <PostHogProvider>
          <AuthProvider>{children}</AuthProvider>
        </PostHogProvider>
        <Analytics />
      </body>
    </html>
  )
}
