import { createContext } from 'react';
import type { LoginInput, PublicUser, RegisterInput } from '../types/api';

export interface AuthContextValue {
  user: PublicUser | null;
  login(email: LoginInput['email'], password: LoginInput['password']): Promise<string>;
  register(name: RegisterInput['name'], email: RegisterInput['email'], password: RegisterInput['password']): Promise<string>;
  logout(): void;
}

export const AuthContext = createContext<AuthContextValue | null>(null);
