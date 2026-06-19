'use client';

import React from 'react';
import { useParams } from 'next/navigation';
import ServiceApplyClient from '@/features/services/components/ServiceApplyClient';

export default function ServiceApplyPage() {
  const params = useParams();
  const serviceSlug = params?.serviceSlug as string;

  return <ServiceApplyClient serviceSlug={serviceSlug} />;
}
