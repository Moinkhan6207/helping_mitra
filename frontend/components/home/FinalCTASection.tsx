"use client";

import React, { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';

export const FinalCTASection: React.FC = () => {
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
        threshold: 0.1,
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

  return (
    <section 
      ref={sectionRef}
      className="py-16 bg-white relative overflow-hidden"
    >
      <div className="mx-auto max-w-7xl px-6">
        
        {/* Banner Card Container with Rounded Corners and Dark Blue Gradient */}
        <div 
          className={`relative bg-gradient-to-br from-[#0F172A] via-[#0F2942] to-[#1E3A8A] rounded-[2rem] p-12 md:p-16 text-center overflow-hidden shadow-2xl border border-white/10 transition-all duration-700 ease-out ${
            isIntersected ? 'opacity-100 translate-y-0 scale-100' : 'opacity-0 translate-y-8 scale-[0.98]'
          }`}
        >
          {/* Inner SVG Dot Grid Background */}
          <div className="absolute inset-0 pointer-events-none overflow-hidden select-none opacity-30">
            <svg className="absolute inset-0 h-full w-full stroke-white/[0.08]" fill="none">
              <defs>
                <pattern id="final-cta-dots" width="20" height="20" patternUnits="userSpaceOnUse" x="0" y="0">
                  <circle cx="2" cy="2" r="1.5" fill="#FFFFFF" />
                </pattern>
              </defs>
              <rect width="100%" height="100%" fill="url(#final-cta-dots)" />
            </svg>
          </div>

          {/* Radial Ambient Glow Glimmers */}
          <div className="absolute -left-32 -top-32 w-96 h-96 rounded-full bg-blue-500/10 blur-[80px] pointer-events-none" />
          <div className="absolute -right-32 -bottom-32 w-96 h-96 rounded-full bg-indigo-500/10 blur-[90px] pointer-events-none" />

          {/* Content Wrapper */}
          <div className="relative z-10 mx-auto max-w-2xl flex flex-col items-center gap-6">
            
            {/* Tag Badge */}
            <span className="inline-flex items-center text-[10px] font-bold uppercase tracking-widest text-blue-200 bg-white/10 px-3 py-1 rounded-md border border-white/10">
              Start Today
            </span>

            {/* Heading (White Text) */}
            <h2 className="text-3xl font-extrabold text-white sm:text-4xl lg:text-5xl tracking-tight leading-tight">
              Ready to start your <br className="sm:hidden" />
              service business?
            </h2>

            {/* Subheading (Muted Blue/White Text) */}
            <p className="text-blue-150/80 text-sm sm:text-base leading-relaxed max-w-lg">
              Create account and start serving customers with Helping Mitra.
            </p>

            {/* CTA White Button */}
            <div className="pt-4">
              <Link href="/register">
                <span className="inline-flex items-center gap-2.5 px-8 py-4 bg-white text-[#145BFF] font-extrabold text-sm sm:text-base rounded-xl shadow-lg shadow-black/10 hover:bg-blue-50 hover:shadow-xl hover:shadow-black/15 hover:scale-[1.03] transition-all cursor-pointer duration-300 group">
                  Get Started Now
                  <ArrowRight className="h-4.5 w-4.5 transition-transform duration-300 group-hover:translate-x-1" />
                </span>
              </Link>
            </div>

          </div>

        </div>

      </div>
    </section>
  );
};

export default FinalCTASection;
