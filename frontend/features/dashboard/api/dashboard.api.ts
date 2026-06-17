import axiosClient from '@/lib/axios';
import { UserDashboardSummary, AdminDashboardSummary } from '../types';

export interface ApiSuccessResponse<T> {
  success: boolean;
  message: string;
  data: T;
}

export const dashboardApi = {
  getUserSummary: async (): Promise<ApiSuccessResponse<UserDashboardSummary>> => {
    const response = await axiosClient.get<ApiSuccessResponse<UserDashboardSummary>>('/dashboard/user-summary');
    return response.data;
  },

  getAdminSummary: async (): Promise<ApiSuccessResponse<AdminDashboardSummary>> => {
    const response = await axiosClient.get<ApiSuccessResponse<AdminDashboardSummary>>('/dashboard/admin-summary');
    return response.data;
  },
};
export default dashboardApi;
