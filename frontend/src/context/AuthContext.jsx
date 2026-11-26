import { useEffect, useState } from 'react';
import { sessionStorageService } from '../storage/sessionStorage';
import { authApi } from '../api/authApi';
import { AUTH_EXPIRED_EVENT } from '../api/httpClient';
import { AuthContext } from './authContext';

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => sessionStorageService.getUser());

  // El cliente HTTP avisa cuando el token caducó o dejó de ser válido.
  useEffect(() => {
    const handleExpired = () => setUser(null);
    window.addEventListener(AUTH_EXPIRED_EVENT, handleExpired);
    return () => window.removeEventListener(AUTH_EXPIRED_EVENT, handleExpired);
  }, []);

  const startSession = (data) => {
    setUser(data.user);
    sessionStorageService.save(data.token, data.user);
    return data.message;
  };

  const login = async (email, password) => startSession(await authApi.login(email, password));
  const register = async (name, email, password) => startSession(await authApi.register(name, email, password));

  const logout = () => {
    setUser(null);
    sessionStorageService.clear();
  };

  return (
    <AuthContext.Provider value={{ user, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}
