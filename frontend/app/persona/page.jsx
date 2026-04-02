'use client'

import ProtectedRoute from '../../components/ProtectedRoute'
import Persona from '../../pages/Persona'

export default function Page() {
  return (
    <ProtectedRoute>
      <Persona />
    </ProtectedRoute>
  )
}
