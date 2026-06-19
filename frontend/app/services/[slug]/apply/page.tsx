'use client';

import React from 'react';
import { useParams } from 'next/navigation';
import { useAuthStore } from '@/features/auth/authStore';
import DashboardLayout from '@/components/layout/DashboardLayout';
import PublicHeader from '@/components/layout/PublicHeader';
import PublicFooter from '@/components/layout/PublicFooter';
import WhatsAppButton from '@/components/layout/WhatsAppButton';
import ServiceApplyClient from '@/features/services/components/ServiceApplyClient';

export default function AliasApplyPage() {
  const params = useParams();
  const slug = params?.slug as string;
  const { status } = useAuthStore();

  const renderContent = () => {
    return <ServiceApplyClient serviceSlug={slug} />;
  };

  if (status === 'loading') {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <div className="w-10 h-10 border-4 border-blue-100 border-t-blue-600 rounded-full animate-spin" />
        <p className="text-xs text-slate-500 font-bold tracking-wider">Verifying session...</p>
      </div>
    );
  }

  if (status === 'authenticated') {
    return (
      <DashboardLayout>
        <div className="py-2">
          {renderContent()}
        </div>
      </DashboardLayout>
    );
  }

  // Unauthenticated shell
  return (
    <div className="relative min-h-screen flex flex-col justify-between overflow-x-hidden bg-slate-50">
      {/* Floating Glow Ambient Backgrounds */}
      <div className="absolute top-[5%] left-[-20%] h-[600px] w-[600px] rounded-full bg-primary-blue/5 blur-[120px] pointer-events-none" />
      <div className="absolute top-[40%] right-[-20%] h-[600px] w-[600px] rounded-full bg-indigo-600/5 blur-[120px] pointer-events-none" />

      {/* Main Header */}
      <PublicHeader />

      {/* Page Body */}
      <main className="flex-grow py-12 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full relative z-10">
        {renderContent()}
      </main>

      {/* Main Footer */}
      <PublicFooter />

      {/* Floating Chat */}
      <WhatsAppButton />
    </div>
  );
}
