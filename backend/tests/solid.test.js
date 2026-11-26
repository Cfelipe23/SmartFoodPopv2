const test = require('node:test');
const assert = require('node:assert/strict');
const { createInMemoryStore } = require('../dist/data/inMemoryStore');
const ProductRepository = require('../dist/repositories/ProductRepository');
const CatalogRepository = require('../dist/repositories/CatalogRepository');
const UserRepository = require('../dist/repositories/UserRepository');
const ReviewRepository = require('../dist/repositories/ReviewRepository');
const FavoriteRepository = require('../dist/repositories/FavoriteRepository');
const ProductService = require('../dist/services/ProductService');
const { basePrice, withStore, withUnitPrice } = require('../dist/services/pricePresenter');
const { CatalogEquivalenceIndex } = require('../dist/services/EquivalenceIndexProxy');
const { ProductDetailService, summarizeReviews } = require('../dist/services/ProductDetailService');
const ProductComparisonService = require('../dist/services/ProductComparisonService');
const ProductAdminService = require('../dist/services/ProductAdminService');
const { CatalogFacade } = require('../dist/services/CatalogFacade');
const { searchFilter, defaultProductFilters, applyFilters } = require('../dist/domain/productFilters');
const { AuthService, AuthError } = require('../dist/services/AuthService');
const TokenService = require('../dist/services/TokenService');
const { BcryptPasswordHasher } = require('../dist/services/PasswordHasher');

function setup() {
  const store = createInMemoryStore();
  const productRepository = new ProductRepository(store), catalogRepository = new CatalogRepository(store), userRepository = new UserRepository(store), reviewRepository = new ReviewRepository(store), favoriteRepository = new FavoriteRepository(store);
  const storePrice = withStore(basePrice, catalogRepository);
  return { store, productRepository, catalogRepository, userRepository, reviewRepository, favoriteRepository,
    storePrice, detailPrice: withUnitPrice(storePrice), unitPrice: withUnitPrice(basePrice),
    equivalences: new CatalogEquivalenceIndex(productRepository) };
}

test('catálogo: la fachada delega cada consulta y conserva el resultado y el error originales', t => {
  const data = {};
  const query = { search: 'arroz' };
  const products = { list: t.mock.fn(() => data), listOffers: t.mock.fn(() => data) };
  const comparisons = { compare: t.mock.fn(() => data) };
  const details = { getDetail: t.mock.fn(() => data) };
  const facade = new CatalogFacade(products, comparisons, details);
  for (const [method, service, args] of [
    ['list', products, [query]], ['listOffers', products, []],
    ['compare', comparisons, [query]], ['getDetail', details, [11]]
  ]) {
    assert.equal(facade[method](...args), data);
    assert.deepEqual(service[method].mock.calls.map(call => call.arguments), [args]);
  }
  const error = Object.assign(new Error('Tienda no válida'), { status: 400 });
  comparisons.compare.mock.mockImplementation(() => { throw error; });
  assert.throws(() => facade.compare(query), received => received === error);
});

test('RF03: product listing is read-only and returns catalog metadata', () => {
  const d = setup(); const service = new ProductService(d); const result = service.list();
  assert.ok(result.products.length > 0); assert.ok(result.stores.length > 0); assert.ok(result.categories.length > 0);
  assert.equal(typeof service.create, 'undefined'); assert.equal(typeof service.update, 'undefined'); assert.equal(typeof service.delete, 'undefined');
});
test('RF03: offers filter is extensible and only returns offer products', () => {
  const d = setup(); const service = new ProductService(d); const result = service.list({ is_offer: 'true' });
  assert.ok(result.products.every(p => p.prices.some(price => price.is_offer)));
});
test('RF04: search ignores case and accents', () => {
  const d = setup(); const result = applyFilters(d.productRepository.findAll(), { search: 'arroz' }, d.catalogRepository, [searchFilter]);
  assert.ok(result.some(p => p.name.toLowerCase().includes('arroz')));
});
test('RF04: a new filter can be injected without changing ProductService', () => {
  const d = setup(); const maxPriceFilter = { apply: products => products.filter(p => p.prices.some(price => price.price < 4000)), describeEmpty: () => 'Sin productos económicos' };
  const service = new ProductService({ ...d, filters: [maxPriceFilter] });
  assert.ok(service.list().products.every(p => p.prices.some(price => price.price < 4000)));
});

test('RF09: las estrategias reciben el resultado anterior y el primer mensaje aplicable tiene prioridad', () => {
  const deps = setup();
  const first = deps.store.products[0];
  const calls = [];
  const service = new ProductService({ ...deps, filters: [
    { apply(products) { calls.push('primero'); return products.slice(0, 1); } },
    {
      apply(products) { calls.push('segundo'); assert.deepEqual(products, [first]); return []; },
      describeEmpty: () => 'Sin coincidencias del segundo filtro'
    },
    {
      apply(products) { calls.push('tercero'); assert.deepEqual(products, []); return products; },
      describeEmpty: () => 'Sin coincidencias del tercer filtro'
    }
  ] });
  const result = service.list();
  assert.deepEqual(calls, ['primero', 'segundo', 'tercero']);
  assert.equal(result.total, 0);
  assert.equal(result.message, 'Sin coincidencias del segundo filtro');
});
test('RF09: category and store filters compose', () => {
  const d = setup(); const service = new ProductService(d); const result = service.list({ category: 'granos-y-basicos', store: 'd1' });
  assert.ok(result.products.every(p => p.category_id === 1 && p.prices.some(price => price.store_id === 1)));
});
test('RF09: invalid store is a clear 400 error', () => {
  const d = setup(); const service = new ProductService(d);
  assert.throws(() => service.list({ store: 'tienda-inventada' }), error => error.status === 400);
});
test('RF05: product detail enriches prices and summarizes reviews', () => {
  const d = setup(); const service = new ProductDetailService(d); const result = service.getDetail(1);
  assert.ok(result.product.prices.every(p => typeof p.store_name === 'string'));
  assert.deepEqual(result.review_summary, summarizeReviews(result.reviews));
});
test('RF05: review summary has defined empty values', () => assert.deepEqual(summarizeReviews([]), { count: 0, average: 0 }));
test('RF05: missing detail returns null', () => { const d = setup(); assert.equal(new ProductDetailService(d).getDetail(999999), null); });
test('RF07: comparison orders prices and computes potential savings', () => {
  const d = setup(); const result = new ProductComparisonService(d).compare();
  assert.ok(result.products.length > 0);
  for (const product of result.products) {
    assert.deepEqual(product.prices.map(p => p.price), [...product.prices.map(p => p.price)].sort((a,b) => a-b));
    assert.equal(product.potential_savings, product.highest_price - product.lowest_price);
  }
});
test('RF07: comparison accepts injected filters', () => {
  const d = setup(); const onlyOne = { apply: products => products.slice(0, 1), describeEmpty: () => '' };
  assert.equal(new ProductComparisonService({ ...d, filters: [onlyOne] }).compare().total, 1);
});
test('RF01: registration hashes passwords and signs a token through injected services', async () => {
  const d = setup(); const tokenService = new TokenService({ secret: 'test-secret' });
  const service = new AuthService({ userRepository: d.userRepository, passwordHasher: new BcryptPasswordHasher(), tokenService });
  const result = await service.register({ name: 'Test User', email: ' TEST@EXAMPLE.COM ', password: 'secret123' });
  const user = d.userRepository.findByEmail('test@example.com');
  assert.ok(user.password_hash); assert.equal(user.password, undefined); assert.equal(tokenService.verify(result.token).email, 'test@example.com');
});
test('RF01: missing registration fields return AuthError 400', async () => {
  const d = setup(); const service = new AuthService({ userRepository: d.userRepository, passwordHasher: new BcryptPasswordHasher(), tokenService: new TokenService({ secret: 'test-secret' }) });
  await assert.rejects(() => service.register({}), error => error instanceof AuthError && error.status === 400);
});
test('RF02: seeded demo accounts are stored hashed and can log in', async () => {
  const d = setup(); const service = new AuthService({ userRepository: d.userRepository, passwordHasher: new BcryptPasswordHasher(), tokenService: new TokenService({ secret: 'test-secret' }) });
  assert.ok(d.store.users.every(user => user.password_hash && user.password === undefined));
  assert.ok((await service.login({ email: 'admin@smartfood.com', password: 'admin123' })).token);
  const created = await service.register({ name: 'Bcrypt', email: 'bcrypt@example.com', password: 'secret123' });
  assert.ok((await service.login({ email: created.user.email, password: 'secret123' })).token);
});
test('RF01: duplicate email is rejected and AuthError is exported both ways', async () => {
  const d = setup(); const service = new AuthService({ userRepository: d.userRepository, passwordHasher: new BcryptPasswordHasher(), tokenService: new TokenService({ secret: 'test-secret' }) });
  await service.register({ name: 'Uno', email: 'dup@example.com', password: 'secret123' });
  await assert.rejects(() => service.register({ name: 'Dos', email: 'DUP@example.com', password: 'secret123' }), error => error instanceof AuthError && error.status === 409);
  assert.equal(require('../dist/services/AuthError'), require('../dist/services/AuthError').AuthError);
});
test('RF01: invalid email and short password are rejected', async () => {
  const d = setup(); const service = new AuthService({ userRepository: d.userRepository, passwordHasher: new BcryptPasswordHasher(), tokenService: new TokenService({ secret: 'test-secret' }) });
  await assert.rejects(() => service.register({ name: 'X', email: 'no-es-correo', password: 'secret123' }), error => error.status === 400);
  await assert.rejects(() => service.register({ name: 'X', email: 'x@example.com', password: '123' }), error => error.status === 400);
});
test('RF02: bad credentials return 401', async () => {
  const d = setup(); const service = new AuthService({ userRepository: d.userRepository, passwordHasher: new BcryptPasswordHasher(), tokenService: new TokenService({ secret: 'test-secret' }) });
  await assert.rejects(() => service.login({ email: 'missing@example.com', password: 'nope' }), error => error.status === 401);
});
test('admin: product writes are separated from the read service and clean related data', () => {
  const d = setup(); const admin = new ProductAdminService(d); const created = admin.create({ name: 'Test Product', category_id: 1, prices: [{ store_id: 1, price: 1000 }, { store_id: 2, price: 1200 }] });
  assert.ok(created.id); assert.ok(new ProductService(d).list().products.some(p => p.id === created.id));
  d.reviewRepository.add({ product_id: created.id, rating: 5, comment: 'test' });
  d.favoriteRepository.toggle(1, created.id);
  assert.equal(admin.delete(created.id), true); assert.equal(d.reviewRepository.findByProductId(created.id).length, 0);
});

test('HU11: el alta mínima usa los valores predeterminados del producto', () => {
  const admin = new ProductAdminService(setup());
  const product = admin.create({ name: ' Arroz ', category_id: '1', prices: [{ store_id: 1, price: 1000 }] });
  assert.deepEqual(product, {
    id: product.id, name: 'Arroz', description: '', category_id: 1, unit: '1 Unidad',
    image_url: 'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=600&q=80',
    prices: [{ store_id: 1, price: 1000, previous_price: 1000, is_offer: false, offer_description: '', source_url: '' }]
  });
});

test('HU11: el alta completa y la edición parcial conservan la oferta y el enlace', () => {
  const admin = new ProductAdminService(setup());
  const product = {
    name: 'Arroz', description: 'Grano largo', category_id: 1, unit: '500 g', image_url: 'https://example.test/arroz.jpg',
    prices: [{ store_id: 1, price: 900, previous_price: 1000, is_offer: true, offer_description: 'Descuento', source_url: 'https://www.d1.com.co/arroz/p' }]
  };
  const created = admin.create(product);
  assert.deepEqual(created, { id: created.id, ...product });
  assert.deepEqual(admin.update(created.id, { description: '' }), { ...created, description: '' });
});

test('HU11: al editar desde un producto anterior se conservan los nulos y se aíslan sus precios', () => {
  const original = {
    id: 27, name: 'Arroz', description: null, category_id: null, unit: null, image_url: null,
    prices: [{ store_id: 1, price: 900, previous_price: null, is_offer: false, offer_description: '' }]
  };
  const deps = setup();
  deps.productRepository.replaceAll([original]);
  const edited = new ProductAdminService(deps).update(original.id, { name: 'Nuevo' });
  assert.deepEqual(edited, { ...original, name: 'Nuevo' });
  edited.prices[0].price = 800;
  assert.equal(original.prices[0].price, 900);
});

test('HU11: una validación fallida conserva el producto y la versión del catálogo', () => {
  const deps = setup();
  const admin = new ProductAdminService(deps);
  const original = admin.create({ name: 'Arroz', category_id: 1, prices: [{ store_id: 1, price: 1000 }] });
  const version = deps.productRepository.version;
  for (const [changes, message] of [
    [{ name: ' ' }, /obligatorio/],
    [{ name: 'a'.repeat(256) }, /255/],
    [{ description: 'a'.repeat(2001) }, /2000/],
    [{ category_id: 99 }, /categoría/],
    [{ prices: [] }, /al menos una tienda/],
    [{ prices: [{ store_id: 1, price: 0 }] }, /mayor que cero/],
    [{ prices: [{ store_id: 99, price: 10 }] }, /tienda indicada/],
    [{ prices: [{ store_id: 1, price: 10 }, { store_id: 1, price: 11 }] }, /misma tienda/],
    [{ prices: [{ store_id: 1, price: 10, previous_price: 10, is_offer: true }] }, /precio anterior/]
  ]) {
    assert.throws(() => admin.update(original.id, changes), { status: 400, message });
    assert.throws(() => admin.create({ ...original, ...changes }), { status: 400, message });
  }
  assert.equal(deps.productRepository.version, version);
  assert.deepEqual(deps.productRepository.findById(original.id), original);
});
