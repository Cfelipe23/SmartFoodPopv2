import type { NextFunction, Request, Response } from 'express';
import type { ErrorResponse } from '../contracts/api';

// Express identifica el middleware de errores por sus cuatro parámetros.
export function apiErrorHandler(error: unknown, _req: Request, res: Response<ErrorResponse>, _next: NextFunction): void {
  if (typeof error === 'object' && error !== null && 'type' in error && error.type === 'entity.parse.failed') {
    res.status(400).json({ error: 'El cuerpo de la petición no es un JSON válido' });
    return;
  }
  console.error('Unhandled Server Error:', error);
  res.status(500).json({ error: 'Ocurrió un error inesperado en el servidor' });
}
