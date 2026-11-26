const bcrypt = require('bcryptjs');

// Las contraseñas solo se almacenan como hash bcrypt (nunca en texto plano).
class BcryptPasswordHasher {
  constructor({ rounds = 10 } = {}) { this.rounds = rounds; }
  async hash(password) { return bcrypt.hash(password, this.rounds); }
  hashSync(password) { return bcrypt.hashSync(password, this.rounds); }
  async verify(password, user) {
    return Boolean(user?.password_hash) && bcrypt.compare(password, user.password_hash);
  }
}

module.exports = { BcryptPasswordHasher };
