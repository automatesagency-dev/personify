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

  // Signed-in visitors are sent to the dashboard, but only after the page has
  // rendered. This used to be gated by `if (loading) return null`, which meant
  // the prerendered HTML was an empty document: no headings, no copy, nothing
  // for a crawler or a link preview to read.
  useEffect(() => {
    if (!loading && isAuthenticated) {
      router.replace('/dashboard');
    }
  }, [isAuthenticated, loading, router]);

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
