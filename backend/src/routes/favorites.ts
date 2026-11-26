import { Router } from 'express';
import type favoriteController = require('../controllers/favoriteController');
import type { createAuthMiddleware } from '../middleware/authMiddleware';

function favoriteRoutes(
  controller: ReturnType<typeof favoriteController>,
  { authenticateToken }: Pick<ReturnType<typeof createAuthMiddleware>, 'authenticateToken'>
): Router {
  const router = Router();
  router.get('/', authenticateToken, controller.list);
  router.post('/toggle', authenticateToken, controller.toggle);
  return router;
}

export = favoriteRoutes;
