import React from 'react';
import Link from 'next/link';
import { Network, Wallet, MessageSquare, ArrowRight, CheckCircle } from 'lucide-react';
import Button from '../ui/Button';
import Card from '../ui/Card';

export const BusinessPlatformSection: React.FC = () => {
  const highlights = [
    {
      title: 'All-India Retailer Network',
      description: 'Join a vast network of merchants delivering digital resources to millions of citizens.',
      icon: Network,
    },
    {
      title: 'Unified Single Wallet',
      description: 'One balance for all services. No separate recharges needed for PAN, Vahan, or Farmer services.',
      icon: Wallet,
    },
    {
      title: 'Fast Customer Support',
      description: 'Dedicated merchant managers resolving ledger queries and technical portal tickets quickly.',
      icon: MessageSquare,
    },
  ];

  return (
    <section id="platform" className="py-20 bg-white relative overflow-hidden">
      <div className="absolute top-[40%] right-[-10%] h-[400px] w-[400px] rounded-full bg-primary-blue/5 blur-[120px] -z-10" />

      <div className="mx-auto max-w-7xl px-6 grid gap-12 lg:grid-cols-2 items-center">
        {/* Left Side Highlights List */}
        <div className="flex flex-col gap-6">
          <div>
            <span className="text-xs font-semibold uppercase tracking-wider text-indigo-750 bg-indigo-50 px-3 py-1 rounded-full border border-indigo-100">
              Robust Infrastructure
            </span>
            <h2 className="text-3xl font-extrabold text-slate-900 mt-4 sm:text-4xl">
              Professional Business Platform
            </h2>
            <p className="text-slate-600 mt-3 max-w-lg text-sm sm:text-base leading-relaxed">
              Helping Mitra compiles all utility and registry services under one secure panel. Run recharges, document retrieval, and applications seamlessly.
            </p>
          </div>

          <div className="flex flex-col gap-4">
            {highlights.map((item) => {
              const Icon = item.icon;
              return (
                <div key={item.title} className="flex gap-4 p-4 rounded-2xl bg-slate-50 border border-slate-200/80 hover:border-slate-350 transition-colors shadow-sm shadow-slate-100">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary-blue/10 text-primary-blue">
                    <Icon className="h-5 w-5" />
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-900 mb-1 text-sm sm:text-base">{item.title}</h4>
                    <p className="text-xs text-slate-600 leading-relaxed">{item.description}</p>
                  </div>
                </div>
              );
            })}
          </div>

          <div>
            <Link href="/register">
              <Button variant="primary" size="md">
                Join Now <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </div>
        </div>

        {/* Right Side Card Mockup */}
        <div className="flex justify-center items-center">
          <Card hoverGlow glass className="w-full max-w-md p-6 bg-white border border-slate-200 shadow-xl relative">
            <h3 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-emerald-500" /> Platform Advantages
            </h3>
            <ul className="flex flex-col gap-3.5">
              {[
                'Distributor Management Console',
                'Instantly Settled Wallet Ledgers',
                'Bilingual Hindi + English Operator Guides',
                'Comprehensive Audit Journals & Reports',
                'DDoS Encrypted Gateway Protection',
              ].map((bullet) => (
                <li key={bullet} className="flex items-start gap-2.5 text-xs text-slate-600">
                  <CheckCircle className="h-4.5 w-4.5 text-emerald-600 shrink-0 mt-0.5" />
                  <span>{bullet}</span>
                </li>
              ))}
            </ul>

            {/* Micro stats banner */}
            <div className="mt-8 pt-6 border-t border-slate-100 grid grid-cols-2 gap-4 text-center">
              <div>
                <span className="text-xs text-slate-500 block">Active Merchants</span>
                <span className="text-xl font-bold text-slate-900 mt-1 block">15,000+</span>
              </div>
              <div>
                <span className="text-xs text-slate-500 block">Daily Transactions</span>
                <span className="text-xl font-bold text-slate-900 mt-1 block">50,000+</span>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </section>
  );
};

export default BusinessPlatformSection;
