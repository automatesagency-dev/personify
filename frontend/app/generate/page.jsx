'use client'

import ProtectedRoute from '../../components/ProtectedRoute'
import Generate from '../../pages/Generate'

export default function Page() {
  return (
    <ProtectedRoute>
      <Generate />
    </ProtectedRoute>
  )
}
