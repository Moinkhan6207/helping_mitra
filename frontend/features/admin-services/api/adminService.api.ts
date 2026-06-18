import axiosClient from '@/lib/axios';
import {
  AdminCategoryData,
  AdminServiceListItem,
  AdminServiceDetailsData,
  AdminServiceFieldData,
  AdminServiceDocumentData,
  PriceHistoryResponse,
  AdminServiceQueryOptions,
} from '../types';

export const adminServiceApi = {
  // Category management
  createCategory: async (data: Partial<AdminCategoryData>): Promise<AdminCategoryData> => {
    const response = await axiosClient.post('/admin/service-categories', data);
    return response.data.data;
  },
  getCategories: async (): Promise<AdminCategoryData[]> => {
    const response = await axiosClient.get('/admin/service-categories');
    return response.data.data;
  },
  updateCategory: async (id: string, data: Partial<AdminCategoryData>): Promise<AdminCategoryData> => {
    const response = await axiosClient.patch(`/admin/service-categories/${id}`, data);
    return response.data.data;
  },
  deleteCategory: async (id: string): Promise<AdminCategoryData> => {
    const response = await axiosClient.delete(`/admin/service-categories/${id}`);
    return response.data.data;
  },

  // Service management
  createService: async (data: Partial<AdminServiceDetailsData>): Promise<AdminServiceDetailsData> => {
    const response = await axiosClient.post('/admin/services', data);
    return response.data.data;
  },
  getServices: async (params: AdminServiceQueryOptions) => {
    const response = await axiosClient.get('/admin/services', { params });
    return response.data.data; // contains services and pagination
  },
  getServiceById: async (id: string): Promise<AdminServiceDetailsData> => {
    const response = await axiosClient.get(`/admin/services/${id}`);
    return response.data.data;
  },
  updateService: async (id: string, data: Partial<AdminServiceDetailsData>): Promise<AdminServiceDetailsData> => {
    const response = await axiosClient.patch(`/admin/services/${id}`, data);
    return response.data.data;
  },
  /** FR-2.8: Dedicated MRP update — hits strict validation endpoint */
  updateMrp: async (id: string, mrp: number): Promise<AdminServiceDetailsData> => {
    const response = await axiosClient.patch(`/admin/services/${id}/mrp`, { mrp });
    return response.data.data;
  },
  /** FR-2.7: Dedicated status toggle endpoint */
  updateStatus: async (id: string, status: 'ACTIVE' | 'INACTIVE'): Promise<AdminServiceDetailsData> => {
    const response = await axiosClient.patch(`/admin/services/${id}/status`, { status });
    return response.data.data;
  },
  deleteService: async (id: string): Promise<AdminServiceDetailsData> => {
    const response = await axiosClient.delete(`/admin/services/${id}`);
    return response.data.data;
  },

  // Field management
  createField: async (serviceId: string, data: Partial<AdminServiceFieldData>): Promise<AdminServiceFieldData> => {
    const response = await axiosClient.post(`/admin/services/${serviceId}/fields`, data);
    return response.data.data;
  },
  updateField: async (id: string, data: Partial<AdminServiceFieldData>): Promise<AdminServiceFieldData> => {
    const response = await axiosClient.patch(`/admin/fields/${id}`, data);
    return response.data.data;
  },
  deleteField: async (id: string): Promise<void> => {
    await axiosClient.delete(`/admin/fields/${id}`);
  },

  // Document management
  createDocument: async (serviceId: string, data: Partial<AdminServiceDocumentData>): Promise<AdminServiceDocumentData> => {
    const response = await axiosClient.post(`/admin/services/${serviceId}/documents`, data);
    return response.data.data;
  },
  updateDocument: async (id: string, data: Partial<AdminServiceDocumentData>): Promise<AdminServiceDocumentData> => {
    const response = await axiosClient.patch(`/admin/documents/${id}`, data);
    return response.data.data;
  },
  deleteDocument: async (id: string): Promise<void> => {
    await axiosClient.delete(`/admin/documents/${id}`);
  },

  // Price history
  getPriceHistory: async (serviceId: string): Promise<PriceHistoryResponse> => {
    const response = await axiosClient.get(`/admin/services/${serviceId}/price-history`);
    return response.data.data;
  },
};
