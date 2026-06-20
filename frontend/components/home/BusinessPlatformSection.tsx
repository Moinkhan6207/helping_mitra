"use client";

import React, { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { 
  Network, 
  Users, 
  Briefcase, 
  Check, 
  ArrowRight, 
  Store, 
  IdCard, 
  UserCheck, 
  FileCheck, 
  Car, 
  FileText,
  Activity
} from 'lucide-react';

export const BusinessPlatformSection: React.FC = () => {
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
    {
      title: 'PAN, Voter, Samagra, Vahan & DL Services',
      description: 'Access major citizen database and utility services from a single central portal.',
    },
    {
      title: 'Retailer / Distributor Network Management',
      description: 'Easily register downline members, monitor earnings, and set custom margins.',
    },
    {
      title: 'Single Wallet & Ledger Tracking',
      description: 'Run all operations with one wallet recharge. Direct tracking with full transparency.',
    },
    {
      title: 'Fast Support & Online Status Tracking',
      description: 'Get swift answers with dedicated WhatsApp helpdesks and instant status updates.',
    },
    {
      title: 'High Growth Business Opportunity',
      description: 'Maximize retail footfall and earn consistent passive recurring commissions.',
    },
  ];

  const stats = [
    {
      value: '5000+',
      label: 'Retailers',
      description: 'Local assistance points',
      icon: Store,
    },
    {
      value: '500+',
      label: 'Distributors',
      description: 'Managing merchant groups',
      icon: Users,
    },
    {
      value: '50+',
      label: 'Master Distributors',
      description: 'Regional network leaders',
      icon: Network,
    },
    {
      value: '100,000+',
      label: 'Services Delivered',
      description: 'Seamless digital requests',
      icon: Activity,
    },
  ];

  return (
    <section 
      ref={sectionRef}
      id="platform" 
      className="relative py-12 md:py-16 bg-white border-b border-slate-200/50 overflow-hidden"
    >
      {/* Custom styles injected directly to ensure compatibility */}
      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes flow-line {
          to {
            stroke-dashoffset: -20;
          }
        }
        .animate-flow-dash {
          stroke-dasharray: 6, 4;
          animation: flow-line 1.2s linear infinite;
        }
        @keyframes float-slow {
          0%, 100% {
            transform: translateY(0px);
          }
          50% {
            transform: translateY(-6px);
          }
        }
        .animate-float-node {
          animation: float-slow 4s ease-in-out infinite;
        }
        @keyframes shimmer-infinite {
          0% {
            transform: translateX(-150%);
          }
          50% {
            transform: translateX(150%);
          }
          100% {
            transform: translateX(150%);
          }
        }
        .animate-shimmer-btn::after {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          background: linear-gradient(
            90deg,
            rgba(255, 255, 255, 0) 0%,
            rgba(255, 255, 255, 0.25) 50%,
            rgba(255, 255, 255, 0) 100%
          );
          animation: shimmer-infinite 4s infinite ease-in-out;
        }
      `}} />

      {/* Decorative glows */}
      <div className="absolute top-[20%] left-[-10%] h-[500px] w-[500px] rounded-full bg-[#145BFF]/5 blur-[120px] pointer-events-none select-none" />
      <div className="absolute bottom-[20%] right-[-10%] h-[500px] w-[500px] rounded-full bg-indigo-600/5 blur-[120px] pointer-events-none select-none" />

      <div className="relative mx-auto max-w-7xl px-6 z-10">
        
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-20">
          <span className="inline-flex items-center text-xs font-semibold uppercase tracking-wider text-[#145BFF] bg-[#145BFF]/8 px-4 py-1.5 rounded-full border border-[#145BFF]/15">
            B2B Network Opportunity
          </span>
          <h2 className="text-3xl font-extrabold text-[#0F172A] mt-5 sm:text-4xl lg:text-5xl tracking-tight">
            Business to Business Service Platform
          </h2>
          <div className="mt-4 space-y-2 max-w-2xl mx-auto">
            <p className="text-base sm:text-lg text-slate-800 font-semibold leading-relaxed">
              Helping Mitra के network से Retailer, Distributor और Master Distributor अपना Digital Service Business शुरू कर सकते हैं।
            </p>
            <p className="text-sm sm:text-base text-[#64748B] leading-relaxed">
              PAN, Voter, Samagra, Vahan, Driving Licence और Farmer Services के साथ अपना business grow करें।
            </p>
          </div>
        </div>

        {/* Main Grid: Illustration & Benefits */}
        <div className="grid gap-12 lg:grid-cols-12 lg:items-stretch mb-20">
          
          {/* Left Column: Network Hierarchy Illustration (7cols) */}
          <div className="lg:col-span-7 flex flex-col justify-center bg-slate-50/60 border border-slate-200/50 rounded-3xl p-6 sm:p-8 xl:p-10 relative overflow-hidden shadow-inner">
            {/* Visual background details */}
            <div className="absolute inset-0 bg-[radial-gradient(#e2e8f0_1px,transparent_1px)] [background-size:24px_24px] opacity-60 pointer-events-none" />
            
            <h4 className="relative text-xs font-bold uppercase tracking-wider text-slate-400 mb-8 text-center sm:text-left">
              Network Hierarchy & Distribution Flow
            </h4>

            {/* Vertical Tree Flow */}
            <div className="relative flex flex-col items-center gap-1 sm:gap-2 z-10 w-full max-w-[370px] mx-auto">
              
              {/* Level 1: Master Distributor */}
              <div className="w-full flex items-center justify-between p-4 bg-slate-900 border border-indigo-500/30 text-white rounded-2xl shadow-lg transition-transform duration-300 hover:scale-[1.02]">
                <div className="flex items-center gap-3.5">
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                    <Briefcase className="h-5 w-5" />
                  </div>
                  <div>
                    <h5 className="font-bold text-sm sm:text-base">Master Distributor</h5>
                    <p className="text-[11px] text-slate-400">High-tier commissions & network creation</p>
                  </div>
                </div>
                <span className="text-[10px] font-bold tracking-wider uppercase bg-indigo-500/20 text-indigo-300 px-2.5 py-1 rounded-md border border-indigo-500/30">
                  Lvl 1
                </span>
              </div>

              {/* Connecting Arrow 1 */}
              <svg className="h-10 w-6 text-indigo-500/50" fill="none" viewBox="0 0 24 40">
                <path d="M12 0v38" stroke="currentColor" strokeWidth="2.5" className="animate-flow-dash" />
                <path d="M7 33l5 5 5-5" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>

              {/* Level 2: Distributor */}
              <div className="w-full flex items-center justify-between p-4 bg-white border border-slate-200/80 text-slate-900 rounded-2xl shadow-sm transition-transform duration-300 hover:scale-[1.02]">
                <div className="flex items-center gap-3.5">
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-indigo-50 border border-indigo-100 text-indigo-650">
                    <Network className="h-5 w-5" />
                  </div>
                  <div>
                    <h5 className="font-bold text-sm sm:text-base text-[#0F172A]">Distributor</h5>
                    <p className="text-[11px] text-[#64748B]">Recruit & manage local merchant groups</p>
                  </div>
                </div>
                <span className="text-[10px] font-bold tracking-wider uppercase bg-indigo-50 text-indigo-650 px-2.5 py-1 rounded-md border border-indigo-100">
                  Lvl 2
                </span>
              </div>

              {/* Connecting Arrow 2 */}
              <svg className="h-10 w-6 text-indigo-500/50" fill="none" viewBox="0 0 24 40">
                <path d="M12 0v38" stroke="currentColor" strokeWidth="2.5" className="animate-flow-dash" />
                <path d="M7 33l5 5 5-5" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>

              {/* Level 3: Retailer */}
              <div className="w-full relative flex items-center justify-between p-4 bg-white border-2 border-[#145BFF] text-slate-900 rounded-2xl shadow-md transition-transform duration-300 hover:scale-[1.02]">
                <div className="flex items-center gap-3.5">
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-50 border border-blue-100 text-[#145BFF]">
                    <Store className="h-5 w-5" />
                  </div>
                  <div>
                    <h5 className="font-bold text-sm sm:text-base text-[#0F172A]">Retailer</h5>
                    <p className="text-[11px] text-[#64748B]">Provide direct citizen services locally</p>
                  </div>
                </div>
                <span className="text-[10px] font-bold tracking-wider uppercase bg-blue-50 text-[#145BFF] px-2.5 py-1 rounded-md border border-blue-100">
                  Lvl 3
                </span>
              </div>

              {/* Connecting Arrow 3 */}
              <svg className="h-10 w-6 text-blue-500/40" fill="none" viewBox="0 0 24 40">
                <path d="M12 0v38" stroke="currentColor" strokeWidth="2" className="animate-flow-dash" />
                <path d="M7 33l5 5 5-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>

              {/* Level 4: Customers */}
              <div className="w-full flex items-center justify-between p-4 bg-blue-50/50 border border-dashed border-[#145BFF]/30 text-slate-900 rounded-2xl shadow-sm">
                <div className="flex items-center gap-3.5">
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-white border border-[#145BFF]/10 text-sky-600">
                    <Users className="h-5 w-5" />
                  </div>
                  <div>
                    <h5 className="font-bold text-sm sm:text-base text-slate-800">End Customers</h5>
                    <p className="text-[11px] text-[#64748B]">Avail direct paperwork & printing</p>
                  </div>
                </div>
                <span className="text-[10px] font-bold tracking-wider uppercase bg-blue-100/60 text-[#145BFF] px-2.5 py-1 rounded-md">
                  Active
                </span>
              </div>

            </div>

            {/* Desktop-only Floating Services Badges surrounding the Retailer node */}
            <div className="hidden xl:block">
              {/* Badge 1: PAN Services */}
              <div className="absolute top-[12%] left-3 xl:left-4 2xl:left-6 animate-float-node bg-white border border-slate-150 p-2.5 rounded-xl shadow-md flex items-center gap-2 max-w-[150px]">
                <div className="h-7 w-7 rounded-lg bg-rose-50 flex items-center justify-center text-rose-600 border border-rose-100 shrink-0">
                  <IdCard className="h-4 w-4" />
                </div>
                <span className="text-[10px] font-bold text-slate-800">PAN Services</span>
              </div>
              
              {/* Badge 2: Voter Services */}
              <div className="absolute top-[46%] left-3 xl:left-4 2xl:left-6 animate-float-node bg-white border border-slate-150 p-2.5 rounded-xl shadow-md flex items-center gap-2 max-w-[150px]" style={{ animationDelay: '1.2s' }}>
                <div className="h-7 w-7 rounded-lg bg-indigo-50 flex items-center justify-center text-indigo-650 border border-indigo-100 shrink-0">
                  <UserCheck className="h-4 w-4" />
                </div>
                <span className="text-[10px] font-bold text-slate-800">Voter Card</span>
              </div>

              {/* Badge 3: Samagra Services */}
              <div className="absolute top-[28%] right-3 xl:right-4 2xl:right-6 animate-float-node bg-white border border-slate-150 p-2.5 rounded-xl shadow-md flex items-center gap-2 max-w-[150px]" style={{ animationDelay: '2.5s' }}>
                <div className="h-7 w-7 rounded-lg bg-emerald-50 flex items-center justify-center text-emerald-600 border border-emerald-100 shrink-0">
                  <FileCheck className="h-4 w-4" />
                </div>
                <span className="text-[10px] font-bold text-slate-800">Samagra ID</span>
              </div>

              {/* Badge 4: Vahan Services */}
              <div className="absolute top-[62%] right-3 xl:right-4 2xl:right-6 animate-float-node bg-white border border-slate-150 p-2.5 rounded-xl shadow-md flex items-center gap-2 max-w-[150px]" style={{ animationDelay: '0.6s' }}>
                <div className="h-7 w-7 rounded-lg bg-sky-50 flex items-center justify-center text-sky-600 border border-sky-100 shrink-0">
                  <Car className="h-4 w-4" />
                </div>
                <span className="text-[10px] font-bold text-slate-800">Vahan / RC</span>
              </div>

              {/* Badge 5: DL Services */}
              <div className="absolute top-[78%] left-6 xl:left-8 2xl:left-12 animate-float-node bg-white border border-slate-150 p-2.5 rounded-xl shadow-md flex items-center gap-2 max-w-[160px]" style={{ animationDelay: '1.8s' }}>
                <div className="h-7 w-7 rounded-lg bg-amber-50 flex items-center justify-center text-amber-600 border border-amber-100 shrink-0">
                  <FileText className="h-4 w-4" />
                </div>
                <span className="text-[10px] font-bold text-slate-800">Driving Licence</span>
              </div>
            </div>

            {/* Mobile/Tablet inline horizontal badges for services */}
            <div className="xl:hidden mt-8 pt-6 border-t border-slate-200/60">
              <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-3 text-center">
                Supported Digital Services
              </p>
              <div className="flex flex-wrap justify-center gap-2">
                {[
                  { label: 'PAN Card', icon: IdCard, bg: 'bg-rose-50 text-rose-600 border-rose-100' },
                  { label: 'Voter Card', icon: UserCheck, bg: 'bg-indigo-50 text-indigo-650 border-indigo-100' },
                  { label: 'Samagra ID', icon: FileCheck, bg: 'bg-emerald-50 text-emerald-600 border-emerald-100' },
                  { label: 'Vahan / RC', icon: Car, bg: 'bg-sky-50 text-sky-600 border-sky-100' },
                  { label: 'Driving Licence', icon: FileText, bg: 'bg-amber-50 text-amber-600 border-amber-100' },
                ].map((s) => {
                  const SIcon = s.icon;
                  return (
                    <div key={s.label} className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border bg-white shadow-xs ${s.bg}`}>
                      <SIcon className="h-3.5 w-3.5" />
                      <span className="text-[10px] font-semibold">{s.label}</span>
                    </div>
                  );
                })}
              </div>
            </div>

          </div>

          {/* Right Column: Benefits White Premium Card (5cols) */}
          <div className="lg:col-span-5 flex flex-col justify-between p-8 sm:p-10 bg-white border border-slate-150 rounded-3xl shadow-lg shadow-slate-200/40 relative">
            <div>
              <h3 className="text-2xl font-extrabold text-[#0F172A] mb-8">
                Why Join Helping Mitra?
              </h3>
              
              <ul className="flex flex-col gap-6">
                {benefits.map((bullet) => (
                  <li key={bullet.title} className="flex items-start gap-4">
                    <div className="flex h-6 w-6 items-center justify-center rounded-full bg-emerald-50 border border-emerald-100 text-[#22C55E] shrink-0 mt-0.5 shadow-xs">
                      <Check className="h-3.5 w-3.5 stroke-[3]" />
                    </div>
                    <div>
                      <h5 className="text-sm font-bold text-[#0F172A] mb-0.5">
                        {bullet.title}
                      </h5>
                      <p className="text-xs text-[#64748B] leading-relaxed">
                        {bullet.description}
                      </p>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
            
            {/* Soft accent background blob */}
            <div className="absolute top-0 right-0 w-32 h-32 rounded-bl-full bg-[#145BFF]/3 pointer-events-none select-none" />
          </div>

        </div>

        {/* Business Stats Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 mb-20">
          {stats.map((stat, idx) => {
            const StatIcon = stat.icon;
            return (
              <div 
                key={stat.label}
                style={{
                  transitionDelay: `${idx * 100}ms`,
                }}
                className={`group relative p-6 sm:p-8 bg-white/80 backdrop-blur-md border border-slate-100 rounded-3xl shadow-sm hover:shadow-xl hover:shadow-slate-200/50 hover:border-[#145BFF]/35 hover:ring-1 hover:ring-[#145BFF]/10 transition-all duration-300 ease-out overflow-hidden ${
                  isIntersected ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'
                }`}
              >
                {/* Background glow overlay */}
                <div className="absolute inset-0 rounded-3xl bg-gradient-to-br from-[#145BFF]/0 to-[#145BFF]/0 opacity-0 group-hover:opacity-100 group-hover:from-[#145BFF]/[0.02] group-hover:to-indigo-500/[0.02] transition-all duration-300 pointer-events-none" />

                <div className="flex justify-between items-start mb-5 relative z-10">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#145BFF]/6 text-[#145BFF] border border-[#145BFF]/10 transition-all duration-300 group-hover:bg-[#145BFF] group-hover:text-white group-hover:border-transparent">
                    <StatIcon className="h-5.5 w-5.5 transition-transform duration-300 group-hover:scale-110" />
                  </div>
                </div>
                
                <h4 className="relative z-10 flex items-baseline gap-0.5 font-extrabold text-3xl sm:text-4xl tracking-tight transition-transform duration-300 group-hover:scale-[1.02] w-fit">
                  <span className="bg-gradient-to-r from-blue-600 via-[#145BFF] to-indigo-600 bg-clip-text text-transparent">
                    {stat.value.replace('+', '')}
                  </span>
                  {stat.value.includes('+') && (
                    <span className="text-[#145BFF] text-2xl sm:text-3xl font-black leading-none">
                      +
                    </span>
                  )}
                </h4>
                <div className="mt-2.5 relative z-10">
                  <span className="text-[#0F172A] font-extrabold text-sm sm:text-base block tracking-tight group-hover:text-[#145BFF] transition-colors duration-300">
                    {stat.label}
                  </span>
                  <span className="text-[#64748B] text-[11px] sm:text-xs block mt-1 leading-relaxed">
                    {stat.description}
                  </span>
                </div>
              </div>
            );
          })}
        </div>

        {/* CTA Area Banner */}
        <div
          className={`relative bg-gradient-to-br from-[#0c1a30] via-[#112a52] to-[#145BFF] rounded-3xl p-10 md:p-12 shadow-2xl shadow-blue-900/30 overflow-hidden transition-all duration-700 delay-300 ${
            isIntersected ? 'opacity-100 scale-100' : 'opacity-0 scale-95'
          }`}
        >
          {/* Glowing ambient blobs */}
          <div className="absolute -top-20 -right-20 w-72 h-72 rounded-full bg-blue-400/15 blur-[80px] pointer-events-none" />
          <div className="absolute -bottom-20 -left-20 w-72 h-72 rounded-full bg-indigo-600/20 blur-[80px] pointer-events-none" />

          {/* Dot Grid Overlay */}
          <div className="absolute inset-0 pointer-events-none overflow-hidden select-none">
            <svg className="absolute inset-0 h-full w-full [mask-image:radial-gradient(100%_100%_at_top_right,white,transparent)]" fill="none">
              <defs>
                <pattern id="cta-dots" width="20" height="20" patternUnits="userSpaceOnUse" x="0" y="0">
                  <circle cx="2" cy="2" r="1" fill="white" opacity="0.06" />
                </pattern>
              </defs>
              <rect width="100%" height="100%" fill="url(#cta-dots)" />
            </svg>
          </div>

          {/* Top accent bar */}
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-400 via-indigo-400 to-sky-400 rounded-t-3xl" />

          <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-8">
            <div className="max-w-xl">
              <span className="inline-flex items-center text-[11px] font-bold uppercase tracking-widest text-blue-200 bg-white/10 border border-white/15 px-3 py-1 rounded-full mb-4">
                🚀 Join the Network
              </span>
              <h3 className="text-2xl font-extrabold text-white sm:text-3xl tracking-tight leading-tight">
                Ready to Start Your Digital Service Business?
              </h3>
              <p className="mt-3 text-sm text-blue-100/80 leading-relaxed max-w-lg">
                Join our robust network of retailers and distributors today. Start offering PAN, Voter, Samagra, Vahan, and DL services immediately.
              </p>
            </div>

            <div className="shrink-0">
              <Link href="/register">
                <span className="relative overflow-hidden inline-flex items-center gap-2.5 px-8 py-4 bg-white text-[#145BFF] font-bold text-sm rounded-xl shadow-lg shadow-black/20 hover:shadow-xl hover:bg-blue-50 hover:scale-[1.03] transition-all cursor-pointer duration-300 group">
                  <span className="flex items-center gap-2">
                    Join Now
                    <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
                  </span>
                </span>
              </Link>
            </div>
          </div>
        </div>

      </div>
    </section>
  );
};

export default BusinessPlatformSection;

