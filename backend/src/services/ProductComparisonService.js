const { defaultProductFilters, applyFilters, buildEmptyMessage } = require('../domain/productFilters');
class ProductComparisonService {
  constructor({ productRepository, catalogRepository, filters = defaultProductFilters.filter(f => f !== require('../domain/productFilters').offerFilter) }) { Object.assign(this, { productRepository, catalogRepository, filters }); }
  compare(query = {}) {
    const products = applyFilters(this.productRepository.findAll(), query, this.catalogRepository, this.filters).map(product => {
      const prices = (product.prices || []).map(price => {
        const store = this.catalogRepository.getStores().find(item => Number(item.id) === Number(price.store_id));
        return { ...price, store_name: store?.name || 'Tienda', store_logo: store?.logo || '🏬', store_code: store?.code || 'store' };
      }).sort((a, b) => Number(a.price) - Number(b.price));
      const cheapest = prices[0]; const mostExpensive = prices[prices.length - 1];
      return { ...product, prices, lowest_price: cheapest?.price ?? null, highest_price: mostExpensive?.price ?? null, potential_savings: cheapest && mostExpensive ? Number(mostExpensive.price) - Number(cheapest.price) : 0 };
    });
    return { total: products.length, products, message: products.length ? '' : buildEmptyMessage(query, this.filters) };
  }
}
module.exports = ProductComparisonService;
