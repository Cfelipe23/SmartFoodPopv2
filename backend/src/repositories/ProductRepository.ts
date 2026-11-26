import type { InMemoryStore } from '../data/inMemoryStore';
import { NoopPersistence } from '../data/persistence';
import type { Persistence } from '../data/persistence';
import type { Product } from '../domain/entities';

type ProductData = Omit<Product, 'id'>;

class ProductRepository {
  constructor(readonly store: InMemoryStore, readonly persistence: Persistence = new NoopPersistence()) {}

  // Cambia con cada modificación del catálogo (invalida cachés derivadas, p. ej. equivalencias).
  get version(): number {
    return this.store.catalogVersion || 0;
  }

  bump(): void {
    this.store.catalogVersion = this.version + 1;
  }

  findAll(): Product[] {
    return this.store.products;
  }

  findById(id: number): Product | undefined {
    return this.store.products.find(p => p.id === id);
  }

  // Carga masiva del catálogo (scraper); no dispara escrituras individuales.
  replaceAll(products: Product[]): void {
    this.store.products = products;
    this.bump();
  }

  // Actualización del catálogo desde el scraper: la persistencia la hace CatalogRefreshService en bloque.
  applyRefresh(products: Product[]): void {
    this.store.products = products;
    this.bump();
  }

  create(productData: ProductData): Product {
    const products = this.store.products;
    const newId = products.length ? Math.max(...products.map(p => p.id)) + 1 : 1;
    const product = { id: newId, ...productData };
    products.unshift(product);
    this.bump();
    this.persistence.saveProduct(product);
    return product;
  }

  update(id: number | string, updateData: Partial<ProductData>): Product | null {
    const products = this.store.products;
    const idx = products.findIndex(p => p.id === parseInt(String(id), 10));
    if (idx === -1) return null;
    products[idx] = { ...products[idx], ...updateData, id: products[idx].id };
    this.bump();
    this.persistence.saveProduct(products[idx]);
    return products[idx];
  }

  remove(id: number | string): boolean {
    const numericId = parseInt(String(id), 10);
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

export = ProductRepository;
