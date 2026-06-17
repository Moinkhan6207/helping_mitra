'use client';

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '../authStore';

interface AuthGuardProps {
  children: React.ReactNode;
  allowedRoles?: ('USER' | 'ADMIN')[];
}

export const AuthGuard: React.FC<AuthGuardProps> = ({ children, allowedRoles }) => {
  const { user, status, logout } = useAuthStore();
  const router = useRouter();

  useEffect(() => {
    // Wait for the auth initialization to finish
    if (status === 'loading' || status === 'idle') return;

    if (status === 'unauthenticated' || !user) {
      router.replace('/login');
      return;
    }

    // Inactive user block
    if (user.status !== 'ACTIVE') {
      logout();
      router.replace('/login?error=inactive');
      return;
    }

    // Role Guard check
    if (allowedRoles && !allowedRoles.includes(user.role)) {
      if (user.role === 'ADMIN') {
        router.replace('/admin');
      } else {
        router.replace('/dashboard');
      }
    }
  }, [user, status, allowedRoles, router, logout]);

  // Render full-screen loading spinner while resolving auth state
  if (status === 'loading' || status === 'idle') {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-950 text-slate-100">
        <div className="flex flex-col items-center gap-4">
          <svg className="animate-spin h-8 w-8 text-primary-blue" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
          <p className="text-sm text-slate-400 font-semibold tracking-wide">Securing session...</p>
        </div>
      </div>
    );
  }

  // Prevent flash of protected contents while redirecting
  if (status === 'unauthenticated' || !user) {
    return null;
  }

  if (user.status !== 'ACTIVE') {
    return null;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return null;
  }

  return <>{children}</>;
};

export default AuthGuard;
