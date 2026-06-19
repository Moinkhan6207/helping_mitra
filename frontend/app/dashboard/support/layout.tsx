import React from 'react';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Support – Helping Mitra',
  description: 'Get help via WhatsApp, phone, or email from the Helping Mitra support team.',
};

export default function SupportLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
