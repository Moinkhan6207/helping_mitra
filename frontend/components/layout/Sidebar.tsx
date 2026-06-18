'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname, useSearchParams } from 'next/navigation';
import { useAuthStore } from '@/features/auth/authStore';
import { useCategories } from '@/features/services/hooks/useCategories';
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
  ChevronRight,
  ChevronDown,
  Moon,
} from 'lucide-react';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

interface SidebarLink {
  name: string;
  href: string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
  status: string;
  badge?: string;
}

export const Sidebar: React.FC<SidebarProps> = ({ isOpen, onClose }) => {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { user } = useAuthStore();
  const role = user?.role || 'USER';
  const { data: categories = [] } = useCategories();

  const [servicesExpanded, setServicesExpanded] = React.useState(
    pathname.startsWith('/dashboard/services')
  );

  React.useEffect(() => {
    if (pathname.startsWith('/dashboard/services')) {
      setServicesExpanded(true);
    }
  }, [pathname]);

  const handleLinkClick = (name: string, e: React.MouseEvent) => {
    if (name === 'Services' && role !== 'ADMIN') {
      setServicesExpanded(!servicesExpanded);
    } else {
      onClose();
    }
  };

  // Sidebar menus based on user role
  const userLinks: SidebarLink[] = [
    { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard, status: 'active', badge: 'New' },
    { name: 'Wallet', href: '#', icon: Wallet, status: 'coming-soon' },
    { name: 'Services', href: '/dashboard/services', icon: Grid, status: 'active' },
    { name: 'My Orders', href: '#', icon: ShoppingBag, status: 'coming-soon' },
    { name: 'Support', href: '#', icon: HelpCircle, status: 'coming-soon' },
  ];

  const adminLinks: SidebarLink[] = [
    { name: 'Admin Panel', href: '/admin', icon: Shield, status: 'active' },
    { name: 'User Management', href: '#', icon: Users, status: 'coming-soon' },
    { name: 'Service Management', href: '/admin/services', icon: Grid, status: 'active' },
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
          className="fixed inset-0 z-40 bg-slate-900/40 backdrop-blur-xs lg:hidden transition-opacity duration-300"
        />
      )}

      {/* Sidebar Navigation Drawer */}
      <aside
        className={`
          fixed top-0 bottom-0 left-0 z-50 w-72 bg-white border-r border-slate-200 flex flex-col transition-transform duration-300 lg:translate-x-0 lg:static lg:z-auto
          ${isOpen ? 'translate-x-0' : '-translate-x-full'}
        `}
      >
        {/* Header branding - Visible only on mobile drawers */}
        <div className="h-16 px-6 border-b border-slate-100 flex items-center justify-between lg:hidden bg-[#0c1a30]">
          <Link
            href="/dashboard"
            className="flex items-center gap-2.5 text-base font-bold tracking-tight text-white select-none"
          >
            <div className="w-7 h-7 rounded-lg bg-gradient-to-tr from-[#145BFF] to-teal-400 flex items-center justify-center text-[10px] font-black text-white shadow-md shadow-blue-500/15">
              HM
            </div>
            <span>
              Helping <span className="text-[#145BFF]">Mitra</span>
            </span>
          </Link>

          {/* Close button for Mobile drawers */}
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-300 hover:text-white transition-colors focus:outline-none"
          >
            <X size={16} />
          </button>
        </div>

        {/* Navigation list */}
        <nav className="flex-1 py-6 px-4 space-y-1.5 overflow-y-auto">
          {menuLinks.map((link, idx) => {
            const Icon = link.icon;
            const isComingSoon = link.status === 'coming-soon';
            const isActive = !isComingSoon && (link.href === '/admin' ? pathname === '/admin' : pathname.startsWith(link.href));

            return (
              <div key={idx} className="relative group">
                {isComingSoon ? (
                  <div className="flex items-center justify-between w-full px-4 py-2.5 text-slate-400 rounded-xl text-sm font-medium border border-transparent select-none">
                    <div className="flex items-center gap-3">
                      <Icon size={17} className="text-slate-350" />
                      <span>{link.name}</span>
                    </div>
                    <span className="text-[8px] font-black px-1.5 py-0.5 bg-slate-50 border border-slate-200 rounded text-slate-400 uppercase tracking-wider scale-90 origin-right transition-transform group-hover:scale-95 duration-200">
                      Soon
                    </span>
                  </div>
                ) : (
                  <>
                    <Link
                      href={link.href}
                      onClick={(e) => handleLinkClick(link.name, e)}
                      className={`
                        flex items-center justify-between w-full px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 border active:scale-[0.99]
                        ${
                          isActive
                            ? 'bg-[#145BFF] border-[#145BFF] text-white font-semibold shadow-md shadow-blue-500/10'
                            : 'bg-transparent border-transparent text-slate-700 hover:bg-slate-50 hover:text-slate-950 hover:border-slate-100/50'
                        }
                      `}
                    >
                      <div className="flex items-center gap-3">
                        <Icon size={17} className={isActive ? 'text-white' : 'text-[#145BFF]'} />
                        <span>{link.name}</span>
                      </div>
                      
                      <div className="flex items-center gap-1.5">
                        {link.badge && (
                          <span className="text-[9px] font-bold px-1.5 py-0.5 bg-rose-500 rounded text-white uppercase tracking-wider scale-90">
                            {link.badge}
                          </span>
                        )}
                        {link.name === 'Services' && role !== 'ADMIN' ? (
                          servicesExpanded ? (
                            <ChevronDown size={13} className={isActive ? 'text-white/80' : 'text-slate-400'} />
                          ) : (
                            <ChevronRight size={13} className={isActive ? 'text-white/80' : 'text-slate-400'} />
                          )
                        ) : (
                          <ChevronRight size={13} className={isActive ? 'text-white/80' : 'text-slate-300 group-hover:text-slate-400'} />
                        )}
                      </div>
                    </Link>

                    {/* Submenu for user services */}
                    {servicesExpanded && link.name === 'Services' && role !== 'ADMIN' && (
                      <div className="mt-1 ml-4 pl-3 border-l border-slate-150 space-y-1 animate-in fade-in duration-200">
                        {categories.map((cat) => {
                          const isCatActive = pathname === '/dashboard/services' && searchParams.get('category') === cat.slug;
                          return (
                            <Link
                              key={cat.id}
                              href={`/dashboard/services?category=${cat.slug}`}
                              onClick={onClose}
                              className={`flex items-center justify-between w-full px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                                isCatActive
                                  ? 'text-primary-blue bg-blue-50/50 font-bold'
                                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                              }`}
                            >
                              <span className="truncate">{cat.name}</span>
                            </Link>
                          );
                        })}
                      </div>
                    )}
                  </>
                )}
              </div>
            );
          })}
        </nav>

        {/* Night mode toggle switch widget */}
        <div className="px-5 py-3 border-t border-slate-100 flex items-center justify-between text-slate-700 text-xs font-semibold select-none">
          <div className="flex items-center gap-2.5">
            <span className="text-slate-400"><Moon size={16} /></span>
            <span>Night mode</span>
          </div>
          <button 
            onClick={() => window.alert('Night mode feature is coming soon!')}
            className="w-8 h-4.5 bg-slate-200 rounded-full p-0.5 relative transition-colors duration-200 focus:outline-none cursor-pointer"
          >
            <div className="w-3.5 h-3.5 bg-white rounded-full shadow-sm" />
          </button>
        </div>

        {/* User context signature footer */}
        <div className="p-4 border-t border-slate-100 bg-slate-50/50 flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-slate-200 flex items-center justify-center text-xs font-black text-slate-600 select-none uppercase border border-slate-300/30">
            {user?.name?.slice(0, 2) || 'HM'}
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-xs font-bold text-slate-800 truncate leading-snug">{user?.name}</p>
            <p className="text-[9px] text-slate-500 truncate mt-0.5 leading-none">{user?.email}</p>
          </div>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
