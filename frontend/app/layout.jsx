import './globals.css'
import { AuthProvider } from '../context/AuthContext'

export const metadata = { title: 'Personify', description: 'AI-powered personal branding' }

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  )
}
