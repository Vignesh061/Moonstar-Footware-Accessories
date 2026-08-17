/**
 * Admin API Service — all admin-specific API calls with JWT (admin_token).
 * NEVER uses access_token. Customer and admin tokens are completely separate.
 */
const API_BASE = '/api';

function getToken() {
  return localStorage.getItem('admin_token');
}

function authHeaders(extra = {}) {
  const token = getToken();
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...extra,
  };
}

async function handleResponse(res) {
  const data = await res.json();
  if (!res.ok) {
    if (res.status === 401) {
      localStorage.removeItem('admin_token');
      localStorage.removeItem('admin_user');
      window.location.href = '/admin/login';
    }
    throw new Error(data.error || 'Request failed');
  }
  return data;
}

// ── Auth ──────────────────────────────────────────────────────────────────
export async function adminLogin(username, password) {
  const res = await fetch(`${API_BASE}/admin/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password }),
  });
  return handleResponse(res);
}

export async function seedAdmin(data) {
  const res = await fetch(`${API_BASE}/admin/seed`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  return handleResponse(res);
}

// ── Dashboard ─────────────────────────────────────────────────────────────
export async function getDashboard() {
  const res = await fetch(`${API_BASE}/admin/dashboard`, { headers: authHeaders() });
  return handleResponse(res);
}

// ── Categories ────────────────────────────────────────────────────────────
export async function getCategories(params = {}) {
  const qs = new URLSearchParams(params).toString();
  const res = await fetch(`${API_BASE}/admin/categories?${qs}`, { headers: authHeaders() });
  return handleResponse(res);
}

export async function createCategory(data) {
  const res = await fetch(`${API_BASE}/admin/categories`, {
    method: 'POST', headers: authHeaders(), body: JSON.stringify(data),
  });
  return handleResponse(res);
}

export async function updateCategory(id, data) {
  const res = await fetch(`${API_BASE}/admin/categories/${id}`, {
    method: 'PUT', headers: authHeaders(), body: JSON.stringify(data),
  });
  return handleResponse(res);
}

export async function deleteCategory(id) {
  const res = await fetch(`${API_BASE}/admin/categories/${id}`, {
    method: 'DELETE', headers: authHeaders(),
  });
  return handleResponse(res);
}

// ── Products ──────────────────────────────────────────────────────────────
export async function getProducts(params = {}) {
  const qs = new URLSearchParams(params).toString();
  const res = await fetch(`${API_BASE}/admin/products?${qs}`, { headers: authHeaders() });
  return handleResponse(res);
}

export async function getProduct(id) {
  const res = await fetch(`${API_BASE}/admin/products/${id}`, { headers: authHeaders() });
  return handleResponse(res);
}

export async function createProduct(data) {
  const res = await fetch(`${API_BASE}/admin/products`, {
    method: 'POST', headers: authHeaders(), body: JSON.stringify(data),
  });
  return handleResponse(res);
}

export async function updateProduct(id, data) {
  const res = await fetch(`${API_BASE}/admin/products/${id}`, {
    method: 'PUT', headers: authHeaders(), body: JSON.stringify(data),
  });
  return handleResponse(res);
}

export async function deleteProduct(id) {
  const res = await fetch(`${API_BASE}/admin/products/${id}`, {
    method: 'DELETE', headers: authHeaders(),
  });
  return handleResponse(res);
}

export async function uploadProductImage(productId, file, isPrimary = false, altText = '') {
  const formData = new FormData();
  formData.append('image', file);
  formData.append('is_primary', isPrimary.toString());
  formData.append('alt_text', altText);
  const token = getToken();
  const res = await fetch(`${API_BASE}/admin/products/${productId}/images`, {
    method: 'POST',
    headers: token ? { Authorization: `Bearer ${token}` } : {},
    body: formData,
  });
  return handleResponse(res);
}

export async function deleteProductImage(productId, imageId) {
  const res = await fetch(`${API_BASE}/admin/products/${productId}/images/${imageId}`, {
    method: 'DELETE', headers: authHeaders(),
  });
  return handleResponse(res);
}

// ── Orders ────────────────────────────────────────────────────────────────
export async function getAdminOrders(params = {}) {
  const qs = new URLSearchParams(params).toString();
  const res = await fetch(`${API_BASE}/admin/orders?${qs}`, { headers: authHeaders() });
  return handleResponse(res);
}

export async function getAdminOrder(id) {
  const res = await fetch(`${API_BASE}/admin/orders/${id}`, { headers: authHeaders() });
  return handleResponse(res);
}

export async function updateOrderStatus(id, status) {
  const res = await fetch(`${API_BASE}/admin/orders/${id}/status`, {
    method: 'PUT', headers: authHeaders(), body: JSON.stringify({ status }),
  });
  return handleResponse(res);
}
