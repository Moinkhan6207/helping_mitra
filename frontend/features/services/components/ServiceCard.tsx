import React, { useState } from 'react';
import Link from 'next/link';
import { FileText, CheckCircle, AlignLeft, ArrowRight, Upload, Sparkles, X } from 'lucide-react';
import { ServiceListItem } from '../types';
import { useAuthStore } from '@/features/auth/authStore';

interface ServiceCardProps {
  service: ServiceListItem;
}

export const ServiceCard: React.FC<ServiceCardProps> = ({ service }) => {
  const { status } = useAuthStore();
  const [isComingSoonOpen, setIsComingSoonOpen] = useState(false);

  // Map result type to friendly badge configs
  const getResultTypeConfig = (type: string) => {
    switch (type) {
      case 'FILE_UPLOAD':
        return {
          label: 'File Result',
          bgColor: 'bg-blue-50 text-blue-700 border-blue-200',
          icon: <FileText className="h-3.5 w-3.5 mr-1" />,
        };
      case 'STATUS_ONLY':
        return {
          label: 'Status Result',
          bgColor: 'bg-emerald-50 text-emerald-700 border-emerald-200',
          icon: <CheckCircle className="h-3.5 w-3.5 mr-1" />,
        };
      case 'TEXT_RESULT':
        return {
          label: 'Text Result',
          bgColor: 'bg-purple-50 text-purple-700 border-purple-200',
          icon: <AlignLeft className="h-3.5 w-3.5 mr-1" />,
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
  const fieldsCount = service._count?.fields ?? 0;
  const docsCount = service._count?.documentRequirements ?? 0;

  return (
    <>
      <div className="group relative flex flex-col justify-between bg-white rounded-2xl border border-slate-100 p-6 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-300">
        <div>
          {/* Top Badges */}
          <div className="flex items-center justify-between mb-4">
            <span className="text-xs font-semibold text-primary-blue bg-blue-50/50 px-2.5 py-1 rounded-md">
              {service.category.name}
            </span>
            <div className={`flex items-center text-xs font-medium border px-2.5 py-1 rounded-md ${badge.bgColor}`}>
              {badge.icon}
              {badge.label}
            </div>
          </div>

          {/* Name */}
          <h3 className="text-lg font-bold text-slate-800 group-hover:text-primary-blue transition-colors mb-2">
            {service.name}
          </h3>

          {/* Short Description */}
          <p className="text-sm text-slate-600 line-clamp-2 mb-4">
            {service.shortDescription}
          </p>

          {/* Required Details & Documents Summaries (FR-2.10) */}
          <div className="flex flex-wrap gap-2 mb-5">
            <span className="inline-flex items-center gap-1.5 text-[10px] font-bold text-indigo-600 bg-indigo-50/70 border border-indigo-100/50 px-2.5 py-1 rounded-full">
              <FileText className="h-3 w-3" />
              {fieldsCount} {fieldsCount === 1 ? 'Detail Required' : 'Details Required'}
            </span>
            <span className="inline-flex items-center gap-1.5 text-[10px] font-bold text-emerald-600 bg-emerald-50/70 border border-emerald-100/50 px-2.5 py-1 rounded-full">
              <Upload className="h-3 w-3" />
              {docsCount} {docsCount === 1 ? 'Document Required' : 'Documents Required'}
            </span>
          </div>
        </div>

        {/* Footer / MRP & Action */}
        <div className="pt-4 border-t border-slate-50 space-y-3.5">
          <div className="flex items-center justify-between">
            <div>
              <span className="block text-xs font-medium text-slate-400">Our Fee</span>
              <span className="text-xl font-extrabold text-slate-800">
                ₹{service.mrp}
              </span>
            </div>

            <Link
              href={`/services/${service.slug}`}
              className="inline-flex items-center gap-1 text-xs font-bold text-primary-blue hover:text-blue-700 transition-colors group/btn"
            >
              <span>View Details</span>
              <ArrowRight className="h-3.5 w-3.5 group-hover/btn:translate-x-0.5 transition-transform" />
            </Link>
          </div>

          {/* Action Button */}
          {status === 'authenticated' ? (
            <button
              onClick={() => setIsComingSoonOpen(true)}
              className="w-full py-2.5 bg-primary-blue hover:bg-secondary-blue text-white rounded-xl text-xs font-bold transition-all shadow-sm hover:shadow-md flex items-center justify-center gap-1.5"
            >
              Apply / Use Service
            </button>
          ) : (
            <Link
              href={`/login?redirect=/services/${service.slug}`}
              className="w-full py-2.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5"
            >
              Login to Continue
            </Link>
          )}
        </div>
      </div>

      {/* Coming Soon Modal */}
      {isComingSoonOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[9999] flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl p-6 md:p-8 max-w-sm w-full shadow-2xl border border-gray-100 flex flex-col items-center text-center animate-in zoom-in-95 duration-200 relative">
            <button
              onClick={() => setIsComingSoonOpen(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X size={18} />
            </button>

            <div className="w-14 h-14 rounded-2xl bg-blue-50 text-primary-blue flex items-center justify-center mb-4 border border-blue-100/50 shadow-sm">
              <Sparkles size={26} className="text-primary-blue" />
            </div>

            <h4 className="text-base font-extrabold text-gray-800">Kiosk Gateway Coming Soon</h4>
            <p className="text-xs text-gray-500 mt-2 leading-relaxed">
              The application form and payment flow for <strong className="text-gray-700">{service.name}</strong> are currently under development.
            </p>
            <p className="text-xs text-gray-400 mt-2 bg-gray-50 border border-gray-150 py-1.5 px-3 rounded-xl w-full">
              Full processing will launch in Phase 3.
            </p>

            <button
              onClick={() => setIsComingSoonOpen(false)}
              className="w-full mt-5 py-2.5 bg-primary-blue hover:bg-secondary-blue text-white rounded-xl text-xs font-bold transition-all shadow-sm"
            >
              Close Window
            </button>
          </div>
        </div>
      )}
    </>
  );
};

export default ServiceCard;
