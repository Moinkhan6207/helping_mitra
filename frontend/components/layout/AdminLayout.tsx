'use client';

import React, { useState } from 'react';
import { AuthGuard } from '@/features/auth/components/AuthGuard';
import { Sidebar } from './Sidebar';
import { Topbar } from './Topbar';

interface AdminLayoutProps {
  children: React.ReactNode;
}

export const AdminLayout: React.FC<AdminLayoutProps> = ({ children }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <AuthGuard allowedRoles={['ADMIN']}>
      <div className="flex h-screen bg-slate-950 text-slate-100 overflow-hidden">
        {/* Navigation Sidebar */}
        <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

        {/* Right workspace area */}
        <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
          {/* Header Bar */}
          <Topbar onToggleSidebar={() => setSidebarOpen(true)} title="Admin Control Panel" />

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

export default AdminLayout;
