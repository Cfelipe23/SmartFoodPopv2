import type { ProductFilterQuery } from '../domain/productFilters';
import type ProductService = require('./ProductService');
import type ProductComparisonService = require('./ProductComparisonService');
import type { ProductDetailService } from './ProductDetailService';

export class CatalogFacade {
  constructor(
    private readonly products: Pick<ProductService, 'list' | 'listOffers'>,
    private readonly comparisons: Pick<ProductComparisonService, 'compare'>,
    private readonly details: Pick<ProductDetailService, 'getDetail'>
  ) {}

  list(query?: ProductFilterQuery) {
    return this.products.list(query);
  }

  listOffers() {
    return this.products.listOffers();
  }

  compare(query?: ProductFilterQuery) {
    return this.comparisons.compare(query);
  }

  getDetail(productId: number | string) {
    return this.details.getDetail(productId);
  }
}
