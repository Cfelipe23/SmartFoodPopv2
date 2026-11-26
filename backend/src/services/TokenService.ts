import jwt = require('jsonwebtoken');
import type { JwtPayload, Secret, SignOptions } from 'jsonwebtoken';
import type { PublicUser } from '../contracts/api';

interface TokenOptions {
  secret: Secret;
  expiresIn?: SignOptions['expiresIn'];
}

class TokenService {
  readonly secret: Secret;
  readonly expiresIn: NonNullable<SignOptions['expiresIn']>;

  constructor({ secret, expiresIn = '7d' }: TokenOptions) {
    if (!secret) throw new Error('JWT secret requerido');
    this.secret = secret;
    this.expiresIn = expiresIn;
  }

  sign(user: PublicUser): string {
    return jwt.sign({ id: user.id, name: user.name, email: user.email, role: user.role }, this.secret, { expiresIn: this.expiresIn });
  }

  verify(token: string): JwtPayload | string {
    return jwt.verify(token, this.secret);
  }
}

export = TokenService;
