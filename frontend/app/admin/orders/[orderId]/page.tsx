import React from 'react';
import { AdminOrderDetailClient } from '@/features/admin-orders/components/AdminOrderDetailClient';

export const metadata = {
  title: 'Order Details - Admin Panel | Helping Mitra',
  description: 'Detailed inspection and audit logs for administrative processing.',
};

interface PageProps {
  params: Promise<{
    orderId: string;
  }>;
}

export default async function OrderDetailPage({ params }: PageProps) {
  const { orderId } = await params;
  return <AdminOrderDetailClient orderId={orderId} />;
}
