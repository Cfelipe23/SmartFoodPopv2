import env = require('./config/env');
import type { HealthResponse } from './contracts/api';
import { createInMemoryStore } from './data/inMemoryStore';
import type { InMemoryStore } from './data/inMemoryStore';
import { loadScrapedProducts } from './data/scrapedProductsLoader';
import { ScrapedCatalogAdapter } from './data/ScrapedCatalogAdapter';
import { NoopPersistence } from './data/persistence';
import type { CatalogPersistence, Persistence } from './data/persistence';
import { PostgresPersistence, describeDbError } from './data/PostgresPersistence';
import ProductRepository = require('./repositories/ProductRepository');
import CatalogRepository = require('./repositories/CatalogRepository');
import UserRepository = require('./repositories/UserRepository');
import ReviewRepository = require('./repositories/ReviewRepository');
import FavoriteRepository = require('./repositories/FavoriteRepository');
import ProductService = require('./services/ProductService');
import { CatalogEquivalenceIndex, EquivalenceIndexProxy } from './services/EquivalenceIndexProxy';
import { CatalogFacade } from './services/CatalogFacade';
import { basePrice, withStore, withUnitPrice } from './services/pricePresenter';
import { ProductDetailService } from './services/ProductDetailService';
import ProductComparisonService = require('./services/ProductComparisonService');
import ProductAdminService = require('./services/ProductAdminService');
import CatalogRefreshService = require('./services/CatalogRefreshService');
import ReviewService = require('./services/ReviewService');
import FavoriteService = require('./services/FavoriteService');
import { AuthService } from './services/AuthService';
import { BcryptPasswordHasher } from './services/PasswordHasher';
import TokenService = require('./services/TokenService');

interface CatalogOptions {
  logger?: Pick<Console, 'log' | 'warn'>;
  scrapedPath?: string;
}

interface ContainerOptions extends CatalogOptions {
  store?: InMemoryStore;
  persistence?: Persistence;
  loadCatalog?: boolean;
}

interface BootstrapOptions extends CatalogOptions {
  persistence?: CatalogPersistence | null;
  reseedCatalog?: boolean;
}

// Composition root: construye repositorios y servicios con sus dependencias.
export function buildContainer({
  store = createInMemoryStore(),
  persistence = new NoopPersistence(),
  loadCatalog = true,
  scrapedPath = env.SCRAPED_PRODUCTS_PATH,
  logger = console
}: ContainerOptions = {}) {
  const productRepository = new ProductRepository(store, persistence);
  const catalogRepository = new CatalogRepository(store);
  const userRepository = new UserRepository(store, persistence);
  const reviewRepository = new ReviewRepository(store, persistence);
  const favoriteRepository = new FavoriteRepository(store, persistence);
  const passwordHasher = new BcryptPasswordHasher();
  const tokenService = new TokenService({ secret: env.JWT_SECRET });

  const source = new ScrapedCatalogAdapter(scrapedPath);
  if (loadCatalog) loadScrapedProducts(productRepository, source, logger);

  const storage: HealthResponse['storage'] = persistence.storage ?? 'postgres';
  const equivalences = new EquivalenceIndexProxy(new CatalogEquivalenceIndex(productRepository), productRepository);
  const storePrice = withStore(basePrice, catalogRepository);
  const productService = new ProductService({ productRepository, catalogRepository, equivalences, unitPrice: withUnitPrice(basePrice) });
  const productDetailService = new ProductDetailService({ productRepository, catalogRepository, reviewRepository, detailPrice: withUnitPrice(storePrice) });
  const productComparisonService = new ProductComparisonService({ productRepository, catalogRepository, storePrice });
  return {
    store,
    persistence,
    storage,
    tokenService,
    productService,
    productDetailService,
    productComparisonService,
    catalogFacade: new CatalogFacade(productService, productComparisonService, productDetailService),
    catalogRefreshService: new CatalogRefreshService({ productRepository, reviewRepository, favoriteRepository, persistence, scrapedPath, source, logger }),
    productAdminService: new ProductAdminService({ productRepository, reviewRepository, favoriteRepository, catalogRepository }),
    reviewService: new ReviewService({ reviewRepository, productRepository }),
    favoriteService: new FavoriteService({ favoriteRepository, productRepository }),
    authService: new AuthService({ userRepository, passwordHasher, tokenService })
  };
}

export type Container = ReturnType<typeof buildContainer>;

// Arranque con persistencia: PostgreSQL si está configurado; memoria (solo desarrollo) en caso contrario.
export async function bootstrapContainer({
  logger = console,
  persistence = PostgresPersistence.fromEnv(env),
  reseedCatalog = env.RESEED_CATALOG,
  scrapedPath = env.SCRAPED_PRODUCTS_PATH
}: BootstrapOptions = {}): Promise<Container> {
  if (!persistence) {
    logger.warn('⚠️ PostgreSQL no está configurado (DATABASE_URL o PGHOST/PGUSER): los datos se guardan SOLO en memoria y se pierden al reiniciar.');
    return buildContainer({ logger, scrapedPath });
  }

  let store: InMemoryStore;
  let hasCatalog: boolean;
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
