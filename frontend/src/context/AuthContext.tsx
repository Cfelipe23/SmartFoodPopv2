import { useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import { sessionStorageService } from '../storage/sessionStorage';
import { authApi } from '../api/authApi';
import { AUTH_EXPIRED_EVENT } from '../api/httpClient';
import type { PublicUser, SessionResponse } from '../types/api';
import { AuthContext } from './authContext';
import type { AuthContextValue } from './authContext';

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<PublicUser | null>(() => sessionStorageService.getUser());

  // El cliente HTTP avisa cuando el token caducó o dejó de ser válido.
  useEffect(() => {
    const handleExpired = () => setUser(null);
    window.addEventListener(AUTH_EXPIRED_EVENT, handleExpired);
    return () => window.removeEventListener(AUTH_EXPIRED_EVENT, handleExpired);
  }, []);

  const startSession = (data: SessionResponse | null): string => {
    if (data === null) throw new Error('La respuesta del servidor no contiene una sesión.');
    setUser(data.user);
    sessionStorageService.save(data.token, data.user);
    return data.message;
  };

  const login: AuthContextValue['login'] = async (email, password) => startSession(await authApi.login(email, password));
  const register: AuthContextValue['register'] = async (name, email, password) => startSession(await authApi.register(name, email, password));

  const logout: AuthContextValue['logout'] = () => {
    setUser(null);
    sessionStorageService.clear();
  };

  return (
    <AuthContext.Provider value={{ user, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}
