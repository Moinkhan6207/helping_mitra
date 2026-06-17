import { axiosClient } from '@/lib/axios';
import { AppHealthResponse, DbHealthResponse } from '@/types';

/**
 * Sends a GET request to verify server api health state.
 */
export const fetchAppHealth = async (): Promise<AppHealthResponse> => {
  const response = await axiosClient.get<AppHealthResponse>('/health');
  return response.data;
};

/**
 * Sends a GET request to verify database connectivity.
 */
export const fetchDbHealth = async (): Promise<DbHealthResponse> => {
  const response = await axiosClient.get<DbHealthResponse>('/health/db');
  return response.data;
};
