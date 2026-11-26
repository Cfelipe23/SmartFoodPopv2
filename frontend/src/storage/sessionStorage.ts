import { isPublicUser } from '../api/responseGuards';
import type { PublicUser } from '../types/api';

const TOKEN_KEY = 'smartfood_token';
const USER_KEY = 'smartfood_user';
let revision = 0;

export const sessionStorageService = {
  // Cada inicio o cierre identifica una sesión nueva, incluso si el JWT se repite.
  getRevision: (): number => revision,
  getToken: (): string | null => localStorage.getItem(TOKEN_KEY),

  getUser: (): PublicUser | null => {
    const saved = localStorage.getItem(USER_KEY);
    if (!saved) return null;
    try {
      const user: unknown = JSON.parse(saved);
      return isPublicUser(user) ? user : null;
    } catch {
      return null;
    }
  },

  save: (token: string, user: PublicUser): void => {
    localStorage.setItem(TOKEN_KEY, token);
    localStorage.setItem(USER_KEY, JSON.stringify(user));
    revision++;
  },

  clear: (): void => {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    revision++;
  }
};
