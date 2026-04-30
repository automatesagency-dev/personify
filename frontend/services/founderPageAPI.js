'use client'

import api from './api';

// Founder Page API
export const founderPageAPI = {
  // Get user's founder page
  get: () => api.get('/founder-page'),

  // Create or update founder page
  upsert: (data) => api.post('/founder-page', data),

  // Publish/unpublish page
  publish: (published) => api.patch('/founder-page/publish', { published }),

  // Check username availability
  checkUsername: (username) => api.get(`/founder-page/check-username/${username}`),

  // Get public page by username
  getPublic: (username) => api.get(`/founder-page/public/${username}`),

  // Preview own page (authenticated, works even when unpublished)
  getPreview: () => api.get('/founder-page/preview'),

  // Delete founder page
  delete: () => api.delete('/founder-page')
};

export default founderPageAPI;
