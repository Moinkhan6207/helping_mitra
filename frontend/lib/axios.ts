import axios from 'axios';

const getApiBaseUrl = () => {
  const envUrl = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:5050/api';
  if (typeof window !== 'undefined') {
    const hostname = window.location.hostname;
    // If accessed via a local network IP address, dynamically point localhost to that IP
    if (hostname !== 'localhost' && hostname !== '127.0.0.1') {
      return envUrl.replace('localhost', hostname).replace('127.0.0.1', hostname);
    }
  }
  return envUrl;
};

const apiBaseUrl = getApiBaseUrl();

/**
 * Reusable Axios Client configured for the Helping Mitra API.
 * Standardizes timeouts, body formats, header injects, and error intercepts.
 */
export const axiosClient = axios.create({
  baseURL: apiBaseUrl,
  timeout: 10000, // 10 seconds timeout
  headers: {
    'Content-Type': 'application/json',
  },
});

import { useAuthStore } from '@/features/auth/authStore';

// Request Interceptor (Injects authorization or metadata tags)
axiosClient.interceptors.request.use(
  (config) => {
    const token = useAuthStore.getState().accessToken;
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

let isRefreshing = false;
let failedQueue: Array<{
  resolve: (value: string | null) => void;
  reject: (reason: any) => void;
}> = [];

const processQueue = (error: any, token: string | null = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

// Response Interceptor (Extracts nested data and normalizes errors)
axiosClient.interceptors.response.use(
  (response) => {
    return response;
  },
  async (error) => {
    const originalRequest = error.config;

    // Check if the error is 401 and it's not a retry already
    if (error.response?.status === 401 && originalRequest && !originalRequest._retry) {
      // If the 401 error is on login or refresh endpoints, don't try to refresh
      if (
        originalRequest.url?.includes('/auth/login') ||
        originalRequest.url?.includes('/auth/refresh-token')
      ) {
        return Promise.reject(error.response?.data || error);
      }

      if (isRefreshing) {
        return new Promise<string | null>((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then((token) => {
            if (originalRequest.headers) {
              originalRequest.headers.Authorization = `Bearer ${token}`;
            }
            return axiosClient(originalRequest);
          })
          .catch((err) => {
            return Promise.reject(err);
          });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      const refreshToken = useAuthStore.getState().refreshToken;

      if (!refreshToken) {
        useAuthStore.getState().logout();
        if (typeof window !== 'undefined') {
          window.location.href = '/login';
        }
        isRefreshing = false;
        return Promise.reject(error.response?.data || error);
      }

      try {
        // Direct call to axios to avoid interceptor loop
        const response = await axios.post(`${apiBaseUrl}/auth/refresh-token`, {
          refreshToken,
        });

        const newAccessToken = response.data?.data?.accessToken;
        if (!newAccessToken) {
          throw new Error('No access token returned');
        }

        useAuthStore.getState().setAccessToken(newAccessToken);

        processQueue(null, newAccessToken);
        if (originalRequest.headers) {
          originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
        }
        isRefreshing = false;
        return axiosClient(originalRequest);
      } catch (refreshError) {
        processQueue(refreshError, null);
        useAuthStore.getState().logout();
        if (typeof window !== 'undefined') {
          window.location.href = '/login';
        }
        isRefreshing = false;
        return Promise.reject(refreshError);
      }
    }

    // Extract standard error structure formatted by the backend error middleware
    const apiError = error.response?.data || {
      success: false,
      message: error.message || 'A network error occurred. Please check your connection.',
      error: {
        code: 'CLIENT_NETWORK_ERROR',
        details: error.response?.statusText || null,
      },
    };

    return Promise.reject(apiError);
  }
);

export default axiosClient;
