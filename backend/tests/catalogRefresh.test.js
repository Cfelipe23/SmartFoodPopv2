const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const test = require('node:test');
const assert = require('node:assert/strict');
const { newDb } = require('pg-mem');
const { toProductPageUrl, productUrlKey } = require('../dist/domain/productUrl');
const { mergeCatalog } = require('../dist/domain/catalogRefresh');
const { buildCatalogCards } = require('../dist/domain/catalogBuilder');
const { PostgresPersistence } = require('../dist/data/PostgresPersistence');
const { bootstrapContainer, buildContainer } = require('../dist/container');
const { createInMemoryStore } = require('../dist/data/inMemoryStore');
const { CatalogEquivalenceIndex } = require('../dist/services/EquivalenceIndexProxy');
const { ScrapedCatalogAdapter } = require('../dist/data/ScrapedCatalogAdapter');

const quietLogger = { log() {}, warn() {} };

test('RF03: el adaptador produce las mismas tarjetas que el dominio con el JSON del scraper', () => {
  const file = path.join(__dirname, 'fixtures/scraped_sample.json');
  assert.deepEqual(new ScrapedCatalogAdapter(file).readCards(), buildCatalogCards(require(file)));
});

test('RF03: el adaptador admite registros antiguos junto a registros inválidos', t => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'sfp-adapter-'));
  t.after(() => fs.rmSync(dir, { recursive: true, force: true }));
  const file = path.join(dir, 'catalog.json');
  fs.writeFileSync(file, JSON.stringify([null, { name: 'Arroz Diana 500 G', store: 'D1', price: '2000', image_url: null }]));
  const cards = new ScrapedCatalogAdapter(file).readCards();
  assert.equal(cards.length, 1);
  assert.deepEqual(cards[0].prices, [{
    store_id: 1, price: 2000, previous_price: 2000, is_offer: false, offer_description: '', source_url: ''
  }]);
});

for (const [label, content, error] of [
  ['archivo inexistente', undefined, { code: 'ENOENT' }],
  ['JSON mal formado', '[', SyntaxError],
  ['objeto en lugar de lista', '{}', /debe ser una lista/],
  ['lista vacía', '[]', /no contiene productos válidos/],
  ['registros inválidos', '[null, {"name":"Arroz","store":"d1","price":0}]', /no contiene productos válidos/]
]) {
  test(`RF03: ${label} conserva el catálogo durante la carga y la actualización`, t => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'sfp-adapter-'));
    t.after(() => fs.rmSync(dir, { recursive: true, force: true }));
    const scrapedPath = path.join(dir, 'catalog.json');
    if (content !== undefined) fs.writeFileSync(scrapedPath, content);
    assert.throws(() => new ScrapedCatalogAdapter(scrapedPath).readCards(), error);
    const store = createInMemoryStore();
    store.products = buildCatalogCards([{ name: 'Arroz 500 G', store: 'd1', price: 2000 }]);
    const expected = structuredClone(store.products);
    const container = buildContainer({ store, scrapedPath, logger: quietLogger });
    assert.deepEqual(store.products, expected);
    assert.equal(container.catalogRefreshService.refresh(), null);
    assert.deepEqual(store.products, expected);
  });
}
const D1 = 'https://www.d1.com.co';
const OLI = 'https://www.olimpica.com';
const price = (store_id, value, url) => ({ store_id, price: value, previous_price: value, is_offer: false, offer_description: '', source_url: url });
const raw = (store, name, value, slug) => ({ store, name, price: value, original_price: value, image_url: `https://img/${slug}.png`, sku_id: slug, source_url: `${store === 'd1' ? D1 : OLI}/${slug}` });

test('RF03: el enlace del producto abre su página en la tienda (VTEX: /slug/p)', () => {
  assert.equal(toProductPageUrl(`${D1}/blanqueador-brilla-king-2000ml-12000089`), `${D1}/blanqueador-brilla-king-2000ml-12000089/p`);
  assert.equal(toProductPageUrl(`${OLI}/leche-colanta/p`), `${OLI}/leche-colanta/p`);
  assert.equal(toProductPageUrl(`${OLI}/leche-colanta/?utm=1`), `${OLI}/leche-colanta/p`);
  assert.equal(toProductPageUrl(`${D1}/`), '', 'sin slug no hay página de producto');
  assert.equal(toProductPageUrl(''), '');
  assert.equal(productUrlKey(`${OLI}/Leche-Colanta`), productUrlKey(`${OLI}/leche-colanta/p`));
  const [card] = buildCatalogCards([raw('d1', 'Arroz Diana 500 G', 2000, 'arroz-diana-500g')]);
  assert.equal(card.prices[0].source_url, `${D1}/arroz-diana-500g/p`);
});

test('actualización de precios: conserva ids, agrega nuevos y retira los que la tienda ya no publica', () => {
  const current = [
    { id: 7, name: 'Arroz Diana 500 G', description: 'Presentación: 500 g.', category_id: 1, unit: '500 g', image_url: 'a', prices: [price(1, 2000, `${D1}/arroz`), price(2, 2100, `${OLI}/arroz`)] },
    { id: 9, name: 'Producto descontinuado', category_id: 4, unit: '', image_url: '', prices: [price(1, 900, `${D1}/viejo`)] },
    { id: 12, name: 'Creado por el admin', category_id: 4, unit: '', image_url: '', prices: [price(2, 5000, '')] }
  ];
  const fresh = [
    { name: 'Arroz Diana 500 G', description: 'Presentación: 500 g. Nueva', category_id: 1, unit: '500 g', image_url: 'a2', prices: [price(1, 1990, `${D1}/arroz/p`), price(2, 2150, `${OLI}/arroz/p`)] },
    { name: 'Azúcar 1 Kg', category_id: 1, unit: '1 kg', image_url: 'z', prices: [price(1, 3390, `${D1}/azucar/p`)] }
  ];
  const result = mergeCatalog(current, fresh, { minStoreRatio: 0 });

  const arroz = result.products.find(p => p.id === 7);
  assert.deepEqual(arroz.prices.map(p => p.price), [1990, 2150], 'mismo id, precios nuevos');
  assert.equal(arroz.prices[0].source_url, `${D1}/arroz/p`);
  assert.equal(result.products.find(p => p.name === 'Azúcar 1 Kg').id, 13, 'los nuevos toman ids libres');
  assert.deepEqual(result.removedIds, [9]);
  assert.deepEqual(result.products.map(p => p.id), [7, 12, 13]);
  assert.deepEqual(result.changedProducts.map(p => p.id), [7, 13]);
  assert.equal(result.remap.size, 0);
  assert.ok(result.products.some(p => p.id === 12), 'lo creado por el administrador no se toca');
  assert.deepEqual(result.stats, { total: 3, updated: 1, created: 1, removed: 1, unchanged: 1 });
});

test('actualización de precios: si una tienda sale incompleta se conservan sus precios anteriores', () => {
  const current = Array.from({ length: 10 }, (_, i) => ({
    id: i + 1, name: `P${i}`, category_id: 4, unit: '', image_url: '',
    prices: [price(1, 100 + i, `${D1}/p${i}`), price(2, 200 + i, `${OLI}/p${i}`)]
  }));
  // Olímpica solo devolvió 2 de 10 productos (p. ej. la API la bloqueó).
  const fresh = current.map((product, i) => ({ ...product, id: undefined, prices: [price(1, 50 + i, `${D1}/p${i}/p`), ...(i < 2 ? [price(2, 1, `${OLI}/p${i}/p`)] : [])] }));
  const result = mergeCatalog(current, fresh);
  assert.deepEqual(result.skippedStores, [2]);
  assert.equal(result.removedIds.length, 0);
  const third = result.products.find(p => p.id === 3);
  assert.deepEqual(third.prices.map(p => p.price), [52, 202], 'D1 se actualiza; Olímpica conserva el precio anterior');
});

test('actualización de precios: si dos fichas pasan a ser el mismo producto, reseñas y favoritos lo siguen', () => {
  const store = createInMemoryStore();
  store.products = [
    { id: 1, name: 'Leche Colanta 1 L', category_id: 2, unit: '1 L', image_url: '', prices: [price(1, 4000, `${D1}/leche`)] },
    { id: 2, name: 'Leche Colanta 1000 Ml', category_id: 2, unit: '1 L', image_url: '', prices: [price(2, 4200, `${OLI}/leche`)] }
  ];
  store.reviews = [{ id: 1, user_id: 1, user_name: 'Ana', product_id: 2, rating: 5, comment: 'ok', created_at: '2026-01-01' }];
  store.favorites = [{ id: 1, user_id: 1, product_id: 1 }, { id: 2, user_id: 1, product_id: 2 }];

  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'sfp-'));
  const scrapedPath = path.join(dir, 'scraped.json');
  fs.writeFileSync(scrapedPath, JSON.stringify([raw('d1', 'Leche Colanta 1000 Ml', 3900, 'leche'), raw('olimpica', 'Leche Colanta 1000 Ml', 4100, 'leche')]));

  const container = buildContainer({ store, loadCatalog: false, scrapedPath, logger: quietLogger });
  const result = container.catalogRefreshService.refresh();
  assert.deepEqual(result.removedIds, [2]);
  assert.deepEqual([...result.remap], [[2, 1]]);
  assert.equal(store.products.length, 1);
  assert.deepEqual(store.products[0].prices.map(p => p.price), [3900, 4100]);
  assert.equal(store.reviews[0].product_id, 1, 'la reseña pasa al producto que quedó');
  assert.deepEqual(store.favorites.map(f => f.product_id), [1], 'sin favoritos duplicados');
  fs.rmSync(dir, { recursive: true, force: true });
});

test('RF07: catálogo y ofertas comparten un cálculo por versión y muestran el precio actualizado del equivalente', t => {
  const builds = t.mock.method(CatalogEquivalenceIndex.prototype, 'getIndex');
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'sfp-index-'));
  t.after(() => fs.rmSync(dir, { recursive: true, force: true }));
  const scrapedPath = path.join(dir, 'catalog.json');
  const rice = { ...raw('d1', 'Arroz Diana 500 G', 2000, 'arroz-500'), original_price: 2500, is_offer: true };
  const equivalent = raw('olimpica', 'Arroz Diana 1 Kg', 3600, 'arroz-kilo');
  fs.writeFileSync(scrapedPath, JSON.stringify([rice, equivalent]));
  const { catalogFacade, catalogRefreshService } = buildContainer({ scrapedPath, logger: quietLogger });
  assert.equal(builds.mock.callCount(), 0);
  const offeredRice = catalogFacade.list().products.find(p => p.prices.some(price => price.is_offer));
  assert.equal(offeredRice.equivalent.prices[0].price, 3600);
  assert.equal(catalogFacade.listOffers().offers[0].equivalent.prices[0].price, 3600);
  assert.equal(builds.mock.callCount(), 1);

  fs.writeFileSync(scrapedPath, JSON.stringify([rice, { ...equivalent, price: 3300 }]));
  assert.equal(catalogRefreshService.refresh().stats.updated, 1);
  assert.equal(builds.mock.callCount(), 1);
  assert.equal(catalogFacade.listOffers().offers[0].equivalent.prices[0].price, 3300);
  assert.equal(catalogFacade.list().products.find(p => p.id === offeredRice.id).equivalent.prices[0].price, 3300);
  assert.equal(builds.mock.callCount(), 2);
});

test('PostgreSQL: al reiniciar se aplican los precios nuevos del scraper sin perder reseñas ni favoritos', async () => {
  const schemaSql = fs.readFileSync(path.join(__dirname, '../dist/data/schema.sql'), 'utf8').replace(/DECIMAL\(\d+,\s*\d+\)/g, 'DECIMAL');
  const { Pool } = newDb().adapters.createPg();
  const persistence = new PostgresPersistence(new Pool(), { logger: { log() {}, error: console.error }, schemaSql });

  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'sfp-'));
  const scrapedPath = path.join(dir, 'scraped.json');
  const items = [raw('d1', 'Arroz Diana 500 G', 2000, 'arroz'), raw('olimpica', 'Arroz Diana 500 G', 2100, 'arroz'), raw('d1', 'Fríjol Rojo 500 G', 5000, 'frijol')];
  fs.writeFileSync(scrapedPath, JSON.stringify(items));

  const first = await bootstrapContainer({ persistence, logger: quietLogger, scrapedPath, reseedCatalog: false });
  const arrozId = first.store.products.find(p => p.name.startsWith('Arroz')).id;
  first.store.reviews.push({ id: 1, user_id: 1, user_name: 'Ana', product_id: arrozId, rating: 4, comment: 'bueno', created_at: new Date().toISOString() });
  persistence.saveReview(first.store.reviews[0]);
  persistence.addFavorite({ id: 1, user_id: 1, product_id: arrozId });
  await persistence.flush();

  // El scraper corre de nuevo: el arroz baja de precio, el fríjol desaparece y llega un producto nuevo.
  fs.writeFileSync(scrapedPath, JSON.stringify([
    { ...items[0], price: 1890, original_price: 1890 }, items[1], raw('d1', 'Azúcar 1 Kg', 3390, 'azucar')
  ]));
  persistence.init = async () => {};
  const second = await bootstrapContainer({ persistence, logger: quietLogger, scrapedPath, reseedCatalog: false });
  const arroz = second.store.products.find(p => p.id === arrozId);
  assert.deepEqual(arroz.prices.map(p => p.price), [1890, 2100]);

  const reloaded = createInMemoryStore();
  await persistence.load(reloaded);
  assert.deepEqual(reloaded.products.map(p => p.name).sort(), ['Arroz Diana 500 G', 'Azúcar 1 Kg']);
  assert.equal(reloaded.products.find(p => p.id === arrozId).prices.find(p => p.store_id === 1).price, 1890);
  assert.equal(reloaded.products.find(p => p.id === arrozId).prices[0].source_url.endsWith('/p'), true);
  assert.equal(reloaded.reviews.length, 1, 'la reseña sigue');
  assert.equal(reloaded.favorites[0].product_id, arrozId, 'el favorito sigue');
  await persistence.close();
  fs.rmSync(dir, { recursive: true, force: true });
});
