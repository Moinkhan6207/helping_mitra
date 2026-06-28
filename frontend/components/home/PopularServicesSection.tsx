'use client';

import React, { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useServices } from '@/features/services/hooks/useServices';
import { ArrowRight, LayoutGrid, IndianRupee } from 'lucide-react';
import type { ResultType, ServiceListItem } from '@/features/services/types';

// Badge config per resultType
const RESULT_BADGE: Record<ResultType, { label: string; cls: string }> = {
  FILE_UPLOAD: { label: '📄 Document Service', cls: 'bg-sky-50 text-sky-650 border-sky-100/80' },
  STATUS_ONLY: { label: '⭐ Status Service', cls: 'bg-indigo-50 text-indigo-650 border-indigo-100/80' },
  TEXT_RESULT: { label: '🔥 High Demand', cls: 'bg-rose-50 text-rose-600 border-rose-100/80' },
};

// Icon color palette for cards
const ICON_COLORS = [
  'bg-rose-50 text-rose-600 border-rose-100',
  'bg-indigo-50 text-indigo-650 border-indigo-100',
  'bg-emerald-50 text-emerald-600 border-emerald-100',
  'bg-sky-50 text-sky-650 border-sky-100',
  'bg-amber-50 text-amber-600 border-amber-100',
  'bg-violet-50 text-violet-650 border-violet-100',
];

export const PopularServicesSection: React.FC = () => {
  const [isIntersected, setIsIntersected] = useState(false);
  const sectionRef = useRef<HTMLDivElement>(null);

  const { data, isLoading } = useServices({ page: 1, limit: 6 });
  const popularServices = data?.services ?? [];

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsIntersected(true);
          observer.unobserve(entry.target);
        }
      },
      { threshold: 0.05 }
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

  return (
    <section
      ref={sectionRef}
      id="popular-services"
      className="py-12 md:py-16 bg-gradient-to-b from-[#F8FBFF] to-white border-b border-slate-200/50"
    >
      <div className="mx-auto max-w-7xl px-6">

        {/* Popular Grid */}
        {isLoading ? (
          <div className="grid gap-8 grid-cols-1 md:grid-cols-2 mb-16">
            {Array.from({ length: 6 }).map((_, i) => (
              <div
                key={i}
                className="h-36 bg-white border border-slate-150 rounded-3xl animate-pulse p-6 flex gap-5"
              >
                <div className="h-14 w-14 bg-slate-100 rounded-2xl shrink-0" />
                <div className="flex-1 space-y-3 pt-1">
                  <div className="h-4 bg-slate-100 rounded w-2/3" />
                  <div className="h-3 bg-slate-100 rounded w-full" />
                  <div className="h-3 bg-slate-100 rounded w-4/5" />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="grid gap-8 grid-cols-1 md:grid-cols-2 mb-16">
            {popularServices.map((service: ServiceListItem, index: number) => {
              const badge = RESULT_BADGE[service.resultType] ?? { label: '⭐ Popular', cls: 'bg-slate-50 text-slate-500 border-slate-100' };
              const iconClass = ICON_COLORS[index % ICON_COLORS.length];

              return (
                <Link
                  key={service.id}
                  href={`/services/${service.slug}`}
                  style={{ transitionDelay: `${index * 80}ms` }}
                  className={`group relative p-6 sm:p-8 bg-white border border-slate-150 rounded-3xl shadow-sm hover:shadow-xl hover:shadow-slate-200/40 hover:border-[#145BFF]/30 transition-all duration-500 ease-out flex flex-col sm:flex-row gap-5 sm:gap-6 ${
                    isIntersected ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'
                  }`}
                >
                  {/* Large Icon Box */}
                  <div className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl border transition-all duration-300 group-hover:scale-110 ${iconClass}`}>
                    <LayoutGrid className="h-6 w-6" />
                  </div>

                  {/* Content details */}
                  <div className="flex-grow flex flex-col justify-between">
                    <div>
                      {/* Header line with Name & Badge */}
                      <div className="flex items-start justify-between gap-3 mb-2">
                        <h4 className="font-extrabold text-[#0F172A] text-base sm:text-lg tracking-tight group-hover:text-[#145BFF] transition-colors duration-300">
                          {service.name}
                        </h4>
                        <span className={`text-[10px] font-bold px-2.5 py-1 rounded-md border shrink-0 uppercase tracking-wider ${badge.cls}`}>
                          {badge.label}
                        </span>
                      </div>

                      {/* Description */}
                      <p className="text-xs sm:text-sm text-[#64748B] leading-relaxed pr-2">
                        {service.shortDescription || service.description?.slice(0, 100)}
                      </p>
                    </div>

                    {/* Bottom row: MRP + CTA */}
                    <div className="mt-4 flex items-center justify-between">
                      <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-600 bg-emerald-50 border border-emerald-100 px-2.5 py-1 rounded-lg">
                        <IndianRupee className="h-3 w-3" />
                        {service.mrp}
                      </span>
                      <div className="flex items-center text-xs font-bold text-[#145BFF] uppercase tracking-wider group/link cursor-pointer">
                        <span>Explore Service</span>
                        <ArrowRight className="ml-1.5 h-3.5 w-3.5 transition-transform duration-300 group-hover/link:translate-x-1 group-hover:translate-x-1" />
                      </div>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}

        {/* CTA Strip below cards */}
        <div
          className={`relative bg-gradient-to-br from-[#0c1a30] via-[#112a52] to-[#145BFF] rounded-3xl p-7 sm:p-10 flex flex-col sm:flex-row items-center justify-between gap-6 max-w-4xl mx-auto overflow-hidden shadow-2xl shadow-blue-900/30 transition-all duration-700 delay-300 ${
            isIntersected ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'
          }`}
        >
          {/* Glow blobs */}
          <div className="absolute -top-16 -right-16 w-56 h-56 rounded-full bg-blue-400/15 blur-[60px] pointer-events-none" />
          <div className="absolute -bottom-16 -left-16 w-56 h-56 rounded-full bg-indigo-600/20 blur-[60px] pointer-events-none" />

          {/* Dot grid overlay */}
          <div className="absolute inset-0 pointer-events-none overflow-hidden select-none">
            <svg className="absolute inset-0 h-full w-full [mask-image:radial-gradient(80%_80%_at_top_right,white,transparent)]" fill="none">
              <defs>
                <pattern id="popular-cta-dots" width="18" height="18" patternUnits="userSpaceOnUse">
                  <circle cx="2" cy="2" r="1" fill="white" opacity="0.06" />
                </pattern>
              </defs>
              <rect width="100%" height="100%" fill="url(#popular-cta-dots)" />
            </svg>
          </div>

          {/* Top accent line */}
          <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-blue-400 via-sky-400 to-indigo-400 rounded-t-3xl" />

          <div className="relative z-10">
            <span className="inline-flex items-center text-[10px] font-bold uppercase tracking-widest text-blue-200 bg-white/10 border border-white/15 px-3 py-1 rounded-full mb-3">
              ✨ Partner Opportunity
            </span>
            <h3 className="text-lg sm:text-xl font-extrabold text-white tracking-tight">
              Ready to Offer These Services?
            </h3>
            <p className="text-xs sm:text-sm text-blue-100/75 leading-relaxed mt-1.5">
              Join Helping Mitra today and expand your digital business portfolio instantly.
            </p>
          </div>

          <div className="relative z-10 flex items-center gap-3 w-full sm:w-auto shrink-0">
            <Link href="/login" className="w-full sm:w-auto">
              <span className="w-full sm:w-auto justify-center inline-flex items-center gap-2 px-6 py-3 bg-white text-[#145BFF] font-bold text-xs sm:text-sm rounded-xl shadow-lg shadow-black/20 hover:bg-blue-50 hover:scale-[1.02] cursor-pointer transition-all duration-300 group">
                Join Helping Mitra
                <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
              </span>
            </Link>

            <Link href="/services" className="w-full sm:w-auto">
              <span className="w-full sm:w-auto justify-center inline-flex items-center px-6 py-3 bg-white/10 border border-white/20 hover:bg-white/20 text-white font-bold text-xs sm:text-sm rounded-xl hover:scale-[1.02] cursor-pointer transition-all duration-300">
                Browse All Services
              </span>
            </Link>
          </div>
        </div>

      </div>
    </section>
  );
};

export default PopularServicesSection;
