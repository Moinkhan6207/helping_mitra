'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  ShoppingBag,
  BookOpen,
  HelpCircle,
  LogOut,
  ChevronDown,
  ChevronRight,
  Grid3X3,
  Moon,
  Loader2,
  AlertCircle,
  RefreshCw,
  User,
} from 'lucide-react';
import { useAuthStore } from '@/features/auth/authStore';
import { useLogout } from '@/features/auth/hooks/useLogout';
import { useSidebarCategories } from '@/features/services/hooks/useSidebarCategories';
import type { SidebarCategory } from '@/features/services/hooks/useSidebarCategories';
import { useThemeStore } from '@/features/theme/themeStore';

interface ServiceSidebarProps {
  /** Controls visibility of the mobile drawer */
  isOpen: boolean;
  /** Called to close the sidebar (mobile drawer) */
  onClose: () => void;
}

/**
 * ServiceSidebar — Phase 3 Dynamic Service Navigation
 *
 * Structure:
 *  Dashboard
 *  [Dynamic Categories from API]
 *    └─ [Active Services under each category]
 *  My Orders
 *  Wallet Ledger
 *  Support
 *  Logout
 *
 * Rules enforced:
 *  Rule 3: Only ACTIVE categories shown (backend filters)
 *  Rule 4: Only ACTIVE services shown (backend filters)
 *  Rule 1 & 2: Rendered inside AuthGuard — only authenticated ACTIVE users see this
 *
 * UX Features:
 *  - Category accordion (expand/collapse with smooth animation)
 *  - Persist expanded state across route changes
 *  - Active route highlighted (blue background + border + text)
 *  - Mobile: drawer overlay, closes on route change and outside click
 */
export const ServiceSidebar: React.FC<ServiceSidebarProps> = ({ isOpen, onClose }) => {
  const pathname = usePathname();
  const { isDarkMode, toggleDarkMode } = useThemeStore();
  const { user } = useAuthStore();
  const logoutMutation = useLogout();

  const {
    data: categories = [],
    isLoading: categoriesLoading,
    isError: categoriesError,
    refetch: refetchCategories,
  } = useSidebarCategories();

  // Track which category accordions are expanded
  // Pre-expand category if current route is under it
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());

  // Auto-expand category when navigating into a service
  useEffect(() => {
    if (categories.length === 0) return;
    categories.forEach((cat: SidebarCategory) => {
      const hasActiveService = cat.services.some((s) =>
        pathname.startsWith(`/dashboard/services/${s.slug}`)
      );
      if (hasActiveService) {
        setExpandedCategories((prev) => new Set([...prev, cat.id]));
      }
    });
  }, [pathname, categories]);

  // Close mobile drawer on route change
  useEffect(() => {
    onClose();
  }, [pathname]); // eslint-disable-line react-hooks/exhaustive-deps

  const toggleCategory = useCallback((categoryId: string) => {
    setExpandedCategories((prev) => {
      const next = new Set(prev);
      if (next.has(categoryId)) {
        next.delete(categoryId);
      } else {
        next.add(categoryId);
      }
      return next;
    });
  }, []);

  const handleLogout = () => {
    logoutMutation.mutate();
  };

  // Check if a service route is active
  const isServiceActive = (slug: string) =>
    pathname.startsWith(`/dashboard/services/${slug}`);

  // Check if any service in a category is active
  const isCategoryRouteActive = (cat: SidebarCategory) =>
    cat.services.some((s) => isServiceActive(s.slug));

  const userInitials = user?.name
    ? user.name.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase()
    : 'HM';

  return (
    <>
      {/* ── Mobile Backdrop Overlay ── */}
      {isOpen && (
        <div
          id="sidebar-backdrop"
          onClick={onClose}
          className="fixed inset-0 z-40 bg-slate-900/50 backdrop-blur-sm lg:hidden transition-opacity duration-300"
          aria-hidden="true"
        />
      )}

      {/* ── Sidebar Panel ── */}
      <aside
        id="service-sidebar"
        role="navigation"
        aria-label="Dashboard navigation"
        className={`
          fixed top-0 bottom-0 left-0 z-50 w-[272px] bg-white border-r border-slate-200/80
          flex flex-col transition-transform duration-300 ease-in-out
          lg:translate-x-0 lg:static lg:z-auto lg:shrink-0
          ${isOpen ? 'translate-x-0 shadow-2xl shadow-slate-900/20' : '-translate-x-full'}
        `}
      >
        {/* ── Sidebar Brand Header (mobile only) ── */}
        <div className="h-16 px-5 border-b border-slate-100 flex items-center justify-between lg:hidden bg-[#0c1a30] shrink-0">
          <Link
            href="/dashboard"
            className="flex items-center gap-2 text-base font-bold tracking-tight text-white"
          >
            <div className="w-7 h-7 rounded-lg bg-gradient-to-tr from-[#145BFF] to-teal-400 flex items-center justify-center text-[10px] font-black text-white">
              HM
            </div>
            <span>
              Helping <span className="text-[#145BFF]">Mitra</span>
            </span>
          </Link>
          <button
            onClick={onClose}
            id="sidebar-close-btn"
            className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-300 hover:text-white transition-colors focus:outline-none"
            aria-label="Close navigation"
          >
            <ChevronRight size={16} />
          </button>
        </div>

        {/* ── Navigation List ── */}
        <nav className="flex-1 py-4 px-3 overflow-y-auto space-y-0.5">

          {/* Dashboard */}
          <NavItem
            id="nav-dashboard"
            href="/dashboard"
            label="Dashboard"
            icon={<LayoutDashboard size={16} />}
            isActive={pathname === '/dashboard'}
          />

          {/* ── Dynamic Service Categories ── */}
          <div className="pt-2 pb-1">
            <p className="px-3 text-[9px] font-black uppercase tracking-widest text-slate-400 mb-1.5">
              Services
            </p>

            {categoriesLoading && (
              <div className="flex items-center gap-2 px-3 py-2 text-slate-400">
                <Loader2 size={14} className="animate-spin shrink-0" />
                <span className="text-xs">Loading services...</span>
              </div>
            )}

            {categoriesError && (
              <div className="px-3 py-2">
                <div className="flex items-center gap-2 text-red-400 mb-1.5">
                  <AlertCircle size={14} className="shrink-0" />
                  <span className="text-xs">Failed to load</span>
                </div>
                <button
                  onClick={() => refetchCategories()}
                  className="flex items-center gap-1.5 text-xs text-[#145BFF] hover:text-blue-700 font-semibold transition-colors"
                >
                  <RefreshCw size={12} />
                  Retry
                </button>
              </div>
            )}

            {!categoriesLoading && !categoriesError && categories.length === 0 && (
              <div className="px-3 py-2 text-xs text-slate-400">No services available</div>
            )}

            {/* Category Accordion Items */}
            {categories.map((cat: SidebarCategory) => {
              const isExpanded = expandedCategories.has(cat.id);
              const catHasActiveRoute = isCategoryRouteActive(cat);

              return (
                <div key={cat.id} id={`nav-category-${cat.slug}`}>
                  {/* Category Header Button */}
                  <button
                    onClick={() => toggleCategory(cat.id)}
                    className={`
                      flex items-center justify-between w-full px-3 py-2.5 rounded-xl text-sm font-semibold
                      transition-all duration-150 border active:scale-[0.99] group
                      ${catHasActiveRoute
                        ? 'bg-blue-50 border-blue-100 text-[#145BFF]'
                        : 'bg-transparent border-transparent text-slate-700 hover:bg-slate-50 hover:text-slate-900 hover:border-slate-100/60'
                      }
                    `}
                    aria-expanded={isExpanded}
                    aria-controls={`nav-category-services-${cat.slug}`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <Grid3X3
                        size={15}
                        className={catHasActiveRoute ? 'text-[#145BFF] shrink-0' : 'text-slate-400 group-hover:text-[#145BFF] shrink-0 transition-colors'}
                      />
                      <span className="truncate">{cat.name}</span>
                      {cat.services.length > 0 && (
                        <span className={`text-[9px] font-black px-1.5 py-0.5 rounded-full shrink-0 ${
                          catHasActiveRoute ? 'bg-blue-100 text-blue-600' : 'bg-slate-100 text-slate-500'
                        }`}>
                          {cat.services.length}
                        </span>
                      )}
                    </div>
                    <div className="transition-transform duration-200 shrink-0">
                      {isExpanded
                        ? <ChevronDown size={13} className={catHasActiveRoute ? 'text-[#145BFF]' : 'text-slate-400'} />
                        : <ChevronRight size={13} className={catHasActiveRoute ? 'text-[#145BFF]' : 'text-slate-400'} />
                      }
                    </div>
                  </button>

                  {/* Service Sub-items with smooth expand/collapse */}
                  <div
                    id={`nav-category-services-${cat.slug}`}
                    className={`overflow-hidden transition-all duration-250 ease-in-out ${
                      isExpanded ? 'max-h-[500px] opacity-100' : 'max-h-0 opacity-0'
                    }`}
                    style={{ transitionProperty: 'max-height, opacity' }}
                  >
                    <div className="ml-3 pl-3 border-l border-slate-150 mt-0.5 mb-0.5 space-y-0.5">
                      {cat.services.map((service) => {
                        const active = isServiceActive(service.slug);
                        return (
                          <Link
                            key={service.id}
                            id={`nav-service-${service.slug}`}
                            href={`/dashboard/services/${service.slug}/apply`}
                            className={`
                              flex items-center gap-2 w-full px-3 py-2 rounded-lg text-xs font-semibold
                              transition-all duration-150 border
                              ${active
                                ? 'bg-[#145BFF] border-[#145BFF] text-white shadow-sm shadow-blue-500/20'
                                : 'border-transparent text-slate-600 hover:text-slate-900 hover:bg-slate-50 hover:border-slate-100/50'
                              }
                            `}
                          >
                            <span
                              className={`w-1 h-1 rounded-full shrink-0 ${active ? 'bg-white' : 'bg-slate-300'}`}
                            />
                            <span className="truncate leading-snug">{service.name}</span>
                          </Link>
                        );
                      })}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* ── Bottom Navigation ── */}
          <div className="pt-2 space-y-0.5">
            <div className="px-3 pb-1">
              <div className="border-t border-slate-100" />
            </div>

            <NavItem
              id="nav-my-orders"
              href="/dashboard/orders"
              label="My Orders"
              icon={<ShoppingBag size={16} />}
              isActive={pathname.startsWith('/dashboard/orders')}
            />

            <NavItem
              id="nav-wallet-ledger"
              href="/dashboard/wallet"
              label="Wallet Ledger"
              icon={<BookOpen size={16} />}
              isActive={pathname.startsWith('/dashboard/wallet')}
            />

            <NavItem
              id="nav-support"
              href="/dashboard/support"
              label="Support"
              icon={<HelpCircle size={16} />}
              isActive={pathname.startsWith('/dashboard/support')}
            />

            <NavItem
              id="nav-profile"
              href="/dashboard/profile"
              label="My Account"
              icon={<User size={16} />}
              isActive={pathname === '/dashboard/profile'}
            />
          </div>

          {/* Logout Button */}
          <div className="pt-1">
            <button
              id="sidebar-logout-btn"
              onClick={handleLogout}
              disabled={logoutMutation.isPending}
              className="flex items-center gap-3 w-full px-3 py-2.5 rounded-xl text-sm font-semibold text-red-500 hover:bg-red-50 hover:text-red-600 border border-transparent hover:border-red-100/50 transition-all duration-150 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {logoutMutation.isPending ? (
                <Loader2 size={15} className="animate-spin shrink-0" />
              ) : (
                <LogOut size={15} className="shrink-0" />
              )}
              <span>{logoutMutation.isPending ? 'Signing out...' : 'Logout'}</span>
            </button>
          </div>
        </nav>

        {/* ── Night Mode Toggle (placeholder) ── */}
        <div className="px-4 py-3 border-t border-slate-100 flex items-center justify-between text-slate-600 shrink-0">
          <div className="flex items-center gap-2.5 text-xs font-semibold">
            <Moon size={14} className="text-slate-400" />
            <span>Night mode</span>
          </div>
          <button
            onClick={toggleDarkMode}
            className={`w-8 h-4.5 rounded-full p-0.5 relative transition-colors duration-200 focus:outline-none cursor-pointer ${
              isDarkMode ? 'bg-emerald-500' : 'bg-slate-200'
            }`}
            aria-label="Toggle night mode"
          >
            <div
              className={`w-3.5 h-3.5 bg-white rounded-full shadow-sm transition-transform duration-200 ${
                isDarkMode ? 'translate-x-3.5' : 'translate-x-0'
              }`}
            />
          </button>
        </div>

        {/* ── User Signature Footer ── */}
        <div className="p-3.5 border-t border-slate-100 bg-slate-50/60 flex items-center gap-3 shrink-0">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#145BFF] to-indigo-500 flex items-center justify-center text-white text-xs font-black shrink-0 shadow-md shadow-blue-500/20">
            {userInitials}
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-xs font-bold text-slate-800 truncate leading-snug">{user?.name}</p>
            <p className="text-[10px] font-semibold text-slate-600 dark:text-slate-400 truncate mt-0.5">{user?.email}</p>
          </div>
        </div>
      </aside>
    </>
  );
};

// ─── Reusable NavItem ─────────────────────────────────────────────────────────

interface NavItemProps {
  href: string;
  label: string;
  icon: React.ReactNode;
  isActive: boolean;
  id?: string;
  badge?: string;
}

const NavItem: React.FC<NavItemProps> = ({ href, label, icon, isActive, id, badge }) => (
  <Link
    href={href}
    id={id}
    className={`
      flex items-center justify-between w-full px-3 py-2.5 rounded-xl text-sm font-semibold
      transition-all duration-150 border active:scale-[0.99] group
      ${isActive
        ? 'bg-[#145BFF] border-[#145BFF] text-white shadow-md shadow-blue-500/15'
        : 'bg-transparent border-transparent text-slate-700 hover:bg-slate-50 hover:text-slate-900 hover:border-slate-100/60'
      }
    `}
  >
    <div className="flex items-center gap-2.5 min-w-0">
      <span className={isActive ? 'text-white' : 'text-[#145BFF] group-hover:text-[#145BFF]'}>
        {icon}
      </span>
      <span className="truncate">{label}</span>
    </div>
    <div className="flex items-center gap-1.5 shrink-0">
      {badge && (
        <span className={`text-[9px] font-black px-1.5 py-0.5 rounded-full ${
          isActive ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-500'
        }`}>
          {badge}
        </span>
      )}
      <ChevronRight
        size={12}
        className={isActive ? 'text-white/70' : 'text-slate-300 group-hover:text-slate-400'}
      />
    </div>
  </Link>
);

export default ServiceSidebar;
