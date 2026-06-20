"use client";

import React, { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { Check, ArrowRight, Sparkles } from 'lucide-react';

export const PartnerPlansSection: React.FC = () => {
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

  const plans = [
    {
      name: 'Distributor',
      price: '₹499',
      period: 'One-Time',
      description: 'Perfect for small business',
      features: [
        'Unlimited Retailers',
        'PAN Services',
        'PAN Find Service',
        'Single Wallet',
        'High Margin',
      ],
      cta: 'Join Distributor',
      highlighted: false,
    },
    {
      name: 'Master Distributor',
      price: '₹999',
      period: 'One-Time',
      description: 'Best for network growth',
      features: [
        'Unlimited Distributors',
        'Unlimited Retailers',
        'PAN Find & Status',
        'PAN Services',
        'Single Wallet',
        'High Margin',
      ],
      cta: 'Join Master Distributor',
      highlighted: true,
    },
  ];

  return (
    <section 
      ref={sectionRef}
      id="plans" 
      className="py-12 md:py-16 bg-white relative overflow-hidden"
    >
      {/* Decorative background glows */}
      <div className="absolute top-[30%] left-[5%] h-[450px] w-[450px] rounded-full bg-[#145BFF]/5 blur-[120px] pointer-events-none select-none" />
      <div className="absolute bottom-[10%] right-[5%] h-[450px] w-[450px] rounded-full bg-indigo-650/5 blur-[120px] pointer-events-none select-none" />

      <div className="relative mx-auto max-w-7xl px-6 z-10">
        
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-20">
          <span className="inline-flex items-center text-xs font-semibold uppercase tracking-wider text-[#145BFF] bg-[#145BFF]/8 px-4 py-1.5 rounded-full border border-[#145BFF]/15 animate-fade-in">
            Partner Pricing
          </span>
          <h2 className="text-3xl font-extrabold text-[#0F172A] mt-5 sm:text-4xl lg:text-5xl tracking-tight">
            Choose Your Business Package
          </h2>
          <div className="mt-4 space-y-2 max-w-2xl mx-auto">
            <p className="text-base sm:text-lg text-slate-800 font-semibold leading-relaxed">
              Retailer network build करके business grow करें
            </p>
            <p className="text-sm sm:text-base text-[#64748B] leading-relaxed">
              Select from our premium Distributor and Master Distributor partnership plans to start earning passive commissions.
            </p>
          </div>
        </div>

        {/* Plans Grid (Exactly 2 Cards) */}
        <div className="grid gap-8 grid-cols-1 md:grid-cols-2 max-w-4xl mx-auto items-stretch">
          {plans.map((plan, index) => (
            <div
              key={plan.name}
              style={{
                transitionDelay: `${index * 120}ms`,
              }}
              className={`group relative p-8 bg-white border flex flex-col justify-between h-full rounded-3xl transition-all duration-500 ease-out hover:-translate-y-2 ${
                plan.highlighted
                  ? 'border-[#145BFF] shadow-xl shadow-blue-500/8 ring-2 ring-[#145BFF]/10'
                  : 'border-slate-200/80 shadow-md shadow-slate-100/40 hover:border-slate-300'
              } ${
                isIntersected ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6 pointer-events-none'
              }`}
            >
              
              {/* Highlight Banner / Gradient Header */}
              {plan.highlighted ? (
                <div className="bg-gradient-to-r from-[#145BFF] to-indigo-600 text-white rounded-t-[1.3rem] p-6 -mx-8 -mt-8 mb-8 relative overflow-hidden flex items-center justify-between shadow-md">
                  <div className="absolute inset-0 bg-[radial-gradient(#ffffff_1px,transparent_1px)] [background-size:16px_16px] opacity-10 pointer-events-none" />
                  <div>
                    <span className="text-[10px] uppercase font-bold tracking-widest bg-white/15 px-2.5 py-1 rounded-md border border-white/10 shrink-0">
                      Best Value Plan
                    </span>
                    <h4 className="font-extrabold text-lg sm:text-xl mt-2 tracking-tight">
                      {plan.name}
                    </h4>
                  </div>
                  <Sparkles className="h-6 w-6 text-amber-300 animate-pulse shrink-0" />
                </div>
              ) : (
                <div className="mb-6 border-b border-slate-100 pb-5">
                  <span className="text-xs uppercase font-extrabold tracking-wider text-[#64748B] block mb-1">
                    Standard Option
                  </span>
                  <h4 className="font-extrabold text-lg sm:text-xl text-[#0F172A] tracking-tight">
                    {plan.name}
                  </h4>
                </div>
              )}

              {/* Price Details */}
              <div>
                <div className="flex items-baseline gap-2 mb-3">
                  <span className="text-4xl sm:text-5xl font-black text-[#0F172A] tracking-tight">
                    {plan.price}
                  </span>
                  <span className="text-xs sm:text-sm font-bold text-[#64748B]">
                    / {plan.period} Payment
                  </span>
                </div>
                <p className="text-xs sm:text-sm text-[#64748B] leading-relaxed mb-6 font-medium">
                  {plan.description}
                </p>

                {/* Features List */}
                <ul className="flex flex-col gap-4.5 mb-8 border-t border-slate-100 pt-6">
                  {plan.features.map((feature) => (
                    <li key={feature} className="flex items-start gap-3 text-xs sm:text-sm text-[#64748B]">
                      {/* Green Check Icon wrapper */}
                      <div className="flex h-5 w-5 items-center justify-center rounded-full bg-emerald-50 border border-emerald-100 text-[#22C55E] shrink-0 mt-0.5 shadow-sm">
                        <Check className="h-3.5 w-3.5 stroke-[3.5]" />
                      </div>
                      <span className="font-medium text-slate-700">{feature}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* CTA Button at Bottom */}
              <div className="mt-4">
                <Link href="/register">
                  <span className={`w-full justify-center inline-flex items-center gap-2 px-6 py-4 font-bold text-xs sm:text-sm rounded-xl cursor-pointer transition-all duration-300 hover:scale-[1.02] shadow-md ${
                    plan.highlighted
                      ? 'bg-gradient-to-r from-[#145BFF] to-blue-600 text-white shadow-blue-500/15 hover:shadow-lg hover:shadow-blue-500/25'
                      : 'bg-white border border-slate-200 hover:border-slate-350 text-[#0F172A]'
                  } group`}>
                    {plan.cta}
                    <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
                  </span>
                </Link>
              </div>

            </div>
          ))}
        </div>

      </div>
    </section>
  );
};

export default PartnerPlansSection;
