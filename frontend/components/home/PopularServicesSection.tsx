import React from 'react';
import { CreditCard, UserCheck, FileText, Truck, ShieldAlert, HeartHandshake } from 'lucide-react';
import Card from '../ui/Card';

export const PopularServicesSection: React.FC = () => {
  const popularServices = [
    { name: 'PAN Services', desc: 'Apply for New PAN cards, execute Corrections, or retrieve lost PAN credentials.', icon: CreditCard },
    { name: 'Voter Services', desc: 'Download digital Voter IDs, execute details modification, and process additions.', icon: UserCheck },
    { name: 'Samagra Services', desc: 'Search family IDs, sync demographic configuration data, and download certificates.', icon: FileText },
    { name: 'Vahan Services', desc: 'Query registration records, download RC duplicates, and track transport cases.', icon: Truck },
    { name: 'Driving Licence', desc: 'Search licenses databases, apply for renewals, and compile driver status details.', icon: ShieldAlert },
    { name: 'Farmer Services', desc: 'Resolve registry details, download KCC guidelines, and verify crop schemes.', icon: HeartHandshake },
  ];

  return (
    <section className="py-20 bg-white">
      <div className="mx-auto max-w-7xl px-6">
        {/* Section Header */}
        <div className="text-center max-w-2xl mx-auto mb-16">
          <span className="text-xs font-semibold uppercase tracking-wider text-primary-blue bg-primary-blue/5 px-3 py-1 rounded-full border border-primary-blue/10">
            Merchant Toolkit
          </span>
          <h2 className="text-3xl font-extrabold text-slate-900 mt-4 sm:text-4xl">
            Popular Digital Services
          </h2>
          <p className="text-slate-600 mt-3 text-sm sm:text-base leading-relaxed">
            Expand your shop catalog and boost monthly footfall. Assist your local community with essential digital administrative portals.
          </p>
        </div>

        {/* Popular Grid */}
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {popularServices.map((service) => {
            const Icon = service.icon;
            return (
              <Card hoverGlow key={service.name} className="p-6 bg-white border border-slate-200 flex gap-4">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary-blue/10 border border-primary-blue/15 text-primary-blue">
                  <Icon className="h-5 w-5" />
                </div>
                <div>
                  <h4 className="font-bold text-slate-900 mb-1.5 text-sm sm:text-base">{service.name}</h4>
                  <p className="text-xs text-slate-600 leading-normal">{service.desc}</p>
                </div>
              </Card>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default PopularServicesSection;
