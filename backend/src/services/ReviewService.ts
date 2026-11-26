import type { CreateReviewInput } from '../contracts/api';
import type { Review } from '../domain/entities';
import { httpError } from '../domain/httpError';
import type ProductRepository = require('../repositories/ProductRepository');
import type ReviewRepository = require('../repositories/ReviewRepository');

const MAX_COMMENT_LENGTH = 1000;

type ReviewDraft = Pick<Review, 'user_id' | 'user_name'> & Partial<Record<keyof CreateReviewInput, unknown>>;

interface ReviewOptions {
  reviewRepository: Pick<ReviewRepository, 'findByProductId' | 'add'>;
  productRepository?: Pick<ProductRepository, 'findById'>;
}

// RF06: consulta pública y publicación autenticada de reseñas.
class ReviewService {
  readonly reviewRepository: ReviewOptions['reviewRepository'];
  readonly productRepository: ReviewOptions['productRepository'];

  constructor({ reviewRepository, productRepository }: ReviewOptions) {
    this.reviewRepository = reviewRepository;
    this.productRepository = productRepository;
  }

  listByProduct(productId: number): Review[] {
    return this.reviewRepository.findByProductId(productId);
  }

  add(input?: ReviewDraft): Review {
    if (input === undefined) throw httpError(400, 'La calificación y el comentario son requeridos');
    const { user_id, user_name, product_id, rating, comment } = input;
    const productId = Number.parseInt(`${product_id}`, 10);
    const numericRating = Number(rating);
    const text = typeof comment === 'string' ? comment.trim() : '';

    if (!productId || !rating || !text) throw httpError(400, 'La calificación y el comentario son requeridos');
    if (!Number.isInteger(numericRating) || numericRating < 1 || numericRating > 5) {
      throw httpError(400, 'La calificación debe estar entre 1 y 5 estrellas');
    }
    if (text.length > MAX_COMMENT_LENGTH) throw httpError(400, `El comentario no puede superar ${MAX_COMMENT_LENGTH} caracteres`);
    if (this.productRepository && !this.productRepository.findById(productId)) throw httpError(404, 'Producto no encontrado');

    return this.reviewRepository.add({ user_id, user_name, product_id: productId, rating: numericRating, comment: text });
  }
}

export = ReviewService;
