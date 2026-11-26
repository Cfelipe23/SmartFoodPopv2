import type { InMemoryStore } from '../data/inMemoryStore';
import { NoopPersistence } from '../data/persistence';
import type { Persistence } from '../data/persistence';
import type { Review } from '../domain/entities';

type ReviewData = Pick<Review, 'user_id' | 'user_name' | 'comment'> & {
  product_id: number | string;
  rating: number | string;
};

class ReviewRepository {
  constructor(readonly store: InMemoryStore, readonly persistence: Persistence = new NoopPersistence()) {}

  findByProductId(productId: number): Review[] {
    return this.store.reviews.filter(r => r.product_id === productId);
  }

  add(reviewData: ReviewData): Review {
    const reviews = this.store.reviews;
    const newReview: Review = {
      id: reviews.length ? Math.max(...reviews.map(r => r.id)) + 1 : 1,
      user_id: reviewData.user_id,
      user_name: reviewData.user_name || 'Usuario',
      product_id: parseInt(String(reviewData.product_id), 10),
      rating: parseInt(String(reviewData.rating), 10),
      comment: reviewData.comment,
      created_at: new Date().toISOString()
    };
    reviews.unshift(newReview);
    this.persistence.saveReview(newReview);
    return newReview;
  }

  // Tras actualizar el catálogo: las reseñas siguen al producto que absorbió la ficha
  // (`remap`) o se descartan si el producto dejó de existir.
  reassignProducts(remap: ReadonlyMap<number, number>, removedIds: readonly number[]): void {
    const removed = new Set(removedIds);
    this.store.reviews = this.store.reviews
      .map(review => {
        const destination = review.product_id === null ? undefined : remap.get(review.product_id);
        return destination === undefined ? review : { ...review, product_id: destination };
      })
      .filter(review => review.product_id === null || !removed.has(review.product_id) || remap.has(review.product_id));
  }

  // La base elimina las reseñas por cascada al borrar el producto; aquí se limpia la memoria.
  removeByProductId(productId: number): void {
    this.store.reviews = this.store.reviews.filter(r => r.product_id !== productId);
  }
}

export = ReviewRepository;
