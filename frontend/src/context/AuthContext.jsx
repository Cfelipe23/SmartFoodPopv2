import { sessionStorageService } from '../storage/sessionStorage';
import { authApi } from '../api/authApi';
import { createContext, useContext, useState } from 'react';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => sessionStorageService.getUser());

  const startSession = (data) => {
    setUser(data.user);
    sessionStorageService.save(data.token, data.user);
    return data.message;
  };

  const login = async (email, password) => startSession(await authApi.login(email, password));
  const register = async (name, email, password) => startSession(await authApi.register(name, email, password));
  const resetPassword = async (email, newPassword) => startSession(await authApi.resetPassword(email, newPassword));

  const logout = () => {
    setUser(null);
    sessionStorageService.clear();
  };

  return (
    <AuthContext.Provider value={{ user, login, register, resetPassword, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth debe usarse dentro de AuthProvider');
  return ctx;
}
