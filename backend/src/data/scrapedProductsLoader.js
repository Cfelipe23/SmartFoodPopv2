const fs = require('fs');
const { buildCatalogCards } = require('../domain/catalogBuilder');

// RF03: carga el catálogo desde el JSON generado por el scraper de Python.
// Devuelve true si el catálogo del scraper reemplazó al dataset de respaldo.
function loadScrapedProducts(productRepository, scrapedPath, logger = console) {
  if (!scrapedPath || !fs.existsSync(scrapedPath)) {
    logger.warn(`⚠️ [Scraper Data] No existe ${scrapedPath}; se usa el catálogo de respaldo. Ejecute "npm run scrape".`);
    return false;
  }

  try {
    const scrapedItems = JSON.parse(fs.readFileSync(scrapedPath, 'utf8'));
    if (!Array.isArray(scrapedItems)) throw new Error('el JSON del scraper debe ser una lista');
    const cards = buildCatalogCards(scrapedItems);
    if (!cards.length) throw new Error('el JSON no contiene productos válidos');
    productRepository.replaceAll(cards);
    const comparable = cards.filter(card => card.prices.length > 1).length;
    logger.log(`📦 [Scraper Data] ${scrapedItems.length} registros → ${cards.length} productos (${comparable} comparables entre tiendas).`);
    return true;
  } catch (error) {
    logger.warn('⚠️ Error al cargar productos del scraper:', error.message);
    return false;
  }
}

module.exports = { loadScrapedProducts };
