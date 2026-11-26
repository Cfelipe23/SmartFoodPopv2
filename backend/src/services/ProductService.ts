import type { CatalogProduct, CatalogResponse, OffersResponse, PriceWithUnit } from '../contracts/api';
import type { Product, ProductEquivalence, ProductPrice } from '../domain/entities';
import { defaultProductFilters, applyFilters, buildEmptyMessage } from '../domain/productFilters';
import type { ProductFilterQuery, ProductFilterStrategy } from '../domain/productFilters';
import type { PricePresenter } from './pricePresenter';
import type { EquivalenceIndexProvider } from './EquivalenceIndexProxy';
import type CatalogRepository = require('../repositories/CatalogRepository');
import type ProductRepository = require('../repositories/ProductRepository');

interface ProductServiceOptions {
  productRepository: Pick<ProductRepository, 'findAll'>;
  equivalences: EquivalenceIndexProvider;
  unitPrice: PricePresenter<PriceWithUnit>;
  catalogRepository: Pick<CatalogRepository, 'getStores' | 'getCategories'>;
  filters?: readonly ProductFilterStrategy[];
}

// RF03 (catálogo), RF08 (ofertas) y RF07 (cada tarjeta trae su comparación con la otra tienda).
class ProductService {
  readonly productRepository: ProductServiceOptions['productRepository'];
  readonly catalogRepository: ProductServiceOptions['catalogRepository'];
  readonly filters: readonly ProductFilterStrategy[];
  private readonly equivalences: EquivalenceIndexProvider;
  private readonly unitPrice: PricePresenter<PriceWithUnit>;

  constructor({ productRepository, catalogRepository, equivalences, unitPrice, filters = defaultProductFilters }: ProductServiceOptions) {
    this.productRepository = productRepository;
    this.catalogRepository = catalogRepository;
    this.filters = filters;
    this.equivalences = equivalences;
    this.unitPrice = unitPrice;
  }

  getEquivalenceIndex(): ReadonlyMap<number, ProductEquivalence> {
    return this.equivalences.getIndex();
  }

  withUnitPrices(product: Product, prices: readonly ProductPrice[] = product.prices || []): PriceWithUnit[] {
    return prices.map(price => this.unitPrice(product, price));
  }

  // Producto + precios con precio por kg/L + equivalente en otra tienda (si existe).
  decorate(product: Product, index: ReadonlyMap<number, ProductEquivalence>): CatalogProduct {
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

  list(query: ProductFilterQuery = {}): CatalogResponse {
    const filtered = applyFilters(this.productRepository.findAll(), query, this.catalogRepository, this.filters);
    const index = this.getEquivalenceIndex();
    // El catálogo solo expone productos comparables: idénticos en ambas tiendas (primero) o con equivalente.
    const rank = (product: CatalogProduct) => (product.prices.length > 1 ? 0 : 1);
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

  listOffers(): OffersResponse {
    const result = this.list({ is_offer: 'true' });
    return { total: result.total, offers: result.products };
  }
}

export = ProductService;
