import React from 'react';
import Link from 'next/link';
import { Search, Zap, Wallet, AlertCircle, ArrowRight } from 'lucide-react';
import Button from '../ui/Button';
import Card from '../ui/Card';

export const HighlightServiceSection: React.FC = () => {
  const highlights = [
    {
      title: 'Fast Process',
      description: 'Search PAN details by entering Aadhaar or matching inputs. Results populate instantly.',
      icon: Zap,
    },
    {
      title: 'Wallet Based Charge',
      description: 'Transparent deductions directly from your unified wallet. No credit cards required.',
      icon: Wallet,
    },
    {
      title: 'High Consumer Demand',
      description: 'Help customers recover lost PAN numbers. High retail footfall driver.',
      icon: Search,
    },
  ];

  return (
    <section className="py-20 bg-slate-50 border-y border-slate-200/80 relative overflow-hidden">
      <div className="absolute top-[-10%] left-[-10%] h-[350px] w-[350px] rounded-full bg-primary-blue/5 blur-[100px] -z-10" />

      <div className="mx-auto max-w-7xl px-6 grid gap-12 lg:grid-cols-2 items-center">
        {/* Mockup Display */}
        <div className="flex justify-center items-center order-2 lg:order-1">
          <Card hoverGlow glass className="w-full max-w-md p-6 bg-white border border-slate-200 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-5">
              <span className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                <Search className="h-4 w-4 text-primary-blue" /> PAN Search Portal
              </span>
              <span className="text-[10px] text-slate-400 font-mono">Module: find_v1</span>
            </div>

            {/* Simulated search field */}
            <div className="flex flex-col gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs text-slate-500 font-semibold">Enter Customer Aadhaar Number</label>
                <div className="relative">
                  <input
                    type="text"
                    placeholder="XXXX - XXXX - 1234"
                    disabled
                    className="w-full bg-slate-50 border border-slate-200 text-slate-600 rounded-xl px-4 py-3 text-xs placeholder-slate-400 cursor-not-allowed"
                  />
                  <div className="absolute right-3 top-3.5 h-1.5 w-1.5 rounded-full bg-primary-blue" />
                </div>
              </div>

              <div className="p-3.5 bg-primary-blue/5 border border-primary-blue/10 rounded-xl flex gap-2.5 text-xs text-primary-blue leading-normal">
                <AlertCircle className="h-4.5 w-4.5 shrink-0 mt-0.5" />
                <span>Entering a valid 12-digit Aadhaar will instantly look up the linked PAN card number.</span>
              </div>

              <Button variant="primary" size="sm" className="w-full pointer-events-none opacity-80">
                Execute PAN Search
              </Button>
            </div>
          </Card>
        </div>

        {/* Text Block */}
        <div className="flex flex-col gap-6 order-1 lg:order-2">
          <div>
            <span className="text-xs font-semibold uppercase tracking-wider text-primary-blue bg-primary-blue/5 px-3 py-1 rounded-full border border-primary-blue/10">
              Featured Utility
            </span>
            <h2 className="text-3xl font-extrabold text-slate-900 mt-4 sm:text-4xl">
              PAN Find Service
            </h2>
            <p className="text-slate-600 mt-3 text-sm sm:text-base leading-relaxed">
              खोया हुआ PAN कार्ड ढूंढना हुआ आसान! Assist clients who have lost their physical PAN documents. Retrieve active PAN numbers in seconds using Aadhaar queries.
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            {highlights.map((item) => {
              const Icon = item.icon;
              return (
                <div key={item.title} className="p-4 rounded-2xl bg-white border border-slate-200 shadow-sm shadow-slate-100">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary-blue/10 text-primary-blue mb-3">
                    <Icon className="h-4 w-4" />
                  </div>
                  <h4 className="font-bold text-slate-900 text-xs mb-1">{item.title}</h4>
                  <p className="text-[11px] text-slate-600 leading-normal">{item.description}</p>
                </div>
              );
            })}
          </div>

          <div>
            <Link href="/login">
              <Button variant="outline" size="md">
                Start PAN Find Service <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
};

export default HighlightServiceSection;
