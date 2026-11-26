const test = require('node:test');
const assert = require('node:assert/strict');
const { PostgresPersistence } = require('../dist/data/PostgresPersistence');

test('PostgreSQL: la carga convierte DECIMAL y fechas sin perder valores nulos ni identificadores', async () => {
  const createdAt = new Date('2026-01-03T04:05:06Z');
  const rows = {
    stores: [{ id: 7, name: 'D1', code: 'd1', logo: null, city: 'Popayán', address: null }],
    categories: [{ id: 4, name: 'Otros', slug: 'otros', icon: null }],
    users: [{ id: 8, name: 'Ana', email: 'ana@example.test', role: 'consumer', password_hash: 'hash-de-prueba' }],
    products: [{ id: 42, name: 'Arroz', description: null, category_id: 4, unit: null, image_url: null }],
    product_prices: [{
      product_id: 42, store_id: 7, price: '1250.50', previous_price: null,
      is_offer: null, offer_description: null, source_url: null
    }],
    reviews: [{ id: 19, user_id: 8, product_id: 42, user_name: 'Ana', rating: 5, comment: 'Bien', created_at: createdAt }],
    favorites: [{ id: 31, user_id: 8, product_id: 42 }]
  };
  const pool = { query: async sql => ({ rows: rows[/FROM (\w+)/.exec(sql)[1]] }) };
  const store = {};
  await new PostgresPersistence(pool).load(store);

  assert.deepEqual(store, {
    stores: rows.stores,
    categories: rows.categories,
    users: rows.users,
    products: [{
      ...rows.products[0],
      prices: [{
        store_id: 7, price: 1250.5, previous_price: null,
        is_offer: false, offer_description: '', source_url: ''
      }]
    }],
    reviews: [{ ...rows.reviews[0], created_at: '2026-01-03T04:05:06.000Z' }],
    favorites: rows.favorites
  });
});

test('PostgreSQL: la cola conserva la copia, revierte un fallo y continúa antes de cerrar', async () => {
  const events = [];
  const errors = [];
  let releaseFirstWrite;
  const firstWrite = new Promise(resolve => { releaseFirstWrite = resolve; });
  const client = {
    async query(sql, parameters) {
      if (sql.startsWith('INSERT INTO products')) {
        events.push(['producto', parameters[1]]);
        await firstWrite;
      } else if (sql.startsWith('INSERT INTO product_prices')) {
        events.push('precio');
        throw new Error('fallo en precio');
      } else {
        events.push(sql);
      }
    },
    release() { events.push('release'); }
  };
  const pool = {
    async connect() { return client; },
    async query(sql, parameters) { events.push([sql, parameters]); },
    async end() { events.push('end'); }
  };
  const persistence = new PostgresPersistence(pool, { logger: { error: (...args) => errors.push(args) } });
  const product = {
    id: 42, name: 'Arroz original', description: '', category_id: 4, unit: '500 g', image_url: '',
    prices: [{ store_id: 1, price: 1250, previous_price: 1250, is_offer: false, offer_description: '' }]
  };

  persistence.saveProduct(product);
  product.name = 'Arroz editado';
  persistence.deleteProduct(43);
  const closed = persistence.close();
  await new Promise(resolve => setImmediate(resolve));
  assert.deepEqual(events, ['BEGIN', ['producto', 'Arroz original']]);
  releaseFirstWrite();
  await closed;

  assert.deepEqual(events, [
    'BEGIN', ['producto', 'Arroz original'], 'DELETE FROM product_prices WHERE product_id = $1',
    'precio', 'ROLLBACK', 'release', ['DELETE FROM products WHERE id = $1', [43]], 'end'
  ]);
  assert.deepEqual(errors, [['[PostgreSQL] Error al guardar (producto):', 'fallo en precio']]);
});
