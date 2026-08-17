/**
 * Public API Service — Axios instance for customer-facing endpoints.
 *
 * Uses `access_token` from localStorage (customer JWT).
 * Never uses admin_token here.
 */
import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
  timeout: 15000,
  headers: { 'Content-Type': 'application/json' },
});

// Attach customer access_token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('access_token');
    if (token) config.headers.Authorization = `Bearer ${token}`;
    return config;
  },
  (error) => Promise.reject(error)
);

// Normalize errors — auto-clear expired token
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error.response?.status;
    const serverMsg = error.response?.data?.message || error.response?.data?.error || '';

    // Token expired or invalid — clear localStorage so user gets a clean re-login
    if (status === 401) {
      const isExpired =
        serverMsg.toLowerCase().includes('expired') ||
        serverMsg.toLowerCase().includes('signature') ||
        serverMsg.toLowerCase().includes('invalid');

      if (isExpired) {
        localStorage.removeItem('access_token');
        localStorage.removeItem('customer_user');
        localStorage.removeItem('customer_profile');
        // Reload the page — AuthContext will see no token and show "Sign In"
        // Only reload if we're not already on the login page
        if (!window.location.pathname.includes('/login')) {
          window.location.href = '/login?expired=1';
        }
      }
    }

    const message = serverMsg || error.message || 'An unexpected error occurred';
    return Promise.reject({ status, message, data: error.response?.data });
  }
);

// ── Products ──────────────────────────────────────────────────────────────

export const getProducts = (params = {}) =>
  api.get('/products', { params }).then((r) => r.data);

export const getProduct = (idOrSlug) =>
  api.get(`/products/${idOrSlug}`).then((r) => r.data);

export const getCategories = () =>
  api.get('/categories').then((r) => r.data);

export const getCategory = (slug) =>
  api.get(`/categories/${slug}`).then((r) => r.data);

export const getCategoryProducts = (slug, params = {}) =>
  api.get(`/categories/${slug}/products`, { params }).then((r) => r.data);

// ── Customer Auth ─────────────────────────────────────────────────────────

export const registerCustomer = (data) =>
  api.post('/auth/register', data).then((r) => r.data);

export const loginCustomer = (email, password) =>
  api.post('/auth/login', { email, password }).then((r) => r.data);

export const googleAuthLogin = (credential, userinfo) =>
  api.post('/auth/google', credential ? { credential } : { userinfo }).then((r) => r.data);

export const getMyProfile = () =>
  api.get('/auth/me').then((r) => r.data);

export const updateMyProfile = (data) =>
  api.put('/auth/me', data).then((r) => r.data);

export const saveProfile = (data) =>
  api.put('/auth/profile', data).then((r) => r.data);

export const getDeliveryProfile = () =>
  api.get('/auth/profile').then((r) => r.data);

// Legacy OTP exports kept so existing imports don't break
export const sendOTP = () => Promise.reject({ message: 'OTP login removed' });
export const verifyOTP = () => Promise.reject({ message: 'OTP login removed' });

// ── Orders ────────────────────────────────────────────────────────────────

export const placeOrder = (orderData) =>
  api.post('/orders', orderData).then((r) => r.data);

export const getMyOrders = (params = {}) =>
  api.get('/orders', { params }).then((r) => r.data);

export const getMyOrder = (orderId) =>
  api.get(`/orders/${orderId}`).then((r) => r.data);

export default api;
