'use client';

import React, { useState } from 'react';
import { AuthGuard } from '@/features/auth/components/AuthGuard';
import { Sidebar } from './Sidebar';
import { Topbar } from './Topbar';

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export const DashboardLayout: React.FC<DashboardLayoutProps> = ({ children }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <AuthGuard allowedRoles={['USER']}>
      <div className="flex h-screen bg-slate-950 text-slate-100 overflow-hidden">
        {/* Navigation Sidebar */}
        <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

        {/* Right workspace area */}
        <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
          {/* Header Bar */}
          <Topbar onToggleSidebar={() => setSidebarOpen(true)} title="Partner Workspace" />

          {/* Scrollable content body */}
          <main className="flex-1 overflow-y-auto bg-slate-950 p-6 md:p-8">
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
