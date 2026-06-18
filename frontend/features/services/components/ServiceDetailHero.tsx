import React from 'react';
import Link from 'next/link';
import { ArrowLeft, FileText, CheckCircle, AlignLeft } from 'lucide-react';
import { ServiceDetailsData } from '../types';

interface ServiceDetailHeroProps {
  service: ServiceDetailsData;
}

export const ServiceDetailHero: React.FC<ServiceDetailHeroProps> = ({ service }) => {
  const getResultTypeConfig = (type: string) => {
    switch (type) {
      case 'FILE_UPLOAD':
        return {
          label: 'File Result',
          bgColor: 'bg-blue-50 text-blue-700 border-blue-200',
          icon: <FileText className="h-4 w-4 mr-1.5" />,
        };
      case 'STATUS_ONLY':
        return {
          label: 'Status Result',
          bgColor: 'bg-emerald-50 text-emerald-700 border-emerald-200',
          icon: <CheckCircle className="h-4 w-4 mr-1.5" />,
        };
      case 'TEXT_RESULT':
        return {
          label: 'Text Result',
          bgColor: 'bg-purple-50 text-purple-700 border-purple-200',
          icon: <AlignLeft className="h-4 w-4 mr-1.5" />,
        };
      default:
        return {
          label: type,
          bgColor: 'bg-slate-50 text-slate-700 border-slate-200',
          icon: null,
        };
    }
  };

  const badge = getResultTypeConfig(service.resultType);

  return (
    <div className="bg-white rounded-3xl border border-slate-100 p-8 shadow-sm mb-8">
      {/* Breadcrumb & Back button */}
      <div className="mb-6">
        <Link
          href="/services"
          className="inline-flex items-center text-sm font-bold text-slate-500 hover:text-primary-blue transition-colors group"
        >
          <ArrowLeft className="h-4 w-4 mr-2 group-hover:-translate-x-0.5 transition-transform" />
          Back to Catalogue
        </Link>
      </div>

      {/* Meta badges row */}
      <div className="flex flex-wrap items-center gap-3 mb-4">
        <span className="text-xs font-bold text-primary-blue bg-blue-50/50 border border-blue-100 px-3 py-1.5 rounded-full">
          {service.category.name}
        </span>
        <div className={`flex items-center text-xs font-bold border px-3 py-1.5 rounded-full ${badge.bgColor}`}>
          {badge.icon}
          {badge.label}
        </div>
      </div>

      {/* Title */}
      <h1 className="text-3xl md:text-4xl font-extrabold text-slate-900 tracking-tight mb-4">
        {service.name}
      </h1>

      {/* Short Description */}
      <p className="text-base text-slate-600 max-w-3xl leading-relaxed mb-6">
        {service.shortDescription}
      </p>

      {/* Bottom Row: MRP summary */}
      <div className="flex items-center gap-4 pt-4 border-t border-slate-50">
        <div>
          <span className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-0.5">Service Fee</span>
          <span className="text-2xl font-black text-slate-900">₹{service.mrp}</span>
        </div>
        <div className="h-8 w-px bg-slate-200" />
        <div>
          <span className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-0.5">Output Format</span>
          <span className="text-sm font-bold text-slate-700">{service.resultLabel}</span>
        </div>
      </div>
    </div>
  );
};
