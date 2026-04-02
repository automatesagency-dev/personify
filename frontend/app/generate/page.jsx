'use client'
export const dynamic = 'force-dynamic'

import ProtectedRoute from '../../components/ProtectedRoute'
import Generate from '../../pages/Generate'

export default function Page() {
  return (
    <ProtectedRoute>
      <Generate />
    </ProtectedRoute>
  )
}
