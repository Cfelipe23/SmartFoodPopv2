import { request } from './httpClient';

export const authApi = {
  register: (name, email, password) => request('/auth/register', { method: 'POST', body: JSON.stringify({ name, email, password }) }),
  login: (email, password) => request('/auth/login', { method: 'POST', body: JSON.stringify({ email, password }) }),
  resetPassword: (email, newPassword) => request('/auth/reset-password', { method: 'POST', body: JSON.stringify({ email, newPassword }) }),
  getMe: () => request('/auth/me')
};
