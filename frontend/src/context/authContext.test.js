import test from 'node:test';
import assert from 'node:assert/strict';
import { createElement } from 'react';
import { renderToString } from 'react-dom/server';
import { createTestModules } from '../../scripts/testModules.js';

const vite = await createTestModules();
test.after(() => vite.close());
const { AuthProvider } = await vite.ssrLoadModule('/src/context/AuthContext.tsx');
const { useAuth } = await vite.ssrLoadModule('/src/hooks/useAuth.ts');

const user = { id: 13, name: 'Usuario de prueba', email: 'context@example.test', role: 'consumer' };

function installStorage(t) {
  const original = Object.getOwnPropertyDescriptor(globalThis, 'localStorage');
  const values = new Map();
  Object.defineProperty(globalThis, 'localStorage', {
    configurable: true,
    value: {
      getItem: key => values.get(key) ?? null,
      setItem: (key, value) => values.set(key, value),
      removeItem: key => values.delete(key)
    }
  });
  t.after(() => {
    if (original) Object.defineProperty(globalThis, 'localStorage', original);
    else delete globalThis.localStorage;
  });
  return values;
}

function Consumer({ observe }) {
  observe(useAuth());
  return null;
}

function readContext() {
  let context;
  const observe = value => { context = value; };
  renderToString(createElement(AuthProvider, null, createElement(Consumer, { observe })));
  return context;
}

test('el proveedor distingue sesión existente, ausencia y almacenamiento dañado', t => {
  const storage = installStorage(t);
  assert.equal(readContext().user, null);
  storage.set('smartfood_user', JSON.stringify(user));
  storage.set('smartfood_token', 'fixture-token');
  assert.deepEqual(readContext().user, user);
  storage.set('smartfood_user', '{');
  assert.equal(readContext().user, null);
  assert.equal(storage.get('smartfood_token'), 'fixture-token');
});

test('useAuth mantiene el error cuando se usa sin el proveedor', () => {
  function Consumer() {
    useAuth();
    return null;
  }
  assert.throws(() => renderToString(createElement(Consumer)), /dentro de AuthProvider/);
});

test('inicio, registro y cierre conservan las claves y los mensajes de confirmación', async t => {
  const storage = installStorage(t);
  t.mock.method(globalThis, 'fetch', async (url, options) => {
    const body = JSON.parse(options.body);
    assert.equal(body.email, user.email);
    if (url.endsWith('/auth/register')) assert.equal(body.name, user.name);
    return Response.json({ token: 'fixture-token', user, message: 'Confirmado' });
  });
  const context = readContext();
  assert.equal(await context.login(user.email, 'fixture-password'), 'Confirmado');
  assert.deepEqual(JSON.parse(storage.get('smartfood_user')), user);
  context.logout();
  assert.equal(storage.size, 0);
  assert.equal(await context.register(user.name, user.email, 'fixture-password'), 'Confirmado');
  assert.equal(storage.get('smartfood_token'), 'fixture-token');
});

test('un error o una respuesta de sesión vacía no reemplaza una sesión existente', async t => {
  const storage = installStorage(t);
  storage.set('smartfood_token', 'fixture-token');
  storage.set('smartfood_user', JSON.stringify(user));
  const fetch = t.mock.method(globalThis, 'fetch', async () =>
    Response.json({ error: 'Credenciales incorrectas' }, { status: 401 })
  );
  const context = readContext();
  await assert.rejects(context.login(user.email, 'fixture-wrong'), /Credenciales incorrectas/);
  fetch.mock.mockImplementation(async () => new Response(null, { status: 204 }));
  await assert.rejects(context.register(user.name, user.email, 'fixture-password'), /no contiene una sesión/);
  assert.equal(storage.get('smartfood_token'), 'fixture-token');
  assert.deepEqual(JSON.parse(storage.get('smartfood_user')), user);
});
