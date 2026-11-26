const test = require('node:test');
const assert = require('node:assert/strict');
const { buildEquivalenceIndex } = require('../dist/domain/productEquivalence');
const { describeDbError } = require('../dist/data/PostgresPersistence');
const { buildContainer } = require('../dist/container');
const { createApp } = require('../dist/app');
const { createInMemoryStore } = require('../dist/data/inMemoryStore');
const ProductRepository = require('../dist/repositories/ProductRepository');
const CatalogRepository = require('../dist/repositories/CatalogRepository');
const ProductService = require('../dist/services/ProductService');
const { basePrice, withUnitPrice } = require('../dist/services/pricePresenter');
const { CatalogEquivalenceIndex } = require('../dist/services/EquivalenceIndexProxy');

const price = (store_id, value) => ({ store_id, price: value, previous_price: value, is_offer: false });
const product = (id, name, store_id, value) => ({ id, name, description: '', category_id: 1, unit: '', image_url: '', prices: [price(store_id, value)] });

test('RF07: cada producto de una tienda recibe su equivalente de la otra, aunque el tamaño cambie', () => {
  const products = [
    product(1, 'Arroz Diana 500 G', 1, 2000),
    product(2, 'Arroz Diana 1 Kg', 2, 3600),
    product(3, 'Aceite Imatá 900 Ml', 1, 6950),
    product(4, 'Detergente Ariel 2 Kg', 2, 20000)
  ];
  const index = buildEquivalenceIndex(products);
  assert.equal(index.get(1).product.id, 2);
  assert.equal(index.get(2).product.id, 1);
  assert.equal(index.has(3), false, 'sin equivalente no se inventa uno');
  assert.equal(index.has(4), false);
});

test('RF07: no se mezclan tipos de medida distintos (gramos vs mililitros)', () => {
  const index = buildEquivalenceIndex([product(1, 'Leche Entera 900 Ml', 1, 3000), product(2, 'Leche Entera en Polvo 900 G', 2, 20000)]);
  assert.equal(index.size, 0);
});

test('RF07: el listado incluye precio por kg/L y el equivalente, solo lo comparable (idénticos primero)', () => {
  const store = createInMemoryStore();
  store.products = [
    product(1, 'Banano Unidad', 1, 500),
    product(2, 'Arroz Diana 500 G', 1, 2000),
    product(3, 'Arroz Diana 1 Kg', 2, 3600),
    { ...product(4, 'Fríjol Rojo 500 G', 1, 5000), prices: [price(1, 5000), price(2, 5200)] }
  ];
  const productRepository = new ProductRepository(store);
  const service = new ProductService({ productRepository, catalogRepository: new CatalogRepository(store),
    equivalences: new CatalogEquivalenceIndex(productRepository), unitPrice: withUnitPrice(basePrice) });
  const { products } = service.list();
  assert.deepEqual(products.map(p => p.id), [4, 2, 3], 'idénticos primero, luego con equivalente; lo que no se compara no se lista');
  assert.equal(products.find(p => p.id === 1), undefined);
  const arroz = products.find(p => p.id === 2);
  assert.deepEqual(arroz.prices[0].unit_price, { value: 4000, per: 'kg' });
  assert.equal(arroz.equivalent.name, 'Arroz Diana 1 Kg');
  assert.deepEqual(arroz.equivalent.prices[0].unit_price, { value: 3600, per: 'kg' });
});

test('RF07/RF11: el administrador crea un producto y las equivalencias se actualizan sin reiniciar', () => {
  const container = buildContainer({ logger: { log() {}, warn() {} } });
  const index = container.productService.getEquivalenceIndex();
  const before = container.productService.productRepository.findAll().find(p => !index.has(p.id) && p.prices.length === 1);
  const created = container.productAdminService.create({ name: before.name, category_id: 4, unit: before.unit, prices: [{ store_id: before.prices[0].store_id === 1 ? 2 : 1, price: 1000 }] });
  const after = container.productService.list().products.find(p => p.id === before.id);
  assert.equal(after.equivalent?.id, created.id);
});

test('GET /api/health indica si el almacenamiento es memoria o PostgreSQL', async () => {
  const container = buildContainer({ logger: { log() {}, warn() {} } });
  const server = createApp(container).listen(0);
  await new Promise(resolve => server.once('listening', resolve));
  const response = await fetch(`http://127.0.0.1:${server.address().port}/api/health`);
  assert.deepEqual(await response.json(), { status: 'ok', storage: 'memory' });
  await new Promise(resolve => server.close(resolve));
});

test('RF07: cada consulta conserva sus campos de precio y su orden sin alterar el producto', () => {
  const store = createInMemoryStore();
  const rice = product(1, 'Arroz Diana 500 G', 1, 2300);
  rice.prices.push(price(2, 2000));
  store.products = [rice];
  const original = structuredClone(rice);
  const { catalogFacade } = buildContainer({ store, loadCatalog: false });
  const catalog = catalogFacade.list().products[0].prices;
  const compared = catalogFacade.compare().products[0].prices;
  const detail = catalogFacade.getDetail(1).product.prices;
  assert.deepEqual(catalog.map(p => p.store_id), [1, 2]);
  assert.deepEqual(catalog.map(p => p.unit_price.value), [4600, 4000]);
  assert.ok(catalog.every(p => !('store_name' in p)));
  assert.deepEqual(compared.map(p => p.store_code), ['olimpica', 'd1']);
  assert.ok(compared.every(p => !('unit_price' in p)));
  assert.deepEqual(detail, compared.map((p, i) => ({ ...p, unit_price: catalog[1 - i].unit_price })));
  assert.deepEqual(rice, original);
});

test('los errores de conexión a PostgreSQL explican qué hacer', () => {
  assert.match(describeDbError({ code: 'ECONNREFUSED' }), /no está encendido/);
  assert.match(describeDbError({ code: '28P01' }), /usuario o la contraseña/);
  assert.match(describeDbError({ code: '3D000' }), /pgAdmin/);
  assert.match(describeDbError({ code: 'XX', message: 'boom' }), /boom/);
});
