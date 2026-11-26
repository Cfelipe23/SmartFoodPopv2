import type { CatalogProduct, CatalogResponse, OffersResponse, PriceWithUnit } from '../contracts/api';
import type { Product, ProductEquivalence, ProductPrice } from '../domain/entities';
import { defaultProductFilters, applyFilters, buildEmptyMessage } from '../domain/productFilters';
import type { ProductFilterQuery } from '../domain/productFilters';
import { analysisOf, computeUnitPrice, buildEquivalenceIndex } from '../domain/productEquivalence';
import type CatalogRepository = require('../repositories/CatalogRepository');
import type ProductRepository = require('../repositories/ProductRepository');

interface ProductServiceOptions {
  productRepository: Pick<ProductRepository, 'findAll' | 'version'>;
  catalogRepository: Pick<CatalogRepository, 'getStores' | 'getCategories'>;
  filters?: readonly (typeof defaultProductFilters)[number][];
}

// RF03 (catálogo), RF08 (ofertas) y RF07 (cada tarjeta trae su comparación con la otra tienda).
class ProductService {
  readonly productRepository: ProductServiceOptions['productRepository'];
  readonly catalogRepository: ProductServiceOptions['catalogRepository'];
  readonly filters: readonly (typeof defaultProductFilters)[number][];
  equivalenceCache: { version: number | null; index: Map<number, ProductEquivalence> | null };

  constructor({ productRepository, catalogRepository, filters = defaultProductFilters }: ProductServiceOptions) {
    this.productRepository = productRepository;
    this.catalogRepository = catalogRepository;
    this.filters = filters;
    this.equivalenceCache = { version: null, index: null };
  }

  // Las equivalencias se recalculan solo cuando cambia el catálogo.
  getEquivalenceIndex(): Map<number, ProductEquivalence> {
    const version = this.productRepository.version;
    const cached = this.equivalenceCache.index;
    if (this.equivalenceCache.version === version && cached) return cached;
    const index = buildEquivalenceIndex(this.productRepository.findAll());
    this.equivalenceCache = { version, index };
    return index;
  }

  withUnitPrices(product: Product, prices: readonly ProductPrice[] = product.prices || []): PriceWithUnit[] {
    const analysis = analysisOf(product);
    return prices.map(price => ({ ...price, unit_price: computeUnitPrice(price.price, analysis) }));
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
