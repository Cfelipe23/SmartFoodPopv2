const jwt = require('jsonwebtoken');
class TokenService {
  constructor({ secret, expiresIn = '7d' }) { if (!secret) throw new Error('JWT secret requerido'); this.secret = secret; this.expiresIn = expiresIn; }
  sign(user) { return jwt.sign({ id: user.id, name: user.name, email: user.email, role: user.role }, this.secret, { expiresIn: this.expiresIn }); }
  verify(token) { return jwt.verify(token, this.secret); }
}
module.exports = TokenService;
