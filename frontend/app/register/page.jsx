'use client'
export const dynamic = 'force-dynamic'

import { Suspense } from 'react'
import Register from '../../views/Register'

export default function Page() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-cream flex items-center justify-center" />}>
      <Register />
    </Suspense>
  )
}
