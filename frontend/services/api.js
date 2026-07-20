'use client'

import axios from 'axios';

// Use NEXT_PUBLIC_ env var for client-side access; fallback to localhost for dev
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

// Create axios instance
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Add token to requests if it exists
api.interceptors.request.use((config) => {
  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Globally handle expired/invalid sessions: any 401 on an authenticated request
// clears the token and sends the user to login, instead of leaving them on a
// broken page. Login/register 401s (wrong credentials) are left for the form to
// display, and we never redirect if we're already on the login page.
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error.response?.status;
    const url = error.config?.url || '';
    const isAuthEndpoint =
      url.includes('/auth/login') ||
      url.includes('/auth/register') ||
      url.includes('/auth/google');

    if (status === 401 && !isAuthEndpoint && typeof window !== 'undefined') {
      const hadToken = !!localStorage.getItem('token');
      localStorage.removeItem('token');
      if (hadToken && window.location.pathname !== '/login') {
        window.location.href = '/login?session=expired';
      }
    }

    return Promise.reject(error);
  }
);

// Auth API
export const authAPI = {
  register: (data) => api.post('/auth/register', data),
  login: (data) => api.post('/auth/login', data),
  googleAuth: (credential) => api.post('/auth/google', { credential }),
  verifyEmail: (token) => api.post('/auth/verify-email', { token }),
  resendVerification: () => api.post('/auth/resend-verification'),
  getMe: () => api.get('/auth/me'),
  updateProfilePicture: (profilePictureUrl) =>
    api.patch('/auth/profile-picture', { profilePictureUrl }),
  updateProfile: (data) => api.patch('/auth/profile', data),
  updatePassword: (data) => api.patch('/auth/password', data),
  getAdminUsers: () => api.get('/auth/admin/users'),
  adminOverview: () => api.get('/auth/admin/overview'),
  adminAllGenerations: () => api.get('/auth/admin/generations'),
};

// Persona API
export const personaAPI = {
  create: (data) => api.post('/persona', data),
  get: () => api.get('/persona'),
  delete: () => api.delete('/persona'),
  uploadImage: (formData) => {
    return api.post('/persona/images', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
  },
  deleteImage: (imageId) => api.delete(`/persona/images/${imageId}`)
};

// Generation API
export const generationAPI = {
  generateImage: (data) => api.post('/generate/image', data),
  generateText: (data) => api.post('/generate/text', data),
  getAll: (type) => api.get('/generate', { params: { type } }),
  getById: (id) => api.get(`/generate/${id}`),
  delete: (id) => api.delete(`/generate/${id}`)
};

export const uploadAPI = {
  uploadImage: (formData) => api.post('/upload/image', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  })
};

export const referralAPI = {
  useCode: (code) => api.post('/referral/use', { code }),
  getMyCode: () => api.get('/referral/my-code'),
  adminStats: () => api.get('/referral/admin/stats'),
  adminGenerateCodes: (data) => api.post('/referral/admin/generate', data),
  adminGetCodes: () => api.get('/referral/admin/codes'),
  adminToggleCode: (id) => api.patch(`/referral/admin/codes/${id}/toggle`),
};

export const billingAPI = {
  getSubscription: () => api.get('/billing/subscription'),
  checkout: (plan, interval) => api.post('/billing/checkout', { plan, interval }),
  portal: () => api.post('/billing/portal'),
};

export default api;
