import axiosClient from '@/lib/axios';
import {
  AuthSuccessResponse,
  LoginResponseData,
  RegisterResponseData,
  RefreshTokenResponseData,
  User,
} from '../types';

export const authApi = {
  login: async (payload: Record<string, any>): Promise<AuthSuccessResponse<LoginResponseData>> => {
    const response = await axiosClient.post<AuthSuccessResponse<LoginResponseData>>('/auth/login', payload);
    return response.data;
  },

  register: async (payload: Record<string, any>): Promise<AuthSuccessResponse<RegisterResponseData>> => {
    const response = await axiosClient.post<AuthSuccessResponse<RegisterResponseData>>('/auth/register', payload);
    return response.data;
  },

  refreshToken: async (token: string): Promise<AuthSuccessResponse<RefreshTokenResponseData>> => {
    const response = await axiosClient.post<AuthSuccessResponse<RefreshTokenResponseData>>('/auth/refresh-token', {
      refreshToken: token,
    });
    return response.data;
  },

  logout: async (token: string): Promise<AuthSuccessResponse<Record<string, never>>> => {
    const response = await axiosClient.post<AuthSuccessResponse<Record<string, never>>>('/auth/logout', {
      refreshToken: token,
    });
    return response.data;
  },

  getCurrentUser: async (): Promise<AuthSuccessResponse<{ user: User }>> => {
    const response = await axiosClient.get<AuthSuccessResponse<{ user: User }>>('/auth/me');
    return response.data;
  },
};
