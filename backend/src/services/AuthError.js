class AuthError extends Error {
  constructor(status, message) {
    super(message);
    this.name = 'AuthError';
    this.status = status;
  }
}

// Se exporta como valor por defecto y como propiedad nombrada para que
// `require('./AuthError')` y `const { AuthError } = require('./AuthError')` funcionen igual.
module.exports = AuthError;
module.exports.AuthError = AuthError;
