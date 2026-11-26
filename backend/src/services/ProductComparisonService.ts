import type { ComparisonResponse, PriceWithStore } from '../contracts/api';
import type { PricePresenter } from './pricePresenter';
import { defaultProductFilters, offerFilter, applyFilters, buildEmptyMessage } from '../domain/productFilters';
import type { ProductFilterQuery, ProductFilterStrategy } from '../domain/productFilters';
import type CatalogRepository = require('../repositories/CatalogRepository');
import type ProductRepository = require('../repositories/ProductRepository');

interface ComparisonOptions {
  storePrice: PricePresenter<PriceWithStore>;
  productRepository: Pick<ProductRepository, 'findAll'>;
  catalogRepository: Pick<CatalogRepository, 'getStores' | 'getCategories'>;
  filters?: readonly ProductFilterStrategy[];
}

class ProductComparisonService {
  private readonly storePrice: PricePresenter<PriceWithStore>;
  readonly productRepository: ComparisonOptions['productRepository'];
  readonly catalogRepository: ComparisonOptions['catalogRepository'];
  readonly filters: readonly ProductFilterStrategy[];

  constructor({ productRepository, catalogRepository, storePrice, filters = defaultProductFilters.filter(f => f !== offerFilter) }: ComparisonOptions) {
    this.storePrice = storePrice;
    this.productRepository = productRepository;
    this.catalogRepository = catalogRepository;
    this.filters = filters;
  }

  compare(query: ProductFilterQuery = {}): ComparisonResponse {
    const products = applyFilters(this.productRepository.findAll(), query, this.catalogRepository, this.filters).map(product => {
      const prices = (product.prices || []).map(price => this.storePrice(product, price))
        .sort((a, b) => Number(a.price) - Number(b.price));
      const cheapest = prices[0]; const mostExpensive = prices[prices.length - 1];
      return { ...product, prices, lowest_price: cheapest?.price ?? null, highest_price: mostExpensive?.price ?? null, potential_savings: cheapest && mostExpensive ? Number(mostExpensive.price) - Number(cheapest.price) : 0 };
    });
    return { total: products.length, products, message: products.length ? '' : buildEmptyMessage(query, this.filters) };
  }
}
export = ProductComparisonService;
