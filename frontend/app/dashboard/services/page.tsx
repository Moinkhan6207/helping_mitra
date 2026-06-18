'use client';

import React, { Suspense } from 'react';
import { ServiceDiscovery } from '@/features/dashboard/components/ServiceDiscovery';

export default function DashboardServicesPage() {
  return (
    <div className="py-2">
      <Suspense fallback={<div className="h-56 bg-white border border-gray-100 rounded-3xl animate-pulse" />}>
        <ServiceDiscovery />
      </Suspense>
    </div>
  );
}
