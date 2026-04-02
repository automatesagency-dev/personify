'use client'

import ProtectedRoute from '../../components/ProtectedRoute'
import FounderPage from '../../pages/FounderPage'

export default function Page() {
  return (
    <ProtectedRoute>
      <FounderPage />
    </ProtectedRoute>
  )
}
