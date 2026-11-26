import type { LoginInput, PublicUser, RegisterInput, SessionResponse } from '../contracts/api';
import type UserRepository = require('../repositories/UserRepository');
import AuthError = require('./AuthError');
import { BcryptPasswordHasher } from './PasswordHasher';
import type TokenService = require('./TokenService');

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MIN_PASSWORD_LENGTH = 6;

interface AuthOptions {
  userRepository: Pick<UserRepository, 'findByEmail' | 'add'>;
  passwordHasher?: Pick<BcryptPasswordHasher, 'hash' | 'verify'>;
  tokenService: Pick<TokenService, 'sign'>;
}

// RF01 (registro) y RF02 (inicio de sesión): autenticación propia con correo y contraseña.
export class AuthService {
  readonly userRepository: AuthOptions['userRepository'];
  readonly passwordHasher: Pick<BcryptPasswordHasher, 'hash' | 'verify'>;
  readonly tokenService: AuthOptions['tokenService'];

  constructor({ userRepository, passwordHasher = new BcryptPasswordHasher(), tokenService }: AuthOptions) {
    this.userRepository = userRepository;
    this.passwordHasher = passwordHasher;
    this.tokenService = tokenService;
  }

  normalizeEmail(email: unknown): string {
    return typeof email === 'string' ? email.trim().toLowerCase() : '';
  }

  buildSession(user: PublicUser, message: string): SessionResponse {
    const token = this.tokenService.sign(user);
    return { message, token, user: { id: user.id, name: user.name, email: user.email, role: user.role } };
  }

  async register({ name, email, password }: Partial<Record<keyof RegisterInput, unknown>> = {}): Promise<SessionResponse> {
    const normalizedName = typeof name === 'string' ? name.trim() : '';
    const normalizedEmail = this.normalizeEmail(email);
    if (!normalizedName || !normalizedEmail || typeof password !== 'string' || !password) {
      throw new AuthError(400, 'Todos los campos son obligatorios');
    }
    if (normalizedName.length > 100) throw new AuthError(400, 'El nombre no puede superar 100 caracteres');
    if (!EMAIL_PATTERN.test(normalizedEmail)) throw new AuthError(400, 'Ingrese un correo electrónico válido');
    if (password.length < MIN_PASSWORD_LENGTH) {
      throw new AuthError(400, `La contraseña debe tener al menos ${MIN_PASSWORD_LENGTH} caracteres`);
    }
    if (this.userRepository.findByEmail(normalizedEmail)) {
      throw new AuthError(409, 'El correo electrónico ya está registrado');
    }
    const password_hash = await this.passwordHasher.hash(password);
    const user = this.userRepository.add({ name: normalizedName, email: normalizedEmail, password_hash, role: 'consumer' });
    return this.buildSession(user, 'Registro exitoso. Tu cuenta ya está habilitada.');
  }

  async login({ email, password }: Partial<Record<keyof LoginInput, unknown>> = {}): Promise<SessionResponse> {
    const normalizedEmail = this.normalizeEmail(email);
    if (!normalizedEmail || typeof password !== 'string' || !password) {
      throw new AuthError(400, 'Ingrese correo y contraseña');
    }
    const user = this.userRepository.findByEmail(normalizedEmail);
    if (!user || !(await this.passwordHasher.verify(password, user))) {
      throw new AuthError(401, 'Credenciales incorrectas');
    }
    return this.buildSession(user, 'Inicio de sesión exitoso');
  }
}

export { AuthError };
