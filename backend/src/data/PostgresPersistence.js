const fs = require('fs');
const path = require('path');

const SCHEMA_PATH = path.join(__dirname, 'schema.sql');

// Traduce los errores típicos de conexión a instrucciones concretas (pgAdmin / .env).
function describeDbError(error) {
  const code = error?.code;
  if (code === 'ECONNREFUSED') return 'No se pudo conectar a PostgreSQL: el servicio no está encendido o el puerto/host de DATABASE_URL es incorrecto (puerto por defecto: 5432).';
  if (code === 'ENOTFOUND') return 'No se encontró el servidor de PostgreSQL: revisa el host en DATABASE_URL.';
  if (code === '28P01' || code === '28000') return 'PostgreSQL rechazó el usuario o la contraseña: revisa DATABASE_URL en backend/.env (usa los mismos datos con que entras a pgAdmin).';
  if (code === '3D000') return 'La base de datos indicada en DATABASE_URL no existe: créala en pgAdmin (clic derecho en Databases → Create → Database) y reinicia el backend.';
  return `Error de PostgreSQL${code ? ` (${code})` : ''}: ${error?.message || error}`;
}

function toNumber(value) {
  return value === null || value === undefined ? value : Number(value);
}

function toIso(value) {
  return value instanceof Date ? value.toISOString() : value;
}

// Persistencia en PostgreSQL (escritura diferida y ordenada sobre el estado en memoria).
// Lectura: el estado se carga de la base al arrancar. Escritura: cada cambio se encola
// y se ejecuta en orden; los errores se registran sin tumbar la petición HTTP.
class PostgresPersistence {
  constructor(pool, { logger = console, schemaSql = null } = {}) {
    this.pool = pool;
    this.logger = logger;
    this.schemaSql = schemaSql;
    this.queue = Promise.resolve();
  }

  static fromEnv(env, { Pool = require('pg').Pool } = {}) {
    const connectionString = env.DATABASE_URL
      || (env.PGHOST && env.PGUSER
        ? `postgres://${encodeURIComponent(env.PGUSER)}:${encodeURIComponent(env.PGPASSWORD)}@${env.PGHOST}:${env.PGPORT}/${env.PGDATABASE}`
        : '');
    return connectionString ? new PostgresPersistence(new Pool({ connectionString })) : null;
  }

  enqueue(label, task) {
    this.queue = this.queue
      .then(task)
      .catch(error => this.logger.error(`[PostgreSQL] Error al guardar (${label}):`, error.message));
  }

  async flush() { await this.queue; }

  async close() {
    await this.flush();
    await this.pool.end();
  }

  async init() {
    const statements = (this.schemaSql ?? fs.readFileSync(SCHEMA_PATH, 'utf8'))
      .replace(/^\s*--.*$/gm, '')
      .split(';')
      .map(statement => statement.trim())
      .filter(Boolean);
    for (const statement of statements) await this.pool.query(statement);
  }

  async hasCatalog() {
    const { rows } = await this.pool.query('SELECT COUNT(*) AS total FROM products');
    return Number(rows[0].total) > 0;
  }

  // ---------- Carga inicial / siembra ----------

  async seedReferenceData(store) {
    for (const s of store.stores) {
      await this.pool.query(
        `INSERT INTO stores (id, name, code, logo, city, address) VALUES ($1, $2, $3, $4, $5, $6)
         ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, code = EXCLUDED.code, logo = EXCLUDED.logo, city = EXCLUDED.city, address = EXCLUDED.address`,
        [s.id, s.name, s.code, s.logo, s.city, s.address]
      );
    }
    for (const c of store.categories) {
      await this.pool.query(
        `INSERT INTO categories (id, name, slug, icon) VALUES ($1, $2, $3, $4)
         ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, slug = EXCLUDED.slug, icon = EXCLUDED.icon`,
        [c.id, c.name, c.slug, c.icon]
      );
    }
    for (const user of store.users) {
      await this.pool.query(
        `INSERT INTO users (id, name, email, password_hash, role) VALUES ($1, $2, $3, $4, $5)
         ON CONFLICT (email) DO NOTHING`,
        [user.id, user.name, user.email, user.password_hash, user.role]
      );
    }
  }

  // Reemplaza todo el catálogo (y, por cascada, reseñas y favoritos asociados).
  async replaceCatalog(products) {
    const client = await this.pool.connect();
    try {
      await client.query('BEGIN');
      await client.query('DELETE FROM products');
      for (const product of products) await this.insertProduct(client, product);
      await client.query('COMMIT');
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  async insertProduct(client, product) {
    await client.query(
      `INSERT INTO products (id, name, description, category_id, image_url, unit) VALUES ($1, $2, $3, $4, $5, $6)`,
      [product.id, product.name, product.description || '', product.category_id, product.image_url || '', product.unit || '']
    );
    for (const price of product.prices || []) {
      await client.query(
        `INSERT INTO product_prices (product_id, store_id, price, previous_price, is_offer, offer_description, source_url)
         VALUES ($1, $2, $3, $4, $5, $6, $7)`,
        [product.id, price.store_id, price.price, price.previous_price ?? price.price, Boolean(price.is_offer), price.offer_description || '', price.source_url || '']
      );
    }
  }

  async load(store) {
    const [stores, categories, users, products, prices, reviews, favorites] = await Promise.all([
      this.pool.query('SELECT id, name, code, logo, city, address FROM stores ORDER BY id'),
      this.pool.query('SELECT id, name, slug, icon FROM categories ORDER BY id'),
      this.pool.query('SELECT id, name, email, password_hash, role FROM users ORDER BY id'),
      this.pool.query('SELECT id, name, description, category_id, image_url, unit FROM products ORDER BY id'),
      this.pool.query('SELECT product_id, store_id, price, previous_price, is_offer, offer_description, source_url FROM product_prices ORDER BY id'),
      this.pool.query('SELECT id, user_id, user_name, product_id, rating, comment, created_at FROM reviews ORDER BY created_at DESC, id DESC'),
      this.pool.query('SELECT id, user_id, product_id FROM favorites ORDER BY id')
    ]);

    if (stores.rows.length) store.stores = stores.rows;
    if (categories.rows.length) store.categories = categories.rows;
    if (users.rows.length) store.users = users.rows;

    const pricesByProduct = new Map();
    for (const row of prices.rows) {
      if (!pricesByProduct.has(row.product_id)) pricesByProduct.set(row.product_id, []);
      pricesByProduct.get(row.product_id).push({
        store_id: row.store_id,
        price: toNumber(row.price),
        previous_price: toNumber(row.previous_price),
        is_offer: Boolean(row.is_offer),
        offer_description: row.offer_description || '',
        source_url: row.source_url || ''
      });
    }
    store.products = products.rows.map(row => ({ ...row, prices: pricesByProduct.get(row.id) || [] }));
    store.reviews = reviews.rows.map(row => ({ ...row, created_at: toIso(row.created_at) }));
    store.favorites = favorites.rows;
  }

  // ---------- Escrituras (RF01, RF06, RF10, RF11) ----------

  saveUser(user) {
    this.enqueue('usuario', () => this.pool.query(
      `INSERT INTO users (id, name, email, password_hash, role) VALUES ($1, $2, $3, $4, $5)
       ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, email = EXCLUDED.email, password_hash = EXCLUDED.password_hash, role = EXCLUDED.role`,
      [user.id, user.name, user.email, user.password_hash, user.role]
    ));
  }

  saveReview(review) {
    this.enqueue('reseña', () => this.pool.query(
      `INSERT INTO reviews (id, user_id, user_name, product_id, rating, comment, created_at) VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [review.id, review.user_id, review.user_name, review.product_id, review.rating, review.comment, review.created_at]
    ));
  }

  addFavorite(favorite) {
    this.enqueue('favorito', () => this.pool.query(
      `INSERT INTO favorites (id, user_id, product_id) VALUES ($1, $2, $3) ON CONFLICT (user_id, product_id) DO NOTHING`,
      [favorite.id, favorite.user_id, favorite.product_id]
    ));
  }

  removeFavorite(userId, productId) {
    this.enqueue('favorito', () => this.pool.query(
      'DELETE FROM favorites WHERE user_id = $1 AND product_id = $2',
      [userId, productId]
    ));
  }

  async upsertProduct(client, product) {
    await client.query(
      `INSERT INTO products (id, name, description, category_id, image_url, unit) VALUES ($1, $2, $3, $4, $5, $6)
       ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, description = EXCLUDED.description,
         category_id = EXCLUDED.category_id, image_url = EXCLUDED.image_url, unit = EXCLUDED.unit`,
      [product.id, product.name, product.description || '', product.category_id, product.image_url || '', product.unit || '']
    );
    await client.query('DELETE FROM product_prices WHERE product_id = $1', [product.id]);
    for (const price of product.prices || []) {
      await client.query(
        `INSERT INTO product_prices (product_id, store_id, price, previous_price, is_offer, offer_description, source_url)
         VALUES ($1, $2, $3, $4, $5, $6, $7)`,
        [product.id, price.store_id, price.price, price.previous_price ?? price.price, Boolean(price.is_offer), price.offer_description || '', price.source_url || '']
      );
    }
  }

  async transaction(work) {
    const client = await this.pool.connect();
    try {
      await client.query('BEGIN');
      await work(client);
      await client.query('COMMIT');
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  saveProduct(product) {
    const snapshot = JSON.parse(JSON.stringify(product));
    this.enqueue('producto', () => this.transaction(client => this.upsertProduct(client, snapshot)));
  }

  // Actualización del catálogo desde el scraper (todo o nada): productos nuevos/cambiados,
  // traslado de reseñas y favoritos de fichas absorbidas y borrado de productos retirados.
  syncCatalog({ changedProducts, removedIds, remap }) {
    const products = JSON.parse(JSON.stringify(changedProducts));
    const moves = [...remap];
    const removed = [...removedIds];
    this.enqueue('actualizar catálogo', () => this.transaction(async client => {
      for (const product of products) await this.upsertProduct(client, product);
      for (const [from, to] of moves) {
        await client.query('UPDATE reviews SET product_id = $2 WHERE product_id = $1', [from, to]);
        await client.query(
          'DELETE FROM favorites f WHERE f.product_id = $1 AND EXISTS (SELECT 1 FROM favorites g WHERE g.user_id = f.user_id AND g.product_id = $2)',
          [from, to]
        );
        await client.query('UPDATE favorites SET product_id = $2 WHERE product_id = $1', [from, to]);
      }
      for (const id of removed) await client.query('DELETE FROM products WHERE id = $1', [id]);
    }));
  }

  deleteProduct(productId) {
    this.enqueue('eliminar producto', () => this.pool.query('DELETE FROM products WHERE id = $1', [productId]));
  }
}

module.exports = { PostgresPersistence, describeDbError };
