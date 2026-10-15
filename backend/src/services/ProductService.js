const { defaultProductFilters, applyFilters, buildEmptyMessage } = require('../domain/productFilters');
class ProductService {
  constructor({ productRepository, catalogRepository, filters = defaultProductFilters }) {
    this.productRepository = productRepository;
    this.catalogRepository = catalogRepository;
    this.filters = filters;
  }
  list(query = {}) {
    const products = applyFilters(this.productRepository.findAll(), query, this.catalogRepository, this.filters);
    return { total: products.length, products, stores: this.catalogRepository.getStores(), categories: this.catalogRepository.getCategories(), message: products.length ? '' : buildEmptyMessage(query, this.filters) };
  }
  listOffers() { const result = this.list({ is_offer: 'true' }); return { total: result.total, offers: result.products }; }
}
module.exports = ProductService;
