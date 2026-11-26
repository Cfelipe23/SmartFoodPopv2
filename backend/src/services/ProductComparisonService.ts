import type { ComparisonResponse } from '../contracts/api';
import { defaultProductFilters, offerFilter, applyFilters, buildEmptyMessage } from '../domain/productFilters';
import type { ProductFilterQuery } from '../domain/productFilters';
import type CatalogRepository = require('../repositories/CatalogRepository');
import type ProductRepository = require('../repositories/ProductRepository');

interface ComparisonOptions {
  productRepository: Pick<ProductRepository, 'findAll'>;
  catalogRepository: Pick<CatalogRepository, 'getStores' | 'getCategories'>;
  filters?: readonly (typeof defaultProductFilters)[number][];
}

class ProductComparisonService {
  readonly productRepository: ComparisonOptions['productRepository'];
  readonly catalogRepository: ComparisonOptions['catalogRepository'];
  readonly filters: readonly (typeof defaultProductFilters)[number][];

  constructor({ productRepository, catalogRepository, filters = defaultProductFilters.filter(f => f !== offerFilter) }: ComparisonOptions) {
    this.productRepository = productRepository;
    this.catalogRepository = catalogRepository;
    this.filters = filters;
  }

  compare(query: ProductFilterQuery = {}): ComparisonResponse {
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
export = ProductComparisonService;
