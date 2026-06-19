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

export const orderApi = {
  getOrders: async (params?: OrderQueryFilters): Promise<OrdersListResponse> => {
    const response = await axiosClient.get('/orders', { params });
    return response.data.data;
  },

  getOrderDetail: async (orderId: string): Promise<OrderData> => {
    const response = await axiosClient.get(`/orders/${orderId}`);
    return response.data.data.order;
  },
};
