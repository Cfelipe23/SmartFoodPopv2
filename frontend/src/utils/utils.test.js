import test from 'node:test';
import assert from 'node:assert/strict';
import { createTestModules } from '../../scripts/testModules.js';

const vite = await createTestModules();
test.after(() => vite.close());
const { filterProducts } = await vite.ssrLoadModule('/src/utils/filterProducts.ts');
const { formatCop, discountPercent, bestDiscount } = await vite.ssrLoadModule('/src/utils/format.ts');
const { buildProductPayload } = await vite.ssrLoadModule('/src/utils/productPayload.ts');

const stores = [{ id: 1, code: 'd1', name: 'Tiendas D1' }, { id: 2, code: 'olimpica', name: 'Olímpica' }];
const categories = [{ id: 1, slug: 'granos-y-basicos' }, { id: 2, slug: 'lacteos' }];
const products = [
  { id: 1, name: 'Fríjol Cargamanto 500 G', description: '', category_id: 1, prices: [{ store_id: 1, price: 5000, previous_price: 5000, is_offer: false }] },
  { id: 2, name: 'Leche Entera 1 L', description: 'UHT', category_id: 2, prices: [{ store_id: 1, price: 3000, previous_price: 4000, is_offer: true }, { store_id: 2, price: 3500, previous_price: 3500, is_offer: false }] },
  { id: 3, name: 'Arroz Diana 500 G', description: '', category_id: 1, prices: [{ store_id: 2, price: 1990, previous_price: 2490, is_offer: true }] }
];
const base = { products, categories, stores, favorites: [], searchTerm: '', selectedCategory: 'all', selectedStore: 'all', activeTab: 'catalog' };
const ids = (options) => filterProducts({ ...base, ...options }).map(product => product.id);

test('RF04: la búsqueda ignora tildes y mayúsculas', () => {
  assert.deepEqual(ids({ searchTerm: 'FRIJOL' }), [1]);
  assert.deepEqual(ids({ searchTerm: 'uht' }), [2]);
  assert.deepEqual(ids({ searchTerm: 'zzz' }), []);
});

test('RF09: filtra por categoría y por tienda', () => {
  assert.deepEqual(ids({ selectedCategory: 'lacteos' }), [2]);
  assert.deepEqual(ids({ selectedStore: 'olimpica' }), [2, 3]);
  assert.deepEqual(ids({ selectedCategory: 'granos-y-basicos', selectedStore: 'olimpica' }), [3]);
});

test('RF08: la pestaña de ofertas muestra primero el mayor descuento', () => {
  assert.deepEqual(ids({ activeTab: 'offers' }), [2, 3]);
  assert.equal(bestDiscount(products[1].prices), 25);
  assert.equal(bestDiscount(products[2].prices), 20);
});

test('RF10: la pestaña de guardados solo muestra los favoritos', () => {
  assert.deepEqual(ids({ activeTab: 'favorites', favorites: [3] }), [3]);
  assert.deepEqual(ids({ activeTab: 'favorites', favorites: [] }), []);
});

test('formato de precios y descuentos', () => {
  assert.equal(formatCop(1990), '$1.990');
  assert.equal(discountPercent(4000, 3000), 25);
  assert.equal(discountPercent(3000, 3000), 0);
  assert.equal(discountPercent(undefined, 3000), 0);
});

test('HU11: el formulario del admin valida campos obligatorios antes de guardar', () => {
  const form = (overrides = {}) => ({ name: 'Arroz', description: '', category_id: 1, unit: '', image_url: '', prices: { 1: { price: '1500', is_offer: false, previous_price: '' }, 2: { price: '', is_offer: false, previous_price: '' } }, ...overrides });

  assert.match(buildProductPayload(form({ name: '  ' }), stores).error, /nombre/i);
  assert.match(buildProductPayload(form({ prices: { 1: { price: '' }, 2: { price: '' } } }), stores).error, /al menos una tienda/);
  assert.match(buildProductPayload(form({ prices: { 1: { price: '-3' }, 2: { price: '' } } }), stores).error, /mayor que cero/);
  assert.match(buildProductPayload(form({ prices: { 1: { price: '100', is_offer: true, previous_price: '50' }, 2: { price: '' } } }), stores).error, /precio anterior/);

  const ok = buildProductPayload(form({ prices: { 1: { price: '1500' }, 2: { price: '1200', is_offer: true, previous_price: '1500' } } }), stores);
  assert.equal(ok.error, undefined);
  assert.deepEqual(ok.payload.prices, [
    { store_id: 1, price: 1500, previous_price: 1500, is_offer: false },
    { store_id: 2, price: 1200, previous_price: 1500, is_offer: true }
  ]);
  assert.equal(ok.payload.unit, '1 Unidad');
});
