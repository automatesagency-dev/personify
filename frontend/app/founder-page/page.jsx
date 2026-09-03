'use client'
export const dynamic = 'force-dynamic'

import { Suspense } from 'react'
import ProtectedRoute from '../../components/ProtectedRoute'
import FounderPage from '../../views/FounderPage'

// Founder Page is open to every logged-in user — no referral code required.
// (ReferralGate still exists if a future paywall needs a full-page block.)
export default function Page() {
  return (
    <ProtectedRoute>
      <Suspense fallback={<div className="min-h-screen bg-dark-bg flex items-center justify-center text-white">Loading...</div>}>
        <FounderPage />
      </Suspense>
    </ProtectedRoute>
  )
}
