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
      <div className="flex flex-col h-screen bg-[#f4f6f9] text-slate-800 overflow-hidden">
        {/* Header Bar */}
        <Topbar onToggleSidebar={() => setSidebarOpen(true)} title="Partner Workspace" />

        <div className="flex flex-1 min-w-0 overflow-hidden">
          {/* Navigation Sidebar */}
          <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

          {/* Scrollable content body */}
          <main className="flex-1 overflow-y-auto bg-[#f4f6f9] p-6 md:p-8">
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
