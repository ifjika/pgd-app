import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

const api = axios.create({
  baseURL: `${API_URL}/api`,
  headers: { 'Content-Type': 'application/json' },
});

// Add auth token to requests
api.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('pgd_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }
  return config;
});

// Handle 401 errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401 && typeof window !== 'undefined') {
      localStorage.removeItem('pgd_token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  },
);

// Auth
export const authApi = {
  login: (email: string, password: string) =>
    api.post('/auth/login', { email, password }),
  me: () => api.get('/auth/me'),
};

// Merchants
export const merchantsApi = {
  list: (params?: Record<string, unknown>) => api.get('/merchants', { params }),
  get: (id: string) => api.get(`/merchants/${id}`),
  create: (data: Record<string, unknown>) => api.post('/merchants', data),
  update: (id: string, data: Record<string, unknown>) => api.patch(`/merchants/${id}`, data),
  stats: (id: string) => api.get(`/merchants/${id}/stats`),
};

// Customers
export const customersApi = {
  list: (params?: Record<string, unknown>) => api.get('/customers', { params }),
  get: (id: string) => api.get(`/customers/${id}`),
};

// Transactions
export const transactionsApi = {
  list: (params?: Record<string, unknown>) => api.get('/transactions', { params }),
  get: (id: string) => api.get(`/transactions/${id}`),
  create: (data: Record<string, unknown>) => api.post('/transactions', data),
  recent: (limit?: number) => api.get('/transactions/recent', { params: { limit } }),
};

// Refunds
export const refundsApi = {
  list: (params?: Record<string, unknown>) => api.get('/refunds', { params }),
  create: (data: Record<string, unknown>) => api.post('/refunds', data),
  approve: (id: string) => api.patch(`/refunds/${id}/approve`),
  reject: (id: string, reason: string) => api.patch(`/refunds/${id}/reject`, { reason }),
};

// Webhooks
export const webhooksApi = {
  list: (params?: Record<string, unknown>) => api.get('/webhooks', { params }),
};

// Analytics
export const analyticsApi = {
  overview: () => api.get('/analytics/overview'),
  chart: (period?: string) => api.get('/analytics/chart', { params: { period } }),
  paymentMethods: () => api.get('/analytics/payment-methods'),
  topMerchants: (limit?: number) => api.get('/analytics/top-merchants', { params: { limit } }),
};

// Payment Methods
export const paymentMethodsApi = {
  list: () => api.get('/payment-methods'),
};

// Simulator
export const simulatorApi = {
  status: () => api.get('/simulator/status'),
  toggle: (enabled: boolean) => api.post('/simulator/toggle', { enabled }),
};

export default api;
