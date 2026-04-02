'use client'
export const dynamic = 'force-dynamic'

import ProtectedRoute from '../../components/ProtectedRoute'
import FounderPage from '../../pages/FounderPage'

export default function Page() {
  return (
    <ProtectedRoute>
      <FounderPage />
    </ProtectedRoute>
  )
}
