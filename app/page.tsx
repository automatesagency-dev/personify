import { CTASection } from "@/components/CTASection";
import { FeaturesSection } from "@/components/FeaturesSection";
import { HeroSection } from "@/components/HeroSection";
import CustomLayout from "@/components/layout/CustomLayout";
import { Footer } from "@/components/layout/Footer";


export default function Home() {
  return (
    < >
      <CustomLayout className="flex flex-col gap-20 relative w-full min-h-screen overflow-hidden">
        <HeroSection />
        <FeaturesSection />
        <CTASection />
      </CustomLayout>
      <Footer />
    </>
  );
}
