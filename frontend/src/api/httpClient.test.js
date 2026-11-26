import test from 'node:test';
import assert from 'node:assert/strict';
import { createTestModules } from '../../scripts/testModules.js';

const vite = await createTestModules();
test.after(() => vite.close());
const { AUTH_EXPIRED_EVENT } = await vite.ssrLoadModule('/src/api/httpClient.ts');
const { authApi } = await vite.ssrLoadModule('/src/api/authApi.ts');
const { healthApi } = await vite.ssrLoadModule('/src/api/healthApi.ts');
const { productApi } = await vite.ssrLoadModule('/src/api/productApi.ts');
const { sessionStorageService } = await vite.ssrLoadModule('/src/storage/sessionStorage.ts');

const user = { id: 10, name: 'Usuario de prueba', email: 'frontend@example.test', role: 'consumer' };

function browser(t, entries = []) {
  const values = new Map(entries);
  const events = new EventTarget();
  const originalStorage = Object.getOwnPropertyDescriptor(globalThis, 'localStorage');
  const originalWindow = Object.getOwnPropertyDescriptor(globalThis, 'window');
  Object.defineProperty(globalThis, 'localStorage', {
    configurable: true,
    value: {
      getItem: key => values.get(key) ?? null,
      setItem: (key, value) => values.set(key, value),
      removeItem: key => values.delete(key)
    }
  });
  Object.defineProperty(globalThis, 'window', { configurable: true, value: events });
  t.after(() => {
    if (originalStorage) Object.defineProperty(globalThis, 'localStorage', originalStorage);
    else delete globalThis.localStorage;
    if (originalWindow) Object.defineProperty(globalThis, 'window', originalWindow);
    else delete globalThis.window;
  });
  return { values, events };
}

test('restaura una sesión con las claves existentes y tolera un usuario local dañado', t => {
  const { values } = browser(t, [['smartfood_token', 'fixture-token'], ['smartfood_user', JSON.stringify(user)]]);
  assert.equal(sessionStorageService.getToken(), 'fixture-token');
  assert.deepEqual(sessionStorageService.getUser(), user);
  values.set('smartfood_user', '{');
  assert.equal(sessionStorageService.getUser(), null);
  assert.equal(sessionStorageService.getToken(), 'fixture-token');
  sessionStorageService.clear();
  assert.equal(values.size, 0);
});

test('agrega el Bearer y conserva la sesión si un inicio de sesión devuelve 401', async t => {
  const { events } = browser(t);
  sessionStorageService.save('fixture-token', user);
  let expiration = 0;
  events.addEventListener(AUTH_EXPIRED_EVENT, () => { expiration++; });
  t.mock.method(globalThis, 'fetch', async (url, init) => {
    assert.ok(url.endsWith('/auth/login'));
    assert.equal(init.method, 'POST');
    assert.equal(init.headers.Authorization, 'Bearer fixture-token');
    assert.deepEqual(JSON.parse(init.body), { email: user.email, password: 'fixture-password' });
    return Response.json({ error: 'Credenciales incorrectas' }, { status: 401 });
  });
  await assert.rejects(authApi.login(user.email, 'fixture-password'), /Credenciales incorrectas/);
  assert.equal(sessionStorageService.getToken(), 'fixture-token');
  assert.equal(expiration, 0);
});

test('borra la sesión y emite el evento cuando una ruta protegida rechaza el JWT', async t => {
  const { events } = browser(t);
  let expiration = 0;
  events.addEventListener(AUTH_EXPIRED_EVENT, () => { expiration++; });
  const fetch = t.mock.method(globalThis, 'fetch', async () => Response.json(
    { error: 'Token inválido o expirado' }, { status: 403 }
  ));
  sessionStorageService.save('fixture-token', user);
  await assert.rejects(authApi.getMe(), /Token inválido o expirado/);
  assert.equal(sessionStorageService.getUser(), null);
  assert.equal(sessionStorageService.getToken(), null);
  assert.equal(expiration, 1);

  fetch.mock.mockImplementation(async () => new Response('', { status: 401 }));
  sessionStorageService.save('otro-token-de-prueba', user);
  await assert.rejects(authApi.getMe(), /Error en la petición al servidor/);
  assert.equal(sessionStorageService.getToken(), null);
  assert.equal(expiration, 2);
});

test('distingue error de red, cuerpo ausente y JSON con una estructura inesperada', async t => {
  browser(t);
  const fetch = t.mock.method(globalThis, 'fetch', async () => { throw new TypeError('fallo de prueba'); });
  await assert.rejects(healthApi.getHealth(), /No se pudo conectar con el servidor/);
  fetch.mock.mockImplementation(async () => new Response(null, { status: 204 }));
  assert.equal(await healthApi.getHealth(), null);
  fetch.mock.mockImplementation(async () => Response.json({ products: [null], total: 1, stores: [], categories: [], message: '' }));
  await assert.rejects(productApi.getProducts({ search: 'arroz' }), /no tiene el formato esperado/);
});
