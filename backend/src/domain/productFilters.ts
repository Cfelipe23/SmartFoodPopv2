import type { Category, Product, Store } from './entities';
import { readTextParam, normalizeText, readCatalogItem } from './queryHelpers';

export type ProductFilterQuery = Partial<Record<'search' | 'category' | 'store' | 'is_offer', unknown>>;

interface FilterCatalog {
  getCategories(): readonly Category[];
  getStores(): readonly Store[];
}

interface ProductFilter {
  apply(products: Product[], query: ProductFilterQuery, catalog: FilterCatalog): Product[];
  describeEmpty?(query: ProductFilterQuery): string;
}

function catalogItemId(item: { id: number } | null): number {
  // Un filtro que solo contiene espacios conserva el error anterior al consultar un producto.
  if (item === null) throw new TypeError("Cannot read properties of null (reading 'id')");
  return Number(item.id);
}

export const searchFilter: ProductFilter = {
  apply(products, query) {
    const search = normalizeText(readTextParam(query.search));
    if (!search) return products;
    return products.filter(product => normalizeText(`${product.name || ''} ${product.description || ''}`).includes(search));
  },
  describeEmpty(query) { return query.search ? `No hay productos que coincidan con “${query.search}”.` : ''; }
};
export const categoryFilter: ProductFilter = {
  apply(products, query, catalog) {
    if (!query.category) return products;
    const category = readCatalogItem(catalog.getCategories(), readTextParam(query.category), 'slug');
    return products.filter(product => Number(product.category_id) === catalogItemId(category));
  },
  describeEmpty(query) { return query.category ? `No hay productos en la categoría “${query.category}”.` : ''; }
};
export const storeFilter: ProductFilter = {
  apply(products, query, catalog) {
    if (!query.store) return products;
    const store = readCatalogItem(catalog.getStores(), readTextParam(query.store), 'code');
    return products.filter(product => (product.prices || []).some(price => Number(price.store_id) === catalogItemId(store)));
  },
  describeEmpty(query) { return query.store ? `No hay productos disponibles en la tienda “${query.store}”.` : ''; }
};
export const offerFilter: ProductFilter = {
  apply(products, query) {
    if (query.is_offer !== 'true') return products;
    return products.filter(product => (product.prices || []).some(price => price.is_offer));
  },
  describeEmpty(query) { return query.is_offer === 'true' ? 'No hay ofertas para estos criterios.' : ''; }
};
export function applyFilters(
  products: readonly Product[],
  query: ProductFilterQuery = {},
  catalog: FilterCatalog,
  filters: readonly ProductFilter[] = []
): Product[] {
  return filters.reduce((current, filter) => filter.apply(current, query, catalog), [...products]);
}
export function buildEmptyMessage(query: ProductFilterQuery = {}, filters: readonly ProductFilter[] = []): string {
  for (const filter of filters) { const message = filter.describeEmpty?.(query); if (message) return message; }
  return 'No se encontraron productos con los criterios seleccionados.';
}
export const defaultProductFilters = [searchFilter, categoryFilter, storeFilter, offerFilter];
