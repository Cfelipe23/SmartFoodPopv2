const { BcryptPasswordHasher, PlainPasswordVerifier } = require('./PasswordHasher');
const AuthError = require('./AuthError');
class AuthService {
  constructor({ userRepository, passwordHasher = new BcryptPasswordHasher(), passwordVerifiers, tokenService }) {
    Object.assign(this, { userRepository, passwordHasher, passwordVerifiers: passwordVerifiers || [passwordHasher, new PlainPasswordVerifier()], tokenService });
  }
  normalizeEmail(email) { return typeof email === 'string' ? email.trim().toLowerCase() : ''; }
  buildSession(user, message) {
    const token = this.tokenService.sign(user);
    return { message, token, user: { id: user.id, name: user.name, email: user.email, role: user.role } };
  }
  async register({ name, email, password } = {}) {
    const normalizedEmail = this.normalizeEmail(email);
    if (!name || !normalizedEmail || !password) throw new AuthError(400, 'Todos los campos son obligatorios');
    if (this.userRepository.findByEmail(normalizedEmail)) throw new AuthError(400, 'El correo electrónico ya está registrado');
    const password_hash = await this.passwordHasher.hash(password);
    const user = this.userRepository.add({ name: String(name).trim(), email: normalizedEmail, password_hash, role: 'consumer' });
    return this.buildSession(user, 'Registro exitoso');
  }
  async login({ email, password } = {}) {
    const normalizedEmail = this.normalizeEmail(email);
    if (!normalizedEmail || !password) throw new AuthError(400, 'Ingrese correo y contraseña');
    const user = this.userRepository.findByEmail(normalizedEmail);
    if (!user) throw new AuthError(401, 'Credenciales incorrectas');
    const verifier = this.passwordVerifiers.find(candidate => candidate.supports(user));
    if (!verifier || !(await verifier.verify(password, user))) throw new AuthError(401, 'Credenciales incorrectas');
    return this.buildSession(user, 'Inicio de sesión exitoso');
  }
  async resetPassword({ email, newPassword } = {}) {
    const normalizedEmail = this.normalizeEmail(email);
    if (!normalizedEmail || !newPassword) throw new AuthError(400, 'Ingrese su correo y la nueva contraseña');
    if (newPassword.length < 4) throw new AuthError(400, 'La nueva contraseña debe tener al menos 4 caracteres');
    const user = this.userRepository.findByEmail(normalizedEmail);
    if (!user) throw new AuthError(404, 'No existe una cuenta registrada con este correo');
    const password_hash = await this.passwordHasher.hash(newPassword);
    user.password_hash = password_hash;
    delete user.password; // retirar contraseña en texto plano si existía
    return this.buildSession(user, 'Contraseña actualizada exitosamente');
  }
}
module.exports = { AuthService, AuthError };
