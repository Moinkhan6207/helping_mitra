import { useQuery, useMutation } from '@tanstack/react-query';
import { orderApi, OrderQueryFilters } from '../api/order.api';

export const useOrders = (filters?: OrderQueryFilters) => {
  return useQuery({
    queryKey: ['orders', filters],
    queryFn: () => orderApi.getOrders(filters),
    placeholderData: (previousData) => previousData,
  });
};

export const useOrderDetail = (orderId: string) => {
  return useQuery({
    queryKey: ['orderDetail', orderId],
    queryFn: () => orderApi.getOrderDetail(orderId),
    enabled: !!orderId,
  });
};

export const useOrderResult = (orderId: string, enabled: boolean) => {
  return useQuery({
    queryKey: ['orderResult', orderId],
    queryFn: () => orderApi.getOrderResult(orderId),
    enabled: !!orderId && enabled,
  });
};

export const useResultFileAccess = (orderId: string) => {
  return useMutation({
    mutationFn: (action: 'VIEW' | 'DOWNLOAD') => orderApi.getResultFileAccess(orderId, action),
  });
};
