import test from 'node:test';
import assert from 'node:assert/strict';
import { createElement } from 'react';
import { renderToString } from 'react-dom/server';
import { createTestModules } from '../../scripts/testModules.js';

const vite = await createTestModules();
test.after(() => vite.close());
const { useFavorites } = await vite.ssrLoadModule('/src/hooks/useFavorites.ts');
const { sessionStorageService } = await vite.ssrLoadModule('/src/storage/sessionStorage.ts');

function FavoritesProbe({ options, observe }) {
  observe(useFavorites(options));
  return null;
}

function readFavorites(options) {
  let snapshot;
  const observe = value => { snapshot = value; };
  renderToString(createElement(FavoritesProbe, { options, observe }));
  return snapshot;
}

test('sin usuario no hay favoritos y guardar pide autenticación', async t => {
  const fetch = t.mock.method(globalThis, 'fetch', async () => { throw new Error('Petición inesperada'); });
  let requests = 0;
  const result = readFavorites({ user: null, onAuthRequired: () => { requests++; } });
  assert.deepEqual(result.favorites, []);
  assert.equal(await result.toggleFavorite(8), null);
  assert.equal(requests, 1);
  assert.equal(fetch.mock.callCount(), 0);
});

test('favoritos conserva el error de autorización y requiere confirmación del cambio', async t => {
  const original = Object.getOwnPropertyDescriptor(globalThis, 'localStorage');
  Object.defineProperty(globalThis, 'localStorage', { configurable: true, value: { getItem: () => null } });
  t.after(() => {
    if (original) Object.defineProperty(globalThis, 'localStorage', original);
    else delete globalThis.localStorage;
  });
  const fetch = t.mock.method(globalThis, 'fetch', async () =>
    Response.json({ error: 'Acceso denegado: Token no proporcionado' }, { status: 401 })
  );
  const result = readFavorites({ user: { id: 10 }, onAuthRequired: () => {} });
  await assert.rejects(result.toggleFavorite(8), /Token no proporcionado/);
  fetch.mock.mockImplementation(async () => new Response(null, { status: 204 }));
  await assert.rejects(result.toggleFavorite(8), /no confirma el cambio en favoritos/);
});

const accountA = { id: 10, name: 'Cuenta A', email: 'a@example.test', role: 'consumer' };
const accountB = { id: 20, name: 'Cuenta B', email: 'b@example.test', role: 'consumer' };

function pendingResponse(t) {
  let respond;
  const promise = new Promise(resolve => { respond = resolve; });
  t.mock.method(globalThis, 'fetch', () => promise);
  return respond;
}

function fakeSession(t) {
  const storage = new Map();
  const window = new EventTarget();
  for (const [key, value] of Object.entries({
    localStorage: {
      getItem: key => storage.get(key) ?? null,
      setItem: (key, value) => storage.set(key, value),
      removeItem: key => storage.delete(key)
    },
    window
  })) {
    const original = Object.getOwnPropertyDescriptor(globalThis, key);
    Object.defineProperty(globalThis, key, { configurable: true, value });
    t.after(() => {
      if (original) Object.defineProperty(globalThis, key, original);
      else delete globalThis[key];
    });
  }
  sessionStorageService.save('token-de-prueba-a', accountA);
  return window;
}

for (const [scenario, transition] of [
  ['cambio a la cuenta B', () => sessionStorageService.save('token-de-prueba-b', accountB)],
  ['cierre de sesión', () => sessionStorageService.clear()],
  ['nuevo inicio en la misma cuenta y con el mismo token', () => {
    sessionStorageService.clear();
    sessionStorageService.save('token-de-prueba-a', accountA);
  }]
]) {
  test(`una escritura pendiente de favoritos se descarta tras ${scenario}`, async t => {
    fakeSession(t);
    const respond = pendingResponse(t);
    const { toggleFavorite } = readFavorites({ user: accountA, onAuthRequired: () => {} });
    const pending = toggleFavorite(8);
    transition();
    respond(Response.json({ isFavorite: true, message: 'Producto guardado' }));
    assert.equal(await pending, null);
  });
}

test('un rechazo tardío del token de A no cierra la sesión de B', async t => {
  const window = fakeSession(t);
  const respond = pendingResponse(t);
  let expired = 0;
  window.addEventListener('smartfood:auth-expired', () => { expired++; });
  const { toggleFavorite } = readFavorites({ user: accountA, onAuthRequired: () => {} });
  const pending = toggleFavorite(8);
  sessionStorageService.save('token-de-prueba-b', accountB);
  respond(Response.json({ error: 'Token inválido o expirado' }, { status: 403 }));
  assert.equal(await pending.catch(error => error.message), null);
  assert.deepEqual(sessionStorageService.getUser(), accountB);
  assert.equal(expired, 0);
});

test('una sesión vigente recibe la confirmación al guardar y al quitar un favorito', async t => {
  fakeSession(t);
  const fetch = t.mock.method(globalThis, 'fetch', async () =>
    Response.json({ isFavorite: true, message: 'Producto guardado' }));
  const { toggleFavorite } = readFavorites({ user: accountA, onAuthRequired: () => {} });
  assert.equal(await toggleFavorite(8), 'Producto guardado');
  fetch.mock.mockImplementation(async () => Response.json({ isFavorite: false, message: 'Producto eliminado' }));
  assert.equal(await toggleFavorite(8), 'Producto eliminado');
  assert.deepEqual(fetch.mock.calls.map(call => JSON.parse(call.arguments[1].body)), [
    { product_id: 8 }, { product_id: 8 }
  ]);
});
