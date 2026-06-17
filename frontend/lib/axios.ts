import axios from 'axios';

const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:5000/api';

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

// Request Interceptor (Injects authorization or metadata tags)
axiosClient.interceptors.request.use(
  (config) => {
    // FUTURE JWT PLACEHOLDER:
    // Retrieve authentication token from localStorage or cookie storage
    // const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
    // if (token) {
    //   config.headers.Authorization = `Bearer ${token}`;
    // }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response Interceptor (Extracts nested data and normalizes errors)
axiosClient.interceptors.response.use(
  (response) => {
    // The backend standard success response has shape: { success: true, message: "...", data: {...} }
    return response;
  },
  (error) => {
    // Extract standard error structure formatted by the backend error middleware
    const apiError = error.response?.data || {
      success: false,
      message: error.message || 'A network error occurred. Please check your connection.',
      error: {
        code: 'CLIENT_NETWORK_ERROR',
        details: error.response?.statusText || null,
      },
    };

    // FUTURE EXPLICIT ERROR ROUTING:
    // If the server rejects credentials (401), trigger session flush procedures
    // if (error.response?.status === 401) {
    //   // dispatch logout action
    // }

    return Promise.reject(apiError);
  }
);

export default axiosClient;
