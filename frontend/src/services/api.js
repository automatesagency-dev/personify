import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

// Create axios instance
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Add token to requests if it exists
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Auth API
export const authAPI = {
  register: (data) => api.post('/auth/register', data),
  login: (data) => api.post('/auth/login', data),
  getMe: () => api.get('/auth/me')
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

export default api;