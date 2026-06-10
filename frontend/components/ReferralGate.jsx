'use client'

import { useState } from 'react';
import Link from 'next/link';
import { useAuth } from '../context/AuthContext';
import { referralAPI, authAPI } from '../services/api';

export default function ReferralGate({ children }) {
  const { user, refreshUser } = useAuth();
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  // Loading state while user is being fetched
  if (!user) return null;

  // Already verified — render children normally
  if (user.referralVerified) return children;

  const handleUnlock = async (e) => {
    e.preventDefault();
    if (!code.trim()) return;
    setError('');
    setLoading(true);
    try {
      await referralAPI.useCode(code.trim());
      setSuccess(true);
      await refreshUser();
    } catch (err) {
      setError(err.response?.data?.error || 'Invalid code. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen bg-dark-bg flex items-center justify-center p-6">
        <div className="text-center">
          <div className="w-16 h-16 rounded-full bg-green-500/20 flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h2 className="text-white text-xl font-semibold mb-2">Access Unlocked</h2>
          <p className="text-gray-400 text-sm">Redirecting you to the Founder Page editor...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-dark-bg flex items-center justify-center p-6">
      <div className="w-full max-w-md text-center">
        {/* Lock icon */}
        <div className="w-16 h-16 rounded-2xl bg-brand-pink/10 border border-brand-pink/20 flex items-center justify-center mx-auto mb-6">
          <svg className="w-8 h-8 text-brand-pink" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
          </svg>
        </div>

        <h1 className="text-2xl font-semibold text-white mb-2">Founder Page is Invite-Only</h1>
        <p className="text-gray-400 text-sm mb-8 leading-relaxed">
          You need an access code to use this feature. Ask another member in our{' '}
          <Link href="/community" className="text-brand-pink hover:underline">WhatsApp community</Link>
          {' '}to share their code, or reach out to us directly.
        </p>

        <form onSubmit={handleUnlock} className="space-y-3">
          <input
            type="text"
            value={code}
            onChange={e => setCode(e.target.value.toUpperCase())}
            placeholder="Enter your access code"
            maxLength={8}
            className="w-full px-4 py-3 bg-dark-card border border-gray-700 rounded-xl text-white text-center font-mono text-lg tracking-widest placeholder:text-gray-600 placeholder:font-sans placeholder:tracking-normal outline-none focus:border-brand-pink transition"
          />

          {error && (
            <p className="text-red-400 text-sm">{error}</p>
          )}

          <button
            type="submit"
            disabled={loading || !code.trim()}
            className="w-full py-3 bg-brand-pink text-white rounded-xl font-semibold hover:opacity-90 transition disabled:opacity-40"
          >
            {loading ? 'Checking...' : 'Unlock Access'}
          </button>
        </form>

        <p className="text-gray-600 text-xs mt-6">
          Don't have a code?{' '}
          <Link href="/community" className="text-gray-400 hover:text-white transition">
            Visit the community
          </Link>
        </p>
      </div>
    </div>
  );
}
