const { NoopPersistence } = require('../data/persistence');

class FavoriteRepository {
  constructor(store, persistence = new NoopPersistence()) {
    this.store = store;
    this.persistence = persistence;
  }

  findByUserId(userId) {
    return this.store.favorites.filter(f => f.user_id === userId);
  }

  toggle(userId, productId) {
    const favorites = this.store.favorites;
    const numericProdId = parseInt(productId, 10);
    const numericUserId = parseInt(userId, 10);
    const existingIdx = favorites.findIndex(f => f.user_id === numericUserId && f.product_id === numericProdId);
    if (existingIdx !== -1) {
      favorites.splice(existingIdx, 1);
      this.persistence.removeFavorite(numericUserId, numericProdId);
      return { isFavorite: false };
    }
    const newFav = { id: favorites.length ? Math.max(...favorites.map(f => f.id)) + 1 : 1, user_id: numericUserId, product_id: numericProdId };
    favorites.push(newFav);
    this.persistence.addFavorite(newFav);
    return { isFavorite: true };
  }

  reassignProducts(remap, removedIds) {
    const removed = new Set(removedIds);
    const seen = new Set();
    this.store.favorites = this.store.favorites
      .map(f => (remap.has(f.product_id) ? { ...f, product_id: remap.get(f.product_id) } : f))
      .filter(f => {
        const key = `${f.user_id}|${f.product_id}`;
        if (removed.has(f.product_id) || seen.has(key)) return false;
        seen.add(key);
        return true;
      });
  }

  removeByProductId(productId) {
    this.store.favorites = this.store.favorites.filter(f => f.product_id !== productId);
  }
}

module.exports = FavoriteRepository;
