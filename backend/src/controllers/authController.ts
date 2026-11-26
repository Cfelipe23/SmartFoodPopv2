import type { Response } from 'express';
import type { ErrorResponse, LoginInput, RegisterInput, SessionResponse } from '../contracts/api';
import AuthError = require('../services/AuthError');
import type { AuthService } from '../services/AuthService';
import { readBody } from './httpBoundary';
import type { HttpRequest } from './httpBoundary';

function respondWithError(res: Response<ErrorResponse>, error: unknown, fallbackMessage: string) {
  if (error instanceof AuthError) return res.status(error.status).json({ error: error.message });
  console.error(fallbackMessage, error);
  return res.status(500).json({ error: fallbackMessage });
}

const authController = (authService: Pick<AuthService, 'login' | 'register'>) => ({
  async register(req: HttpRequest, res: Response<SessionResponse | ErrorResponse>) {
    try {
      const session = await authService.register(readBody<RegisterInput>(req.body));
      res.status(201).json(session);
    } catch (error) {
      respondWithError(res, error, 'Error interno en el servidor al registrar');
    }
  },

  async login(req: HttpRequest, res: Response<SessionResponse | ErrorResponse>) {
    try {
      const session = await authService.login(readBody<LoginInput>(req.body));
      res.json(session);
    } catch (error) {
      respondWithError(res, error, 'Error al iniciar sesión');
    }
  },

  // Conserva el contenido verificado del JWT que devuelve esta ruta.
  me(req: HttpRequest, res: Response<{ user: HttpRequest['user'] }>) {
    res.json({ user: req.user });
  }
});

export = authController;
