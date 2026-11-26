import type { CatalogRefreshResult, Favorite, Product, Review, User } from '../domain/entities';
import type { InMemoryStore } from './inMemoryStore';

export type CatalogChanges = Pick<CatalogRefreshResult, 'changedProducts' | 'removedIds' | 'remap'>;
export type ReferenceData = Pick<InMemoryStore, 'stores' | 'categories' | 'users'>;

// Las escrituras devuelven de inmediato. flush espera la cola de persistencia.
export interface Persistence {
  readonly storage?: 'memory' | 'postgres';
  saveUser(user: User): void;
  saveReview(review: Review): void;
  addFavorite(favorite: Favorite): void;
  removeFavorite(userId: number, productId: number): void;
  saveProduct(product: Product): void;
  deleteProduct(productId: number): void;
  syncCatalog(changes: CatalogChanges): void;
  flush(): Promise<void>;
  close(): Promise<void>;
}

export interface CatalogPersistence extends Persistence {
  init(): Promise<void>;
  hasCatalog(): Promise<boolean>;
  load(store: InMemoryStore): Promise<void>;
  seedReferenceData(store: ReferenceData): Promise<void>;
  // Inserta o actualiza las categorías (p. ej. una categoría nueva en una base que ya tiene catálogo).
  syncCategories(categories: ReferenceData['categories']): Promise<void>;
  replaceCatalog(products: readonly Product[]): Promise<void>;
}

// Contrato de persistencia usado por los repositorios. La implementación nula se usa
// cuando no hay base de datos configurada (modo memoria de desarrollo).
export class NoopPersistence implements Persistence {
  readonly storage = 'memory';
  saveUser(_user: User): void {}
  saveReview(_review: Review): void {}
  addFavorite(_favorite: Favorite): void {}
  removeFavorite(_userId: number, _productId: number): void {}
  saveProduct(_product: Product): void {}
  deleteProduct(_productId: number): void {}
  syncCatalog(_changes: CatalogChanges): void {}
  async flush() {}
  async close() {}
}
