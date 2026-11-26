import { Router } from 'express';
import type reviewController = require('../controllers/reviewController');
import type { createAuthMiddleware } from '../middleware/authMiddleware';

function reviewRoutes(
  controller: ReturnType<typeof reviewController>,
  { authenticateToken }: Pick<ReturnType<typeof createAuthMiddleware>, 'authenticateToken'>
): Router {
  const router = Router();
  router.get('/product/:productId', controller.listByProduct);
  router.post('/', authenticateToken, controller.create);
  return router;
}

export = reviewRoutes;
