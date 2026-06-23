'use client';

import React from 'react';
import Link from 'next/link';
import { Menu } from 'lucide-react';
import { useAuthStore } from '@/features/auth/authStore';
import { WalletBalanceCard } from './WalletBalanceCard';
import { ProfileDropdown } from './ProfileDropdown';

interface DashboardHeaderProps {
  /** Called when hamburger menu is tapped on mobile to open sidebar drawer */
  onToggleSidebar: () => void;
  /** Optional page title shown in center on desktop */
  pageTitle?: string;
}

/**
 * DashboardHeader — Phase 3 Primary Navigation Header
 *
 * Layout:
 * LEFT:   Hamburger (mobile) + Logo + "Helping Mitra"
 * CENTER: Current page title (desktop only)
 * RIGHT:  Wallet Balance (read-only, Rule 5) + User info + Profile Dropdown
 *
 * Security (Rule 1 & 2):
 * - Rendered inside AuthGuard — only authenticated ACTIVE users reach this.
 * - Wallet balance shown READ ONLY — no Add Money button.
 */
export const DashboardHeader: React.FC<DashboardHeaderProps> = ({
  onToggleSidebar,
  pageTitle,
}) => {
  const { user } = useAuthStore();

  return (
    <header
      id="dashboard-header"
      className="h-16 bg-[#0c1a30] px-4 md:px-6 flex items-center justify-between z-30 select-none shadow-md shrink-0"
    >
      {/* ── LEFT: Hamburger + Logo ── */}
      <div className="flex items-center gap-3 min-w-0">
        {/* Hamburger — mobile/tablet only */}
        <button
          id="sidebar-toggle-btn"
          onClick={onToggleSidebar}
          className="lg:hidden p-2 rounded-xl hover:bg-slate-800 text-slate-300 hover:text-white transition-colors focus:outline-none shrink-0"
          aria-label="Toggle navigation menu"
        >
          <Menu size={20} />
        </button>

        {/* Logo */}
        <Link
          href="/dashboard"
          id="header-logo-link"
          className="flex items-center gap-2 text-base font-bold tracking-tight text-white select-none shrink-0 group"
        >
          <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-[#145BFF] to-teal-400 flex items-center justify-center text-[11px] font-black text-white shadow-md shadow-blue-500/20 group-hover:shadow-blue-500/30 transition-shadow">
            HM
          </div>
          <span className="hidden xs:inline">
            Helping{' '}
            <span className="text-[#145BFF]">Mitra</span>
          </span>
        </Link>
      </div>

      {/* ── CENTER: Page title (desktop only) ── */}
      {pageTitle && (
        <div className="hidden md:flex absolute left-1/2 -translate-x-1/2 pointer-events-none">
          <span className="text-sm font-semibold text-slate-300 truncate max-w-xs">
            {pageTitle}
          </span>
        </div>
      )}

      {/* ── RIGHT: Wallet + Profile ── */}
      <div className="flex items-center gap-3 shrink-0">
        {/* Wallet Balance — USER role only */}
        {user?.role === 'USER' && (
          <div className="flex items-center gap-2">
            <div
              id="header-wallet-balance"
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-[#162744] border border-slate-700/30"
            >
              <WalletBalanceCard compact />
            </div>
            <Link
              id="header-add-money-btn"
              href="/dashboard/wallet/add-money"
              className="px-3 py-1.5 bg-[#f59e0b] hover:bg-[#e08e06] text-[#0c1a30] text-[10px] font-black tracking-wide rounded-lg transition-all active:scale-95 uppercase select-none shrink-0"
            >
              Add Money
            </Link>
          </div>
        )}

        {/* Profile Dropdown (name, role, menu) */}
        <ProfileDropdown />
      </div>
    </header>
  );
};

export default DashboardHeader;
