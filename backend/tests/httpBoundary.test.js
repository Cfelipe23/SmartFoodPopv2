const test = require('node:test');
const assert = require('node:assert/strict');
const { once } = require('node:events');
const { createApp } = require('../dist/app');
const { buildContainer } = require('../dist/container');
const TokenService = require('../dist/services/TokenService');

async function startApp(t, services) {
  const server = createApp(services).listen(0, '127.0.0.1');
  await once(server, 'listening');
  t.after(() => new Promise(resolve => server.close(resolve)));
  return 'http://127.0.0.1:' + server.address().port;
}

test('HTTP: las cuatro rutas públicas del catálogo conservan las respuestas de sus servicios', async t => {
  const services = buildContainer({ loadCatalog: false });
  const url = await startApp(t, services) + '/api/products';
  const query = { store: 'd1' };
  const id = services.store.products[0].id;
  const cases = [
    ['?store=d1', 200, services.productService.list(query)],
    ['/offers', 200, services.productService.listOffers()],
    ['/compare?store=d1', 200, services.productComparisonService.compare(query)],
    ['/' + id, 200, services.productDetailService.getDetail(id)],
    ['?store=inexistente', 400, { error: 'Tienda no válida: inexistente' }],
    ['/compare?store=inexistente', 400, { error: 'Tienda no válida: inexistente' }],
    ['/0', 404, { error: 'Producto no encontrado' }]
  ];
  for (const [path, status, expected] of cases) {
    const response = await fetch(url + path);
    assert.equal(response.status, status, path);
    assert.deepEqual(await response.json(), JSON.parse(JSON.stringify(expected)), path);
  }
});

test('HTTP: CORS, autenticación y rol se aplican en orden al panel de administración', async t => {
  const services = buildContainer({ loadCatalog: false });
  const secret = 'fixture-de-autorizacion';
  services.tokenService = new TokenService({ secret });
  const expiredTokens = new TokenService({ secret, expiresIn: -1 });
  const user = { id: 1, name: 'Consumidor', email: 'fixture@example.test', role: 'consumer' };
  const url = await startApp(t, services) + '/api/admin/products';
  const origin = 'http://frontend.example.test';
  const preflight = await fetch(url, {
    method: 'OPTIONS',
    headers: { Origin: origin, 'Access-Control-Request-Method': 'POST', 'Access-Control-Request-Headers': 'authorization,content-type' }
  });
  assert.equal(preflight.status, 204);
  assert.equal(preflight.headers.get('Access-Control-Allow-Origin'), '*');
  assert.equal(preflight.headers.get('Access-Control-Allow-Headers'), 'authorization,content-type');

  const cases = [
    [undefined, 401, 'Acceso denegado: Token no proporcionado'],
    ['inválido', 403, 'Token inválido o expirado'],
    [expiredTokens.sign(user), 403, 'Token inválido o expirado'],
    [services.tokenService.sign(user), 403, 'Requiere permisos de administrador']
  ];
  for (const [token, status, error] of cases) {
    const headers = token ? { Origin: origin, Authorization: 'Bearer ' + token } : { Origin: origin };
    const response = await fetch(url, { method: 'POST', headers });
    assert.equal(response.status, status);
    assert.equal(response.headers.get('Access-Control-Allow-Origin'), '*');
    assert.deepEqual(await response.json(), { error });
  }
});

test('HTTP: el manejador central devuelve el error JSON genérico al fallar el lector de cuerpos', async t => {
  t.mock.method(console, 'error', () => {});
  const url = await startApp(t, buildContainer({ loadCatalog: false }));
  const response = await fetch(url + '/api/auth/login', {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'x'.repeat(110000) })
  });
  assert.equal(response.status, 500);
  assert.deepEqual(await response.json(), { error: 'Ocurrió un error inesperado en el servidor' });
});
