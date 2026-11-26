// Error con código HTTP para que los controladores respondan de forma consistente.
export interface HttpError extends Error {
  status: number;
}

export function httpError(status: number, message: string): HttpError {
  return Object.assign(new Error(message), { status });
}
