import React from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';

export const metadata = {
  title: 'Dashboard - Helping Mitra',
};

export default function UserDashboardLayout({ children }: { children: React.ReactNode }) {
  return <DashboardLayout>{children}</DashboardLayout>;
}
