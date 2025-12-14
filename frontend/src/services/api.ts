import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('authToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('authToken');
      window.location.href = '/';
    }
    return Promise.reject(error);
  }
);

// Auth API
export const authAPI = {
  getNonce: (address: string) =>
    api.post('/auth/nonce', { address }),

  verifySignature: (address: string, signature: string, nonce: number) =>
    api.post('/auth/verify', { address, signature, nonce }),
  
  register: (userData: any) =>
    api.post('/auth/register', userData),
  
  getProfile: () =>
    api.get('/auth/profile'),
  
  updateProfile: (data: any) =>
    api.put('/auth/profile', data),
};

// Policy API
export const policyAPI = {
  getAll: () =>
    api.get('/policies'),
  
  getById: (id: string) =>
    api.get(`/policies/${id}`),
  
  create: (policyData: any) =>
    api.post('/policies', policyData),
  
  purchase: (policyId: string) =>
    api.post(`/policies/${policyId}/purchase`),
  
  cancel: (policyId: string) =>
    api.post(`/policies/${policyId}/cancel`),
  
  getUserPolicies: (address: string) => {
    if (!address) {
      return Promise.reject(new Error('Wallet address required'));
    }
    return api.get(`/policies/user/${address}`);
  },
};

// Claims API
export const claimsAPI = {
  getAll: () =>
    api.get('/claims'),
  
  getById: (id: string) =>
    api.get(`/claims/${id}`),
  
  create: (claimData: any) =>
    api.post('/claims', claimData),
  
  update: (id: string, data: any) =>
    api.put(`/claims/${id}`, data),
  
  getUserClaims: (address: string) => {
    if (!address) {
      return Promise.reject(new Error('Wallet address required'));
    }
    return api.get(`/claims/user/${address}`);
  },
  
  submit: (claimData: any) =>
    api.post('/claims/submit', claimData),
  
  approve: (id: string) =>
    api.post(`/claims/${id}/approve`),
  
  reject: (id: string, reason: string) =>
    api.post(`/claims/${id}/reject`, { reason }),
};

// Analytics API
export const analyticsAPI = {
  getDashboard: () =>
    api.get('/analytics/dashboard'),
  
  getClaims: () =>
    api.get('/analytics/claims'),
  
  getPolicies: () =>
    api.get('/analytics/policies'),
  
  getRiskAssessment: () =>
    api.get('/analytics/risk-assessment'),
  getOracleData: () =>
    api.get('/analytics/oracle'),
};

// Notifications API
export const notificationsAPI = {
  getAll: () =>
    api.get('/notifications'),
  
  markAsRead: (id: string) =>
    api.put(`/notifications/${id}/read`),
  
  markAllAsRead: () =>
    api.put('/notifications/read-all'),
  
  delete: (id: string) =>
    api.delete(`/notifications/${id}`),
  
  getStats: () =>
    api.get('/notifications/stats'),
};

// Blockchain API
export const blockchainAPI = {
  getStatus: () =>
    api.get('/blockchain/status'),
  
  getContractAddresses: () =>
    api.get('/blockchain/contracts'),
};

export default api;