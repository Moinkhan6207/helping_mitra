"use client";

import React, { useEffect, useRef, useState } from 'react';
import { IdCard, UserCheck, FileCheck, Car, ArrowRight } from 'lucide-react';

export const BusinessServicesSection: React.FC = () => {
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

  const services = [
    {
      title: 'PAN Services',
      description: 'Apply, update, correction and status tracking services for PAN-related requests.',
      icon: IdCard,
    },
    {
      title: 'Voter Services',
      description: 'Support voter registration, corrections, updates, and verification services.',
      icon: UserCheck,
    },
    {
      title: 'Samagra Services',
      description: 'Access Samagra ID related services, verification and profile management.',
      icon: FileCheck,
    },
    {
      title: 'Vahan Services',
      description: 'Vehicle-related digital services, verification and registration support.',
      icon: Car,
    },
  ];

  return (
    <section 
      ref={sectionRef}
      id="services" 
      className="relative py-24 bg-[#F8FBFF] border-y border-slate-200/50 overflow-hidden"
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
        <div className="grid gap-8 grid-cols-1 md:grid-cols-2 lg:grid-cols-4">
          {services.map((service, index) => {
            const Icon = service.icon;
            return (
              <div
                key={service.title}
                style={{
                  transitionDelay: `${index * 120}ms`,
                }}
                className={`group relative flex flex-col justify-between h-full p-8 md:p-10 bg-white border border-slate-100 rounded-3xl shadow-sm shadow-slate-200/50 transition-all duration-500 ease-out hover:-translate-y-2 hover:shadow-xl hover:shadow-[#145BFF]/8 hover:border-[#145BFF]/25 ${
                  isIntersected 
                    ? 'opacity-100 translate-y-0' 
                    : 'opacity-0 translate-y-8 pointer-events-none'
                }`}
              >
                <div>
                  {/* Icon Container */}
                  <div className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-[#145BFF]/6 border border-[#145BFF]/10 text-[#145BFF] mb-6 transition-all duration-300 group-hover:scale-110 group-hover:bg-[#145BFF]/10 group-hover:border-[#145BFF]/20">
                    <Icon className="h-6 w-6 transition-transform duration-300 group-hover:scale-110" />
                  </div>
                  
                  {/* Service Title */}
                  <h3 className="text-lg font-bold text-[#0F172A] mb-3 group-hover:text-[#145BFF] transition-colors duration-300">
                    {service.title}
                  </h3>
                  
                  {/* Service Description */}
                  <p className="text-xs sm:text-sm text-[#64748B] leading-relaxed">
                    {service.description}
                  </p>
                </div>

                {/* Explore Link */}
                <div className="mt-8 flex items-center text-xs font-bold text-[#145BFF] tracking-wider uppercase group/link">
                  <span>Explore Service</span>
                  <ArrowRight className="ml-1.5 h-3.5 w-3.5 transition-transform duration-300 group-hover/link:translate-x-1 group-hover:translate-x-1" />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default BusinessServicesSection;

