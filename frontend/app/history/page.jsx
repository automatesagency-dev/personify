'use client'

import ProtectedRoute from '../../components/ProtectedRoute'
import History from '../../pages/History'

export default function Page() {
  return (
    <ProtectedRoute>
      <History />
    </ProtectedRoute>
  )
}
