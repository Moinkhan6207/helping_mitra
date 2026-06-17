'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuthStore } from '@/features/auth/authStore';
import {
  LayoutDashboard,
  Wallet,
  Grid,
  ShoppingBag,
  HelpCircle,
  Users,
  BarChart3,
  Shield,
  X,
  Sparkles,
} from 'lucide-react';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ isOpen, onClose }) => {
  const pathname = usePathname();
  const { user } = useAuthStore();
  const role = user?.role || 'USER';

  // Sidebar menus based on user role
  const userLinks = [
    { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard, status: 'active' },
    { name: 'Wallet', href: '#', icon: Wallet, status: 'coming-soon' },
    { name: 'Services', href: '#', icon: Grid, status: 'coming-soon' },
    { name: 'My Orders', href: '#', icon: ShoppingBag, status: 'coming-soon' },
    { name: 'Support', href: '#', icon: HelpCircle, status: 'coming-soon' },
  ];

  const adminLinks = [
    { name: 'Admin Panel', href: '/admin', icon: Shield, status: 'active' },
    { name: 'User Management', href: '#', icon: Users, status: 'coming-soon' },
    { name: 'Service Management', href: '#', icon: Grid, status: 'coming-soon' },
    { name: 'Order Management', href: '#', icon: ShoppingBag, status: 'coming-soon' },
    { name: 'Wallet & Payments', href: '#', icon: Wallet, status: 'coming-soon' },
    { name: 'Reports', href: '#', icon: BarChart3, status: 'coming-soon' },
  ];

  const menuLinks = role === 'ADMIN' ? adminLinks : userLinks;

  return (
    <>
      {/* Mobile Sidebar Backdrop Overlay */}
      {isOpen && (
        <div
          onClick={onClose}
          className="fixed inset-0 z-40 bg-slate-950/60 backdrop-blur-sm lg:hidden transition-opacity duration-300"
        />
      )}

      {/* Sidebar Navigation Drawer */}
      <aside
        className={`
          fixed top-0 bottom-0 left-0 z-50 w-72 bg-slate-900 border-r border-slate-800/80 flex flex-col transition-transform duration-300 lg:translate-x-0 lg:static lg:z-auto
          ${isOpen ? 'translate-x-0' : '-translate-x-full'}
        `}
      >
        {/* Header branding */}
        <div className="h-16 px-6 border-b border-slate-800/80 flex items-center justify-between">
          <Link
            href="/"
            className="flex items-center gap-2.5 text-base font-bold tracking-tight text-white select-none"
          >
            <div className="w-7 h-7 rounded-lg bg-gradient-to-tr from-primary-blue to-teal-500 flex items-center justify-center text-[10px] font-black text-white shadow-md shadow-primary-blue/15">
              HM
            </div>
            <span>
              Helping <span className="text-primary-blue">Mitra</span>
            </span>
          </Link>

          {/* Close button for Mobile drawers */}
          <button
            onClick={onClose}
            className="lg:hidden p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition-colors focus:outline-none"
          >
            <X size={16} />
          </button>
        </div>

        {/* Navigation list */}
        <nav className="flex-1 py-6 px-4 space-y-1.5 overflow-y-auto">
          {menuLinks.map((link, idx) => {
            const Icon = link.icon;
            const isComingSoon = link.status === 'coming-soon';
            const isActive = !isComingSoon && pathname === link.href;

            return (
              <div key={idx} className="relative group">
                {isComingSoon ? (
                  <div className="flex items-center justify-between w-full px-4 py-3 text-slate-500 rounded-xl text-sm font-medium border border-transparent select-none">
                    <div className="flex items-center gap-3">
                      <Icon size={18} className="text-slate-600" />
                      <span>{link.name}</span>
                    </div>
                    <span className="text-[9px] font-bold px-2 py-0.5 bg-slate-950 border border-slate-800 rounded-full text-slate-500 uppercase tracking-wider scale-90 origin-right transition-transform group-hover:scale-95 duration-200">
                      Soon
                    </span>
                  </div>
                ) : (
                  <Link
                    href={link.href}
                    onClick={onClose}
                    className={`
                      flex items-center gap-3 w-full px-4 py-3 rounded-xl text-sm font-medium transition-all duration-150 border active:scale-[0.99]
                      ${
                        isActive
                          ? 'bg-primary-blue/10 border-primary-blue/20 text-primary-blue font-semibold'
                          : 'bg-transparent border-transparent text-slate-400 hover:bg-slate-800/40 hover:text-slate-200 hover:border-slate-800/20'
                      }
                    `}
                  >
                    <Icon size={18} className={isActive ? 'text-primary-blue' : 'text-slate-400 group-hover:text-slate-350'} />
                    <span>{link.name}</span>
                  </Link>
                )}
              </div>
            );
          })}
        </nav>

        {/* User context signature footer */}
        <div className="p-4 border-t border-slate-800/80 bg-slate-900/60 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-slate-800 flex items-center justify-center text-sm font-bold text-slate-200 select-none uppercase border border-slate-750">
            {user?.name?.slice(0, 2) || 'HM'}
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-xs font-semibold text-slate-200 truncate">{user?.name}</p>
            <p className="text-[10px] text-slate-500 truncate mt-0.5">{user?.email}</p>
          </div>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
