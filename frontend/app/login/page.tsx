import React from 'react';

/**
 * Placeholder login page for folder compliance.
 * Authentic login interface will be built in the authentication phase.
 */
export default function LoginPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-950 text-slate-100">
      <div className="text-center p-8 bg-slate-900 border border-slate-800 rounded-3xl max-w-sm">
        <h1 className="text-2xl font-bold mb-2 text-white">Login Panel</h1>
        <p className="text-sm text-slate-400">
          This is a placeholder page. Authentication logic is deferred to Phase 1.
        </p>
      </div>
    </div>
  );
}
