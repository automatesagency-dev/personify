'use client'

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../context/AuthContext';
import CustomLayout from '../components/landing/CustomLayout';
import { LandingNavbar } from '../components/landing/LandingNavbar';
import { HeroSection } from '../components/landing/HeroSection';
import { FeaturesSection } from '../components/landing/FeaturesSection';
import { CTASection } from '../components/landing/CTASection';
import { LandingFooter } from '../components/landing/LandingFooter';

export default function Landing() {
  const { isAuthenticated, loading } = useAuth();
  const router = useRouter();

  // Redirect logged-in users to dashboard
  useEffect(() => {
    if (!loading && isAuthenticated) {
      router.replace('/dashboard');
    }
  }, [isAuthenticated, loading, router]);

  if (loading) return null;

  return (
    <div className="bg-white dark:bg-zinc-950 min-h-screen">
      <LandingNavbar isAuthenticated={isAuthenticated} />
      <CustomLayout className="flex flex-col gap-0">
        <HeroSection isAuthenticated={isAuthenticated} />
        <FeaturesSection />
        <CTASection isAuthenticated={isAuthenticated} />
      </CustomLayout>
      <LandingFooter />
    </div>
  );
}
