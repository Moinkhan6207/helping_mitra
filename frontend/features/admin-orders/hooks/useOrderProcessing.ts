import { useMutation, useQueryClient } from '@tanstack/react-query';
import { adminOrderApi } from '../api/admin-order.api';
import {
  AssignOrderPayload,
  ClaimOrderPayload,
  ReassignOrderPayload,
  StartProcessingPayload,
} from '../types';

export const useAssignOrderMutation = (orderId: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: AssignOrderPayload) => adminOrderApi.assignOrder(orderId, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminOrderDetail', orderId] });
      queryClient.invalidateQueries({ queryKey: ['adminOrders'] });
    },
  });
};

export const useClaimOrderMutation = (orderId: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: ClaimOrderPayload) => adminOrderApi.claimOrder(orderId, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminOrderDetail', orderId] });
      queryClient.invalidateQueries({ queryKey: ['adminOrders'] });
    },
  });
};

export const useReassignOrderMutation = (orderId: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: ReassignOrderPayload) => adminOrderApi.reassignOrder(orderId, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminOrderDetail', orderId] });
      queryClient.invalidateQueries({ queryKey: ['adminOrders'] });
    },
  });
};

export const useStartProcessingMutation = (orderId: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: StartProcessingPayload) => adminOrderApi.startProcessing(orderId, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminOrderDetail', orderId] });
      queryClient.invalidateQueries({ queryKey: ['adminOrders'] });
      queryClient.invalidateQueries({ queryKey: ['adminOrderStats'] });
    },
  });
};
