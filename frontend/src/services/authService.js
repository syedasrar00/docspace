import { apiRequest } from './api.js';

export function demoLogin(email) {
  return apiRequest('/api/auth/demo-login', {
    method: 'POST',
    body: JSON.stringify({ email }),
  });
}

export function getCurrentUser() {
  return apiRequest('/api/auth/me');
}
