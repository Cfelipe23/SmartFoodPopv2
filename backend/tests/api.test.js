const test = require('node:test');
const assert = require('node:assert/strict');
const { buildContainer } = require('../dist/container');
const { createApp } = require('../dist/app');

// Pruebas de integración: servidor Express real en un puerto efímero, sin proceso externo.
async function startApi() {
  const container = buildContainer({ logger: { log() {}, warn() {} } });
  const server = createApp(container).listen(0);
  await new Promise(resolve => server.once('listening', resolve));
  const base = `http://127.0.0.1:${server.address().port}/api`;
  async function call(method, url, { body, token, raw } = {}) {
    const headers = { 'Content-Type': 'application/json' };
    if (token) headers.Authorization = `Bearer ${token}`;
    const response = await fetch(base + url, { method, headers, body: raw ?? (body ? JSON.stringify(body) : undefined) });
    let data = null;
    try { data = await response.json(); } catch { /* sin cuerpo */ }
    return { status: response.status, data };
  }
  return { call, container, close: () => new Promise(resolve => server.close(resolve)) };
}

let api;
test.before(async () => { api = await startApi(); });
test.after(async () => { await api.close(); });

const credentials = { name: 'Ana Pérez', email: 'ana.api@example.com', password: 'Secreta123' };

test('API: la raíz describe el servicio y health identifica el almacenamiento en memoria', async () => {
  const info = await api.call('GET', '/');
  assert.equal(info.status, 200);
  assert.deepEqual(info.data, {
    app: 'SmartFoodPop API', city: 'Popayán, Colombia', version: '1.0.0', status: 'Online',
    endpoints: ['/api/auth/register', '/api/auth/login', '/api/products', '/api/products/offers',
      '/api/products/compare', '/api/reviews', '/api/favorites', '/api/admin/products']
  });
  const health = await api.call('GET', '/health');
  assert.equal(health.status, 200);
  assert.deepEqual(health.data, { status: 'ok', storage: 'memory' });
});

test('HU01: registro valido, correo duplicado y campos vacios (sin tumbar el servidor)', async () => {
  const ok = await api.call('POST', '/auth/register', { body: credentials });
  assert.equal(ok.status, 201);
  assert.ok(ok.data.token); assert.match(ok.data.message, /Registro exitoso/);

  const duplicate = await api.call('POST', '/auth/register', { body: credentials });
  assert.equal(duplicate.status, 409);
  assert.match(duplicate.data.error, /ya está registrado/);

  const empty = await api.call('POST', '/auth/register', { body: {} });
  assert.equal(empty.status, 400);
  assert.match(empty.data.error, /obligatorios/);

  const noBody = await api.call('POST', '/auth/register');
  assert.equal(noBody.status, 400);
});

test('HU02: login correcto, contraseña incorrecta y campos vacios', async () => {
  const good = await api.call('POST', '/auth/login', { body: { email: credentials.email, password: credentials.password } });
  assert.equal(good.status, 200); assert.ok(good.data.token);
  const me = await api.call('GET', '/auth/me', { token: good.data.token });
  assert.equal(me.status, 200); assert.equal(me.data.user.email, credentials.email);

  const bad = await api.call('POST', '/auth/login', { body: { email: credentials.email, password: 'incorrecta' } });
  assert.equal(bad.status, 401); assert.match(bad.data.error, /Credenciales incorrectas/);

  const empty = await api.call('POST', '/auth/login', { body: { email: '', password: '' } });
  assert.equal(empty.status, 400);

  assert.equal((await api.call('GET', '/auth/me')).status, 401);
  assert.equal((await api.call('GET', '/auth/me', { token: 'basura' })).status, 403);
});

test('seguridad: no existe recuperación de contraseña sin verificación de identidad', async () => {
  const response = await api.call('POST', '/auth/reset-password', { body: { email: 'admin@smartfood.com', newPassword: 'hackeada' } });
  assert.equal(response.status, 404);
  const admin = await api.call('POST', '/auth/login', { body: { email: 'admin@smartfood.com', password: 'admin123' } });
  assert.equal(admin.status, 200);
});

test('JSON mal formado responde 400 en lugar de 500', async () => {
  const response = await api.call('POST', '/auth/login', { raw: '{no es json' });
  assert.equal(response.status, 400);
});

test('HU03/HU04/HU09: catálogo, búsqueda y filtros por tienda y categoría', async () => {
  const all = await api.call('GET', '/products');
  assert.equal(all.status, 200);
  assert.ok(all.data.total > 100, 'catálogo del scraper cargado');
  assert.deepEqual(all.data.categories.map(category => category.name), ['Granos y Básicos', 'Lácteos', 'Aseo del Hogar', 'Otros', 'Aseo Personal']);
  assert.ok(all.data.products.every(product => product.name && product.prices.length && product.prices.every(price => price.price > 0 && price.store_id)));

  const search = await api.call('GET', '/products?search=arroz');
  assert.ok(search.data.total > 0 && search.data.products.every(product => /arroz/i.test(product.name + product.description)));

  const none = await api.call('GET', '/products?search=zzzxxyy');
  assert.equal(none.data.total, 0); assert.ok(none.data.message);

  const byStore = await api.call('GET', '/products?store=olimpica');
  assert.ok(byStore.data.products.every(product => product.prices.some(price => price.store_id === 2)));

  const byCategory = await api.call('GET', '/products?category=lacteos');
  assert.ok(byCategory.data.total > 0 && byCategory.data.products.every(product => product.category_id === 2));

  assert.equal((await api.call('GET', '/products?store=inexistente')).status, 400);
});

test('HU05/HU07/HU08: detalle, comparación y ofertas', async () => {
  const comparable = (await api.call('GET', '/products')).data.products.find(product => product.prices.length === 2);
  assert.ok(comparable, 'existe al menos un producto presente en D1 y Olímpica');

  const detail = await api.call('GET', `/products/${comparable.id}`);
  assert.equal(detail.status, 200);
  assert.ok(detail.data.product.category_name);
  assert.deepEqual(detail.data.review_summary, { count: 0, average: 0 });
  assert.ok(Array.isArray(detail.data.similar));
  assert.equal((await api.call('GET', '/products/99999999')).status, 404);

  const compare = await api.call('GET', '/products/compare?search=arroz');
  assert.equal(compare.status, 200);
  assert.ok(compare.data.products.every(product => product.potential_savings >= 0));

  const offers = await api.call('GET', '/products/offers');
  assert.equal(offers.status, 200);
  assert.ok(offers.data.total > 0);
  assert.ok(offers.data.offers.every(product => product.prices.some(price => price.is_offer && price.offer_description)));
});

test('HU06: reseñas públicas de lectura, publicación solo autenticada y validada', async () => {
  const product = (await api.call('GET', '/products')).data.products[0];
  const { token } = (await api.call('POST', '/auth/login', { body: { email: credentials.email, password: credentials.password } })).data;

  assert.equal((await api.call('POST', '/reviews', { body: { product_id: product.id, rating: 5, comment: 'x' } })).status, 401);
  assert.equal((await api.call('POST', '/reviews', { token, body: { product_id: product.id, rating: 9, comment: 'x' } })).status, 400);
  assert.equal((await api.call('POST', '/reviews', { token, body: { product_id: product.id, rating: 4, comment: '   ' } })).status, 400);
  assert.equal((await api.call('POST', '/reviews', { token, body: { product_id: 99999999, rating: 4, comment: 'hola' } })).status, 404);

  const created = await api.call('POST', '/reviews', { token, body: { product_id: product.id, rating: 4, comment: 'Buen precio en Popayán' } });
  assert.equal(created.status, 201);
  assert.equal(created.data.review.user_name, credentials.name);

  const list = await api.call('GET', `/reviews/product/${product.id}`);
  assert.equal(list.data.reviews.length, 1);
  const detail = await api.call('GET', `/products/${product.id}`);
  assert.deepEqual(detail.data.review_summary, { count: 1, average: 4 });
});

test('HU10: guardar, listar y quitar productos de interés', async () => {
  const product = (await api.call('GET', '/products')).data.products[3];
  const { token } = (await api.call('POST', '/auth/login', { body: { email: credentials.email, password: credentials.password } })).data;

  assert.equal((await api.call('GET', '/favorites')).status, 401);
  assert.equal((await api.call('POST', '/favorites/toggle', { token, body: { product_id: 99999999 } })).status, 404);

  const saved = await api.call('POST', '/favorites/toggle', { token, body: { product_id: product.id } });
  assert.equal(saved.data.isFavorite, true);
  const list = await api.call('GET', '/favorites', { token });
  assert.deepEqual(list.data.favorites.map(item => item.id), [product.id]);

  const removed = await api.call('POST', '/favorites/toggle', { token, body: { product_id: product.id } });
  assert.equal(removed.data.isFavorite, false);
  assert.equal((await api.call('GET', '/favorites', { token })).data.favorites.length, 0);
});

test('HU11: panel de administrador (permisos, validación, crear, editar y eliminar)', async () => {
  const consumer = (await api.call('POST', '/auth/login', { body: { email: credentials.email, password: credentials.password } })).data.token;
  const admin = (await api.call('POST', '/auth/login', { body: { email: 'admin@smartfood.com', password: 'admin123' } })).data.token;
  const payload = { name: 'Producto de prueba', description: 'Detalle', category_id: 4, unit: '1 kg', prices: [{ store_id: 1, price: 1500 }, { store_id: 2, price: 1800, is_offer: true, previous_price: 2000 }] };

  assert.equal((await api.call('POST', '/admin/products', { body: payload })).status, 401);
  assert.equal((await api.call('POST', '/admin/products', { token: consumer, body: payload })).status, 403);

  assert.equal((await api.call('POST', '/admin/products', { token: admin, body: { ...payload, name: '  ' } })).status, 400);
  assert.equal((await api.call('POST', '/admin/products', { token: admin, body: { ...payload, category_id: 99 } })).status, 400);
  assert.equal((await api.call('POST', '/admin/products', { token: admin, body: { ...payload, prices: [] } })).status, 400);
  assert.equal((await api.call('POST', '/admin/products', { token: admin, body: { ...payload, prices: [{ store_id: 1, price: -5 }] } })).status, 400);
  assert.equal((await api.call('POST', '/admin/products', { token: admin, body: { ...payload, prices: [{ store_id: 2, price: 100, is_offer: true, previous_price: 50 }] } })).status, 400);

  const created = await api.call('POST', '/admin/products', { token: admin, body: payload });
  assert.equal(created.status, 201);
  const id = created.data.product.id;
  assert.ok((await api.call('GET', '/products')).data.products.some(product => product.id === id), 'el cambio se refleja de inmediato');

  const updated = await api.call('PUT', `/admin/products/${id}`, { token: admin, body: { name: 'Producto editado', prices: [{ store_id: 1, price: 1400 }] } });
  assert.equal(updated.status, 200);
  assert.equal(updated.data.product.name, 'Producto editado');
  assert.equal(updated.data.product.prices[0].price, 1400);
  assert.equal((await api.call('PUT', `/admin/products/${id}`, { token: admin, body: { name: '' } })).status, 400);
  assert.equal((await api.call('PUT', '/admin/products/99999999', { token: admin, body: { name: 'x' } })).status, 404);

  assert.equal((await api.call('DELETE', `/admin/products/${id}`, { token: admin })).status, 200);
  assert.equal((await api.call('GET', `/products/${id}`)).status, 404);
  assert.equal((await api.call('DELETE', `/admin/products/${id}`, { token: admin })).status, 404);
});
