const { NoopPersistence } = require('../data/persistence');

class ProductRepository {
  constructor(store, persistence = new NoopPersistence()) {
    this.store = store;
    this.persistence = persistence;
  }

  // Cambia con cada modificación del catálogo (invalida cachés derivadas, p. ej. equivalencias).
  get version() {
    return this.store.catalogVersion || 0;
  }

  bump() {
    this.store.catalogVersion = this.version + 1;
  }

  findAll() {
    return this.store.products;
  }

  findById(id) {
    return this.store.products.find(p => p.id === id);
  }

  // Carga masiva del catálogo (scraper); no dispara escrituras individuales.
  replaceAll(products) {
    this.store.products = products;
    this.bump();
  }

  // Actualización del catálogo desde el scraper: la persistencia la hace CatalogRefreshService en bloque.
  applyRefresh(products) {
    this.store.products = products;
    this.bump();
  }

  create(productData) {
    const products = this.store.products;
    const newId = products.length ? Math.max(...products.map(p => p.id)) + 1 : 1;
    const product = { id: newId, ...productData };
    products.unshift(product);
    this.bump();
    this.persistence.saveProduct(product);
    return product;
  }

  update(id, updateData) {
    const products = this.store.products;
    const idx = products.findIndex(p => p.id === parseInt(id, 10));
    if (idx === -1) return null;
    products[idx] = { ...products[idx], ...updateData, id: products[idx].id };
    this.bump();
    this.persistence.saveProduct(products[idx]);
    return products[idx];
  }

  remove(id) {
    const numericId = parseInt(id, 10);
    const initialLen = this.store.products.length;
    this.store.products = this.store.products.filter(p => p.id !== numericId);
    const removed = this.store.products.length < initialLen;
    if (removed) {
      this.bump();
      this.persistence.deleteProduct(numericId);
    }
    return removed;
  }
}

module.exports = ProductRepository;
