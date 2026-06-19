'use client';

import React, { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { User, BookOpen, LogOut, ChevronDown } from 'lucide-react';
import { useAuthStore } from '@/features/auth/authStore';
import { useLogout } from '@/features/auth/hooks/useLogout';

/**
 * ProfileDropdown — Phase 3 User Profile Menu
 *
 * Menu Items:
 * - Profile (Coming Soon in Phase 3)
 * - Wallet Ledger (navigates to /dashboard/wallet)
 * - Logout (full logout flow: API → clear store → clear cache → redirect)
 */
export const ProfileDropdown: React.FC = () => {
  const [open, setOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const { user } = useAuthStore();
  const logoutMutation = useLogout();

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = () => {
    setOpen(false);
    logoutMutation.mutate();
  };

  const userTypeLabel =
    user?.role === 'ADMIN'
      ? 'Administrator'
      : user?.userType?.replace(/_/g, ' ') || 'Partner';

  const initials = user?.name
    ? user.name.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase()
    : 'HM';

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Trigger Button */}
      <button
        id="profile-dropdown-trigger"
        onClick={() => setOpen((prev) => !prev)}
        className="flex items-center gap-2 px-2.5 py-1.5 rounded-xl bg-[#162744] border border-slate-700/30 hover:border-slate-600/50 hover:bg-[#1e3256] transition-all duration-200 focus:outline-none group"
        aria-haspopup="true"
        aria-expanded={open}
      >
        {/* Avatar */}
        <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-[#145BFF] to-indigo-500 flex items-center justify-center text-white text-[11px] font-black shrink-0 shadow-md shadow-blue-900/30">
          {initials}
        </div>

        {/* Name + Role — hidden on xs screens */}
        <div className="hidden sm:flex flex-col text-left leading-tight max-w-[110px]">
          <span className="text-[11px] font-bold text-white truncate">{user?.name}</span>
          <span className="text-[9px] text-slate-400 uppercase font-black tracking-wider truncate">
            {userTypeLabel}
          </span>
        </div>

        <ChevronDown
          size={12}
          className={`text-slate-400 transition-transform duration-200 hidden sm:block ${open ? 'rotate-180' : ''}`}
        />
      </button>

      {/* Dropdown Menu */}
      {open && (
        <div
          id="profile-dropdown-menu"
          className="absolute right-0 top-full mt-2 w-52 bg-white border border-slate-200 rounded-2xl shadow-xl shadow-slate-200/60 z-50 overflow-hidden animate-in fade-in slide-in-from-top-1 duration-150"
          role="menu"
        >
          {/* User info header */}
          <div className="px-4 py-3 border-b border-slate-100 bg-slate-50">
            <p className="text-xs font-bold text-slate-800 truncate">{user?.name}</p>
            <p className="text-[10px] text-slate-500 truncate mt-0.5">{user?.email}</p>
            <span className="inline-block mt-1.5 px-2 py-0.5 text-[9px] font-black uppercase tracking-wider bg-blue-50 text-blue-600 border border-blue-100 rounded-full">
              {userTypeLabel}
            </span>
          </div>

          {/* Menu Items */}
          <div className="py-1.5" role="none">
            {/* Profile */}
            <Link
              id="profile-menu-profile"
              href="/dashboard/profile"
              onClick={() => setOpen(false)}
              className="flex items-center gap-3 w-full px-4 py-2.5 text-sm text-slate-600 hover:bg-slate-50 hover:text-slate-900 transition-colors group"
              role="menuitem"
            >
              <User size={15} className="text-slate-400 group-hover:text-[#145BFF] transition-colors" />
              <span>Profile</span>
            </Link>

            {/* Wallet Ledger */}
            <Link
              id="profile-menu-wallet-ledger"
              href="/dashboard/wallet"
              onClick={() => setOpen(false)}
              className="flex items-center gap-3 w-full px-4 py-2.5 text-sm text-slate-600 hover:bg-slate-50 hover:text-slate-900 transition-colors group"
              role="menuitem"
            >
              <BookOpen size={15} className="text-slate-400 group-hover:text-[#145BFF] transition-colors" />
              <span>Wallet Ledger</span>
            </Link>
          </div>

          {/* Logout */}
          <div className="border-t border-slate-100 py-1.5">
            <button
              id="profile-menu-logout"
              onClick={handleLogout}
              disabled={logoutMutation.isPending}
              className="flex items-center gap-3 w-full px-4 py-2.5 text-sm text-red-500 hover:bg-red-50 hover:text-red-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed group"
              role="menuitem"
            >
              {logoutMutation.isPending ? (
                <svg className="animate-spin h-3.5 w-3.5 text-red-400 shrink-0" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
              ) : (
                <LogOut size={15} className="shrink-0" />
              )}
              <span>{logoutMutation.isPending ? 'Signing out...' : 'Logout'}</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProfileDropdown;
