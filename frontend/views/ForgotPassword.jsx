'use client'

import { useState } from 'react';
import Link from 'next/link';
import axios from 'axios';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [resetToken, setResetToken] = useState(''); // For development

  const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setMessage('');
    setLoading(true);

    try {
      const response = await axios.post(`${API_BASE_URL}/auth/forgot-password`, { email });
      setMessage(response.data.message);
      
      // For development - show reset token
      if (response.data.resetToken) {
        setResetToken(response.data.resetToken);
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to send reset email');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* Left Side - Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 bg-cream">
        <div className="w-full max-w-md">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 mb-12">
            <img src="/images/logo.png" alt="Personify" className="w-8 h-8" />
            <span className="text-2xl font-semibold text-gray-900">Personify</span>
          </Link>

          {/* Title */}
          <div className="mb-8">
            <h1 className="text-3xl font-semibold text-gray-900 mb-2">
              Forgot Your Password?
            </h1>
            <p className="text-gray-600">
              No Worries — We've Got You Covered.<br />
              Enter Your Email And We'll Send You A Link To Reset Your Password Securely.
            </p>
          </div>

          {message && (
            <div className="mb-6 p-4 bg-green-50 border border-green-200 text-green-700 rounded-lg text-sm">
              {message}
              {resetToken && (
                <div className="mt-3">
                  <p className="font-semibold mb-1">Development Mode - Reset Token:</p>
                  <Link 
                    to={`/reset-password?token=${resetToken}`}
                    className="text-blue-600 underline break-all"
                  >
                    Click here to reset password
                  </Link>
                </div>
              )}
            </div>
          )}

          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">
              {error}
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Email Address
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-full focus:ring-2 focus:ring-brand-pink focus:border-transparent outline-none transition"
                placeholder="Enter your email address"
                required
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gray-900 text-white py-4 rounded-full font-semibold hover:bg-gray-800 transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Sending...' : 'Submit'}
            </button>
          </form>

          <p className="text-center text-gray-600 mt-6">
            Didn't Have An Account?{' '}
            <Link href="/register" className="text-brand-pink hover:text-pink-700 font-semibold">
              Create Account
            </Link>
          </p>
        </div>
      </div>

      {/* Right Side - Image */}
      <div 
        className="hidden lg:block lg:w-1/2 relative bg-cover bg-center"
        style={{ backgroundImage: 'url(/images/auth-bg.png)' }}
      >
        <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent"></div>
        <div className="absolute bottom-12 left-12 right-12 text-white text-center">
          <h2 className="text-3xl font-semibold mb-4">Level Up Your Personal Brand</h2>
          <p className="text-lg text-white/90">
            No Professional Photos? No Problem. We Generate Highly Realistic Images Of You Anywhere - In An Office, Desert, Or Underwater. Take Your Social Media To The Next Level.
          </p>
        </div>
      </div>
    </div>
  );
}