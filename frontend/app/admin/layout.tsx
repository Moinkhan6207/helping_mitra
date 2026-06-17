import React from 'react';
import AdminLayout from '@/components/layout/AdminLayout';

export const metadata = {
  title: 'Admin Panel - Helping Mitra',
};

export default function AdministrativeLayout({ children }: { children: React.ReactNode }) {
  return <AdminLayout>{children}</AdminLayout>;
}
