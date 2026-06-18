"use client";

import React, { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { 
  IdCard, 
  UserCheck, 
  FileCheck, 
  Car, 
  FileText, 
  Sprout, 
  ArrowRight, 
  Activity, 
  Users, 
  Store 
} from 'lucide-react';

export const PopularServicesSection: React.FC = () => {
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

  const stats = [
    { label: 'Services Processed', value: '100K+', icon: Activity },
    { label: 'Retailers Joined', value: '5000+', icon: Store },
    { label: 'Distributors Joined', value: '500+', icon: Users },
  ];

  const popularServices = [
    { 
      name: 'PAN Services', 
      desc: 'Apply, correction, update and PAN retrieval services for customers.', 
      icon: IdCard,
      badge: '🔥 High Demand',
      badgeClass: 'bg-rose-50 text-rose-600 border-rose-100/80',
      iconClass: 'bg-rose-50 text-rose-600 border-rose-100',
    },
    { 
      name: 'Voter Services', 
      desc: 'Voter registration, updates and verification services.', 
      icon: UserCheck,
      badge: '⭐ Popular',
      badgeClass: 'bg-indigo-50 text-indigo-650 border-indigo-100/80',
      iconClass: 'bg-indigo-50 text-indigo-650 border-indigo-100',
    },
    { 
      name: 'Samagra Services', 
      desc: 'Samagra profile management and family ID related services.', 
      icon: FileCheck,
      badge: '📈 Growing Service',
      badgeClass: 'bg-emerald-50 text-emerald-600 border-emerald-100/80',
      iconClass: 'bg-emerald-50 text-emerald-600 border-emerald-100',
    },
    { 
      name: 'Vahan Services', 
      desc: 'Vehicle verification, RC services and transport records.', 
      icon: Car,
      badge: '🔥 High Demand',
      badgeClass: 'bg-sky-50 text-sky-650 border-sky-100/80',
      iconClass: 'bg-sky-50 text-sky-650 border-sky-100',
    },
    { 
      name: 'Driving Licence Services', 
      desc: 'Licence verification, renewal and application support.', 
      icon: FileText,
      badge: '⭐ Popular',
      badgeClass: 'bg-amber-50 text-amber-600 border-amber-100/80',
      iconClass: 'bg-amber-50 text-amber-600 border-amber-100',
    },
    { 
      name: 'Farmer Services', 
      desc: 'Farmer registrations, KCC and agriculture scheme support.', 
      icon: Sprout,
      badge: '💰 Good Margin',
      badgeClass: 'bg-violet-50 text-violet-650 border-violet-100/80',
      iconClass: 'bg-violet-50 text-violet-650 border-violet-100',
    },
  ];

  return (
    <section 
      ref={sectionRef}
      id="popular-services"
      className="py-24 bg-gradient-to-b from-[#F8FBFF] to-white border-b border-slate-200/50"
    >
      <div className="mx-auto max-w-7xl px-6">
        
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <span className="inline-flex items-center text-xs font-semibold uppercase tracking-wider text-[#145BFF] bg-[#145BFF]/8 px-4 py-1.5 rounded-full border border-[#145BFF]/15 animate-fade-in">
            Grow Your Business
          </span>
          <h2 className="text-3xl font-extrabold text-[#0F172A] mt-5 sm:text-4xl lg:text-5xl tracking-tight">
            Grow Your Business
          </h2>
          <div className="mt-4 space-y-2 max-w-2xl mx-auto">
            <p className="text-base sm:text-lg text-slate-800 font-semibold leading-relaxed">
              High demand services for Retailers, Distributors, and Master Distributors.
            </p>
            <p className="text-sm sm:text-base text-[#64748B] leading-relaxed">
              Expand your digital service portfolio and increase monthly earnings.
            </p>
          </div>
        </div>

        {/* Horizontal Stats Strip */}
        <div 
          className={`bg-white border border-slate-150/80 rounded-2xl p-4 sm:p-5 max-w-3xl mx-auto grid grid-cols-3 divide-x divide-slate-100 shadow-sm shadow-slate-100 text-center mb-16 transition-all duration-700 ${
            isIntersected ? 'opacity-100 scale-100' : 'opacity-0 scale-95'
          }`}
        >
          {stats.map((stat) => {
            const StatIcon = stat.icon;
            return (
              <div key={stat.label} className="px-4 flex flex-col justify-center items-center">
                <div className="flex items-center gap-1.5 sm:gap-2">
                  <StatIcon className="h-4 w-4 text-[#145BFF]" />
                  <span className="text-[#0F172A] font-extrabold text-lg sm:text-2xl tracking-tight">
                    {stat.value}
                  </span>
                </div>
                <span className="text-[10px] sm:text-xs font-bold text-[#64748B] uppercase tracking-wider mt-1">
                  {stat.label}
                </span>
              </div>
            );
          })}
        </div>

        {/* Popular Grid */}
        <div className="grid gap-8 grid-cols-1 md:grid-cols-2 lg:grid-cols-2 mb-16">
          {popularServices.map((service, index) => {
            const Icon = service.icon;
            return (
              <div 
                key={service.name} 
                style={{
                  transitionDelay: `${index * 80}ms`,
                }}
                className={`group relative p-6 sm:p-8 bg-white border border-slate-150 rounded-3xl shadow-sm hover:shadow-xl hover:shadow-slate-200/40 hover:border-[#145BFF]/30 transition-all duration-500 ease-out flex flex-col sm:flex-row gap-5 sm:gap-6 ${
                  isIntersected ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'
                }`}
              >
                {/* Large Icon Box */}
                <div className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl border transition-all duration-300 group-hover:scale-110 ${service.iconClass}`}>
                  <Icon className="h-6 w-6" />
                </div>
                
                {/* Content details */}
                <div className="flex-grow flex flex-col justify-between">
                  <div>
                    {/* Header line with Name & Badge */}
                    <div className="flex items-start justify-between gap-3 mb-2">
                      <h4 className="font-extrabold text-[#0F172A] text-base sm:text-lg tracking-tight group-hover:text-[#145BFF] transition-colors duration-300">
                        {service.name}
                      </h4>
                      <span className={`text-[10px] font-bold px-2.5 py-1 rounded-md border shrink-0 uppercase tracking-wider ${service.badgeClass}`}>
                        {service.badge}
                      </span>
                    </div>
                    
                    {/* Description */}
                    <p className="text-xs sm:text-sm text-[#64748B] leading-relaxed pr-2">
                      {service.desc}
                    </p>
                  </div>

                  {/* Explore Service CTA */}
                  <div className="mt-4 flex items-center text-xs font-bold text-[#145BFF] uppercase tracking-wider group/link cursor-pointer">
                    <span>Explore Service</span>
                    <ArrowRight className="ml-1.5 h-3.5 w-3.5 transition-transform duration-300 group-hover/link:translate-x-1 group-hover:translate-x-1" />
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* CTA Strip below cards */}
        <div 
          className={`bg-slate-50 border border-slate-150/80 rounded-3xl p-6 sm:p-8 flex flex-col sm:flex-row items-center justify-between gap-6 max-w-4xl mx-auto transition-all duration-700 delay-300 ${
            isIntersected ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'
          }`}
        >
          <div>
            <h3 className="text-lg sm:text-xl font-extrabold text-[#0F172A] tracking-tight">
              Ready to Offer These Services?
            </h3>
            <p className="text-xs sm:text-sm text-[#64748B] leading-relaxed mt-1">
              Join helping Mitra today and expand your digital business portfolio instantly.
            </p>
          </div>
          
          <div className="flex items-center gap-3 w-full sm:w-auto shrink-0">
            <Link href="/login" className="w-full sm:w-auto">
              <span className="w-full sm:w-auto justify-center inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-[#145BFF] to-blue-600 text-white font-bold text-xs sm:text-sm rounded-xl shadow-md shadow-blue-500/15 hover:shadow-lg hover:shadow-blue-500/25 hover:scale-[1.02] cursor-pointer transition-all duration-300 group">
                Join Helping Mitra
                <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
              </span>
            </Link>

            <Link href="/register" className="w-full sm:w-auto">
              <span className="w-full sm:w-auto justify-center inline-flex items-center px-6 py-3 bg-white border border-slate-200 hover:border-slate-350 text-[#0F172A] font-bold text-xs sm:text-sm rounded-xl hover:scale-[1.02] cursor-pointer transition-all duration-300">
                Create Account
              </span>
            </Link>
          </div>
        </div>

      </div>
    </section>
  );
};

export default PopularServicesSection;
