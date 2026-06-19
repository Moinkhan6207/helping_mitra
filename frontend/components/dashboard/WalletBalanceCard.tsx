'use client';

import React from 'react';
import { Wallet } from 'lucide-react';
import { useWalletBalance } from '@/features/wallet/useWalletBalance';

interface WalletBalanceCardProps {
  compact?: boolean; // Compact mode for header use
}

const formatCurrency = (amount: number) =>
  new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(amount);

/**
 * WalletBalanceCard — Phase 3 Read-Only Wallet Display
 *
 * Shows the current wallet balance. No funding UI exposed (Rule 5).
 * Displays loading skeleton and error/retry states.
 */
export const WalletBalanceCard: React.FC<WalletBalanceCardProps> = ({ compact = false }) => {
  const { data, isLoading, isError, refetch } = useWalletBalance();
  const balance = data?.balance ?? 0;

  if (compact) {
    // Header compact version
    return (
      <div className="flex items-center gap-1.5" title="Wallet Balance (Read Only)">
        <Wallet size={15} className="text-[#145BFF] shrink-0" />
        {isLoading ? (
          <div className="h-4 w-12 bg-slate-700 rounded animate-pulse" />
        ) : isError ? (
          <button
            onClick={() => refetch()}
            className="text-xs text-red-400 hover:text-red-300 transition-colors"
            title="Retry loading balance"
          >
            ₹—
          </button>
        ) : (
          <span className="text-sm font-bold text-white tabular-nums">
            {formatCurrency(balance)}
          </span>
        )}
      </div>
    );
  }

  // Full card version (for dashboard widgets)
  return (
    <div className="flex flex-col gap-1">
      <p className="text-[9px] font-black tracking-wider uppercase text-blue-200">
        Wallet Balance
      </p>
      {isLoading ? (
        <div className="h-6 w-20 bg-blue-700/40 rounded animate-pulse" />
      ) : isError ? (
        <button
          onClick={() => refetch()}
          className="text-sm text-red-300 hover:text-red-200 transition-colors font-semibold"
        >
          Retry ↺
        </button>
      ) : (
        <p className="text-xl font-black text-white tabular-nums">
          {formatCurrency(balance)}
        </p>
      )}
    </div>
  );
};

export default WalletBalanceCard;
