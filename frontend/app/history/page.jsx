'use client'
export const dynamic = 'force-dynamic'

import ProtectedRoute from '../../components/ProtectedRoute'
import History from '../../views/History'

export default function Page() {
  return (
    <ProtectedRoute>
      <History />
    </ProtectedRoute>
  )
}
