const { createInMemoryStore } = require('./data/inMemoryStore');
const { loadScrapedProducts } = require('./data/scrapedProductsLoader');
const { NoopPersistence } = require('./data/persistence');
const { PostgresPersistence, describeDbError } = require('./data/PostgresPersistence');
const env = require('./config/env');
const ProductRepository = require('./repositories/ProductRepository');
const CatalogRepository = require('./repositories/CatalogRepository');
const UserRepository = require('./repositories/UserRepository');
const ReviewRepository = require('./repositories/ReviewRepository');
const FavoriteRepository = require('./repositories/FavoriteRepository');
const ProductService = require('./services/ProductService');
const { ProductDetailService } = require('./services/ProductDetailService');
const ProductComparisonService = require('./services/ProductComparisonService');
const ProductAdminService = require('./services/ProductAdminService');
const CatalogRefreshService = require('./services/CatalogRefreshService');
const ReviewService = require('./services/ReviewService');
const FavoriteService = require('./services/FavoriteService');
const { AuthService } = require('./services/AuthService');
const { BcryptPasswordHasher } = require('./services/PasswordHasher');
const TokenService = require('./services/TokenService');

// Composition root: construye repositorios y servicios con sus dependencias.
function buildContainer({
  store = createInMemoryStore(),
  persistence = new NoopPersistence(),
  loadCatalog = true,
  scrapedPath = env.SCRAPED_PRODUCTS_PATH,
  logger = console
} = {}) {
  const productRepository = new ProductRepository(store, persistence);
  const catalogRepository = new CatalogRepository(store);
  const userRepository = new UserRepository(store, persistence);
  const reviewRepository = new ReviewRepository(store, persistence);
  const favoriteRepository = new FavoriteRepository(store, persistence);
  const passwordHasher = new BcryptPasswordHasher();
  const tokenService = new TokenService({ secret: env.JWT_SECRET });

  if (loadCatalog) loadScrapedProducts(productRepository, scrapedPath, logger);

  return {
    store,
    persistence,
    storage: persistence instanceof NoopPersistence ? 'memory' : 'postgres',
    tokenService,
    productService: new ProductService({ productRepository, catalogRepository }),
    productDetailService: new ProductDetailService({ productRepository, catalogRepository, reviewRepository }),
    productComparisonService: new ProductComparisonService({ productRepository, catalogRepository }),
    catalogRefreshService: new CatalogRefreshService({ productRepository, reviewRepository, favoriteRepository, persistence, scrapedPath, logger }),
    productAdminService: new ProductAdminService({ productRepository, reviewRepository, favoriteRepository, catalogRepository }),
    reviewService: new ReviewService({ reviewRepository, productRepository }),
    favoriteService: new FavoriteService({ favoriteRepository, productRepository }),
    authService: new AuthService({ userRepository, passwordHasher, tokenService })
  };
}

// Arranque con persistencia: PostgreSQL si está configurado; memoria (solo desarrollo) en caso contrario.
async function bootstrapContainer({ logger = console, persistence = PostgresPersistence.fromEnv(env), reseedCatalog = env.RESEED_CATALOG, scrapedPath = env.SCRAPED_PRODUCTS_PATH } = {}) {
  if (!persistence) {
    logger.warn('⚠️ PostgreSQL no está configurado (DATABASE_URL o PGHOST/PGUSER): los datos se guardan SOLO en memoria y se pierden al reiniciar.');
    return buildContainer({ logger, scrapedPath });
  }

  let store;
  let hasCatalog;
  try {
    await persistence.init();
    store = createInMemoryStore();
    hasCatalog = await persistence.hasCatalog();
    if (hasCatalog) await persistence.load(store);
  } catch (error) {
    throw new Error(describeDbError(error));
  }

  if (hasCatalog && !reseedCatalog) {
    logger.log(`🐘 PostgreSQL: ${store.products.length} productos, ${store.users.length} usuarios y ${store.reviews.length} reseñas cargados.`);
    const container = buildContainer({ store, persistence, loadCatalog: false, logger, scrapedPath });
    // Aplica el JSON más reciente del scraper (p. ej. si se ejecutó con el backend apagado).
    container.catalogRefreshService.refresh();
    await persistence.flush();
    return container;
  }

  // Primer arranque (o RESEED_CATALOG=true): se construye el catálogo y se guarda en la base.
  if (hasCatalog) { store.reviews = []; store.favorites = []; }
  const container = buildContainer({ store, persistence, logger, scrapedPath });
  await persistence.seedReferenceData(store);
  await persistence.replaceCatalog(store.products);
  logger.log(`🐘 PostgreSQL: catálogo inicial guardado (${store.products.length} productos).`);
  return container;
}

module.exports = { buildContainer, bootstrapContainer };
