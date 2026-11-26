const fs = require('fs');
const { buildCatalogCards } = require('../domain/catalogBuilder');
const { mergeCatalog } = require('../domain/catalogRefresh');

// RF03: mantiene los precios al día con el último resultado del scraper sin perder
// usuarios, reseñas ni favoritos (los productos conservan su id).
class CatalogRefreshService {
  constructor({ productRepository, reviewRepository, favoriteRepository, persistence, scrapedPath, logger = console }) {
    this.productRepository = productRepository;
    this.reviewRepository = reviewRepository;
    this.favoriteRepository = favoriteRepository;
    this.persistence = persistence;
    this.scrapedPath = scrapedPath;
    this.logger = logger;
  }

  readCards() {
    const items = JSON.parse(fs.readFileSync(this.scrapedPath, 'utf8'));
    if (!Array.isArray(items)) throw new Error('el JSON del scraper debe ser una lista');
    const cards = buildCatalogCards(items);
    if (!cards.length) throw new Error('el JSON no contiene productos válidos');
    return cards;
  }

  // Devuelve las estadísticas de la actualización, o null si no se pudo leer el JSON.
  refresh() {
    if (!this.scrapedPath || !fs.existsSync(this.scrapedPath)) return null;
    let cards;
    try {
      cards = this.readCards();
    } catch (error) {
      this.logger.warn(`⚠️ [Scraper Data] No se actualizaron los precios: ${error.message}`);
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
  watch({ interval = 2000, debounce = 1500 } = {}) {
    if (!this.scrapedPath) return () => {};
    let timer = null;
    const onChange = (current, previous) => {
      if (current.mtimeMs === previous.mtimeMs || current.size === 0) return;
      clearTimeout(timer);
      timer = setTimeout(() => this.refresh(), debounce);
    };
    fs.watchFile(this.scrapedPath, { interval }, onChange);
    return () => { clearTimeout(timer); fs.unwatchFile(this.scrapedPath, onChange); };
  }
}

module.exports = CatalogRefreshService;
