'use client'

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { authAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';

export default function VerifyEmail() {
  const { refreshUser } = useAuth();
  const [status, setStatus] = useState('verifying'); // verifying | success | error
  const [message, setMessage] = useState('');

  useEffect(() => {
    const token = typeof window !== 'undefined'
      ? new URLSearchParams(window.location.search).get('token')
      : null;

    if (!token) {
      setStatus('error');
      setMessage('No verification token found in this link.');
      return;
    }

    authAPI.verifyEmail(token)
      .then(() => {
        setStatus('success');
        // Refresh cached user so the "verify your email" banner clears.
        refreshUser();
      })
      .catch((err) => {
        setStatus('error');
        setMessage(err.response?.data?.error || 'Verification failed. The link may have expired.');
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center bg-cream px-6">
      <div className="w-full max-w-md text-center bg-white rounded-2xl border border-gray-200 p-8 shadow-sm">
        <img src="/images/logo.png" alt="Personify" className="w-10 h-10 mx-auto mb-6" />

        {status === 'verifying' && (
          <>
            <div className="w-8 h-8 border-4 border-gray-200 border-t-brand-pink rounded-full animate-spin mx-auto mb-4" />
            <p className="text-gray-600">Verifying your email…</p>
          </>
        )}

        {status === 'success' && (
          <>
            <div className="w-14 h-14 rounded-full bg-green-100 text-green-600 text-2xl flex items-center justify-center mx-auto mb-4">✓</div>
            <h1 className="text-xl font-semibold text-gray-900 mb-2">Email verified!</h1>
            <p className="text-gray-600 mb-6">Your email is confirmed — you can now generate content.</p>
            <Link href="/dashboard" className="inline-block bg-gray-900 text-white px-6 py-3 rounded-full font-semibold hover:bg-gray-800 transition">Go to Dashboard</Link>
          </>
        )}

        {status === 'error' && (
          <>
            <div className="w-14 h-14 rounded-full bg-red-100 text-red-600 text-2xl flex items-center justify-center mx-auto mb-4">✕</div>
            <h1 className="text-xl font-semibold text-gray-900 mb-2">Verification failed</h1>
            <p className="text-gray-600 mb-6">{message}</p>
            <Link href="/dashboard" className="inline-block bg-gray-900 text-white px-6 py-3 rounded-full font-semibold hover:bg-gray-800 transition">Go to Dashboard</Link>
            <p className="text-sm text-gray-500 mt-4">You can request a new link from the banner in your dashboard.</p>
          </>
        )}
      </div>
    </div>
  );
}
