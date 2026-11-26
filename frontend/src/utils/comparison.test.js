import test from 'node:test';
import assert from 'node:assert/strict';
import { createTestModules } from '../../scripts/testModules.js';

const vite = await createTestModules();
test.after(() => vite.close());
const { buildComparison, isComparable } = await vite.ssrLoadModule('/src/utils/comparison.ts');
const { filterProducts } = await vite.ssrLoadModule('/src/utils/filterProducts.ts');

const stores = [{ id: 1, code: 'd1', name: 'Tiendas D1' }, { id: 2, code: 'olimpica', name: 'Olímpica' }];
const priceRow = (store_id, price, per, value) => ({ store_id, price, previous_price: price, is_offer: false, unit_price: per ? { value, per } : null });

test('RF07: la tarjeta compara el producto con su equivalente de la otra tienda por kg', () => {
  const product = {
    id: 1, name: 'Arroz Diana 500 G', unit: '500 g',
    prices: [priceRow(1, 2000, 'kg', 4000)],
    equivalent: { id: 2, name: 'Arroz Diana 1 Kg', unit: '1 kg', prices: [priceRow(2, 3600, 'kg', 3600)] }
  };
  const comparison = buildComparison(product, stores);
  assert.equal(comparison.comparable, true);
  assert.equal(comparison.rows.length, 2);
  assert.equal(comparison.basis, 'unit');
  assert.equal(comparison.differentSizes, true);
  assert.equal(comparison.best.store_id, 2, 'la presentación de 1 kg es más barata por kg aunque cueste más en total');
  assert.deepEqual(comparison.missingStores, []);
  assert.equal(isComparable(product), true);
});

test('RF07: el papel higiénico se compara por metro y el cliente acepta esa medida', async () => {
  const product = {
    id: 1, name: 'Papel Higiénico Rendy 12 Un 33 Mts', unit: '12 x 33 m', description: null, image_url: null, category_id: 3,
    prices: [{ ...priceRow(1, 14800, 'm', 37), offer_description: '' }],
    equivalent: { id: 2, name: 'Papel Higiénico Familia Expert 26 Mts X9', unit: '9 x 26 m', image_url: null, score: 0.6, prices: [{ ...priceRow(2, 26050, 'm', 111), offer_description: '' }] }
  };
  const comparison = buildComparison(product, stores);
  assert.equal(comparison.basis, 'unit');
  assert.equal(comparison.measure, 'm');
  assert.equal(comparison.best.store_id, 1);
  const { isCatalog } = await vite.ssrLoadModule('/src/api/responseGuards.ts');
  const catalog = { total: 1, message: '', products: [product], stores: [], categories: [{ id: 5, name: 'Aseo Personal', slug: 'aseo-personal', icon: '🧴' }] };
  assert.equal(isCatalog(catalog), true, 'una respuesta con precio por metro es válida');
  assert.equal(isCatalog({ ...catalog, products: [{ ...product, prices: [{ ...product.prices[0], unit_price: { value: 1, per: 'cm' } }] }] }), false);
});

test('RF07: un producto idéntico en ambas tiendas se compara por precio', () => {
  const product = { id: 1, name: 'Arroz 500 G', unit: '500 g', prices: [priceRow(1, 2000), priceRow(2, 1900)], equivalent: null };
  const comparison = buildComparison(product, stores);
  assert.equal(comparison.basis, 'price');
  assert.equal(comparison.best.store_id, 2);
  assert.equal(comparison.differentSizes, false);
});

test('RF07: sin equivalente se informa qué tienda no tiene el producto', () => {
  const product = { id: 1, name: 'Banano', unit: 'Unidad', prices: [priceRow(1, 500)], equivalent: null };
  const comparison = buildComparison(product, stores);
  assert.equal(comparison.comparable, false);
  assert.equal(comparison.best, null);
  assert.deepEqual(comparison.missingStores.map(store => store.name), ['Olímpica']);
  assert.equal(isComparable(product), false);
});

test('RF07: el filtro «solo comparables» oculta los productos sin comparación', () => {
  const products = [
    { id: 1, name: 'A', category_id: 1, prices: [priceRow(1, 1)], equivalent: null },
    { id: 2, name: 'B', category_id: 1, prices: [priceRow(1, 1)], equivalent: { id: 9, name: 'B2', unit: '', prices: [priceRow(2, 1)] } },
    { id: 3, name: 'C', category_id: 1, prices: [priceRow(1, 1), priceRow(2, 1)], equivalent: null }
  ];
  const base = { products, categories: [], stores, favorites: [], searchTerm: '', selectedCategory: 'all', selectedStore: 'all', activeTab: 'catalog' };
  assert.deepEqual(filterProducts({ ...base, onlyComparable: true }).map(p => p.id), [2, 3]);
  assert.deepEqual(filterProducts({ ...base }).map(p => p.id), [1, 2, 3]);
});

test('cada fila de la comparación trae el enlace a la página del producto en su tienda', () => {
  const product = {
    prices: [{ store_id: 1, price: 2000, source_url: 'https://www.d1.com.co/arroz/p' }],
    equivalent: { name: 'Arroz 1 Kg', unit: '1 kg', prices: [{ store_id: 2, price: 3600, source_url: 'https://www.olimpica.com/arroz-1kg/p' }] }
  };
  assert.deepEqual(buildComparison(product).rows.map(row => row.source_url), ['https://www.d1.com.co/arroz/p', 'https://www.olimpica.com/arroz-1kg/p']);
});
