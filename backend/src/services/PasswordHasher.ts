import bcrypt = require('bcryptjs');
import type { User } from '../domain/entities';

// Las contraseñas solo se almacenan como hash bcrypt (nunca en texto plano).
export class BcryptPasswordHasher {
  readonly rounds: number;

  constructor({ rounds = 10 } = {}) { this.rounds = rounds; }
  async hash(password: string): Promise<string> { return bcrypt.hash(password, this.rounds); }
  hashSync(password: string): string { return bcrypt.hashSync(password, this.rounds); }
  async verify(password: string, user?: Partial<Pick<User, 'password_hash'>> | null): Promise<boolean> {
    if (!user?.password_hash) return false;
    return bcrypt.compare(password, user.password_hash);
  }
}
