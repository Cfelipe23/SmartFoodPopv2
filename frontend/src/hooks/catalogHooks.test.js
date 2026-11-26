import test from 'node:test';
import assert from 'node:assert/strict';
import { createElement } from 'react';
import { renderToString } from 'react-dom/server';
import { createTestModules } from '../../scripts/testModules.js';

const vite = await createTestModules();
test.after(() => vite.close());
const { useProducts } = await vite.ssrLoadModule('/src/hooks/useProducts.ts');
const { useProductDetail } = await vite.ssrLoadModule('/src/hooks/useProductDetail.ts');

function CatalogProbe({ productId, observe }) {
  const catalog = useProducts();
  const detail = useProductDetail(productId);
  observe({ catalog, detail });
  return null;
}

function readHooks(productId) {
  let snapshot;
  const observe = value => { snapshot = value; };
  renderToString(createElement(CatalogProbe, { productId, observe }));
  return snapshot;
}

test('catálogo y detalle conservan sus estados iniciales y la ausencia de selección', () => {
  const { catalog, detail } = readHooks(undefined);
  assert.deepEqual([catalog.products, catalog.stores, catalog.categories], [[], [], []]);
  assert.equal(catalog.loading, true);
  assert.equal(catalog.error, '');
  assert.equal(detail.detail, null);
  assert.equal(detail.error, '');
  assert.equal(detail.loading, false);
  const selected = readHooks(2).detail;
  assert.equal(selected.detail, null);
  assert.equal(selected.loading, true);
});

test('las acciones administrativas requieren confirmación del servidor antes de actualizar el catálogo', async t => {
  const original = Object.getOwnPropertyDescriptor(globalThis, 'localStorage');
  Object.defineProperty(globalThis, 'localStorage', { configurable: true, value: { getItem: () => null } });
  t.after(() => {
    if (original) Object.defineProperty(globalThis, 'localStorage', original);
    else delete globalThis.localStorage;
  });
  t.mock.method(globalThis, 'fetch', async () => new Response(null, { status: 204 }));
  const { catalog } = readHooks();
  const input = { name: 'Fixture', category_id: 1, prices: [{ store_id: 1, price: 1000 }] };
  await assert.rejects(catalog.addProduct(input), /no confirma el cambio/);
  await assert.rejects(catalog.updateProduct(1, input), /no confirma el cambio/);
  await assert.rejects(catalog.deleteProduct(1), /no confirma el cambio/);
});
