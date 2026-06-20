'use client';

import React, { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useCategories } from '@/features/services/hooks/useCategories';
import { ArrowRight, Grid3X3, LayoutGrid } from 'lucide-react';

// Category icon color palette — cycles through these for visual variety
const CATEGORY_COLORS = [
  { bg: 'bg-[#145BFF]/6 border-[#145BFF]/10', icon: 'text-[#145BFF]' },
  { bg: 'bg-violet-500/6 border-violet-500/10', icon: 'text-violet-600' },
  { bg: 'bg-emerald-500/6 border-emerald-500/10', icon: 'text-emerald-600' },
  { bg: 'bg-amber-500/6 border-amber-500/10', icon: 'text-amber-600' },
  { bg: 'bg-rose-500/6 border-rose-500/10', icon: 'text-rose-600' },
  { bg: 'bg-teal-500/6 border-teal-500/10', icon: 'text-teal-600' },
];

export const BusinessServicesSection: React.FC = () => {
  const [isIntersected, setIsIntersected] = useState(false);
  const sectionRef = useRef<HTMLDivElement>(null);

  const { data: categories, isLoading } = useCategories();

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

  // Show top 4 categories
  const displayCategories = categories?.slice(0, 4) ?? [];

  return (
    <section
      ref={sectionRef}
      id="services"
      className="relative py-12 md:py-16 bg-[#F8FBFF] border-y border-slate-200/50 overflow-hidden"
    >
      {/* Decorative Grid Pattern & Soft Glows */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden select-none">
        <svg
          className="absolute inset-0 h-full w-full stroke-slate-200/30 [mask-image:radial-gradient(100%_100%_at_top_right,white,transparent)]"
          aria-hidden="true"
        >
          <defs>
            <pattern
              id="business-services-grid"
              width="48"
              height="48"
              patternUnits="userSpaceOnUse"
              x="-1"
              y="-1"
            >
              <path d="M.5 48V.5H48" fill="none" strokeWidth="1" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#business-services-grid)" />
        </svg>
        <div className="absolute top-0 right-1/4 w-[450px] h-[450px] rounded-full bg-[#145BFF]/5 blur-[100px]" />
        <div className="absolute bottom-0 left-1/4 w-[550px] h-[550px] rounded-full bg-indigo-600/5 blur-[120px]" />
      </div>

      <div className="relative mx-auto max-w-7xl px-6 z-10">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <span className="inline-flex items-center text-xs font-semibold uppercase tracking-wider text-[#145BFF] bg-[#145BFF]/8 px-4 py-1.5 rounded-full border border-[#145BFF]/15 animate-fade-in">
            Services Hub
          </span>
          <h2 className="text-3xl font-extrabold text-[#0F172A] mt-5 sm:text-4xl lg:text-5xl tracking-tight">
            Everything You Need To Grow
          </h2>
          <div className="mt-4 space-y-2 max-w-2xl mx-auto">
            <p className="text-base sm:text-lg text-slate-800 font-semibold leading-relaxed">
              PAN और Digital Service Business के लिए जरूरी सभी services एक ही platform पर।
            </p>
            <p className="text-sm sm:text-base text-[#64748B] leading-relaxed">
              Grow your business with trusted digital services and a powerful retailer network.
            </p>
          </div>
        </div>

        {/* Services Grid */}
        {isLoading ? (
          // Loading Skeleton
          <div className="grid gap-8 grid-cols-1 md:grid-cols-2 lg:grid-cols-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div
                key={i}
                className="h-64 bg-white border border-slate-100 rounded-3xl animate-pulse p-8"
              >
                <div className="w-14 h-14 bg-slate-100 rounded-2xl mb-6" />
                <div className="h-5 bg-slate-100 rounded w-3/4 mb-3" />
                <div className="h-3 bg-slate-100 rounded w-full mb-2" />
                <div className="h-3 bg-slate-100 rounded w-4/5" />
              </div>
            ))}
          </div>
        ) : (
          <div className="grid gap-8 grid-cols-1 md:grid-cols-2 lg:grid-cols-4">
            {displayCategories.map((category, index) => {
              const colorSet = CATEGORY_COLORS[index % CATEGORY_COLORS.length];
              return (
                <Link
                  key={category.id}
                  href={`/services?category=${category.slug}`}
                  style={{ transitionDelay: `${index * 120}ms` }}
                  className={`group relative flex flex-col justify-between h-full p-8 md:p-10 bg-white border border-slate-100 rounded-3xl shadow-sm shadow-slate-200/50 transition-all duration-500 ease-out hover:-translate-y-2 hover:shadow-xl hover:shadow-[#145BFF]/8 hover:border-[#145BFF]/25 ${
                    isIntersected
                      ? 'opacity-100 translate-y-0'
                      : 'opacity-0 translate-y-8 pointer-events-none'
                  }`}
                >
                  <div>
                    {/* Icon Container */}
                    <div
                      className={`inline-flex h-14 w-14 items-center justify-center rounded-2xl border mb-6 transition-all duration-300 group-hover:scale-110 ${colorSet.bg}`}
                    >
                      <LayoutGrid className={`h-6 w-6 ${colorSet.icon} transition-transform duration-300 group-hover:scale-110`} />
                    </div>

                    {/* Category Title */}
                    <h3 className="text-lg font-bold text-[#0F172A] mb-3 group-hover:text-[#145BFF] transition-colors duration-300">
                      {category.name}
                    </h3>

                    {/* Category Description */}
                    <p className="text-xs sm:text-sm text-[#64748B] leading-relaxed">
                      {category.description || `Browse all ${category.name} related services and grow your business portfolio.`}
                    </p>
                  </div>

                  {/* Explore Link */}
                  <div className="mt-8 flex items-center text-xs font-bold text-[#145BFF] tracking-wider uppercase group/link">
                    <span>Explore Services</span>
                    <ArrowRight className="ml-1.5 h-3.5 w-3.5 transition-transform duration-300 group-hover/link:translate-x-1 group-hover:translate-x-1" />
                  </div>
                </Link>
              );
            })}

            {/* "View All" card when categories < 4 */}
            {displayCategories.length > 0 && displayCategories.length < 4 && (
              <Link
                href="/services"
                style={{ transitionDelay: `${displayCategories.length * 120}ms` }}
                className={`group relative flex flex-col items-center justify-center h-full p-8 md:p-10 bg-white border border-dashed border-slate-200 rounded-3xl transition-all duration-500 ease-out hover:border-[#145BFF]/40 hover:shadow-md ${
                  isIntersected ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
                }`}
              >
                <Grid3X3 className="h-10 w-10 text-slate-300 mb-4 group-hover:text-[#145BFF] transition-colors duration-300" />
                <p className="text-sm font-bold text-slate-400 group-hover:text-[#145BFF] transition-colors duration-300">
                  View All Services
                </p>
                <ArrowRight className="h-4 w-4 text-slate-300 mt-2 group-hover:text-[#145BFF] group-hover:translate-x-1 transition-all duration-300" />
              </Link>
            )}
          </div>
        )}

        {/* Browse All CTA */}
        {!isLoading && (
          <div className="text-center mt-12">
            <Link href="/services">
              <span className="inline-flex items-center gap-2 px-6 py-3 bg-[#145BFF]/8 hover:bg-[#145BFF]/14 border border-[#145BFF]/15 text-[#145BFF] text-sm font-bold rounded-xl transition-all duration-200 cursor-pointer">
                Browse All Service Categories
                <ArrowRight className="h-4 w-4" />
              </span>
            </Link>
          </div>
        )}
      </div>
    </section>
  );
};

export default BusinessServicesSection;
