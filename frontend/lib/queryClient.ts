import { QueryClient } from '@tanstack/react-query';

/**
 * Global QueryClient instance defining standard React Query request behaviors.
 */
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60000, // 1 minute stale threshold
      gcTime: 300000,   // Keep cache in memory for 5 minutes (garbage collection time)
      refetchOnWindowFocus: false, // Prevent redundant requests when user switches tabs
      retry: (failureCount, error: any) => {
        // Do not retry on client operational failures (e.g. 401, 403, 404)
        const status = error?.error?.status || error?.response?.status;
        if (status >= 400 && status < 500) {
          return false;
        }
        // Retry server errors or networking hiccups up to 2 times
        return failureCount < 2;
      },
    },
  },
});
