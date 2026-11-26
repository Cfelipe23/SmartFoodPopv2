import test from 'node:test';
import assert from 'node:assert/strict';
import { createElement } from 'react';
import { renderToString } from 'react-dom/server';
import { createTestModules } from '../../scripts/testModules.js';

const vite = await createTestModules();
test.after(() => vite.close());
const { useFavorites } = await vite.ssrLoadModule('/src/hooks/useFavorites.ts');

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
