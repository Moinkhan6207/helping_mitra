import React from 'react';
import { CreditCard, FileText, UserCheck, Truck } from 'lucide-react';
import Card from '../ui/Card';

export const BusinessServicesSection: React.FC = () => {
  const services = [
    {
      title: 'PAN Services',
      description: 'Apply for new PAN Card, track correction requests, and execute PAN searches instantly using our wallet.',
      icon: CreditCard,
      color: 'text-primary-blue bg-primary-blue/5 border-primary-blue/10',
    },
    {
      title: 'Voter ID Services',
      description: 'Search, apply, download, or execute corrections on voter identity cards with instant status verification.',
      icon: UserCheck,
      color: 'text-indigo-600 bg-indigo-50 border-indigo-100',
    },
    {
      title: 'Samagra Services',
      description: 'Retrieve Samagra ID Details, verify family configurations, updates profiles and download certificates.',
      icon: FileText,
      color: 'text-emerald-600 bg-emerald-50 border-emerald-100',
    },
    {
      title: 'Vahan Services',
      description: 'Find vehicle registration information, download RC records, and verify commercial transportation parameters.',
      icon: Truck,
      color: 'text-sky-600 bg-sky-50 border-sky-100',
    },
  ];

  return (
    <section id="services" className="py-20 bg-slate-50 border-y border-slate-200/80">
      <div className="mx-auto max-w-7xl px-6">
        {/* Section Header */}
        <div className="text-center max-w-2xl mx-auto mb-16">
          <span className="text-xs font-semibold uppercase tracking-wider text-primary-blue bg-primary-blue/5 px-3 py-1 rounded-full border border-primary-blue/10">
            Services List
          </span>
          <h2 className="text-3xl font-extrabold text-slate-900 mt-4 sm:text-4xl">
            Core Business Services
          </h2>
          <p className="text-slate-600 mt-3.5 leading-relaxed text-sm sm:text-base">
            Power your digital kiosk and assist customers with all major national government database portals from a single unified panel.
          </p>
        </div>

        {/* Services Grid */}
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {services.map((service) => {
            const Icon = service.icon;
            return (
              <Card hoverGlow key={service.title} className="p-6 flex flex-col justify-between h-full bg-white">
                <div>
                  <div className={`flex h-11 w-11 items-center justify-center rounded-xl border mb-5 ${service.color}`}>
                    <Icon className="h-5 w-5" />
                  </div>
                  <h3 className="text-lg font-bold text-slate-900 mb-2">{service.title}</h3>
                  <p className="text-xs text-slate-600 leading-relaxed">{service.description}</p>
                </div>
              </Card>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default BusinessServicesSection;
