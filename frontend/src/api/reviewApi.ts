import { request } from './httpClient';
import { isReviewCreated, isReviews } from './responseGuards';
import type { CreateReviewInput } from '../types/api';

export const reviewApi = {
  getReviews: (productId: CreateReviewInput['product_id']) => request(`/reviews/product/${productId}`, isReviews),
  addReview: (productId: CreateReviewInput['product_id'], rating: CreateReviewInput['rating'], comment: string) =>
    request('/reviews', isReviewCreated, { method: 'POST', body: JSON.stringify({ product_id: productId, rating, comment }) })
};
