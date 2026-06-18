import React from 'react';
import { IndianRupee, Clock, RefreshCw } from 'lucide-react';
import { ServiceDetailsData } from '../types';

interface ServicePricingProps {
  service: ServiceDetailsData;
}

export const ServicePricing: React.FC<ServicePricingProps> = ({ service }) => {
  const getDeliveryMode = (type: string) => {
    switch (type) {
      case 'FILE_UPLOAD':
        return 'Direct File Download (PDF/Image)';
      case 'STATUS_ONLY':
        return 'Success Status Flag Update';
      case 'TEXT_RESULT':
        return 'Text/Alphanumeric String Output';
      default:
        return type;
    }
  };

  return (
    <div className="bg-white rounded-3xl border border-slate-100 p-8 shadow-sm">
      <h2 className="text-xl font-bold text-slate-800 mb-6 flex items-center">
        <IndianRupee className="h-5 w-5 mr-2 text-primary-blue" />
        Pricing & Delivery
      </h2>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* MRP fee */}
        <div className="p-5 rounded-2xl border border-slate-100 bg-slate-50/50 flex flex-col justify-between">
          <div>
            <span className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Total Fee</span>
            <p className="text-sm text-slate-600">This is the final platform merchant fee for processing this service transaction.</p>
          </div>
          <span className="text-3xl font-black text-slate-900 mt-4 block">₹{service.mrp}</span>
        </div>

        {/* Output Document */}
        <div className="p-5 rounded-2xl border border-slate-100 bg-slate-50/50 flex flex-col justify-between">
          <div>
            <span className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Result Label</span>
            <p className="text-sm text-slate-600">The resulting item that will be generated and made available on completion.</p>
          </div>
          <span className="inline-flex items-center text-sm font-bold text-primary-blue bg-blue-50/50 border border-blue-100 px-3 py-1.5 rounded-lg mt-4 self-start">
            <RefreshCw className="h-4 w-4 mr-1.5 animate-spin-slow" />
            {service.resultLabel}
          </span>
        </div>

        {/* Delivery mode */}
        <div className="p-5 rounded-2xl border border-slate-100 bg-slate-50/50 flex flex-col justify-between">
          <div>
            <span className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Delivery Format</span>
            <p className="text-sm text-slate-600">How the results of your transaction will be delivered to your account portal.</p>
          </div>
          <span className="inline-flex items-center text-sm font-bold text-slate-700 bg-white border border-slate-200 px-3 py-1.5 rounded-lg shadow-sm mt-4 self-start">
            <Clock className="h-4 w-4 mr-1.5 text-slate-400" />
            {getDeliveryMode(service.resultType)}
          </span>
        </div>
      </div>
    </div>
  );
};
