import React from 'react';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'My Orders – Helping Mitra',
  description: 'View and track all your service orders on Helping Mitra.',
};

export default function OrdersLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
