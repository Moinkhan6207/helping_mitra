import React from 'react';
import { AdminOrdersClient } from '@/features/admin-orders/components/AdminOrdersClient';

export const metadata = {
  title: 'Manage Orders - Admin Panel | Helping Mitra',
  description: 'Admin Orders Queue Management System',
};

export default function AdminOrdersPage() {
  return <AdminOrdersClient />;
}
