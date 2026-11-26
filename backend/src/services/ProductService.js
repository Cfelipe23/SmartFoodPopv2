const { defaultProductFilters, applyFilters, buildEmptyMessage } = require('../domain/productFilters');
const { analysisOf, computeUnitPrice, buildEquivalenceIndex } = require('../domain/productEquivalence');

// RF03 (catálogo), RF08 (ofertas) y RF07 (cada tarjeta trae su comparación con la otra tienda).
class ProductService {
  constructor({ productRepository, catalogRepository, filters = defaultProductFilters }) {
    this.productRepository = productRepository;
    this.catalogRepository = catalogRepository;
    this.filters = filters;
    this.equivalenceCache = { version: null, index: null };
  }

  // Las equivalencias se recalculan solo cuando cambia el catálogo.
  getEquivalenceIndex() {
    const version = this.productRepository.version;
    if (this.equivalenceCache.version !== version || !this.equivalenceCache.index) {
      this.equivalenceCache = { version, index: buildEquivalenceIndex(this.productRepository.findAll()) };
    }
    return this.equivalenceCache.index;
  }

  withUnitPrices(product, prices = product.prices || []) {
    const analysis = analysisOf(product);
    return prices.map(price => ({ ...price, unit_price: computeUnitPrice(price.price, analysis) }));
  }

  // Producto + precios con precio por kg/L + equivalente en otra tienda (si existe).
  decorate(product, index) {
    const match = index.get(product.id);
    return {
      ...product,
      prices: this.withUnitPrices(product),
      equivalent: match ? {
        id: match.product.id,
        name: match.product.name,
        unit: match.product.unit,
        image_url: match.product.image_url,
        prices: this.withUnitPrices(match.product, match.prices),
        score: Number(match.score.toFixed(2))
      } : null
    };
  }

  list(query = {}) {
    const filtered = applyFilters(this.productRepository.findAll(), query, this.catalogRepository, this.filters);
    const index = this.getEquivalenceIndex();
    // El catálogo solo expone productos comparables: idénticos en ambas tiendas (primero) o con equivalente.
    const rank = product => (product.prices.length > 1 ? 0 : 1);
    const products = filtered
      .map(product => this.decorate(product, index))
      .filter(product => product.prices.length > 1 || product.equivalent)
      .sort((a, b) => rank(a) - rank(b));
    return {
      total: products.length,
      products,
      stores: this.catalogRepository.getStores(),
      categories: this.catalogRepository.getCategories(),
      message: products.length ? '' : buildEmptyMessage(query, this.filters)
    };
  }

  listOffers() {
    const result = this.list({ is_offer: 'true' });
    return { total: result.total, offers: result.products };
  }
}

module.exports = ProductService;
