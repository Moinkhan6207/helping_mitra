import axiosClient from '@/lib/axios';
import {
  AdminOrderQueryFilters,
  AdminOrdersListResponse,
  AdminOrderStats,
  AdminUserListItem,
  AdminOrderDetail,
  RevealFieldResponse,
  FileAccessResponse,
  AssignOrderPayload,
  ClaimOrderPayload,
  ReassignOrderPayload,
  StartProcessingPayload,
  OrderActionResponse,
  NoteType,
  OrderInternalNote,
  OrderInternalNotesResponse,
  OrderResultDraft,
  OrderResultResponse,
  ResultFileUploadResponse,
  ResultFileAccessResponse,
  CompleteOrderPayload,
  CompleteOrderResponse,
  CompletionSummary,
  RejectOrderPayload,
  RejectOrderResponse,
} from '../types';

export const adminOrderApi = {
  getOrders: async (params?: AdminOrderQueryFilters): Promise<AdminOrdersListResponse> => {
    const response = await axiosClient.get('/admin/orders', { params });
    return response.data.data;
  },

  getStats: async (params?: { startDate?: string; endDate?: string }): Promise<AdminOrderStats> => {
    const response = await axiosClient.get('/admin/orders/stats', { params });
    return response.data.data;
  },

  getAdmins: async (): Promise<AdminUserListItem[]> => {
    const response = await axiosClient.get('/admin/orders/admins');
    return response.data.data;
  },

  getOrderDetail: async (orderId: string): Promise<AdminOrderDetail> => {
    const response = await axiosClient.get(`/admin/orders/${orderId}`);
    return response.data.data;
  },

  revealField: async (orderId: string, fieldKey: string, reason: string): Promise<RevealFieldResponse> => {
    const response = await axiosClient.post(`/admin/orders/${orderId}/reveal`, { fieldKey, reason });
    return response.data.data;
  },

  getFileAccess: async (
    orderId: string,
    fileId: string,
    action: 'VIEW' | 'DOWNLOAD'
  ): Promise<FileAccessResponse> => {
    const response = await axiosClient.get(`/admin/orders/${orderId}/documents/${fileId}/url?action=${action}`);
    return response.data.data;
  },

  assignOrder: async (orderId: string, payload: AssignOrderPayload): Promise<OrderActionResponse> => {
    const response = await axiosClient.post(`/admin/orders/${orderId}/assign`, payload);
    return response.data.data;
  },

  claimOrder: async (orderId: string, payload: ClaimOrderPayload): Promise<OrderActionResponse> => {
    const response = await axiosClient.post(`/admin/orders/${orderId}/claim`, payload);
    return response.data.data;
  },

  reassignOrder: async (orderId: string, payload: ReassignOrderPayload): Promise<OrderActionResponse> => {
    const response = await axiosClient.post(`/admin/orders/${orderId}/reassign`, payload);
    return response.data.data;
  },

  startProcessing: async (orderId: string, payload: StartProcessingPayload): Promise<OrderActionResponse> => {
    const response = await axiosClient.patch(`/admin/orders/${orderId}/start-processing`, payload);
    return response.data.data;
  },

  addInternalNote: async (
    orderId: string,
    payload: { note: string; noteType?: NoteType }
  ): Promise<OrderInternalNote> => {
    const response = await axiosClient.post(`/admin/orders/${orderId}/notes`, payload);
    return response.data.data;
  },

  getInternalNotes: async (
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
  ): Promise<OrderInternalNotesResponse> => {
    const response = await axiosClient.get(`/admin/orders/${orderId}/notes`, { params });
    return response.data.data;
  },

  getResultDraft: async (orderId: string): Promise<OrderResultResponse> => {
    const response = await axiosClient.get(`/admin/orders/${orderId}/result`);
    return response.data.data;
  },

  saveResultDraft: async (orderId: string, payload: OrderResultDraft): Promise<OrderResultDraft> => {
    const response = await axiosClient.post(`/admin/orders/${orderId}/result/draft`, payload);
    return response.data.data;
  },

  validateResult: async (orderId: string): Promise<{ success: boolean; message: string }> => {
    const response = await axiosClient.post(`/admin/orders/${orderId}/result/validate`);
    return response.data.data;
  },

  uploadResultFile: async (
    orderId: string,
    metadata: { storagePath: string; fileName: string; fileType: string; fileSize: number }
  ): Promise<ResultFileUploadResponse> => {
    const response = await axiosClient.post(`/admin/orders/${orderId}/result/upload`, metadata);
    return response.data.data;
  },

  getResultFileAccess: async (
    orderId: string,
    action: 'VIEW' | 'DOWNLOAD'
  ): Promise<ResultFileAccessResponse> => {
    const response = await axiosClient.post(`/admin/orders/${orderId}/result/access`, { action });
    return response.data.data;
  },

  completeOrder: async (
    orderId: string,
    payload: CompleteOrderPayload
  ): Promise<CompleteOrderResponse> => {
    const response = await axiosClient.post(`/admin/orders/${orderId}/complete`, payload);
    return response.data.data;
  },

  getCompletionSummary: async (orderId: string): Promise<CompletionSummary> => {
    const response = await axiosClient.get(`/admin/orders/${orderId}/completion-summary`);
    return response.data.data;
  },

  rejectOrder: async (
    orderId: string,
    payload: RejectOrderPayload
  ): Promise<RejectOrderResponse> => {
    const response = await axiosClient.post(`/admin/orders/${orderId}/reject`, payload);
    return response.data.data;
  },
};
export default adminOrderApi;
