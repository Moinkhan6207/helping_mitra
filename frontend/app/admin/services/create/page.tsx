'use client';

import React from 'react';
import Link from 'next/link';
import { ArrowLeft, ShieldAlert } from 'lucide-react';

export default function CreateServicePage() {
  return (
    <div className="space-y-6">
      <div>
        <Link
          href="/admin/services"
          className="inline-flex items-center gap-2 text-xs font-semibold text-gray-500 hover:text-primary-blue transition-colors mb-2"
        >
          <ArrowLeft size={14} />
          <span>Back to Services Catalog</span>
        </Link>
        <h2 className="text-xl font-bold text-gray-800 tracking-tight">Configure New Service</h2>
      </div>

      <div className="p-8 bg-white border border-gray-100 rounded-3xl shadow-sm text-center max-w-xl mx-auto space-y-4 my-8">
        <div className="p-3 bg-amber-50 rounded-2xl w-fit mx-auto border border-amber-100">
          <ShieldAlert size={28} className="text-amber-500" />
        </div>
        <h3 className="text-base font-bold text-gray-800">Creation Disabled in Phase 2</h3>
        <p className="text-xs text-gray-500 leading-relaxed max-w-md mx-auto">
          Creating new service catalogue endpoints directly through the admin interface is disabled in Phase 2. 
          All services and categories are managed and initialized through system database seeds.
        </p>
        <div className="pt-2">
          <Link
            href="/admin/services"
            className="inline-flex items-center justify-center px-4 py-2.5 bg-gray-50 hover:bg-gray-100 border border-gray-200 text-gray-700 font-semibold rounded-xl text-xs transition-colors shadow-sm"
          >
            Go Back to Catalog
          </Link>
        </div>
      </div>
    </div>
  );
}
