import { useQuery } from '@tanstack/react-query';
import { fetchAppHealth, fetchDbHealth } from './health.api';

/**
 * Custom React Query hook fetching and polling backend app health.
 * Refetches automatically every 15 seconds to maintain real-time telemetry.
 */
export const useAppHealth = () => {
  return useQuery({
    queryKey: ['health', 'app'],
    queryFn: fetchAppHealth,
    refetchInterval: 15000, // poll every 15 seconds
  });
};

/**
 * Custom React Query hook fetching and polling database connection status.
 * Refetches automatically every 15 seconds.
 */
export const useDbHealth = () => {
  return useQuery({
    queryKey: ['health', 'db'],
    queryFn: fetchDbHealth,
    refetchInterval: 15000, // poll every 15 seconds
  });
};
