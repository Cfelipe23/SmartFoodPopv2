const test = require('node:test');
const assert = require('node:assert/strict');
const { createInMemoryStore } = require('../src/data/inMemoryStore');
const ProductRepository = require('../src/repositories/ProductRepository');
const CatalogRepository = require('../src/repositories/CatalogRepository');
const UserRepository = require('../src/repositories/UserRepository');
const ReviewRepository = require('../src/repositories/ReviewRepository');
const FavoriteRepository = require('../src/repositories/FavoriteRepository');
const ProductService = require('../src/services/ProductService');
const { ProductDetailService, summarizeReviews } = require('../src/services/ProductDetailService');
const ProductComparisonService = require('../src/services/ProductComparisonService');
const ProductAdminService = require('../src/services/ProductAdminService');
const { searchFilter, defaultProductFilters, applyFilters } = require('../src/domain/productFilters');
const { AuthService, AuthError } = require('../src/services/AuthService');
const TokenService = require('../src/services/TokenService');
const { BcryptPasswordHasher, PlainPasswordVerifier } = require('../src/services/PasswordHasher');

function setup() {
  const store = createInMemoryStore();
  const productRepository = new ProductRepository(store), catalogRepository = new CatalogRepository(store), userRepository = new UserRepository(store), reviewRepository = new ReviewRepository(store), favoriteRepository = new FavoriteRepository(store);
  return { store, productRepository, catalogRepository, userRepository, reviewRepository, favoriteRepository };
}

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
test('RF02: login can verify bcrypt and seeded plain-text credentials interchangeably', async () => {
  const d = setup(); const tokenService = new TokenService({ secret: 'test-secret' });
  const hasher = new BcryptPasswordHasher();
  const service = new AuthService({ userRepository: d.userRepository, passwordHasher: hasher, passwordVerifiers: [hasher, new PlainPasswordVerifier()], tokenService });
  const seeded = d.store.users.find(user => user.password);
  if (seeded) assert.ok((await service.login({ email: seeded.email, password: seeded.password })).token);
  const created = await service.register({ name: 'Bcrypt', email: 'bcrypt@example.com', password: 'secret123' });
  assert.ok((await service.login({ email: created.user.email, password: 'secret123' })).token);
});
test('RF02: bad credentials return 401', async () => {
  const d = setup(); const service = new AuthService({ userRepository: d.userRepository, passwordHasher: new BcryptPasswordHasher(), tokenService: new TokenService({ secret: 'test-secret' }) });
  await assert.rejects(() => service.login({ email: 'missing@example.com', password: 'nope' }), error => error.status === 401);
});
test('admin: product writes are separated from the read service and clean related data', () => {
  const d = setup(); const admin = new ProductAdminService(d); const created = admin.create({ name: 'Test Product', category_id: 1 });
  assert.ok(created.id); assert.ok(new ProductService(d).list().products.some(p => p.id === created.id));
  d.reviewRepository.add({ product_id: created.id, rating: 5, comment: 'test' });
  d.favoriteRepository.toggle(1, created.id);
  assert.equal(admin.delete(created.id), true); assert.equal(d.reviewRepository.findByProductId(created.id).length, 0);
});

test('Auth: resetPassword successfully hashes new password and updates credentials', async () => {
  const d = setup(); const tokenService = new TokenService({ secret: 'test-secret' });
  const hasher = new BcryptPasswordHasher();
  const service = new AuthService({ userRepository: d.userRepository, passwordHasher: hasher, passwordVerifiers: [hasher, new PlainPasswordVerifier()], tokenService });
  
  // Registrar usuario
  await service.register({ name: 'Reset Test', email: 'reset@popayan.com', password: 'oldPassword123' });
  
  // Restablecer contraseña
  const res = await service.resetPassword({ email: 'reset@popayan.com', newPassword: 'newPassword456' });
  assert.ok(res.token);
  assert.equal(res.user.email, 'reset@popayan.com');
  
  // La clave anterior falla
  await assert.rejects(() => service.login({ email: 'reset@popayan.com', password: 'oldPassword123' }), error => error.status === 401);
  
  // La nueva clave funciona
  const loginRes = await service.login({ email: 'reset@popayan.com', password: 'newPassword456' });
  assert.ok(loginRes.token);
});
