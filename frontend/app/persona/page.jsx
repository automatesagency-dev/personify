'use client'
export const dynamic = 'force-dynamic'

import ProtectedRoute from '../../components/ProtectedRoute'
import Persona from '../../views/Persona'

export default function Page() {
  return (
    <ProtectedRoute>
      <Persona />
    </ProtectedRoute>
  )
}
