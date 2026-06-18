"use client";

import React, { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { 
  Zap, 
  Wallet, 
  TrendingUp, 
  Check, 
  ArrowRight, 
  Users, 
  Fingerprint, 
  IdCard, 
  IndianRupee 
} from 'lucide-react';

export const HighlightServiceSection: React.FC = () => {
  const [isIntersected, setIsIntersected] = useState(false);
  const sectionRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsIntersected(true);
          observer.unobserve(entry.target);
        }
      },
      {
        threshold: 0.05,
      }
    );

    if (sectionRef.current) {
      observer.observe(sectionRef.current);
    }

    return () => {
      if (sectionRef.current) {
        observer.unobserve(sectionRef.current);
      }
    };
  }, []);

  const benefits = [
    'Fast PAN Retrieval',
    'Extra Income Opportunity',
    'High Daily Demand',
    'Wallet Based Processing',
    'Instant Customer Support',
    'No Complex Documentation',
  ];

  const features = [
    {
      title: 'Fast Process',
      description: 'Customer PAN details seconds में retrieve करें।',
      icon: Zap,
    },
    {
      title: 'Wallet Based',
      description: 'Unified wallet से direct service usage.',
      icon: Wallet,
    },
    {
      title: 'High Demand',
      description: 'Lost PAN users के लिए high-frequency service.',
      icon: TrendingUp,
    },
  ];

  return (
    <section 
      ref={sectionRef}
      className="py-20 bg-slate-50 border-y border-slate-200/50 relative overflow-hidden"
    >
      {/* Decorative dot style wrapper */}
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        
        {/* Rounded Callout Gradient Container */}
        <div 
          className={`relative bg-gradient-to-br from-[#0F172A] via-[#1E3A8A] to-[#145BFF] rounded-[2rem] p-8 md:p-16 shadow-2xl overflow-hidden transition-all duration-700 ${
            isIntersected ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
          }`}
        >
          {/* Subtle Background Artworks */}
          <div className="absolute inset-0 bg-[radial-gradient(#ffffff_1px,transparent_1px)] [background-size:20px_20px] opacity-5 pointer-events-none" />
          <div className="absolute top-[-20%] right-[-10%] w-96 h-96 rounded-full bg-[#145BFF]/10 blur-[90px] pointer-events-none" />
          <div className="absolute bottom-[-20%] left-[-10%] w-96 h-96 rounded-full bg-indigo-500/10 blur-[90px] pointer-events-none" />

          {/* Grid Layout: Left Content & Right Illustration */}
          <div className="relative z-10 grid gap-12 lg:grid-cols-12 items-center">
            
            {/* Left Column (7cols) */}
            <div className="lg:col-span-7 flex flex-col gap-6 text-white">
              
              {/* Badge */}
              <div>
                <span className="inline-flex items-center text-xs font-bold bg-white/10 text-amber-300 border border-white/15 px-4 py-1.5 rounded-full uppercase tracking-wider">
                  🔥 High Demand Service
                </span>
              </div>

              {/* Headings */}
              <div>
                <h2 className="text-3xl font-extrabold sm:text-4xl lg:text-5xl tracking-tight leading-tight text-white animate-fade-in">
                  PAN Find Service
                </h2>
                
                {/* Bilingual Subheadings */}
                <div className="mt-5 space-y-2.5 max-w-xl">
                  <p className="text-base sm:text-lg font-bold text-white leading-relaxed">
                    Retailers के लिए PAN Find Service add करें और अपने portal पर extra earning opportunity बनाएं।
                  </p>
                  <p className="text-sm sm:text-base text-blue-100/90 font-medium leading-relaxed">
                    Lost PAN customers को instant support दें और हर search से additional revenue generate करें।
                  </p>
                </div>
              </div>

              {/* Benefits Checklist Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 my-3">
                {benefits.map((benefit) => (
                  <div key={benefit} className="flex items-center gap-3">
                    <div className="flex h-5 w-5 items-center justify-center rounded-full bg-[#22C55E]/20 border border-[#22C55E]/30 text-[#22C55E] shrink-0 shadow-sm">
                      <Check className="h-3 w-3 stroke-[3.5]" />
                    </div>
                    <span className="text-xs sm:text-sm font-bold text-slate-100">
                      {benefit}
                    </span>
                  </div>
                ))}
              </div>

              {/* 3 Premium Feature Cards */}
              <div className="grid gap-4 grid-cols-1 sm:grid-cols-3 mt-4">
                {features.map((feat) => {
                  const FeatIcon = feat.icon;
                  return (
                    <div 
                      key={feat.title} 
                      className="group p-5 bg-white/8 backdrop-blur-md border border-white/10 rounded-2xl transition-all duration-300 hover:-translate-y-1.5 hover:bg-white/12"
                    >
                      <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/10 text-blue-300 border border-white/10 mb-3.5 group-hover:bg-[#145BFF] group-hover:text-white group-hover:border-transparent transition-all duration-300">
                        <FeatIcon className="h-4.5 w-4.5" />
                      </div>
                      <h4 className="font-bold text-xs sm:text-sm text-white mb-1">
                        {feat.title}
                      </h4>
                      <p className="text-[11px] sm:text-xs text-slate-200 leading-relaxed font-medium">
                        {feat.description}
                      </p>
                    </div>
                  );
                })}
              </div>

              {/* CTA Buttons Row */}
              <div className="mt-6">
                <p className="text-sm sm:text-base font-extrabold text-white tracking-wide mb-3">
                  Start Earning With PAN Find Service
                </p>
                
                <div className="flex flex-wrap gap-4 items-center">
                  <Link href="/login">
                    <span className="relative overflow-hidden inline-flex items-center gap-2 px-6 py-3.5 bg-gradient-to-r from-[#145BFF] to-blue-600 text-white text-xs sm:text-sm font-bold rounded-xl shadow-lg shadow-blue-500/20 hover:shadow-xl hover:shadow-blue-500/30 hover:scale-[1.02] cursor-pointer transition-all duration-300 group">
                      Start PAN Find Service
                      <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
                    </span>
                  </Link>

                  <Link href="/register">
                    <span className="inline-flex items-center px-6 py-3.5 bg-white/8 hover:bg-white/12 text-white border border-white/15 text-xs sm:text-sm font-bold rounded-xl transition-all duration-300 hover:scale-[1.02] cursor-pointer">
                      Create Account
                    </span>
                  </Link>
                </div>
              </div>

              {/* Trust Indicators */}
              <div className="flex flex-wrap gap-x-6 gap-y-2 mt-4 pt-4 border-t border-white/10 text-xs font-bold text-slate-200">
                <span>✓ Wallet Based</span>
                <span>✓ Fast Processing</span>
                <span>✓ Retailer Friendly</span>
                <span>✓ High Success Rate</span>
              </div>

            </div>

            {/* Right Column: Flow Chart Illustration (5cols) */}
            <div className="lg:col-span-5 flex flex-col justify-center">
              
              {/* Illustration Card Container */}
              <div className="flex flex-col justify-center bg-white/5 border border-white/10 backdrop-blur-sm rounded-3xl p-6 sm:p-8 relative overflow-hidden shadow-2xl">
                {/* SVG background grid mask */}
                <div className="absolute inset-0 bg-[radial-gradient(#ffffff_1px,transparent_1px)] [background-size:20px_20px] opacity-10 pointer-events-none" />
                
                <h4 className="relative text-xs font-bold uppercase tracking-wider text-slate-200 mb-6 text-center z-10">
                  Service Delivery & Earning Process
                </h4>
                
                <div className="relative flex flex-col items-center gap-1 z-10 w-full max-w-sm mx-auto">
                  
                  {/* Step 1: Customer */}
                  <div className="w-full flex items-center gap-3.5 p-3.5 bg-white/8 border border-white/10 backdrop-blur-sm rounded-xl transition-transform duration-300 hover:scale-[1.02] hover:bg-white/12">
                    <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-rose-500/10 text-rose-300 border border-rose-500/20 shrink-0">
                      <Users className="h-4.5 w-4.5" />
                    </div>
                    <div>
                      <h5 className="font-bold text-xs sm:text-sm text-white">1. Lost PAN Customer</h5>
                      <p className="text-[10px] sm:text-xs text-slate-200">Customer requests lost PAN search</p>
                    </div>
                  </div>
                  
                  {/* Connector Arrow 1 */}
                  <svg className="h-8 w-5 text-indigo-400/40" fill="none" viewBox="0 0 24 40">
                    <path d="M12 0v38" stroke="currentColor" strokeWidth="2" strokeDasharray="5 3" className="animate-flow-dash" />
                  </svg>
                  
                  {/* Step 2: Verification */}
                  <div className="w-full flex items-center gap-3.5 p-3.5 bg-white/8 border border-white/10 backdrop-blur-sm rounded-xl transition-transform duration-300 hover:scale-[1.02] hover:bg-white/12">
                    <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-indigo-500/10 text-indigo-350 border border-indigo-500/20 shrink-0">
                      <Fingerprint className="h-4.5 w-4.5" />
                    </div>
                    <div>
                      <h5 className="font-bold text-xs sm:text-sm text-white">2. Aadhaar Verification</h5>
                      <p className="text-[10px] sm:text-xs text-slate-200">Validate queries with secure consent</p>
                    </div>
                  </div>
                  
                  {/* Connector Arrow 2 */}
                  <svg className="h-8 w-5 text-indigo-400/40" fill="none" viewBox="0 0 24 40">
                    <path d="M12 0v38" stroke="currentColor" strokeWidth="2" strokeDasharray="5 3" className="animate-flow-dash" />
                  </svg>
                  
                  {/* Step 3: Retrieval */}
                  <div className="w-full flex items-center gap-3.5 p-3.5 bg-white/8 border border-white/10 backdrop-blur-sm rounded-xl transition-transform duration-300 hover:scale-[1.02] hover:bg-white/12">
                    <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-sky-500/10 text-sky-350 border border-sky-500/20 shrink-0">
                      <IdCard className="h-4.5 w-4.5" />
                    </div>
                    <div>
                      <h5 className="font-bold text-xs sm:text-sm text-white">3. PAN Number Retrieval</h5>
                      <p className="text-[10px] sm:text-xs text-slate-200">Data retrieved from government databases</p>
                    </div>
                  </div>
                  
                  {/* Connector Arrow 3 */}
                  <svg className="h-8 w-5 text-emerald-400/40" fill="none" viewBox="0 0 24 40">
                    <path d="M12 0v38" stroke="currentColor" strokeWidth="2" strokeDasharray="5 3" className="animate-flow-dash" />
                  </svg>
                  
                  {/* Step 4: Earnings */}
                  <div className="w-full flex items-center gap-3.5 p-3.5 bg-emerald-500/10 border border-emerald-500/25 backdrop-blur-sm rounded-xl transition-transform duration-300 hover:scale-[1.02]">
                    <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-500/20 text-emerald-350 border border-emerald-500/30 shrink-0">
                      <IndianRupee className="h-4.5 w-4.5" />
                    </div>
                    <div>
                      <h5 className="font-bold text-xs sm:text-sm text-emerald-300">4. Retailer Revenue Earned</h5>
                      <p className="text-[10px] sm:text-xs text-emerald-100">Instant commission credit to wallet</p>
                    </div>
                  </div>

                </div>
              </div>

            </div>

          </div>

        </div>

      </div>
    </section>
  );
};

export default HighlightServiceSection;
