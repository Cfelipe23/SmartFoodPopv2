const { NoopPersistence } = require('../data/persistence');

class ReviewRepository {
  constructor(store, persistence = new NoopPersistence()) {
    this.store = store;
    this.persistence = persistence;
  }

  findByProductId(productId) {
    return this.store.reviews.filter(r => r.product_id === productId);
  }

  add(reviewData) {
    const reviews = this.store.reviews;
    const newReview = {
      id: reviews.length ? Math.max(...reviews.map(r => r.id)) + 1 : 1,
      user_id: reviewData.user_id,
      user_name: reviewData.user_name || 'Usuario',
      product_id: parseInt(reviewData.product_id, 10),
      rating: parseInt(reviewData.rating, 10),
      comment: reviewData.comment,
      created_at: new Date().toISOString()
    };
    reviews.unshift(newReview);
    this.persistence.saveReview(newReview);
    return newReview;
  }

  // Tras actualizar el catálogo: las reseñas siguen al producto que absorbió la ficha
  // (`remap`) o se descartan si el producto dejó de existir.
  reassignProducts(remap, removedIds) {
    const removed = new Set(removedIds);
    this.store.reviews = this.store.reviews
      .map(r => (remap.has(r.product_id) ? { ...r, product_id: remap.get(r.product_id) } : r))
      .filter(r => !removed.has(r.product_id) || remap.has(r.product_id));
  }

  // La base elimina las reseñas por cascada al borrar el producto; aquí se limpia la memoria.
  removeByProductId(productId) {
    this.store.reviews = this.store.reviews.filter(r => r.product_id !== productId);
  }
}

module.exports = ReviewRepository;
