import { useQuery } from '@tanstack/react-query';
import { adminOrderApi } from '../api/admin-order.api';
import { AdminOrderQueryFilters } from '../types';

export const useAdminOrders = (filters?: AdminOrderQueryFilters) => {
  return useQuery({
    queryKey: ['adminOrders', filters],
    queryFn: () => adminOrderApi.getOrders(filters),
  });
};

export const useAdminOrderStats = (filters?: { startDate?: string; endDate?: string }, options?: { enabled?: boolean }) => {
  return useQuery({
    queryKey: ['adminOrderStats', filters],
    queryFn: () => adminOrderApi.getStats(filters),
    refetchInterval: 300000, // Poll stats every 5 minutes instead of 15s to avoid rate limiting
    staleTime: 60000, // Consider data fresh for 1 minute
    ...options,
  });
};

export const useAdminsList = () => {
  return useQuery({
    queryKey: ['adminsList'],
    queryFn: () => adminOrderApi.getAdmins(),
    staleTime: 600000, // Cache list of administrators for 10 mins as accounts are static
  });
};
