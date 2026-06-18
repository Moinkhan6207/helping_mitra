"use client";

import React, { useEffect, useRef, useState } from 'react';
import { UserPlus, Wallet, PlayCircle, TrendingUp } from 'lucide-react';

export const HowItWorksSection: React.FC = () => {
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

  const steps = [
    {
      step: '1',
      title: 'Create Account',
      description: 'Portal पर account बनाएं और profile details complete करें।',
      icon: UserPlus,
    },
    {
      step: '2',
      title: 'Add Wallet',
      description: 'Single wallet में balance add करके services use करें।',
      icon: Wallet,
    },
    {
      step: '3',
      title: 'Use Services',
      description: 'PAN, Voter, Samagra और other services use करें।',
      icon: PlayCircle,
    },
    {
      step: '4',
      title: 'Grow Business',
      description: 'Daily services से अपना digital business grow करें।',
      icon: TrendingUp,
    },
  ];

  return (
    <section 
      ref={sectionRef}
      id="how-it-works" 
      className="py-24 bg-[#F8FBFF] border-b border-slate-200/50 relative overflow-hidden"
    >
      <div className="mx-auto max-w-7xl px-6 relative z-10">
        
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-20">
          <span className="inline-flex items-center text-xs font-semibold uppercase tracking-wider text-[#145BFF] bg-[#145BFF]/8 px-4 py-1.5 rounded-full border border-[#145BFF]/15 animate-fade-in">
            Operational Blueprint
          </span>
          <h2 className="text-3xl font-extrabold text-[#0F172A] mt-5 sm:text-4xl lg:text-5xl tracking-tight">
            Start In 4 Simple Steps
          </h2>
          <div className="mt-4 space-y-2 max-w-2xl mx-auto">
            <p className="text-base sm:text-lg text-slate-800 font-semibold leading-relaxed">
              Retailer और Distributor के लिए आसान process
            </p>
            <p className="text-sm sm:text-base text-[#64748B] leading-relaxed">
              Follow our simple blueprint to get your digital kiosk running in under 5 minutes.
            </p>
          </div>
        </div>

        {/* Steps Grid */}
        <div className="grid gap-8 grid-cols-1 md:grid-cols-2 lg:grid-cols-4 relative">
          
          {steps.map((step, index) => {
            const Icon = step.icon;
            return (
              <div 
                key={step.step} 
                style={{
                  transitionDelay: `${index * 120}ms`,
                }}
                className={`group relative flex flex-col justify-between h-full p-8 md:p-10 bg-white border border-slate-100 rounded-3xl shadow-sm shadow-slate-200/30 transition-all duration-500 ease-out hover:-translate-y-2 hover:shadow-xl hover:shadow-[#145BFF]/8 hover:border-[#145BFF]/25 ${
                  isIntersected ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6 pointer-events-none'
                }`}
              >
                <div>
                  {/* Card Header (Step Number + Icon Row) */}
                  <div className="flex items-center justify-between w-full mb-6">
                    {/* Step number in blue rounded square */}
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#145BFF] text-white font-extrabold text-sm shadow-md shadow-[#145BFF]/20 group-hover:scale-105 transition-transform duration-300">
                      0{step.step}
                    </div>

                    {/* Icon in soft blue circle wrapper */}
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#145BFF]/5 text-[#145BFF] border border-[#145BFF]/10 group-hover:bg-[#145BFF] group-hover:text-white group-hover:border-transparent transition-all duration-300">
                      <Icon className="h-5 w-5" />
                    </div>
                  </div>

                  {/* Title */}
                  <h3 className="text-lg font-bold text-[#0F172A] mb-3 group-hover:text-[#145BFF] transition-colors duration-300">
                    {step.title}
                  </h3>
                  
                  {/* Description */}
                  <p className="text-xs sm:text-sm text-[#64748B] leading-relaxed">
                    {step.description}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
        
      </div>
    </section>
  );
};

export default HowItWorksSection;
