const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const assert = require('node:assert/strict');
const { newDb } = require('pg-mem');
const { PostgresPersistence } = require('../dist/data/PostgresPersistence');
const { bootstrapContainer, buildContainer } = require('../dist/container');
const { createInMemoryStore } = require('../dist/data/inMemoryStore');

// PostgreSQL emulado en memoria: valida el esquema SQL y las consultas sin depender de un servidor externo.
// pg-mem no soporta la precisión de DECIMAL(p, s); el resto del esquema real se usa tal cual.
const schemaSql = fs.readFileSync(path.join(__dirname, '../dist/data/schema.sql'), 'utf8').replace(/DECIMAL\(\d+,\s*\d+\)/g, 'DECIMAL');
function createPersistence(logger = { log() {}, error: console.error }) {
  const { Pool } = newDb().adapters.createPg();
  return new PostgresPersistence(new Pool(), { logger, schemaSql });
}
const quietLogger = { log() {}, warn() {} };
const scrapedPath = path.join(__dirname, 'fixtures/scraped_sample.json');

// pg-mem falla con "CREATE TABLE IF NOT EXISTS" sobre tablas ya creadas (PostgreSQL real no);
// en un "reinicio" simulado el esquema ya existe, así que se omite init().
async function restart(persistence, options = {}) {
  persistence.init = async () => {};
  return bootstrapContainer({ persistence, logger: quietLogger, scrapedPath, reseedCatalog: false, ...options });
}

test('PostgreSQL: el esquema se crea y el catálogo inicial se guarda y se vuelve a leer', async () => {
  const persistence = createPersistence();
  const container = await bootstrapContainer({ persistence, logger: quietLogger, scrapedPath, reseedCatalog: false });
  assert.ok(container.store.products.length > 30);

  const reloaded = createInMemoryStore();
  await persistence.load(reloaded);
  assert.equal(reloaded.products.length, container.store.products.length);
  assert.equal(reloaded.users.length, 2);
  assert.deepEqual(reloaded.categories.map(category => category.slug), ['granos-y-basicos', 'lacteos', 'aseo-del-hogar', 'otros']);
  const original = container.store.products[0];
  const stored = reloaded.products.find(product => product.id === original.id);
  assert.equal(stored.name, original.name);
  assert.deepEqual(stored.prices.map(price => price.price).sort(), original.prices.map(price => price.price).sort());
  assert.equal(typeof stored.prices[0].price, 'number', 'los precios DECIMAL vuelven como número');
});

test('PostgreSQL: usuarios, reseñas, favoritos y cambios del admin sobreviven a un reinicio', async () => {
  const persistence = createPersistence();
  const first = await bootstrapContainer({ persistence, logger: quietLogger, scrapedPath, reseedCatalog: false });

  const session = await first.authService.register({ name: 'Persistente', email: 'persist@example.com', password: 'Secreta123' });
  const product = first.store.products[0];
  first.reviewService.add({ user_id: session.user.id, user_name: 'Persistente', product_id: product.id, rating: 5, comment: 'Se guarda en PostgreSQL' });
  first.favoriteService.toggle(session.user.id, product.id);
  const created = first.productAdminService.create({ name: 'Creado por admin', category_id: 4, prices: [{ store_id: 1, price: 1234 }] });
  first.productAdminService.update(product.id, { name: 'Nombre editado', prices: [{ store_id: 2, price: 999, is_offer: true, previous_price: 1500 }] });
  const doomed = first.store.products[5];
  first.reviewService.add({ user_id: session.user.id, user_name: 'Persistente', product_id: doomed.id, rating: 3, comment: 'se borrará' });
  first.productAdminService.delete(doomed.id);
  await persistence.flush();

  // "Reinicio": un contenedor nuevo que solo lee de la base
  const second = await restart(persistence);
  assert.equal((await second.authService.login({ email: 'persist@example.com', password: 'Secreta123' })).user.name, 'Persistente');
  assert.equal(second.reviewService.listByProduct(product.id)[0].comment, 'Se guarda en PostgreSQL');
  assert.deepEqual(second.favoriteService.listProductsForUser(session.user.id).map(item => item.id), [product.id]);
  assert.ok(second.store.products.some(item => item.id === created.id && item.name === 'Creado por admin'));
  const edited = second.store.products.find(item => item.id === product.id);
  assert.equal(edited.name, 'Nombre editado');
  assert.equal(edited.prices.length, 1);
  assert.equal(edited.prices[0].offer_description, 'Antes $1.500 · ahorras 33%');
  assert.equal(second.store.products.some(item => item.id === doomed.id), false);
  assert.equal(second.reviewService.listByProduct(doomed.id).length, 0, 'las reseñas se eliminan en cascada');

  // quitar un favorito también persiste
  second.favoriteService.toggle(session.user.id, product.id);
  await persistence.flush();
  const third = await restart(persistence);
  assert.equal(third.favoriteService.listProductsForUser(session.user.id).length, 0);
});

test('PostgreSQL: RESEED_CATALOG reconstruye el catálogo conservando las cuentas', async () => {
  const persistence = createPersistence();
  const first = await bootstrapContainer({ persistence, logger: quietLogger, scrapedPath, reseedCatalog: false });
  await first.authService.register({ name: 'Cuenta', email: 'cuenta@example.com', password: 'Secreta123' });
  first.productAdminService.delete(first.store.products[0].id);
  await persistence.flush();
  const countAfterDelete = first.store.products.length;

  const reseeded = await restart(persistence, { reseedCatalog: true });
  assert.equal(reseeded.store.products.length, countAfterDelete + 1);
  assert.ok((await reseeded.authService.login({ email: 'cuenta@example.com', password: 'Secreta123' })).token);
});

test('PostgreSQL: un fallo de escritura se registra sin tumbar el servicio', async () => {
  const errors = [];
  const persistence = createPersistence({ log() {}, error: (...args) => errors.push(args.join(' ')) });
  const container = await bootstrapContainer({ persistence, logger: quietLogger, scrapedPath, reseedCatalog: false });
  // usuario con rol inválido: viola el CHECK de la tabla, pero la petición en memoria no se rompe
  container.store.users.push({ id: 99, name: 'x', email: 'x@x.com', password_hash: 'h', role: 'invalido' });
  persistence.saveUser(container.store.users[container.store.users.length - 1]);
  await persistence.flush();
  assert.equal(errors.length, 1);
  assert.match(errors[0], /Error al guardar/);
});

test('modo memoria: sin base configurada el servidor arranca con una advertencia', async () => {
  const warnings = [];
  const container = await bootstrapContainer({ persistence: null, scrapedPath, logger: { log() {}, warn: message => warnings.push(message) } });
  assert.ok(container.store.products.length > 0);
  assert.ok(warnings.some(message => /solo en memoria|SOLO en memoria/i.test(message)));
  assert.equal(typeof buildContainer, 'function');
});
