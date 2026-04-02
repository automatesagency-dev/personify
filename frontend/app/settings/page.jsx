'use client'
export const dynamic = 'force-dynamic'

import ProtectedRoute from '../../components/ProtectedRoute'
import Settings from '../../pages/Settings'

export default function Page() {
  return (
    <ProtectedRoute>
      <Settings />
    </ProtectedRoute>
  )
}
