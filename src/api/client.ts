import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';

// Flexible base URL strategy:
// 1. If VITE_API_URL is set, use it (lets you point to a custom backend).
// 2. Otherwise, always use the hosted backend.
//    This avoids relying on the Vite dev proxy and fixes ECONNREFUSED
//    when no local backend is running on localhost:4000.
const API_BASE_URL =
  import.meta.env.VITE_API_URL || 'https://hmsapi.martomor.xyz/api';

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
});

// Track if we're currently refreshing to avoid multiple refresh calls
let isRefreshing = false;
let failedQueue: Array<{
  resolve: (value?: any) => void;
  reject: (error?: any) => void;
}> = [];

const processQueue = (error: AxiosError | null, token: string | null = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

// Response interceptor to handle 401 errors and refresh tokens
apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };

    // If error is 401 and we haven't retried yet
    if (error.response?.status === 401 && originalRequest && !originalRequest._retry) {
      if (isRefreshing) {
        // If already refreshing, queue this request
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then(() => {
            return apiClient(originalRequest);
          })
          .catch((err) => {
            return Promise.reject(err);
          });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        // Attempt to refresh the token
        await apiClient.post('/auth/refresh', {});
        
        // Process queued requests
        processQueue(null, null);
        isRefreshing = false;

        // Retry the original request
        return apiClient(originalRequest);
      } catch (refreshError) {
        // Refresh failed - clear auth and redirect to login
        processQueue(refreshError as AxiosError, null);
        isRefreshing = false;

        // Only redirect if not already on login page
        if (window.location.pathname !== '/login') {
          localStorage.removeItem('hms_user');
          window.location.href = '/login';
        }

        return Promise.reject(refreshError);
      }
    }

    // For other errors, just reject
    return Promise.reject(error);
  }
);
