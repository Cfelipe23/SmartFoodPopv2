import type { ScrapedCatalogSource } from './ScrapedCatalogAdapter';
import type ProductRepository = require('../repositories/ProductRepository');

// RF03: carga el catálogo desde el JSON generado por el scraper de Python.
// Devuelve true si el catálogo del scraper reemplazó al dataset de respaldo.
export function loadScrapedProducts(
  productRepository: Pick<ProductRepository, 'replaceAll'>,
  source: ScrapedCatalogSource,
  logger: Pick<Console, 'log' | 'warn'> = console
): boolean {
  try {
    const cards = source.readCards();
    productRepository.replaceAll(cards);
    const comparable = cards.filter(card => card.prices.length > 1).length;
    logger.log(`📦 [Scraper Data] ${cards.length} productos (${comparable} comparables entre tiendas).`);
    return true;
  } catch (error) {
    const message = typeof error === 'object' && error !== null && 'message' in error ? error.message : undefined;
    logger.warn('⚠️ Error al cargar productos del scraper:', message);
    return false;
  }
}
