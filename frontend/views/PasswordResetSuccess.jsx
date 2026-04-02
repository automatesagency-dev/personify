'use client'

import Link from 'next/link';

export default function PasswordResetSuccess() {
  return (
    <div className="min-h-screen flex">
      {/* Left Side - Content */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 bg-cream">
        <div className="w-full max-w-md text-center">
          {/* Logo */}
          <Link href="/" className="flex items-center justify-center gap-2 mb-12">
            <img src="/images/logo.png" alt="Personify" className="w-8 h-8" />
            <span className="text-2xl font-semibold text-gray-900">Personify</span>
          </Link>

          {/* Success Icon */}
          <div className="mb-8 flex justify-center">
            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center">
              <svg className="w-10 h-10 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
          </div>

          {/* Title */}
          <div className="mb-8">
            <h1 className="text-3xl font-semibold text-gray-900 mb-4">
              Password Updated<br />Successfully
            </h1>
            <p className="text-gray-600">
              Your Password Has Been Changed. Please Sign In With Your New Credentials To Continue.
            </p>
          </div>

          {/* Sparkles Icon */}
          <div className="mb-8 flex justify-center">
            <svg className="w-16 h-16 text-brand-pink" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 2L9.19 8.63L2 9.24L7.46 13.97L5.82 21L12 17.27L18.18 21L16.54 13.97L22 9.24L14.81 8.63L12 2Z" />
            </svg>
          </div>

          {/* Button */}
          <Link
            href="/login"
            className="block w-full bg-gray-900 text-white py-4 rounded-full font-semibold hover:bg-gray-800 transition"
          >
            Login to Continue
          </Link>
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