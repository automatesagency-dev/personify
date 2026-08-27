'use client'

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '../context/AuthContext';
import { useGoogleLogin } from '@react-oauth/google';

export default function Register() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [agreeToTerms, setAgreeToTerms] = useState(false);
  const [agreeToMarketing, setAgreeToMarketing] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const { register, loginWithGoogle } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();

  // Store invite code from ?ref= param so AuthContext can apply it after signup
  useEffect(() => {
    const ref = searchParams?.get('ref');
    if (ref) {
      localStorage.setItem('pendingReferralCode', ref.toUpperCase().trim());
    }
  }, [searchParams]);

  // Authorization-code flow — see the note in Login.jsx.
  const handleGoogleSignup = useGoogleLogin({
    flow: 'auth-code',
    onSuccess: async ({ code }) => {
      setError('');
      setLoading(true);
      try {
        await loginWithGoogle(code);
        router.push('/onboarding');
      } catch (err) {
        setError('Google sign up failed. Please try again.');
      } finally {
        setLoading(false);
      }
    },
    onError: () => setError('Google sign up failed. Please try again.')
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (!agreeToTerms) {
      setError('Please agree to the terms and conditions');
      return;
    }

    if (password.length < 8) {
      setError('Password must be at least 8 characters');
      return;
    }

    setLoading(true);

    try {
      await register(email, password, name, agreeToMarketing);
      router.push('/onboarding');
    } catch (err) {
      setError(err.response?.data?.error || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const GoogleIcon = () => (
    <svg className="w-5 h-5 flex-shrink-0" viewBox="0 0 24 24">
      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
    </svg>
  );

  const EyeIcon = ({ open }) => open ? (
    <svg className="w-4 h-4 md:w-5 md:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
    </svg>
  ) : (
    <svg className="w-4 h-4 md:w-5 md:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
    </svg>
  );

  return (
    <div className="min-h-screen flex">
      {/* Left Side - Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center px-6 py-8 md:p-8 bg-cream">
        <div className="w-full max-w-md">

          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 mb-5 md:mb-10">
            <img src="/images/logo.png" alt="Personify" className="w-7 h-7 md:w-8 md:h-8" />
            <span className="text-xl md:text-2xl font-semibold text-gray-900">Personify</span>
          </Link>

          {/* Title */}
          <div className="mb-5 md:mb-8">
            <h1 className="text-2xl md:text-3xl font-semibold text-gray-900 mb-1.5 md:mb-2">
              Your Journey To Powerful<br /><span className="text-brand-pink">Personal</span> Branding.
            </h1>
            <p className="text-gray-500 text-sm md:text-base">
              Join creators using AI to elevate their personal brand.
            </p>
          </div>

          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">
              {error}
            </div>
          )}

          {/* Registration Form */}
          <form onSubmit={handleSubmit} className="space-y-3 md:space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Name</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-4 py-2.5 md:py-3 border border-gray-300 rounded-full focus:ring-2 focus:ring-brand-pink focus:border-transparent outline-none transition text-sm"
                  placeholder="Your name"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Email</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-4 py-2.5 md:py-3 border border-gray-300 rounded-full focus:ring-2 focus:ring-brand-pink focus:border-transparent outline-none transition text-sm"
                  placeholder="you@email.com"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Password</label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-4 py-2.5 md:py-3 pr-12 border border-gray-300 rounded-full focus:ring-2 focus:ring-brand-pink focus:border-transparent outline-none transition text-sm"
                  placeholder="Min. 8 characters"
                  required minLength={8}
                />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700">
                  <EyeIcon open={showPassword} />
                </button>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Confirm Password</label>
              <div className="relative">
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full px-4 py-2.5 md:py-3 pr-12 border border-gray-300 rounded-full focus:ring-2 focus:ring-brand-pink focus:border-transparent outline-none transition text-sm"
                  placeholder="••••••••••••"
                  required minLength={8}
                />
                <button type="button" onClick={() => setShowConfirmPassword(!showConfirmPassword)} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700">
                  <EyeIcon open={showConfirmPassword} />
                </button>
              </div>
            </div>

            <div className="space-y-2.5">
              <div className="flex items-start gap-2">
                <input
                  type="checkbox"
                  id="terms"
                  checked={agreeToTerms}
                  onChange={(e) => setAgreeToTerms(e.target.checked)}
                  className="w-4 h-4 mt-0.5 text-brand-pink border-gray-300 rounded focus:ring-brand-pink flex-shrink-0"
                />
                <label htmlFor="terms" className="text-sm text-gray-700 leading-snug">
                  I have read and agree to the{' '}
                  <Link href="/terms" target="_blank" className="text-brand-pink hover:underline font-medium">Terms of Service</Link>
                  {' '}and{' '}
                  <Link href="/privacy" target="_blank" className="text-brand-pink hover:underline font-medium">Privacy Policy</Link>
                  . I confirm I am 18 years or older. <span className="text-red-500">*</span>
                </label>
              </div>
              <div className="flex items-start gap-2">
                <input
                  type="checkbox"
                  id="marketing"
                  checked={agreeToMarketing}
                  onChange={(e) => setAgreeToMarketing(e.target.checked)}
                  className="w-4 h-4 mt-0.5 text-brand-pink border-gray-300 rounded focus:ring-brand-pink flex-shrink-0"
                />
                <label htmlFor="marketing" className="text-sm text-gray-600 leading-snug">
                  I'd like to receive product updates, tips, and news from Personify. <span className="text-gray-400">(optional)</span>
                </label>
              </div>
            </div>

            {/* Divider */}
            <div className="relative py-1">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-200"></div>
              </div>
              <div className="relative flex justify-center text-xs">
                <span className="px-3 bg-cream text-gray-400">or</span>
              </div>
            </div>

            {/* Google — just above Create Account */}
            <button
              type="button"
              onClick={() => handleGoogleSignup()}
              disabled={loading}
              className="w-full flex items-center justify-center gap-3 px-4 py-2.5 md:py-3 border border-gray-300 rounded-full hover:bg-gray-50 transition disabled:opacity-50 text-sm"
            >
              <GoogleIcon />
              <span className="text-gray-700 font-medium">Continue With Google</span>
            </button>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gray-900 text-white py-2.5 md:py-4 rounded-full font-semibold hover:bg-gray-800 transition disabled:opacity-50 text-sm md:text-base"
            >
              {loading ? 'Creating account...' : 'Create Account'}
            </button>
          </form>

          <p className="text-center text-gray-600 mt-4 text-sm">
            Already have an account?{' '}
            <Link href="/login" className="text-brand-pink hover:text-pink-700 font-semibold">Login</Link>
          </p>

          <div className="flex justify-center gap-4 mt-4 pt-4 border-t border-gray-200">
            <Link href="/terms" target="_blank" className="text-xs text-gray-400 hover:text-gray-600 transition">Terms of Service</Link>
            <span className="text-gray-300">·</span>
            <Link href="/privacy" target="_blank" className="text-xs text-gray-400 hover:text-gray-600 transition">Privacy Policy</Link>
          </div>
        </div>
      </div>

      {/* Right Side - Image */}
      <div
        className="hidden lg:block lg:w-1/2 relative bg-cover bg-center"
        style={{ backgroundImage: 'url(/images/auth-bg.png)' }}
      >
        <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
      </div>
    </div>
  );
}