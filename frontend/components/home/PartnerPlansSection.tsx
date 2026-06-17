import React from 'react';
import Link from 'next/link';
import { Check } from 'lucide-react';
import Card from '../ui/Card';
import Button from '../ui/Button';
import Badge from '../ui/Badge';

export const PartnerPlansSection: React.FC = () => {
  const plans = [
    {
      name: 'Retailer Plan',
      price: '₹0',
      period: 'Free',
      description: 'Ideal for small shops and individual operators beginning their service journey.',
      features: [
        'Access to PAN Find Service',
        'Voter & Samagra Download Tools',
        'Standard Wallet Limits',
        'Email Support Ticketing',
      ],
      cta: 'Create Free Account',
      popular: false,
    },
    {
      name: 'Distributor Plan',
      price: '₹499',
      period: 'One-Time Payment',
      description: 'Enable and onboard your own retailer network and earn secondary commissions.',
      features: [
        'Add & Manage Unlimited Retailers',
        'Higher commission margins',
        'Single Wallet Ledger management',
        'Priority Technical Support Manager',
        'All standard retailer features',
      ],
      cta: 'Become a Distributor',
      popular: true,
    },
    {
      name: 'Master Distributor Plan',
      price: '₹999',
      period: 'One-Time Payment',
      description: 'Create a massive network of distributors and retailers. Maximum payouts.',
      features: [
        'Create Distributors & Retailers',
        'Top Commission Slab rates',
        'Advanced Network Audit reports',
        'Dedicated Call & WhatsApp Manager',
        'Zero API execution failures guarantees',
      ],
      cta: 'Become a Master Distributor',
      popular: false,
    },
  ];

  return (
    <section id="plans" className="py-20 bg-white relative overflow-hidden">
      <div className="absolute top-[30%] left-[5%] h-[450px] w-[450px] rounded-full bg-primary-blue/5 blur-[120px] -z-10" />

      <div className="mx-auto max-w-7xl px-6">
        {/* Section Header */}
        <div className="text-center max-w-2xl mx-auto mb-16">
          <span className="text-xs font-semibold uppercase tracking-wider text-primary-blue bg-primary-blue/5 px-3 py-1 rounded-full border border-primary-blue/10">
            Partner Pricing
          </span>
          <h2 className="text-3xl font-extrabold text-slate-900 mt-4 sm:text-4xl">
            Choose Your Business Plan
          </h2>
          <p className="text-slate-600 mt-3 text-sm sm:text-base leading-relaxed">
            Select a partnership plan to start generating revenue and serving clients.
          </p>
        </div>

        {/* Plans Grid */}
        <div className="grid gap-8 lg:grid-cols-3 items-stretch">
          {plans.map((plan) => (
            <Card
              key={plan.name}
              hoverGlow
              className={`p-8 bg-white border flex flex-col justify-between h-full relative ${
                plan.popular
                  ? 'border-primary-blue shadow-xl shadow-primary-blue/5 ring-1 ring-primary-blue/20'
                  : 'border-slate-200'
              }`}
            >
              {plan.popular && (
                <div className="absolute top-4 right-4">
                  <Badge variant="success">Most Popular</Badge>
                </div>
              )}

              <div>
                <span className="text-xs text-slate-500 font-semibold block mb-2">{plan.name}</span>
                <div className="flex items-baseline gap-2 mb-4">
                  <span className="text-4xl font-extrabold text-slate-900">{plan.price}</span>
                  <span className="text-xs text-slate-500 font-medium">/ {plan.period}</span>
                </div>
                <p className="text-xs text-slate-600 leading-relaxed mb-6">{plan.description}</p>

                {/* Features list */}
                <ul className="flex flex-col gap-3 mb-8 border-t border-slate-100 pt-6">
                  {plan.features.map((feature) => (
                    <li key={feature} className="flex items-start gap-2.5 text-xs text-slate-600">
                      <div className="h-4.5 w-4.5 rounded-full bg-emerald-50 border border-emerald-100 text-emerald-600 flex items-center justify-center shrink-0 mt-0.5">
                        <Check className="h-3 w-3" />
                      </div>
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div>
                <Link href="/register">
                  <Button variant={plan.popular ? 'primary' : 'outline'} className="w-full">
                    {plan.cta}
                  </Button>
                </Link>
              </div>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
};

export default PartnerPlansSection;
