import { Router } from 'express';
import type adminController = require('../controllers/adminController');
import type { createAuthMiddleware } from '../middleware/authMiddleware';

function adminRoutes(
  controller: ReturnType<typeof adminController>,
  { authenticateToken, requireAdmin }: ReturnType<typeof createAuthMiddleware>
): Router {
  const router = Router();
  router.post('/products', authenticateToken, requireAdmin, controller.create);
  router.put('/products/:id', authenticateToken, requireAdmin, controller.update);
  router.delete('/products/:id', authenticateToken, requireAdmin, controller.remove);
  return router;
}

export = adminRoutes;
