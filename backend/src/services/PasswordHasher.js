const bcrypt = require('bcryptjs');
class BcryptPasswordHasher {
  supports(user) { return Boolean(user?.password_hash); }
  async hash(password) { return bcrypt.hash(password, 10); }
  async verify(password, user) { return Boolean(user?.password_hash) && bcrypt.compare(password, user.password_hash); }
}
class PlainPasswordVerifier {
  supports(user) { return typeof user?.password === 'string'; }
  async verify(password, user) { return this.supports(user) && user.password === password; }
}
module.exports = { BcryptPasswordHasher, PlainPasswordVerifier };
