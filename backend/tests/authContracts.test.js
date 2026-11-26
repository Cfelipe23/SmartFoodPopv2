const test = require('node:test');
const assert = require('node:assert/strict');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const TokenService = require('../dist/services/TokenService');
const { BcryptPasswordHasher } = require('../dist/services/PasswordHasher');

test('RF02: JWT conserva HS256, siete días y las propiedades públicas de la sesión', () => {
  const user = { id: 4, name: 'Autenticación de prueba', email: 'auth@example.test', role: 'admin' };
  const tokens = new TokenService({ secret: 'fixture-jwt' });
  const token = tokens.sign({ ...user, password_hash: 'hash de prueba' });
  assert.equal(jwt.decode(token, { complete: true }).header.alg, 'HS256');
  const { iat, exp, ...claims } = tokens.verify(token);
  assert.deepEqual(claims, user);
  assert.equal(exp - iat, 7 * 24 * 60 * 60);

  const other = new TokenService({ secret: 'otra-firma-de-prueba' });
  assert.throws(() => other.verify(token), jwt.JsonWebTokenError);
  const expired = new TokenService({ secret: 'fixture-jwt', expiresIn: -1 });
  assert.throws(() => tokens.verify(expired.sign(user)), jwt.TokenExpiredError);
});

test('RF01 y RF02: bcrypt conserva el coste predeterminado y la verificación', async () => {
  const hasher = new BcryptPasswordHasher();
  const hash = hasher.hashSync('frase de prueba');
  assert.equal(bcrypt.getRounds(hash), 10);
  assert.equal(await hasher.verify('frase de prueba', { password_hash: hash }), true);
  assert.equal(await hasher.verify('frase incorrecta', { password_hash: hash }), false);
  assert.equal(await hasher.verify('frase de prueba', {}), false);
});
