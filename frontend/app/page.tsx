import React from 'react';
import PublicHeader from '@/components/layout/PublicHeader';
import PublicFooter from '@/components/layout/PublicFooter';
import WhatsAppButton from '@/components/layout/WhatsAppButton';
import HeroSection from '@/components/home/HeroSection';
import BusinessServicesSection from '@/components/home/BusinessServicesSection';
import BusinessPlatformSection from '@/components/home/BusinessPlatformSection';
import HighlightServiceSection from '@/components/home/HighlightServiceSection';
import HowItWorksSection from '@/components/home/HowItWorksSection';
import PartnerPlansSection from '@/components/home/PartnerPlansSection';
import FinalCTASection from '@/components/home/FinalCTASection';
import ContactSection from '@/components/home/ContactSection';

export default function Home() {
  return (
    <div className="relative min-h-screen flex flex-col justify-between overflow-x-hidden">
      {/* Floating Glow Ambient Backgrounds */}
      <div className="absolute top-[5%] left-[-20%] h-[800px] w-[800px] rounded-full bg-primary-blue/5 blur-[150px] pointer-events-none" />
      <div className="absolute bottom-[15%] right-[-20%] h-[800px] w-[800px] rounded-full bg-indigo-600/5 blur-[150px] pointer-events-none" />

      {/* Main Header / Navigation */}
      <PublicHeader />

      {/* Main Content Layout */}
      <main className="flex-grow">
        {/* 1. Hero Section */}
        <HeroSection />

        {/* 2. Business Services Section */}
        <BusinessServicesSection />

        {/* 3. Platform Capabilities Section */}
        <BusinessPlatformSection />

        {/* 4. Highlight Service Section */}
        <HighlightServiceSection />

        {/* 6. Process Flow Section */}
        <HowItWorksSection />

        {/* 7. Partner pricing Comparison Plans */}
        <PartnerPlansSection />

        {/* 8. Contact Form and Details Section */}
        <ContactSection />

        {/* 9. Final Onboarding CTA Banner */}
        <FinalCTASection />
      </main>

      {/* Footer Details */}
      <PublicFooter />

      {/* WhatsApp Floating Chat Button */}
      <WhatsAppButton />
    </div>
  );
}
