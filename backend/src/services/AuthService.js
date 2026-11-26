const { BcryptPasswordHasher } = require('./PasswordHasher');
const AuthError = require('./AuthError');

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MIN_PASSWORD_LENGTH = 6;

// RF01 (registro) y RF02 (inicio de sesión): autenticación propia con correo y contraseña.
class AuthService {
  constructor({ userRepository, passwordHasher = new BcryptPasswordHasher(), tokenService }) {
    Object.assign(this, { userRepository, passwordHasher, tokenService });
  }

  normalizeEmail(email) {
    return typeof email === 'string' ? email.trim().toLowerCase() : '';
  }

  buildSession(user, message) {
    const token = this.tokenService.sign(user);
    return { message, token, user: { id: user.id, name: user.name, email: user.email, role: user.role } };
  }

  async register({ name, email, password } = {}) {
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

  async login({ email, password } = {}) {
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

module.exports = { AuthService, AuthError };
