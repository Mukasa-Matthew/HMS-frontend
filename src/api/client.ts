import axios from 'axios';

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

