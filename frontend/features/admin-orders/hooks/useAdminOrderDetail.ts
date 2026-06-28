import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { adminOrderApi } from '../api/admin-order.api';

import { CompleteOrderPayload } from '../types';

export const useAdminOrderDetail = (orderId: string) => {
  return useQuery({
    queryKey: ['adminOrderDetail', orderId],
    queryFn: () => adminOrderApi.getOrderDetail(orderId),
    enabled: !!orderId,
  });
};

export const useRevealFieldMutation = (orderId: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ fieldKey, reason }: { fieldKey: string; reason: string }) =>
      adminOrderApi.revealField(orderId, fieldKey, reason),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminOrderDetail', orderId] });
    },
  });
};

export const useFileAccessMutation = (orderId: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ fileId, action }: { fileId: string; action: 'VIEW' | 'DOWNLOAD' }) =>
      adminOrderApi.getFileAccess(orderId, fileId, action),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminOrderDetail', orderId] });
    },
  });
};

export const useOrderInternalNotes = (
  orderId: string,
  params?: {
    page?: number;
    limit?: number;
    search?: string;
    noteType?: string;
    authorId?: string;
    startDate?: string;
    endDate?: string;
  }
) => {
  return useQuery({
    queryKey: ['orderInternalNotes', orderId, params],
    queryFn: () => adminOrderApi.getInternalNotes(orderId, params),
    enabled: !!orderId,
  });
};

export const useAddOrderNoteMutation = (orderId: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: { note: string; noteType?: any }) =>
      adminOrderApi.addInternalNote(orderId, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['orderInternalNotes', orderId] });
      queryClient.invalidateQueries({ queryKey: ['adminOrderDetail', orderId] });
    },
  });
};

export const useOrderResultDraft = (orderId: string, enabled = true) => {
  return useQuery({
    queryKey: ['orderResultDraft', orderId],
    queryFn: () => adminOrderApi.getResultDraft(orderId),
    enabled: !!orderId && enabled,
  });
};

export const useSaveResultDraftMutation = (orderId: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: any) => adminOrderApi.saveResultDraft(orderId, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['orderResultDraft', orderId] });
      queryClient.invalidateQueries({ queryKey: ['adminOrderDetail', orderId] });
    },
  });
};

export const useValidateResultMutation = (orderId: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => adminOrderApi.validateResult(orderId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['orderResultDraft', orderId] });
      queryClient.invalidateQueries({ queryKey: ['adminOrderDetail', orderId] });
    },
  });
};

export const useUploadResultFileMutation = (orderId: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (metadata: { storagePath: string; fileName: string; fileType: string; fileSize: number }) =>
      adminOrderApi.uploadResultFile(orderId, metadata),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['orderResultDraft', orderId] });
      queryClient.invalidateQueries({ queryKey: ['adminOrderDetail', orderId] });
    },
  });
};

export const useGetResultFileAccessMutation = (orderId: string) => {
  return useMutation({
    mutationFn: (action: 'VIEW' | 'DOWNLOAD') => adminOrderApi.getResultFileAccess(orderId, action),
  });
};

export const useCompleteOrderMutation = (orderId: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: CompleteOrderPayload) =>
      adminOrderApi.completeOrder(orderId, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminOrderDetail', orderId] });
      queryClient.invalidateQueries({ queryKey: ['orderResultDraft', orderId] });
      queryClient.invalidateQueries({ queryKey: ['adminOrderStats'] });
      queryClient.invalidateQueries({ queryKey: ['completionSummary', orderId] });
    },
  });
};

export const useCompletionSummary = (orderId: string, enabled = true) => {
  return useQuery({
    queryKey: ['completionSummary', orderId],
    queryFn: () => adminOrderApi.getCompletionSummary(orderId),
    enabled: !!orderId && enabled,
  });
};

export const useRejectOrderMutation = (orderId: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: {
      refundOption: 'FULL_REFUND' | 'NO_REFUND';
      internalRejectionReason: string;
      userVisibleRejectionReason: string;
      noRefundReason?: string;
      version: number;
      idempotencyKey?: string;
    }) => adminOrderApi.rejectOrder(orderId, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminOrderDetail', orderId] });
      queryClient.invalidateQueries({ queryKey: ['adminOrderStats'] });
      queryClient.invalidateQueries({ queryKey: ['adminOrders'] });
    },
  });
};
