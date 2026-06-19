'use client';

import React from 'react';
import Link from 'next/link';
import { Menu, LogOut, Wallet } from 'lucide-react';
import { useAuthStore } from '@/features/auth/authStore';
import { useLogout } from '@/features/auth/hooks/useLogout';
import { useUserDashboardSummary } from '@/features/dashboard/hooks/useUserDashboardSummary';

interface TopbarProps {
  onToggleSidebar: () => void;
  title?: string;
}

export const Topbar: React.FC<TopbarProps> = ({ onToggleSidebar }) => {
  const { user } = useAuthStore();
  const logoutMutation = useLogout();
  const { data: summaryData } = useUserDashboardSummary();

  const handleLogout = () => {
    logoutMutation.mutate();
  };

  const walletBalance = summaryData?.data?.walletBalance ?? 0;

  const formatCurrency = (val?: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(val || 0);
  };

  return (
    <header className="h-16 bg-[#0c1a30] px-4 md:px-6 flex items-center justify-between z-30 select-none shadow-md">
      <div className="flex items-center gap-3">
        {/* Toggle button on Mobile/Tablet */}
        <button
          onClick={onToggleSidebar}
          className="lg:hidden p-2 rounded-xl hover:bg-slate-800 text-slate-300 hover:text-white transition-colors focus:outline-none"
          aria-label="Toggle sidebar menu"
        >
          <Menu size={20} />
        </button>

        {/* Logo */}
        <Link
          href="/dashboard"
          className="flex items-center gap-2.5 text-base font-bold tracking-tight text-white select-none"
        >
          <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-[#145BFF] to-teal-400 flex items-center justify-center text-xs font-black text-white shadow-md shadow-blue-500/10">
            HM
          </div>
          <span>
            Helping <span className="text-[#145BFF]">Mitra</span>
          </span>
        </Link>
      </div>

      <div className="flex items-center gap-4">
        {/* Wallet balance and ADD MONEY - visible only for USER role */}
        {user?.role === 'USER' && (
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5 text-white font-bold text-sm">
              <Wallet size={16} className="text-[#145BFF]" />
              <span>{formatCurrency(walletBalance)}</span>
            </div>
            <Link
              href="/dashboard/wallet/Add_Wallet"
              className="px-3.5 py-1.5 bg-[#f59e0b] hover:bg-[#e08e06] text-[#0c1a30] text-[11px] font-black tracking-wide rounded-md transition-colors duration-150 active:scale-95 cursor-pointer uppercase text-center font-bold flex items-center justify-center"
            >
              Add Money
            </Link>
          </div>
        )}

        {/* Quick User profile block */}
        <div className="flex items-center gap-2 px-3 py-1 bg-[#162744] border border-slate-700/30 rounded-lg">
          <div className="w-6 h-6 rounded-md bg-[#145BFF] flex items-center justify-center text-white text-[11px] font-bold uppercase shrink-0">
            {user?.name?.slice(0, 1) || 'U'}
          </div>
          <div className="hidden sm:flex flex-col text-left leading-tight">
            <span className="text-[11px] font-bold text-white truncate max-w-[100px]">
              {user?.name}
            </span>
            <span className="text-[8px] text-slate-400 uppercase font-black tracking-wider">
              {user?.role === 'ADMIN' ? 'Admin' : user?.userType?.replace('_', ' ') || 'Partner'}
            </span>
          </div>
        </div>

        {/* Logout Button */}
        <button
          onClick={handleLogout}
          disabled={logoutMutation.isPending}
          className="p-2 rounded-lg border border-slate-700/40 hover:bg-red-500/10 text-slate-400 hover:text-red-400 transition-all duration-200 focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
          title="Sign Out"
        >
          {logoutMutation.isPending ? (
            <svg className="animate-spin h-4 w-4 text-current" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              />
            </svg>
          ) : (
            <LogOut size={15} />
          )}
        </button>
      </div>
    </header>
  );
};

export default Topbar;
