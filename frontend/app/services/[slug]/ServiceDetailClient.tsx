'use client';

import React, { useState } from 'react';
import PublicHeader from '@/components/layout/PublicHeader';
import PublicFooter from '@/components/layout/PublicFooter';
import WhatsAppButton from '@/components/layout/WhatsAppButton';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { useAuthStore } from '@/features/auth/authStore';
import { ServiceDetailHero } from '@/features/services/components/ServiceDetailHero';
import { ServiceRequirements } from '@/features/services/components/ServiceRequirements';
import { ServiceDocuments } from '@/features/services/components/ServiceDocuments';
import { ServicePricing } from '@/features/services/components/ServicePricing';
import { useService } from '@/features/services/hooks/useService';
import { AlertCircle, RotateCcw, Info, ShoppingBag, X, Sparkles } from 'lucide-react';
import Link from 'next/link';

interface ServiceDetailClientProps {
  slug: string;
}

export default function ServiceDetailClient({ slug }: ServiceDetailClientProps) {
  const { details, fields, documents, isLoading, isError, error } = useService(slug);
  const { status } = useAuthStore();
  const [isComingSoonOpen, setIsComingSoonOpen] = useState(false);


  const renderContent = () => {
    if (isLoading) {
      return (
        /* Loading Skeletons */
        <div className="space-y-8 animate-pulse">
          <div className="h-64 bg-white rounded-3xl border border-slate-100 p-8 shadow-sm flex flex-col justify-between">
            <div className="space-y-4">
              <div className="h-5 w-40 bg-slate-200 rounded" />
              <div className="h-10 w-1/2 bg-slate-200 rounded" />
              <div className="h-4 w-2/3 bg-slate-200 rounded" />
            </div>
            <div className="h-12 w-48 bg-slate-200 rounded-lg" />
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-8">
              <div className="h-48 bg-white rounded-3xl border border-slate-100 p-8 shadow-sm" />
              <div className="h-64 bg-white rounded-3xl border border-slate-100 p-8 shadow-sm" />
            </div>
            <div className="h-64 bg-white rounded-3xl border border-slate-100 p-8 shadow-sm" />
          </div>
        </div>
      );
    }

    if (isError || !details) {
      return (
        /* Error State */
        <div className="bg-white border border-slate-100 rounded-3xl p-10 text-center max-w-md mx-auto my-16 shadow-sm">
          <div className="inline-flex items-center justify-center h-14 w-14 rounded-full bg-red-50 text-red-600 mb-4">
            <AlertCircle className="h-7 w-7" />
          </div>
          <h3 className="text-lg font-bold text-slate-800 mb-2">Service Not Found</h3>
          <p className="text-sm text-slate-500 mb-6">
            The requested digital service was not found or is currently inactive.
          </p>
          <Link
            href={status === 'authenticated' ? '/dashboard/services' : '/services'}
            className="inline-flex items-center justify-center px-5 py-2.5 bg-primary-blue text-white font-semibold rounded-xl hover:bg-blue-700 active:scale-95 transition-all text-sm shadow-md shadow-blue-500/10"
          >
            Return to Catalogue
          </Link>
        </div>
      );
    }

    return (
      /* Content Layout */
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        {/* Left Column: Details */}
        <div className="lg:col-span-2 space-y-8">
          {/* Section 1: Hero */}
          <ServiceDetailHero service={details} />

          {/* Section 2: About Service */}
          <div className="bg-white rounded-3xl border border-slate-100 p-8 shadow-sm">
            <h2 className="text-xl font-bold text-slate-800 mb-4 flex items-center">
              <Info className="h-5 w-5 mr-2 text-primary-blue" />
              About Service
            </h2>
            <div className="text-sm text-slate-600 leading-relaxed space-y-3 whitespace-pre-line">
              {details.description}
            </div>
          </div>

          {/* Section 3: Required Fields */}
          <ServiceRequirements fields={fields || []} />

          {/* Section 4: Required Documents */}
          <ServiceDocuments documents={documents || []} />

          {/* Section 5: Detailed Pricing Card */}
          <ServicePricing service={details} />
        </div>

        {/* Right Column: Checkout Card / CTA (Section 6) */}
        <div className="bg-white rounded-3xl border border-slate-100 p-6 shadow-sm sticky top-6">
          <div className="mb-4">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-1">
              Service Price
            </span>
            <div className="flex items-baseline gap-1">
              <span className="text-3xl font-black text-slate-900">₹{details.mrp}</span>
              <span className="text-xs text-slate-500 font-medium">all inclusive</span>
            </div>
          </div>

          <div className="space-y-4 mb-6">
            <div className="p-3 bg-blue-50/50 rounded-xl border border-blue-100 flex items-start gap-2.5">
              <Info className="h-4.5 w-4.5 text-primary-blue shrink-0 mt-0.5" />
              <p className="text-xs text-slate-600 leading-normal">
                This service catalog is currently in read-only mode. Dynamic details and requirements are shown for preparation.
              </p>
            </div>
          </div>

          {/* Section 6: Apply CTA */}
          {status === 'authenticated' ? (
            <button
              onClick={() => setIsComingSoonOpen(true)}
              className="w-full inline-flex items-center justify-center gap-2 px-6 py-4 bg-primary-blue hover:bg-secondary-blue text-white font-bold rounded-2xl transition-all text-sm uppercase tracking-wider shadow-lg shadow-blue-500/10"
            >
              <ShoppingBag className="h-4.5 w-4.5" />
              Apply / Use Service
            </button>
          ) : (
            <Link
              href={`/login?redirect=/services/${details.slug}`}
              className="w-full inline-flex items-center justify-center gap-2 px-6 py-4 bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 font-bold rounded-2xl transition-all text-sm uppercase tracking-wider"
            >
              <ShoppingBag className="h-4.5 w-4.5" />
              Login to Continue
            </Link>
          )}
        </div>

        {/* Coming Soon Modal */}
        {isComingSoonOpen && (
          <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[9999] flex items-center justify-center p-4 animate-in fade-in duration-200">
            <div className="bg-white rounded-3xl p-6 md:p-8 max-w-sm w-full shadow-2xl border border-gray-100 flex flex-col items-center text-center animate-in zoom-in-95 duration-200 relative">
              <button
                onClick={() => setIsComingSoonOpen(false)}
                className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X size={18} />
              </button>

              <div className="w-14 h-14 rounded-2xl bg-blue-50 text-primary-blue flex items-center justify-center mb-4 border border-blue-100/50 shadow-sm">
                <Sparkles size={26} className="text-primary-blue" />
              </div>

              <h4 className="text-base font-extrabold text-gray-800">Kiosk Gateway Coming Soon</h4>
              <p className="text-xs text-gray-500 mt-2 leading-relaxed">
                The application form and payment flow for <strong className="text-gray-700">{details.name}</strong> are currently under development.
              </p>
              <p className="text-xs text-gray-400 mt-2 bg-gray-50 border border-gray-150 py-1.5 px-3 rounded-xl w-full">
                Full processing will launch in Phase 3.
              </p>

              <button
                onClick={() => setIsComingSoonOpen(false)}
                className="w-full mt-5 py-2.5 bg-primary-blue hover:bg-secondary-blue text-white rounded-xl text-xs font-bold transition-all shadow-sm"
              >
                Close Window
              </button>
            </div>
          </div>
        )}
      </div>
    );
  };

  if (status === 'authenticated') {
    return (
      <DashboardLayout>
        <div className="py-2">
          {renderContent()}
        </div>
      </DashboardLayout>
    );
  }

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
