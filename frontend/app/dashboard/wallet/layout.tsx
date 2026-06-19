import React from 'react';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Wallet Ledger – Helping Mitra',
  description: 'View your wallet balance history and all debit/credit transactions.',
};

export default function WalletLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
