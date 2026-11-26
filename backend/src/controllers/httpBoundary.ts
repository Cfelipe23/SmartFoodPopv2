import type { Request, Response } from 'express';
import type { ErrorResponse } from '../contracts/api';

export type HttpRequest<Params = Record<string, string>> = Request<Params, unknown, unknown>;

type RequestFields<Input> = Partial<Record<keyof Input, unknown>>;

function isBody<Input>(value: unknown): value is RequestFields<Input> {
  return typeof value === 'object' && value !== null;
}

export function readBody<Input>(value: unknown): RequestFields<Input> | undefined {
  return isBody<Input>(value) ? value : undefined;
}

export function respondWithServiceError(
  res: Response<ErrorResponse>,
  error: unknown,
  fallbackMessage: string,
  logUnexpected = true
) {
  if (typeof error === 'object' && error !== null &&
      'status' in error && typeof error.status === 'number' && error.status &&
      'message' in error && typeof error.message === 'string') {
    return res.status(error.status).json({ error: error.message });
  }
  if (logUnexpected) console.error(fallbackMessage, error);
  return res.status(500).json({ error: fallbackMessage });
}
