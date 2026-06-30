import React from 'react';
import type { Metadata } from 'next';
import PublicHeader from '@/components/layout/PublicHeader';
import PublicFooter from '@/components/layout/PublicFooter';
import WhatsAppButton from '@/components/layout/WhatsAppButton';
import { AlertTriangle, Calendar, Building, Clock, CreditCard, ShieldAlert, Mail, ShieldCheck } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Disclaimer | Helping Mitra',
  description: 'Helping Mitra Disclaimer. Understand our platform scope, no government affiliation policy, service availability, liability limitations, and payment terms.',
};

export default function DisclaimerPage() {
  const liabilityCauses = [
    'Incorrect user information',
    'Fake documents',
    'Government delays',
    'Network issues',
    'Third-party service interruptions'
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
            <AlertTriangle size={13} className="text-amber-500" />
            General Information
          </div>
          <h1 className="text-4xl md:text-5xl font-black text-slate-900 tracking-tight leading-tight mb-4">
            Platform{' '}
            <span className="relative text-primary-blue">
              Disclaimer
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

            {/* Overview */}
            <section className="bg-amber-50/40 border border-amber-200/40 rounded-2xl p-6 sm:p-8">
              <h2 className="text-lg font-bold text-slate-900 mb-3 flex items-center gap-2">
                <ShieldCheck size={18} className="text-amber-600 shrink-0" />
                Facilitation Platform Scope
              </h2>
              <p className="leading-relaxed text-sm sm:text-base mb-2">
                Helping Mitra is a digital service facilitation platform.
              </p>
              <p className="leading-relaxed text-sm sm:text-base">
                We assist retailers and customers in submitting applications for various government and utility-related services.
              </p>
            </section>

            {/* No Government Affiliation */}
            <section>
              <h2 className="text-xl sm:text-2xl font-bold text-slate-900 mb-3 flex items-center gap-2">
                <Building size={20} className="text-primary-blue shrink-0" />
                No Government Affiliation
              </h2>
              <p className="leading-relaxed text-sm sm:text-base font-semibold text-slate-800 bg-slate-50 border border-slate-200/60 p-4 rounded-xl">
                Helping Mitra is not a government department and is not directly affiliated with any central or state government authority unless explicitly stated.
              </p>
            </section>

            {/* Service Availability */}
            <section className="border-t border-slate-100 pt-8">
              <h2 className="text-xl sm:text-2xl font-bold text-slate-900 mb-3">
                Service Availability
              </h2>
              <p className="leading-relaxed text-sm sm:text-base">
                Services may change based on government policies, technical availability, or third-party providers.
              </p>
            </section>

            {/* Accuracy */}
            <section className="border-t border-slate-100 pt-8">
              <h2 className="text-xl sm:text-2xl font-bold text-slate-900 mb-3">
                Accuracy
              </h2>
              <p className="leading-relaxed text-sm sm:text-base">
                Users are responsible for providing accurate information and valid supporting documents.
              </p>
            </section>

            {/* Processing Time */}
            <section className="border-t border-slate-100 pt-8">
              <h2 className="text-xl sm:text-2xl font-bold text-slate-900 mb-3 flex items-center gap-2">
                <Clock size={20} className="text-primary-blue shrink-0" />
                Processing Time
              </h2>
              <p className="leading-relaxed text-sm sm:text-base">
                Estimated timelines are indicative only and may vary depending on government departments or external verification agencies.
              </p>
            </section>

            {/* Payment */}
            <section className="border-t border-slate-100 pt-8">
              <h2 className="text-xl sm:text-2xl font-bold text-slate-900 mb-3 flex items-center gap-2">
                <CreditCard size={20} className="text-primary-blue shrink-0" />
                Payment
              </h2>
              <p className="leading-relaxed text-sm sm:text-base mb-2">
                Service fees cover application processing and platform services.
              </p>
              <p className="leading-relaxed text-sm sm:text-base">
                Approval or rejection ultimately depends on the concerned authority.
              </p>
            </section>

            {/* Liability */}
            <section className="border-t border-slate-100 pt-8">
              <h2 className="text-xl sm:text-2xl font-bold text-slate-900 mb-4 flex items-center gap-2">
                <ShieldAlert size={20} className="text-red-500 shrink-0" />
                Liability
              </h2>
              <p className="leading-relaxed mb-4 text-sm sm:text-base">
                Helping Mitra shall not be responsible for losses caused by:
              </p>
              <ul className="space-y-2.5 pl-2">
                {liabilityCauses.map((item, idx) => (
                  <li key={idx} className="flex items-start gap-2 text-sm sm:text-base">
                    <span className="w-1.5 h-1.5 rounded-full bg-red-500 mt-2.5 shrink-0" />
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
