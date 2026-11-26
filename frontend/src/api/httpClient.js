import { API_BASE } from '../config/env';
import { sessionStorageService } from '../storage/sessionStorage';

export const AUTH_EXPIRED_EVENT = 'smartfood:auth-expired';

const AUTH_ENDPOINTS = ['/auth/login', '/auth/register'];

// Cliente HTTP único: adjunta el token, normaliza los errores y avisa cuando la sesión caduca.
export async function request(endpoint, options = {}) {
  const token = sessionStorageService.getToken();
  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...options.headers
  };

  let res;
  try {
    res = await fetch(`${API_BASE}${endpoint}`, { ...options, headers });
  } catch {
    throw new Error('No se pudo conectar con el servidor. Verifica que el backend esté en ejecución.');
  }

  let data = null;
  try {
    data = await res.json();
  } catch {
    // respuesta sin cuerpo JSON
  }

  if (!res.ok) {
    const sessionExpired = token && !AUTH_ENDPOINTS.includes(endpoint)
      && (res.status === 401 || data?.error === 'Token inválido o expirado');
    if (sessionExpired) {
      sessionStorageService.clear();
      window.dispatchEvent(new Event(AUTH_EXPIRED_EVENT));
    }
    throw new Error(data?.error || 'Error en la petición al servidor');
  }
  return data;
}
