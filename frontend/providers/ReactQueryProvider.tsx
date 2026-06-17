'use client';

import React, { useEffect } from 'react';
import { QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { queryClient } from '../lib/queryClient';
import { useAuthStore } from '@/features/auth/authStore';

interface ReactQueryProviderProps {
  children: React.ReactNode;
}

/**
 * Root Client Component Provider mapping TanStack Query context down the page tree.
 * Registers the global query cache client and appends development debug tooling.
 * Also initializes client-side authentication on app boot.
 */
export default function ReactQueryProvider({ children }: ReactQueryProviderProps) {
  const initializeAuth = useAuthStore((state) => state.initializeAuth);

  useEffect(() => {
    initializeAuth();
  }, [initializeAuth]);

  return (
    <QueryClientProvider client={queryClient}>
      {children}
      {/* Devtools will render only when in development builds and collapsed by default */}
      <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
  );
}
