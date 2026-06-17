import React from 'react';
import Link from 'next/link';
import { Check, Shield, Layers, Users, Zap, Wallet } from 'lucide-react';
import Button from '../ui/Button';
import Card from '../ui/Card';
import Badge from '../ui/Badge';

export const HeroSection: React.FC = () => {
  const trustBadges = [
    { text: 'PAN Services', icon: Shield },
    { text: 'Single Wallet', icon: Wallet },
    { text: 'All India Retailer Network', icon: Users },
    { text: 'Fast Support', icon: Zap },
  ];

  return (
    <section id="hero" className="relative overflow-hidden pt-32 pb-24 md:pt-40 md:pb-36 bg-white">
      {/* Glow overlays matching fast2pan light accents */}
      <div className="absolute top-[-10%] left-[-10%] h-[600px] w-[600px] rounded-full bg-primary-blue/5 blur-[130px] -z-10" />
      <div className="absolute top-[10%] right-[-5%] h-[500px] w-[500px] rounded-full bg-amber-400/8 blur-[120px] -z-10" />

      <div className="mx-auto max-w-7xl px-6 grid gap-12 lg:grid-cols-2 items-center">
        {/* Text Block */}
        <div className="flex flex-col gap-6 text-center lg:text-left">
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
              const IconComp = badge.icon;
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
        <div className="flex justify-center items-center relative">
          <div className="absolute top-[20%] left-[20%] h-[300px] w-[300px] rounded-full bg-primary-blue/10 blur-[100px] -z-10" />
          <Card hoverGlow glass className="w-full max-w-lg p-6 bg-white border border-slate-200 shadow-2xl relative">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4 mb-6">
              <div className="flex items-center gap-2">
                <span className="h-3 w-3 rounded-full bg-rose-400" />
                <span className="h-3 w-3 rounded-full bg-amber-400" />
                <span className="h-3 w-3 rounded-full bg-emerald-400" />
              </div>
              <span className="text-xs text-slate-400 uppercase tracking-widest font-semibold">Mitra Portal</span>
            </div>

            {/* Wallet representation card */}
            <div className="grid gap-6">
              <div className="p-5 bg-gradient-to-br from-primary-blue/5 to-indigo-500/5 border border-primary-blue/10 rounded-2xl flex items-center justify-between">
                <div>
                  <span className="text-xs text-slate-500 uppercase font-semibold">Digital Wallet Balance</span>
                  <h3 className="text-3xl font-extrabold text-slate-900 mt-1">₹14,250.00</h3>
                </div>
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary-blue/10 border border-primary-blue/20 text-primary-blue">
                  <Wallet className="h-6 w-6" />
                </div>
              </div>

              {/* Grid represent active services */}
              <div>
                <span className="text-xs text-slate-500 uppercase font-semibold block mb-3">Quick Actions</span>
                <div className="grid grid-cols-2 gap-3">
                  {['PAN Find Service', 'Apply New Voter', 'Download Samagra', 'Vehicle Vahan ID'].map((service, idx) => (
                    <div
                      key={service}
                      className="p-3 bg-slate-50 border border-slate-200/80 hover:border-slate-300 rounded-xl flex items-center justify-between transition-colors cursor-pointer group"
                    >
                      <span className="text-xs font-medium text-slate-600 group-hover:text-primary-blue transition-colors">{service}</span>
                      <span className={`h-2 w-2 rounded-full ${idx === 0 ? 'bg-emerald-500' : 'bg-primary-blue'}`} />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
