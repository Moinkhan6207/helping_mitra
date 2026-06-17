import React from 'react';
import { UserPlus, Wallet, PlayCircle, TrendingUp } from 'lucide-react';

export const HowItWorksSection: React.FC = () => {
  const steps = [
    {
      step: '1',
      title: 'Create Account',
      description: 'Fill in your merchant credentials (name, shopName, KYC numbers) and select a membership plan.',
      icon: UserPlus,
    },
    {
      step: '2',
      title: 'Add Wallet',
      description: 'Add balances instantly to your unified digital wallet via secure UPI or NetBanking channels.',
      icon: Wallet,
    },
    {
      step: '3',
      title: 'Use Services',
      description: 'Access the dashboard, search lost PANs, query RC vehicle details, and download certificates.',
      icon: PlayCircle,
    },
    {
      step: '4',
      title: 'Grow Business',
      description: 'Provide high-speed assistance, process customer orders, receive commissions, and boost profits.',
      icon: TrendingUp,
    },
  ];

  return (
    <section id="how-it-works" className="py-20 bg-slate-50 border-y border-slate-200/80 relative overflow-hidden">
      <div className="mx-auto max-w-7xl px-6">
        {/* Section Header */}
        <div className="text-center max-w-2xl mx-auto mb-16">
          <span className="text-xs font-semibold uppercase tracking-wider text-primary-blue bg-primary-blue/5 px-3 py-1 rounded-full border border-primary-blue/10">
            Operational Blueprint
          </span>
          <h2 className="text-3xl font-extrabold text-slate-900 mt-4 sm:text-4xl">
            How Helping Mitra Works
          </h2>
          <p className="text-slate-600 mt-3 text-sm sm:text-base leading-relaxed">
            Go live and begin executing customer services in under 5 minutes.
          </p>
        </div>

        {/* Steps Grid */}
        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4 relative">
          {steps.map((step) => {
            const Icon = step.icon;
            return (
              <div key={step.step} className="flex flex-col items-center text-center relative group">
                {/* Step Circle Icon wrapper */}
                <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-white border border-slate-200 group-hover:border-primary-blue/30 text-primary-blue shadow-md shadow-slate-200/50 transition-all duration-300 mb-6">
                  <Icon className="h-7 w-7" />
                </div>

                {/* Badge indicator */}
                <span className="absolute top-0 right-[35%] flex h-6 w-6 items-center justify-center rounded-full bg-primary-blue text-white text-xs font-bold font-mono shadow-md shadow-primary-blue/25">
                  {step.step}
                </span>

                <h3 className="text-lg font-bold text-slate-900 mb-2">{step.title}</h3>
                <p className="text-xs text-slate-600 leading-relaxed max-w-xs">{step.description}</p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default HowItWorksSection;
