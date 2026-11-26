import { request } from './httpClient';
import { isCurrentUser, isSession } from './responseGuards';

export const authApi = {
  register: (name: string, email: string, password: string) =>
    request('/auth/register', isSession, { method: 'POST', body: JSON.stringify({ name, email, password }) }),
  login: (email: string, password: string) =>
    request('/auth/login', isSession, { method: 'POST', body: JSON.stringify({ email, password }) }),
  getMe: () => request('/auth/me', isCurrentUser)
};
