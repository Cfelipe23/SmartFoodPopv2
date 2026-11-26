import type { Category, Store } from '../domain/entities';
import type { InMemoryStore } from '../data/inMemoryStore';

class CatalogRepository {
  constructor(readonly store: InMemoryStore) {}

  getStores(): Store[] {
    return this.store.stores;
  }

  getCategories(): Category[] {
    return this.store.categories;
  }
}

export = CatalogRepository;
