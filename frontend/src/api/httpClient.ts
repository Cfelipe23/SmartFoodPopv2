import { API_BASE } from '../config/env';
import { sessionStorageService } from '../storage/sessionStorage';
import { readErrorMessage } from './responseGuards';

export const AUTH_EXPIRED_EVENT = 'smartfood:auth-expired';

const AUTH_ENDPOINTS = ['/auth/login', '/auth/register'];
type RequestOptions = Omit<RequestInit, 'headers'> & { headers?: Record<string, string> };

// Cliente HTTP único: adjunta el token, normaliza los errores y avisa cuando la sesión caduca.
export async function request<T>(
  endpoint: string,
  isResponse: (value: unknown) => value is T,
  options: RequestOptions = {}
): Promise<T | null> {
  const token = sessionStorageService.getToken();
  const revision = sessionStorageService.getRevision();
  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...options.headers
  };

  let res: Response;
  try {
    res = await fetch(`${API_BASE}${endpoint}`, { ...options, headers });
  } catch {
    throw new Error('No se pudo conectar con el servidor. Verifica que el backend esté en ejecución.');
  }

  let data: unknown = null;
  try {
    data = await res.json();
  } catch {
    // respuesta sin cuerpo JSON
  }

  if (!res.ok) {
    const errorMessage = readErrorMessage(data);
    const sessionExpired = token && !AUTH_ENDPOINTS.includes(endpoint)
      && (res.status === 401 || errorMessage === 'Token inválido o expirado');
    if (sessionExpired && revision === sessionStorageService.getRevision()) {
      sessionStorageService.clear();
      window.dispatchEvent(new Event(AUTH_EXPIRED_EVENT));
    }
    throw new Error(errorMessage || 'Error en la petición al servidor');
  }
  if (data === null) return null;
  if (!isResponse(data)) throw new Error('La respuesta del servidor no tiene el formato esperado.');
  return data;
}
