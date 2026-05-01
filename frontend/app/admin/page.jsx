'use client'
export const dynamic = 'force-dynamic'

import ProtectedRoute from '../../components/ProtectedRoute'
import AdminUsers from '../../views/AdminUsers'

export default function Page() {
  return (
    <ProtectedRoute>
      <AdminUsers />
    </ProtectedRoute>
  )
}
