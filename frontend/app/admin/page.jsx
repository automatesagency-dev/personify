'use client'
export const dynamic = 'force-dynamic'

import ProtectedRoute from '../../components/ProtectedRoute'
import Admin from '../../views/Admin'

export default function Page() {
  return (
    <ProtectedRoute>
      <Admin />
    </ProtectedRoute>
  )
}
