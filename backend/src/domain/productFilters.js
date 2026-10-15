const { readTextParam, normalizeText, readCatalogItem } = require('./queryHelpers');
const searchFilter = {
  apply(products, query) {
    const search = normalizeText(readTextParam(query.search));
    if (!search) return products;
    return products.filter(product => normalizeText(`${product.name || ''} ${product.description || ''}`).includes(search));
  },
  describeEmpty(query) { return query.search ? `No hay productos que coincidan con “${query.search}”.` : ''; }
};
const categoryFilter = {
  apply(products, query, catalog) {
    if (!query.category) return products;
    const category = readCatalogItem(catalog.getCategories(), readTextParam(query.category), 'slug');
    return products.filter(product => Number(product.category_id) === Number(category.id));
  },
  describeEmpty(query) { return query.category ? `No hay productos en la categoría “${query.category}”.` : ''; }
};
const storeFilter = {
  apply(products, query, catalog) {
    if (!query.store) return products;
    const store = readCatalogItem(catalog.getStores(), readTextParam(query.store), 'code');
    return products.filter(product => (product.prices || []).some(price => Number(price.store_id) === Number(store.id)));
  },
  describeEmpty(query) { return query.store ? `No hay productos disponibles en la tienda “${query.store}”.` : ''; }
};
const offerFilter = {
  apply(products, query) {
    if (query.is_offer !== 'true') return products;
    return products.filter(product => (product.prices || []).some(price => price.is_offer));
  },
  describeEmpty(query) { return query.is_offer === 'true' ? 'No hay ofertas para estos criterios.' : ''; }
};
function applyFilters(products, query = {}, catalog, filters = []) {
  return filters.reduce((current, filter) => filter.apply(current, query, catalog), [...products]);
}
function buildEmptyMessage(query = {}, filters = []) {
  for (const filter of filters) { const message = filter.describeEmpty?.(query); if (message) return message; }
  return 'No se encontraron productos con los criterios seleccionados.';
}
const defaultProductFilters = [searchFilter, categoryFilter, storeFilter, offerFilter];
module.exports = { searchFilter, categoryFilter, storeFilter, offerFilter, defaultProductFilters, applyFilters, buildEmptyMessage };
