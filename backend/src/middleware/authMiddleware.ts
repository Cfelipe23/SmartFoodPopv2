import type { NextFunction, Request, Response } from 'express';
import type { ErrorResponse } from '../contracts/api';
import type TokenService = require('../services/TokenService');

// La firma verificada no garantiza la forma de los campos del JWT.
declare global {
  namespace Express {
    interface Request {
      user?: string | Record<string, unknown>;
    }
  }
}

export function authenticatedIdentity(req: Request): { id: number; name: string | null } {
  const { user } = req;
  if (typeof user !== 'object' || user === null || typeof user.id !== 'number') {
    throw new Error('La solicitud no contiene un identificador de usuario autenticado');
  }
  return { id: user.id, name: typeof user.name === 'string' ? user.name : null };
}

export function createAuthMiddleware(tokenService: Pick<TokenService, 'verify'>) {
  function authenticateToken(req: Request, res: Response<ErrorResponse>, next: NextFunction) {
    const header = req.headers.authorization || '';
    const token = header.startsWith('Bearer ') ? header.slice(7) : '';
    if (!token) return res.status(401).json({ error: 'Acceso denegado: Token no proporcionado' });
    try { req.user = tokenService.verify(token); return next(); }
    catch { return res.status(403).json({ error: 'Token inválido o expirado' }); }
  }
  function requireAdmin(req: Request, res: Response<ErrorResponse>, next: NextFunction) {
    const { user } = req;
    if (typeof user !== 'object' || user === null || user.role !== 'admin') {
      return res.status(403).json({ error: 'Requiere permisos de administrador' });
    }
    return next();
  }
  return { authenticateToken, requireAdmin };
}
