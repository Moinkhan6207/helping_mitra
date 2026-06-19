import axiosClient from '@/lib/axios';
import { CategoryData, ServicesResponse, ServiceDetailsData, ServiceFieldData, ServiceDocumentData, ServiceQueryOptions, FormConfigResponse } from '../types';

export interface ServiceStats {
  totalCategories: number;
  totalServices: number;
}

export const serviceApi = {
  getCategories: async (): Promise<CategoryData[]> => {
    const response = await axiosClient.get('/services/categories');
    return response.data.data;
  },

  getServices: async (params: ServiceQueryOptions): Promise<ServicesResponse> => {
    const response = await axiosClient.get('/services', { params });
    return response.data.data;
  },

  getServiceDetails: async (slug: string): Promise<ServiceDetailsData> => {
    const response = await axiosClient.get(`/services/${slug}`);
    return response.data.data;
  },

  getApplicationConfig: async (slug: string): Promise<ServiceDetailsData & { fields: ServiceFieldData[]; documents: ServiceDocumentData[] }> => {
    const response = await axiosClient.get(`/services/${slug}/application-config`);
    return response.data.data;
  },

  /** Returns section-grouped form config (Phase 3.9+). sections[] from backend Section Grouping Engine. */
  getFormConfig: async (slug: string): Promise<FormConfigResponse> => {
    const response = await axiosClient.get(`/services/${slug}/form-config`);
    return response.data.data;
  },

  validateForm: async (slug: string, payload: any): Promise<any> => {
    const response = await axiosClient.post(`/services/${slug}/validate`, payload);
    return response.data.data;
  },

  getServiceFields: async (slug: string): Promise<ServiceFieldData[]> => {
    const response = await axiosClient.get(`/services/${slug}/fields`);
    return response.data.data;
  },

  getServiceDocuments: async (slug: string): Promise<ServiceDocumentData[]> => {
    const response = await axiosClient.get(`/services/${slug}/documents`);
    return response.data.data;
  },

  getServiceStats: async (): Promise<ServiceStats> => {
    const response = await axiosClient.get('/services/stats');
    return response.data.data;
  },
};
