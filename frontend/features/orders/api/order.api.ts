import axiosClient from '@/lib/axios';
import { OrderData, OrdersListResponse } from '../types';

export interface OrderQueryFilters {
  page?: number;
  limit?: number;
  orderStatus?: string;
  serviceId?: string;
  categoryName?: string;
  search?: string;
  startDate?: string;
  endDate?: string;
}

export interface UserOrderResult {
  orderId: string;
  orderNumber: string;
  orderStatus: string;
  resultAvailable: boolean;
  message?: string;
  resultType?: string;
  resultLabel?: string;
  completedAt?: string | null;
  userVisibleCompletionNote?: string | null;
  textValue?: string | null;
  fileName?: string | null;
  fileType?: string | null;
  fileSize?: number | null;
}

export interface ResultFileAccessResponse {
  signedUrl: string;
  fileName: string;
  fileType: string;
  fileSize: number;
  expiresAt: string;
}

export const orderApi = {
  getOrders: async (params?: OrderQueryFilters): Promise<OrdersListResponse> => {
    const response = await axiosClient.get('/orders', { params });
    return response.data.data;
  },

  getOrderDetail: async (orderId: string): Promise<OrderData> => {
    const response = await axiosClient.get(`/orders/${orderId}`);
    return response.data.data.order;
  },

  getOrderResult: async (orderId: string): Promise<UserOrderResult> => {
    const response = await axiosClient.get(`/orders/${orderId}/result`);
    return response.data.data;
  },

  getResultFileAccess: async (orderId: string, action: 'VIEW' | 'DOWNLOAD'): Promise<ResultFileAccessResponse> => {
    const response = await axiosClient.post(`/orders/${orderId}/result/access`, { action });
    return response.data.data;
  },

  getResultFileUrl: async (orderId: string): Promise<ResultFileAccessResponse> => {
    const response = await axiosClient.get(`/orders/my/${orderId}/result/url`);
    return response.data.data;
  },
};
