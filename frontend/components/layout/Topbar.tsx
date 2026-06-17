'use client';

import React from 'react';
import { Menu, LogOut, User as UserIcon } from 'lucide-react';
import { useAuthStore } from '@/features/auth/authStore';
import { useLogout } from '@/features/auth/hooks/useLogout';

interface TopbarProps {
  onToggleSidebar: () => void;
  title?: string;
}

export const Topbar: React.FC<TopbarProps> = ({ onToggleSidebar, title = 'Dashboard' }) => {
  const { user } = useAuthStore();
  const logoutMutation = useLogout();

  const handleLogout = () => {
    logoutMutation.mutate();
  };

  return (
    <header className="h-16 border-b border-slate-800/80 bg-slate-900 px-6 flex items-center justify-between z-30 select-none">
      <div className="flex items-center gap-3">
        {/* Toggle button on Mobile/Tablet */}
        <button
          onClick={onToggleSidebar}
          className="lg:hidden p-2 rounded-xl hover:bg-slate-800 text-slate-400 hover:text-white transition-colors focus:outline-none focus:ring-2 focus:ring-slate-800"
          aria-label="Toggle sidebar menu"
        >
          <Menu size={20} />
        </button>

        <h1 className="text-base font-bold text-white tracking-tight">{title}</h1>
      </div>

      <div className="flex items-center gap-4">
        {/* Quick User summary details */}
        <div className="hidden sm:flex flex-col items-end text-right">
          <span className="text-xs font-semibold text-slate-200">{user?.name}</span>
          <span className="text-[10px] text-slate-500 uppercase font-bold tracking-wider mt-0.5">
            {user?.role === 'ADMIN' ? 'Admin' : user?.userType?.replace('_', ' ') || 'Partner'}
          </span>
        </div>

        {/* Avatar badge */}
        <div className="w-9 h-9 rounded-xl bg-slate-800 border border-slate-700/60 flex items-center justify-center text-slate-300">
          <UserIcon size={16} />
        </div>

        {/* Logout Button */}
        <button
          onClick={handleLogout}
          disabled={logoutMutation.isPending}
          className="p-2 rounded-xl border border-slate-800 hover:border-slate-700/60 hover:bg-red-500/10 text-slate-400 hover:text-red-400 transition-all duration-200 focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed"
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
            <LogOut size={16} />
          )}
        </button>
      </div>
    </header>
  );
};

export default Topbar;
