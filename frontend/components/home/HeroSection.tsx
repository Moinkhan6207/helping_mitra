'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Check, Shield, Users, Zap, Wallet } from 'lucide-react';
import Button from '../ui/Button';
import Badge from '../ui/Badge';
import helpingMitraImage from '@/assets/helping-mitra-image.png';

export const HeroSection: React.FC = () => {
  const [mounted, setMounted] = useState(false);
  const trustBadges = [
    { text: 'PAN Services', icon: Shield },
    { text: 'Single Wallet', icon: Wallet },
    { text: 'All India Retailer Network', icon: Users },
    { text: 'Fast Support', icon: Zap },
  ];

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <section id="hero" className="relative overflow-hidden pt-24 pb-12 md:pt-32 md:pb-16 bg-white">
      {/* Glow overlays matching fast2pan light accents */}
      <div className="absolute top-[-10%] left-[-10%] h-[600px] w-[600px] rounded-full bg-primary-blue/5 blur-[130px] -z-10" />
      <div className="absolute top-[10%] right-[-5%] h-[500px] w-[500px] rounded-full bg-amber-400/8 blur-[120px] -z-10" />

      <div className="mx-auto max-w-7xl px-6 grid gap-12 lg:grid-cols-2 items-center">
        {/* Text Block */}
        <div className={`flex flex-col gap-6 text-center lg:text-left transition-all duration-1000 ease-out ${
          mounted ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-12'
        }`}>
          <div>
            <Badge variant="primary">💥 Launch Your Digital Business Today</Badge>
          </div>
          <h1 className="text-4xl font-extrabold sm:text-6xl tracking-tight leading-none text-slate-900">
            Open Your <br className="hidden sm:inline" />
            <span className="bg-gradient-to-r from-primary-blue via-indigo-600 to-sky-500 bg-clip-text text-transparent">
              Digital Service Center
            </span>
          </h1>
          <p className="text-slate-600 text-lg sm:text-xl leading-relaxed max-w-xl mx-auto lg:mx-0">
            Helping Mitra के साथ <span className="text-slate-900 font-semibold">PAN, Voter, Samagra, Vahan, Driving Licence</span> और <span className="text-slate-900 font-semibold">Farmer services</span> शुरू करें.
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4">
            <Link href="/register" className="w-full sm:w-auto">
              <Button variant="primary" size="lg" className="w-full sm:w-auto">
                Create Account
              </Button>
            </Link>
            <Link href="/login" className="w-full sm:w-auto">
              <Button variant="outline" size="lg" className="w-full sm:w-auto">
                Member Login
              </Button>
            </Link>
          </div>

          {/* Trust Badges */}
          <div className="grid grid-cols-2 gap-4 pt-6 border-t border-slate-100 max-w-md mx-auto lg:mx-0">
            {trustBadges.map((badge) => {
              return (
                <div key={badge.text} className="flex items-center gap-2 text-slate-600 text-sm">
                  <div className="flex h-6 w-6 items-center justify-center rounded-md bg-emerald-500/10 border border-emerald-500/20 text-emerald-600">
                    <Check className="h-3.5 w-3.5" />
                  </div>
                  <span>{badge.text}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Hero Illustration Mockup */}
        <div className={`flex justify-center items-center relative transition-all duration-1000 ease-out ${
          mounted ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-12'
        }`}>
          <div className="absolute top-[20%] left-[20%] h-[300px] w-[300px] rounded-full bg-primary-blue/10 blur-[100px] -z-10" />
          <Image
            src={helpingMitraImage}
            alt="Helping Mitra Digital Services Mockup"
            priority
            className="w-full h-auto rounded-3xl shadow-2xl border border-slate-200/80 hover:shadow-blue-500/10 transition-shadow duration-300"
          />
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
