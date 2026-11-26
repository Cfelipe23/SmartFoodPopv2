const test = require('node:test');
const assert = require('node:assert/strict');
const { buildCatalogCards } = require('../dist/domain/catalogBuilder');
const { mergeCatalog } = require('../dist/domain/catalogRefresh');
const { applyFilters, defaultProductFilters } = require('../dist/domain/productFilters');

test('RF03: los registros parciales del scraper conservan los valores predeterminados', () => {
  const cards = buildCatalogCards([
    null,
    [],
    { name: 123, price: 2000, store: 'd1' },
    { name: 'Fuera del alcance', price: 2000, store: 'constructor' },
    { name: 'Sin precio', price: 'sin precio', store: 'd1' },
    {
      name: 'Arroz Diana 500 G',
      price: '2000',
      original_price: null,
      store: 'D1',
      image_url: null,
      sku_id: null,
      source_url: null,
      is_offer: true
    }
  ]);

  assert.equal(cards.length, 1);
  const [card] = cards;
  assert.equal(card.id, 1);
  assert.equal(card.unit, '500 g');
  assert.match(card.image_url, /^https:\/\//);
  assert.deepEqual(card.prices, [{
    store_id: 1,
    price: 2000,
    previous_price: 2000,
    is_offer: false,
    offer_description: '',
    source_url: ''
  }]);
});

test('RF03: al recibir exactamente el 50 % de una tienda se aplican sus precios', () => {
  const first = { store: 'd1', name: 'Arroz Diana 500 G', price: 2000, source_url: 'https://www.d1.com.co/arroz' };
  const second = { store: 'd1', name: 'Leche Alpina 1 L', price: 3000, source_url: 'https://www.d1.com.co/leche' };
  const current = buildCatalogCards([first, second]);
  const [rice, milk] = current;

  const refreshed = mergeCatalog(current, buildCatalogCards([{ ...first, price: 1900 }]));

  assert.deepEqual(refreshed.skippedStores, []);
  assert.deepEqual(refreshed.removedIds, [milk.id]);
  assert.equal(refreshed.products[0].id, rice.id);
  assert.equal(refreshed.products[0].prices[0].price, 1900);
});

test('RF03 y RF08: SKU, URL y precio anterior conservan sus reglas al construir el catálogo', () => {
  const cards = buildCatalogCards([
    { name: 'Arroz Diana 500 G', store: 'd1', price: 2500, sku_id: 14 },
    {
      name: 'Arroz Diana 500 G',
      store: 'd1',
      price: '2000',
      original_price: '4000',
      sku_id: '14',
      source_url: 'https://www.d1.com.co/arroz-diana/?utm=1',
      is_offer: true,
      offer_desc: null
    }
  ]);

  assert.equal(cards.length, 1);
  assert.deepEqual(cards[0].prices, [{
    store_id: 1,
    price: 2000,
    previous_price: 4000,
    is_offer: true,
    offer_description: 'Antes $4.000 · ahorras 50%',
    source_url: 'https://www.d1.com.co/arroz-diana/p'
  }]);
});

test('RF09: un filtro de tienda o categoría con solo espacios conserva su comportamiento anterior', () => {
  const products = buildCatalogCards([{ name: 'Arroz Diana 500 G', store: 'd1', price: 2000 }]);
  const catalog = { getCategories: () => [], getStores: () => [] };
  for (const query of [{ category: ' ' }, { store: ' ' }]) {
    assert.deepEqual(applyFilters([], query, catalog, defaultProductFilters), []);
    assert.throws(() => applyFilters(products, query, catalog, defaultProductFilters), TypeError);
  }
});
