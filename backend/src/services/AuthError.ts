class AuthError extends Error {
  // Mantiene las dos formas de require que usan los controladores y las pruebas.
  static readonly AuthError = AuthError;
  readonly status: number;

  constructor(status: number, message: string) {
    super(message);
    this.name = 'AuthError';
    this.status = status;
  }
}

export = AuthError;
