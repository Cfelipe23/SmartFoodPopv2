import type { InMemoryStore } from '../data/inMemoryStore';
import { NoopPersistence } from '../data/persistence';
import type { Persistence } from '../data/persistence';
import type { Favorite } from '../domain/entities';

class FavoriteRepository {
  constructor(readonly store: InMemoryStore, readonly persistence: Persistence = new NoopPersistence()) {}

  findByUserId(userId: number): Favorite[] {
    return this.store.favorites.filter(f => f.user_id === userId);
  }

  toggle(userId: number | string, productId: number | string): { isFavorite: boolean } {
    const favorites = this.store.favorites;
    const numericProdId = parseInt(String(productId), 10);
    const numericUserId = parseInt(String(userId), 10);
    const existingIdx = favorites.findIndex(f => f.user_id === numericUserId && f.product_id === numericProdId);
    if (existingIdx !== -1) {
      favorites.splice(existingIdx, 1);
      this.persistence.removeFavorite(numericUserId, numericProdId);
      return { isFavorite: false };
    }
    const newFav: Favorite = { id: favorites.length ? Math.max(...favorites.map(f => f.id)) + 1 : 1, user_id: numericUserId, product_id: numericProdId };
    favorites.push(newFav);
    this.persistence.addFavorite(newFav);
    return { isFavorite: true };
  }

  reassignProducts(remap: ReadonlyMap<number, number>, removedIds: readonly number[]): void {
    const removed = new Set(removedIds);
    const seen = new Set<string>();
    this.store.favorites = this.store.favorites
      .map(favorite => {
        const destination = favorite.product_id === null ? undefined : remap.get(favorite.product_id);
        return destination === undefined ? favorite : { ...favorite, product_id: destination };
      })
      .filter(f => {
        const key = `${f.user_id}|${f.product_id}`;
        if ((f.product_id !== null && removed.has(f.product_id)) || seen.has(key)) return false;
        seen.add(key);
        return true;
      });
  }

  removeByProductId(productId: number): void {
    this.store.favorites = this.store.favorites.filter(f => f.product_id !== productId);
  }
}

export = FavoriteRepository;
