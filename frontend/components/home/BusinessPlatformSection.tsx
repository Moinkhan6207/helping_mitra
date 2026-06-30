"use client";

import React, { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { 
  Target, 
  Eye, 
  Globe, 
  Network, 
  Wallet, 
  ClipboardCheck, 
  Lock, 
  BarChart3, 
  ArrowRight,
  TrendingUp,
  Award,
  Zap,
  Activity,
  ChevronRight
} from 'lucide-react';

interface StatCardProps {
  value: string;
  label: string;
  detail: string;
}

export const StatCard: React.FC<StatCardProps> = ({ value, label, detail }) => {
  return (
    <div className="relative overflow-hidden bg-slate-50/50 border border-slate-200/60 hover:border-primary-blue/35 rounded-3xl p-6 sm:p-8 text-center transition-all duration-300 hover:shadow-xl hover:shadow-slate-100 hover:-translate-y-1 group">
      {/* Subtle interior glow */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary-blue/[0.01] to-indigo-500/[0.01] opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
      
      <div className="text-4xl sm:text-5xl font-black bg-gradient-to-r from-primary-blue via-blue-600 to-indigo-600 bg-clip-text text-transparent mb-2.5 tracking-tight transition-transform duration-300 group-hover:scale-105">
        {value}
      </div>
      <div className="text-sm sm:text-base font-extrabold text-slate-900 mb-1 tracking-tight">
        {label}
      </div>
      <div className="text-[11px] sm:text-xs text-slate-500 leading-normal">
        {detail}
      </div>
    </div>
  );
};

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

  const features = [
    {
      title: '50+ Digital Government Services',
      description: 'Access multiple citizen services from one platform.',
      icon: Globe,
      color: 'text-primary-blue',
      bg: 'bg-blue-50 border-blue-100/60'
    },
    {
      title: 'Multi-Level Business Network',
      description: 'Retailer → Distributor → Master Distributor hierarchy with complete management.',
      icon: Network,
      color: 'text-indigo-600',
      bg: 'bg-indigo-50 border-indigo-100/60'
    },
    {
      title: 'Smart Wallet System',
      description: 'Instant wallet recharge, secure payments, transaction history and ledger.',
      icon: Wallet,
      color: 'text-emerald-600',
      bg: 'bg-emerald-50 border-emerald-100/60'
    },
    {
      title: 'Order Tracking & Management',
      description: 'Track every application from submission to completion with real-time status.',
      icon: ClipboardCheck,
      color: 'text-amber-600',
      bg: 'bg-amber-50 border-amber-100/60'
    },
    {
      title: 'Secure Document Storage',
      description: 'Encrypted cloud storage with role-based access and audit logs.',
      icon: Lock,
      color: 'text-rose-600',
      bg: 'bg-rose-50 border-rose-100/60'
    },
    {
      title: 'Business Analytics Dashboard',
      description: 'Monitor revenue, commissions, orders and business growth from a single dashboard.',
      icon: BarChart3,
      color: 'text-violet-600',
      bg: 'bg-violet-50 border-violet-100/60'
    }
  ];

  const stats = [
    { value: '50+', label: 'Digital Services', detail: 'Covering essential citizen portals' },
    { value: '1000+', label: 'Retailers', detail: 'Operating nationwide centers' },
    { value: '5000+', label: 'Orders', detail: 'Processed securely online' },
    { value: '99.9%', label: 'Platform Availability', detail: 'Highest system uptime guarantee' }
  ];

  // Helper function to handle internal hash link clicking smoothly
  const handleContactClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault();
    const contactEl = document.getElementById('contact');
    if (contactEl) {
      contactEl.scrollIntoView({ behavior: 'smooth' });
      window.history.pushState(null, '', '#contact');
    }
  };

  return (
    <section 
      ref={sectionRef}
      id="platform" 
      className="relative py-20 md:py-28 bg-white border-b border-slate-200/50 overflow-hidden"
    >
      {/* Decorative Glows */}
      <div className="absolute top-[10%] left-[-15%] h-[600px] w-[600px] rounded-full bg-primary-blue/5 blur-[140px] pointer-events-none select-none" />
      <div className="absolute bottom-[10%] right-[-15%] h-[600px] w-[600px] rounded-full bg-indigo-600/5 blur-[140px] pointer-events-none select-none" />

      <div className="relative mx-auto max-w-7xl px-6 z-10">
        
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-16 md:mb-20">
          <span className="inline-flex items-center text-xs font-bold uppercase tracking-wider text-primary-blue bg-primary-blue/8 px-4 py-1.5 rounded-full border border-primary-blue/15">
            ABOUT HELPING MITRA
          </span>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black text-slate-900 mt-5 tracking-tight leading-tight">
            India’s Trusted Digital Service Platform for Retailers & Business Partners
          </h2>
          <div className="mt-6 text-slate-650 leading-relaxed text-sm sm:text-base space-y-4 font-medium">
            <p>
              Helping Mitra is a modern Digital Service Platform designed to empower retailers, distributors, and master distributors across India.
            </p>
            <p>
              Through one secure platform, users can provide PAN, Voter, Samagra, Driving Licence, Vahan, Farmer Services, and many other digital government services while managing customers, wallet, orders, and business efficiently.
            </p>
          </div>
        </div>

        {/* Mission & Vision Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-20">
          
          {/* Mission Card */}
          <div className="relative overflow-hidden bg-slate-50 border border-slate-200/80 rounded-3xl p-8 sm:p-10 shadow-sm transition-all duration-300 hover:shadow-md hover:border-primary-blue/20 flex flex-col sm:flex-row gap-6">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-tr from-primary-blue to-blue-500 text-white shadow-md shadow-primary-blue/15">
              <Target className="h-7 w-7" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-slate-900 mb-3">Our Mission</h3>
              <p className="text-slate-600 leading-relaxed text-sm sm:text-base">
                To build India’s most trusted digital service ecosystem by enabling every retailer to deliver secure, transparent, and technology-driven citizen services.
              </p>
            </div>
          </div>

          {/* Vision Card */}
          <div className="relative overflow-hidden bg-slate-50 border border-slate-200/80 rounded-3xl p-8 sm:p-10 shadow-sm transition-all duration-300 hover:shadow-md hover:border-indigo-650/20 flex flex-col sm:flex-row gap-6">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-tr from-indigo-600 to-violet-600 text-white shadow-md shadow-indigo-600/15">
              <Eye className="h-7 w-7" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-slate-900 mb-3">Our Vision</h3>
              <p className="text-slate-600 leading-relaxed text-sm sm:text-base">
                To create a nationwide network where every retailer can become a reliable Digital Service Center using one powerful platform.
              </p>
            </div>
          </div>

        </div>

        {/* Feature Grid Section Title */}
        <div className="text-center max-w-2xl mx-auto mb-12">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 bg-blue-50/50 border border-blue-100 rounded-full text-xs font-bold text-primary-blue shadow-xs">
            <Zap size={12} />
            Capabilities & Benefits
          </div>
          <h3 className="text-2xl sm:text-3xl font-extrabold text-slate-900 mt-4 tracking-tight">
            Key Features of Our Platform
          </h3>
        </div>

        {/* Feature Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 mb-24">
          {features.map((feature, idx) => {
            const FeatureIcon = feature.icon;
            return (
              <div 
                key={feature.title}
                style={{ transitionDelay: `${idx * 80}ms` }}
                className={`group relative p-8 bg-white border border-slate-200/60 rounded-3xl shadow-sm hover:shadow-xl hover:shadow-slate-100/80 hover:border-primary-blue/25 transition-all duration-300 hover:-translate-y-1 flex flex-col justify-between ${
                  isIntersected ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'
                }`}
              >
                <div>
                  <div className={`inline-flex h-12 w-12 items-center justify-center rounded-xl border mb-6 transition-all duration-300 group-hover:scale-110 ${feature.bg} ${feature.color}`}>
                    <FeatureIcon className="h-5.5 w-5.5" />
                  </div>
                  <h4 className="text-lg font-bold text-slate-900 mb-3 group-hover:text-primary-blue transition-colors duration-300">
                    {feature.title}
                  </h4>
                  <p className="text-sm text-slate-500 leading-relaxed">
                    {feature.description}
                  </p>
                </div>
              </div>
            );
          })}
        </div>

        {/* Statistics Section Title */}
        <div className="text-center max-w-2xl mx-auto mb-12">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 bg-emerald-50 border border-emerald-100 rounded-full text-xs font-bold text-emerald-600 shadow-xs">
            <Activity size={12} />
            Growing Every Day
          </div>
          <h3 className="text-2xl sm:text-3xl font-extrabold text-slate-900 mt-4 tracking-tight">
            Platform Metrics in Real Time
          </h3>
        </div>

        {/* Statistics Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 mb-24">
          {stats.map((stat) => (
            <StatCard 
              key={stat.label} 
              value={stat.value} 
              label={stat.label} 
              detail={stat.detail} 
            />
          ))}
        </div>

        {/* CTA Area Banner */}
        <div
          className={`relative bg-gradient-to-br from-slate-900 via-slate-800 to-primary-blue rounded-3xl p-10 md:p-14 shadow-2xl shadow-blue-900/10 overflow-hidden transition-all duration-700 ease-out ${
            isIntersected ? 'opacity-100 scale-100' : 'opacity-0 scale-95'
          }`}
        >
          {/* Decorative glowing blobs */}
          <div className="absolute -top-20 -right-20 w-72 h-72 rounded-full bg-blue-400/10 blur-[80px] pointer-events-none" />
          <div className="absolute -bottom-20 -left-20 w-72 h-72 rounded-full bg-primary-blue/20 blur-[80px] pointer-events-none" />

          {/* Pattern overlay */}
          <div className="absolute inset-0 pointer-events-none overflow-hidden select-none">
            <svg className="absolute inset-0 h-full w-full opacity-5" fill="none">
              <defs>
                <pattern id="cta-dots" width="20" height="20" patternUnits="userSpaceOnUse">
                  <circle cx="2" cy="2" r="1" fill="white" />
                </pattern>
              </defs>
              <rect width="100%" height="100%" fill="url(#cta-dots)" />
            </svg>
          </div>

          <div className="relative z-10 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-10">
            <div className="max-w-xl">
              <span className="inline-flex items-center text-[10px] font-extrabold uppercase tracking-widest text-blue-200 bg-white/10 border border-white/10 px-3.5 py-1 rounded-full mb-4">
                🚀 JOIN THE NETWORK
              </span>
              <h3 className="text-2xl font-black text-white sm:text-3xl tracking-tight leading-tight">
                Ready to Start Your Digital Service Business?
              </h3>
              <p className="mt-3 text-sm sm:text-base text-blue-100/80 leading-relaxed font-medium">
                Join Helping Mitra today and grow your business with India’s trusted digital service platform.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 shrink-0">
              <Link 
                href="/register"
                className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-white text-primary-blue hover:bg-blue-50 font-bold text-sm rounded-xl shadow-lg transition-all duration-200 active:scale-95 cursor-pointer"
              >
                Create Account
                <ArrowRight className="h-4 w-4" />
              </Link>
              <a 
                href="#contact"
                onClick={handleContactClick}
                className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-white/10 border border-white/15 text-white hover:bg-white/15 font-bold text-sm rounded-xl transition-all duration-200 active:scale-95 cursor-pointer"
              >
                Contact Us
                <ChevronRight className="h-4 w-4" />
              </a>
            </div>
          </div>
        </div>

      </div>
    </section>
  );
};

export default BusinessPlatformSection;
