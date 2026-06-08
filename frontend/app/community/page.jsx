'use client'
export const dynamic = 'force-dynamic'

import ProtectedRoute from '../../components/ProtectedRoute'
import Community from '../../views/Community'

export default function Page() {
  return (
    <ProtectedRoute>
      <Community />
    </ProtectedRoute>
  )
}
