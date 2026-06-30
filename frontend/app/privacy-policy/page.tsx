import React from 'react';
import type { Metadata } from 'next';
import PublicHeader from '@/components/layout/PublicHeader';
import PublicFooter from '@/components/layout/PublicFooter';
import WhatsAppButton from '@/components/layout/WhatsAppButton';
import { ShieldCheck, Calendar, Mail, FileText, ArrowRight, Lock, CheckCircle2 } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Privacy Policy | Helping Mitra',
  description: 'Helping Mitra Privacy Policy. Read about how we collect, use, store, and protect your personal information on our digital service business platform.',
};

export default function PrivacyPolicyPage() {
  const infoCollected = [
    'Full Name',
    'Mobile Number',
    'Email Address',
    'Aadhaar Number',
    'PAN Number',
    'Address Details',
    'Uploaded Documents',
    'Wallet Transactions',
    'Service Application Data',
    'Device & Browser Information',
    'Login Activity'
  ];

  const infoUsage = [
    'Process service applications',
    'Verify identity',
    'Manage retailer accounts',
    'Process wallet transactions',
    'Prevent fraud',
    'Improve platform performance',
    'Provide customer support',
    'Meet legal obligations'
  ];

  const securityPractices = [
    'Encrypted communication (HTTPS)',
    'Secure authentication',
    'Role-based access control',
    'Audit logging',
    'Secure cloud storage'
  ];

  const sharingInformation = [
    'With government departments when processing services',
    'With payment partners',
    'When legally required'
  ];

  return (
    <div className="relative min-h-screen flex flex-col bg-slate-50 overflow-x-hidden">
      {/* Ambient Background Glows */}
      <div className="pointer-events-none fixed top-[-10%] left-[-15%] h-[600px] w-[600px] rounded-full bg-primary-blue/5 blur-[140px]" />
      <div className="pointer-events-none fixed top-[40%] right-[-15%] h-[500px] w-[500px] rounded-full bg-indigo-500/5 blur-[120px]" />

      <PublicHeader />

      <main className="flex-grow w-full max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-28 relative z-10">

        {/* Hero Section */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-white border border-slate-200 rounded-full text-xs font-bold text-slate-500 shadow-sm mb-5">
            <ShieldCheck size={13} className="text-primary-blue" />
            Trust & Security
          </div>
          <h1 className="text-4xl md:text-5xl font-black text-slate-900 tracking-tight leading-tight mb-4">
            Privacy{' '}
            <span className="relative text-primary-blue">
              Policy
              <span className="absolute bottom-0 left-0 w-full h-1 bg-gradient-to-r from-blue-400 to-indigo-500 rounded-full opacity-30 translate-y-1" />
            </span>
          </h1>
          <div className="flex items-center justify-center gap-2 text-sm text-slate-500 font-semibold bg-slate-100/80 px-4 py-1.5 rounded-full w-fit mx-auto border border-slate-200/50">
            <Calendar size={14} className="text-primary-blue" />
            <span>Effective Date: 30 June 2026</span>
          </div>
        </div>

        {/* Content Box */}
        <div className="bg-white rounded-3xl border border-slate-200/60 p-6 sm:p-10 md:p-14 shadow-sm">

          <div className="space-y-10 text-slate-600">

            {/* Welcome */}
            <section className="bg-blue-50/50 border border-blue-100/50 rounded-2xl p-6 sm:p-8">
              <h2 className="text-lg font-bold text-slate-900 mb-3 flex items-center gap-2">
                <Lock size={18} className="text-primary-blue shrink-0" />
                Welcome to Helping Mitra
              </h2>
              <p className="leading-relaxed text-sm sm:text-base">
                Helping Mitra is a digital service platform that enables retailers and business partners to provide government and utility-related services to end customers. We value your privacy and are committed to protecting your personal information.
              </p>
            </section>

            {/* Information We Collect */}
            <section>
              <h2 className="text-xl sm:text-2xl font-bold text-slate-900 mb-4 flex items-center gap-2">
                <FileText size={20} className="text-primary-blue shrink-0" />
                Information We Collect
              </h2>
              <p className="leading-relaxed mb-4 text-sm sm:text-base">
                We may collect:
              </p>
              <ul className="grid grid-cols-1 sm:grid-cols-2 gap-3 pl-2">
                {infoCollected.map((item, idx) => (
                  <li key={idx} className="flex items-start gap-2 text-sm sm:text-base">
                    <CheckCircle2 size={16} className="text-emerald-500 mt-1 shrink-0" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </section>

            {/* How We Use Your Information */}
            <section>
              <h2 className="text-xl sm:text-2xl font-bold text-slate-900 mb-4 flex items-center gap-2">
                <ArrowRight size={20} className="text-primary-blue shrink-0" />
                How We Use Your Information
              </h2>
              <p className="leading-relaxed mb-4 text-sm sm:text-base">
                Your information is used to:
              </p>
              <ul className="grid grid-cols-1 sm:grid-cols-2 gap-3 pl-2">
                {infoUsage.map((item, idx) => (
                  <li key={idx} className="flex items-start gap-2 text-sm sm:text-base">
                    <CheckCircle2 size={16} className="text-primary-blue mt-1 shrink-0" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </section>

            {/* Document Storage */}
            <section className="border-t border-slate-100 pt-8">
              <h2 className="text-xl sm:text-2xl font-bold text-slate-900 mb-3">
                Document Storage
              </h2>
              <p className="leading-relaxed text-sm sm:text-base">
                Documents uploaded through Helping Mitra are stored securely using cloud storage infrastructure. Only authorized system administrators can access them when required for order processing.
              </p>
            </section>

            {/* Data Security */}
            <section className="border-t border-slate-100 pt-8">
              <h2 className="text-xl sm:text-2xl font-bold text-slate-900 mb-4">
                Data Security
              </h2>
              <p className="leading-relaxed mb-4 text-sm sm:text-base">
                We implement industry-standard security practices including:
              </p>
              <ul className="space-y-2.5 pl-2">
                {securityPractices.map((item, idx) => (
                  <li key={idx} className="flex items-start gap-2 text-sm sm:text-base">
                    <span className="w-1.5 h-1.5 rounded-full bg-primary-blue mt-2.5 shrink-0" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </section>

            {/* Sharing of Information */}
            <section className="border-t border-slate-100 pt-8">
              <h2 className="text-xl sm:text-2xl font-bold text-slate-900 mb-4">
                Sharing of Information
              </h2>
              <p className="leading-relaxed mb-3 text-sm sm:text-base font-semibold text-slate-800">
                We never sell your personal information.
              </p>
              <p className="leading-relaxed mb-3 text-sm sm:text-base">
                Information may only be shared:
              </p>
              <ul className="space-y-2.5 pl-2">
                {sharingInformation.map((item, idx) => (
                  <li key={idx} className="flex items-start gap-2 text-sm sm:text-base">
                    <span className="w-1.5 h-1.5 rounded-full bg-primary-blue mt-2.5 shrink-0" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </section>


          </div>

        </div>

      </main>

      <PublicFooter />
      <WhatsAppButton />
    </div>
  );
}
