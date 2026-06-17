'use client';

import React from 'react';
import { QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { queryClient } from '../lib/queryClient';

interface ReactQueryProviderProps {
  children: React.ReactNode;
}

/**
 * Root Client Component Provider mapping TanStack Query context down the page tree.
 * Registers the global query cache client and appends development debug tooling.
 */
export default function ReactQueryProvider({ children }: ReactQueryProviderProps) {
  return (
    <QueryClientProvider client={queryClient}>
      {children}
      {/* Devtools will render only when in development builds and collapsed by default */}
      <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
  );
}
