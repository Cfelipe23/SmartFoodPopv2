import type { Response } from 'express';
import type { CreateReviewInput, ErrorResponse, ReviewCreatedResponse, ReviewsResponse } from '../contracts/api';
import { authenticatedIdentity } from '../middleware/authMiddleware';
import type ReviewService = require('../services/ReviewService');
import { readBody, respondWithServiceError } from './httpBoundary';
import type { HttpRequest } from './httpBoundary';

const reviewController = (reviewService: Pick<ReviewService, 'listByProduct' | 'add'>) => ({
  listByProduct(req: HttpRequest<{ productId: string }>, res: Response<ReviewsResponse | ErrorResponse>) {
    try {
      const productId = parseInt(req.params.productId, 10);
      res.json({ reviews: reviewService.listByProduct(productId) });
    } catch (error) {
      respondWithServiceError(res, error, 'Error al consultar reseñas');
    }
  },

  create(req: HttpRequest, res: Response<ReviewCreatedResponse | ErrorResponse>) {
    try {
      const { product_id, rating, comment } = readBody<CreateReviewInput>(req.body) ?? {};
      const { id, name } = authenticatedIdentity(req);
      const review = reviewService.add({ user_id: id, user_name: name, product_id, rating, comment });
      res.status(201).json({ message: 'Reseña publicada con éxito', review });
    } catch (error) {
      respondWithServiceError(res, error, 'Error al publicar reseña');
    }
  }
});

export = reviewController;
