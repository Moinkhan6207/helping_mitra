import React from 'react';

/**
 * Placeholder admin panel page for folder compliance.
 * Authentic admin modules will be built in the admin phases.
 */
export default function AdminPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-950 text-slate-100">
      <div className="text-center p-8 bg-slate-900 border border-slate-800 rounded-3xl max-w-sm">
        <h1 className="text-2xl font-bold mb-2 text-white">Admin Panel</h1>
        <p className="text-sm text-slate-400">
          This is a placeholder page. Admin modules are deferred to future phases.
        </p>
      </div>
    </div>
  );
}
