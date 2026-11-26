import { existsSync, readFileSync } from 'node:fs';
import { buildCatalogCards } from '../domain/catalogBuilder';
import type ProductRepository = require('../repositories/ProductRepository');

// RF03: carga el catálogo desde el JSON generado por el scraper de Python.
// Devuelve true si el catálogo del scraper reemplazó al dataset de respaldo.
export function loadScrapedProducts(
  productRepository: Pick<ProductRepository, 'replaceAll'>,
  scrapedPath?: string | null,
  logger: Pick<Console, 'log' | 'warn'> = console
): boolean {
  if (!scrapedPath || !existsSync(scrapedPath)) {
    logger.warn(`⚠️ [Scraper Data] No existe ${scrapedPath}; se usa el catálogo de respaldo. Ejecute "npm run scrape".`);
    return false;
  }

  try {
    const scrapedItems: unknown = JSON.parse(readFileSync(scrapedPath, 'utf8'));
    if (!Array.isArray(scrapedItems)) throw new Error('el JSON del scraper debe ser una lista');
    const cards = buildCatalogCards(scrapedItems);
    if (!cards.length) throw new Error('el JSON no contiene productos válidos');
    productRepository.replaceAll(cards);
    const comparable = cards.filter(card => card.prices.length > 1).length;
    logger.log(`📦 [Scraper Data] ${scrapedItems.length} registros → ${cards.length} productos (${comparable} comparables entre tiendas).`);
    return true;
  } catch (error) {
    const message = typeof error === 'object' && error !== null && 'message' in error ? error.message : undefined;
    logger.warn('⚠️ Error al cargar productos del scraper:', message);
    return false;
  }
}
