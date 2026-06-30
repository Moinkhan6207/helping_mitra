import React from 'react';
import type { Metadata } from 'next';
import PublicHeader from '@/components/layout/PublicHeader';
import PublicFooter from '@/components/layout/PublicFooter';
import WhatsAppButton from '@/components/layout/WhatsAppButton';
import { Scale, Calendar, ShieldAlert, Wallet, HelpCircle, FileCheck, Landmark } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Terms of Service | Helping Mitra',
  description: 'Helping Mitra Terms of Service. Read the rules, guidelines, eligibility, and legal terms for operating retailer accounts on our digital service platform.',
};

export default function TermsOfServicePage() {
  const accountResponsibilities = [
    'Maintaining account security',
    'Protecting passwords',
    'All activities performed through their account'
  ];

  const prohibitedActivities = [
    'Upload malicious files',
    'Attempt unauthorized access',
    'Misuse the platform',
    'Commit fraud',
    'Abuse wallet features'
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
            <Scale size={13} className="text-primary-blue" />
            Terms & Conditions
          </div>
          <h1 className="text-4xl md:text-5xl font-black text-slate-900 tracking-tight leading-tight mb-4">
            Terms of{' '}
            <span className="relative text-primary-blue">
              Service
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
                <HelpCircle size={18} className="text-primary-blue shrink-0" />
                Agreement to Terms
              </h2>
              <p className="leading-relaxed text-sm sm:text-base">
                Welcome to Helping Mitra. By accessing or using Helping Mitra, you agree to these Terms of Service.
              </p>
            </section>

            {/* Eligibility */}
            <section>
              <h2 className="text-xl sm:text-2xl font-bold text-slate-900 mb-3">
                Eligibility
              </h2>
              <p className="leading-relaxed text-sm sm:text-base">
                Users must be legally eligible to operate a retailer account.
              </p>
            </section>

            {/* Account Responsibility */}
            <section className="border-t border-slate-100 pt-8">
              <h2 className="text-xl sm:text-2xl font-bold text-slate-900 mb-4">
                Account Responsibility
              </h2>
              <p className="leading-relaxed mb-4 text-sm sm:text-base">
                Users are responsible for:
              </p>
              <ul className="space-y-2.5 pl-2">
                {accountResponsibilities.map((item, idx) => (
                  <li key={idx} className="flex items-start gap-2 text-sm sm:text-base">
                    <span className="w-1.5 h-1.5 rounded-full bg-primary-blue mt-2.5 shrink-0" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </section>

            {/* Wallet Usage */}
            <section className="border-t border-slate-100 pt-8">
              <h2 className="text-xl sm:text-2xl font-bold text-slate-900 mb-3 flex items-center gap-2">
                <Wallet size={20} className="text-primary-blue shrink-0" />
                Wallet Usage
              </h2>
              <p className="leading-relaxed text-sm sm:text-base">
                Wallet balance can only be used for services available on Helping Mitra. Wallet recharges are subject to verification before credit.
              </p>
            </section>

            {/* Service Applications */}
            <section className="border-t border-slate-100 pt-8">
              <h2 className="text-xl sm:text-2xl font-bold text-slate-900 mb-3">
                Service Applications
              </h2>
              <p className="leading-relaxed text-sm sm:text-base">
                Users must submit accurate information. Providing false documents or incorrect details may result in rejection or suspension.
              </p>
            </section>

            {/* Document Upload */}
            <section className="border-t border-slate-100 pt-8">
              <h2 className="text-xl sm:text-2xl font-bold text-slate-900 mb-3 flex items-center gap-2">
                <FileCheck size={20} className="text-primary-blue shrink-0" />
                Document Upload
              </h2>
              <p className="leading-relaxed text-sm sm:text-base">
                Only genuine documents should be uploaded. Uploading fake, forged, or illegal documents may lead to permanent account termination.
              </p>
            </section>

            {/* Payments */}
            <section className="border-t border-slate-100 pt-8">
              <h2 className="text-xl sm:text-2xl font-bold text-slate-900 mb-3">
                Payments
              </h2>
              <p className="leading-relaxed text-sm sm:text-base">
                Service fees are displayed before submission. Payment confirmation does not guarantee approval of government services.
              </p>
            </section>

            {/* Order Processing */}
            <section className="border-t border-slate-100 pt-8">
              <h2 className="text-xl sm:text-2xl font-bold text-slate-900 mb-3">
                Order Processing
              </h2>
              <p className="leading-relaxed text-sm sm:text-base">
                Helping Mitra processes service requests through authorized workflows. Processing time depends on service type and external departments.
              </p>
            </section>

            {/* Prohibited Activities */}
            <section className="border-t border-slate-100 pt-8">
              <h2 className="text-xl sm:text-2xl font-bold text-slate-900 mb-4 flex items-center gap-2">
                <ShieldAlert size={20} className="text-red-500 shrink-0" />
                Prohibited Activities
              </h2>
              <p className="leading-relaxed mb-4 text-sm sm:text-base">
                Users must not:
              </p>
              <ul className="space-y-2.5 pl-2">
                {prohibitedActivities.map((item, idx) => (
                  <li key={idx} className="flex items-start gap-2 text-sm sm:text-base">
                    <span className="w-1.5 h-1.5 rounded-full bg-red-500 mt-2.5 shrink-0" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </section>

            {/* Suspension */}
            <section className="border-t border-slate-100 pt-8">
              <h2 className="text-xl sm:text-2xl font-bold text-slate-900 mb-3">
                Suspension
              </h2>
              <p className="leading-relaxed text-sm sm:text-base">
                Helping Mitra reserves the right to suspend or terminate accounts violating these terms.
              </p>
            </section>

            {/* Limitation of Liability */}
            <section className="border-t border-slate-100 pt-8">
              <h2 className="text-xl sm:text-2xl font-bold text-slate-900 mb-3">
                Limitation of Liability
              </h2>
              <p className="leading-relaxed text-sm sm:text-base">
                Helping Mitra is a facilitation platform and is not responsible for delays caused by government departments or external agencies.
              </p>
            </section>

            {/* Governing Law */}
            <section className="border-t border-slate-100 pt-8">
              <h2 className="text-xl sm:text-2xl font-bold text-slate-900 mb-3 flex items-center gap-2">
                <Landmark size={20} className="text-primary-blue shrink-0" />
                Governing Law
              </h2>
              <p className="leading-relaxed text-sm sm:text-base">
                These Terms shall be governed by the laws of India.
              </p>
            </section>

          </div>

        </div>

      </main>

      <PublicFooter />
      <WhatsAppButton />
    </div>
  );
}
