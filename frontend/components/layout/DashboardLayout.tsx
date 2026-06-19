'use client';

import React, { useState } from 'react';
import { AuthGuard } from '@/features/auth/components/AuthGuard';
import { DashboardHeader } from '@/components/dashboard/DashboardHeader';
import { ServiceSidebar } from '@/components/dashboard/ServiceSidebar';
import { useThemeStore } from '@/features/theme/themeStore';

interface DashboardLayoutProps {
  children: React.ReactNode;
  /** Optional page title displayed in the header center (desktop) */
  pageTitle?: string;
}

/**
 * DashboardLayout — Phase 3 Primary Layout Shell
 *
 * Structure:
 *   [DashboardHeader]  ← full width, fixed top
 *   [ServiceSidebar] | [main content]  ← sidebar fixed left on desktop, drawer on mobile
 *
 * Security:
 *   Wrapped in AuthGuard with allowedRoles=['USER'].
 *   Rule 1: Unauthenticated users → redirected to /login
 *   Rule 2: Inactive users → blocked, redirected to /login?error=inactive
 */
export const DashboardLayout: React.FC<DashboardLayoutProps> = ({ children, pageTitle }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { isDarkMode } = useThemeStore();

  React.useEffect(() => {
    useThemeStore.getState().initializeTheme();
  }, []);

  return (
    <AuthGuard allowedRoles={['USER']}>
      <div className={`flex flex-col h-screen bg-[#f4f6f9] text-slate-800 overflow-hidden ${isDarkMode ? 'dark' : ''}`}>

        {/* ── Top Header Bar ── */}
        <DashboardHeader
          onToggleSidebar={() => setSidebarOpen(true)}
          pageTitle={pageTitle}
        />

        {/* ── Body: Sidebar + Content ── */}
        <div className="flex flex-1 min-w-0 overflow-hidden">

          {/* ── Service Sidebar Navigation ── */}
          <ServiceSidebar
            isOpen={sidebarOpen}
            onClose={() => setSidebarOpen(false)}
          />

          {/* ── Scrollable Main Content ── */}
          <main className="flex-1 overflow-y-auto bg-[#f4f6f9] p-5 md:p-7">
            <div className="mx-auto max-w-7xl">
              {children}
            </div>
          </main>
        </div>
      </div>
    </AuthGuard>
  );
};

export default DashboardLayout;
