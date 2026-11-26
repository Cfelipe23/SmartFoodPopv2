import { existsSync, readFileSync, watchFile, unwatchFile } from 'node:fs';
import type { Stats } from 'node:fs';
import type { Persistence } from '../data/persistence';
import { buildCatalogCards } from '../domain/catalogBuilder';
import { mergeCatalog } from '../domain/catalogRefresh';
import type { CatalogRefreshResult, Product } from '../domain/entities';
import type FavoriteRepository = require('../repositories/FavoriteRepository');
import type ProductRepository = require('../repositories/ProductRepository');
import type ReviewRepository = require('../repositories/ReviewRepository');

interface RefreshOptions {
  productRepository: Pick<ProductRepository, 'findAll' | 'applyRefresh'>;
  reviewRepository: Pick<ReviewRepository, 'reassignProducts'>;
  favoriteRepository: Pick<FavoriteRepository, 'reassignProducts'>;
  persistence: Pick<Persistence, 'syncCatalog'>;
  scrapedPath: string;
  logger?: Pick<Console, 'log' | 'warn'>;
}

// RF03: mantiene los precios al día con el último resultado del scraper sin perder
// usuarios, reseñas ni favoritos (los productos conservan su id).
class CatalogRefreshService {
  readonly productRepository: RefreshOptions['productRepository'];
  readonly reviewRepository: RefreshOptions['reviewRepository'];
  readonly favoriteRepository: RefreshOptions['favoriteRepository'];
  readonly persistence: RefreshOptions['persistence'];
  readonly scrapedPath: string;
  readonly logger: Pick<Console, 'log' | 'warn'>;

  constructor({ productRepository, reviewRepository, favoriteRepository, persistence, scrapedPath, logger = console }: RefreshOptions) {
    this.productRepository = productRepository;
    this.reviewRepository = reviewRepository;
    this.favoriteRepository = favoriteRepository;
    this.persistence = persistence;
    this.scrapedPath = scrapedPath;
    this.logger = logger;
  }

  readCards(): Product[] {
    const items: unknown = JSON.parse(readFileSync(this.scrapedPath, 'utf8'));
    if (!Array.isArray(items)) throw new Error('el JSON del scraper debe ser una lista');
    const cards = buildCatalogCards(items);
    if (!cards.length) throw new Error('el JSON no contiene productos válidos');
    return cards;
  }

  // Devuelve las estadísticas de la actualización, o null si no se pudo leer el JSON.
  refresh(): CatalogRefreshResult | null {
    if (!this.scrapedPath || !existsSync(this.scrapedPath)) return null;
    let cards: Product[];
    try {
      cards = this.readCards();
    } catch (error) {
      const message = typeof error === 'object' && error !== null && 'message' in error ? error.message : undefined;
      this.logger.warn(`⚠️ [Scraper Data] No se actualizaron los precios: ${message}`);
      return null;
    }

    const result = mergeCatalog(this.productRepository.findAll(), cards);
    this.productRepository.applyRefresh(result.products);
    this.reviewRepository.reassignProducts(result.remap, result.removedIds);
    this.favoriteRepository.reassignProducts(result.remap, result.removedIds);
    this.persistence.syncCatalog(result);

    const { stats, skippedStores } = result;
    this.logger.log(`🔄 [Scraper Data] Precios actualizados: ${stats.updated} productos cambiados, ${stats.created} nuevos, ${stats.removed} retirados (${stats.total} en total).`);
    if (skippedStores.length) {
      this.logger.warn(`⚠️ [Scraper Data] La extracción de la(s) tienda(s) ${skippedStores.join(', ')} salió incompleta: se conservan sus precios anteriores.`);
    }
    return result;
  }

  // Vuelve a cargar los precios cada vez que el scraper reescribe el JSON.
  watch({ interval = 2000, debounce = 1500 } = {}): () => void {
    if (!this.scrapedPath) return () => {};
    let timer: ReturnType<typeof setTimeout> | undefined;
    const onChange = (current: Stats, previous: Stats) => {
      if (current.mtimeMs === previous.mtimeMs || current.size === 0) return;
      clearTimeout(timer);
      timer = setTimeout(() => this.refresh(), debounce);
    };
    watchFile(this.scrapedPath, { interval }, onChange);
    return () => { clearTimeout(timer); unwatchFile(this.scrapedPath, onChange); };
  }
}

export = CatalogRefreshService;
