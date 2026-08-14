/**
 * API Service — Axios instance configured for the Flask backend.
 *
 * Uses Vite's proxy in development (/api → http://localhost:5000/api).
 * Includes response/error interceptors for consistent error handling.
 */
import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// ── Request Interceptor ──
// Attach JWT token if available
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('access_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// ── Response Interceptor ──
// Normalize error responses
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const message =
      error.response?.data?.message ||
      error.response?.data?.error ||
      error.message ||
      'An unexpected error occurred';

    console.error(`[API Error] ${error.config?.method?.toUpperCase()} ${error.config?.url}:`, message);

    return Promise.reject({
      status: error.response?.status,
      message,
      data: error.response?.data,
    });
  }
);

export default api;
