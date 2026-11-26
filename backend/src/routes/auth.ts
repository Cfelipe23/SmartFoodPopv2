import { Router } from 'express';
import type authController = require('../controllers/authController');
import type { createAuthMiddleware } from '../middleware/authMiddleware';

function authRoutes(
  controller: ReturnType<typeof authController>,
  { authenticateToken }: Pick<ReturnType<typeof createAuthMiddleware>, 'authenticateToken'>
): Router {
  const router = Router();
  router.post('/register', controller.register);
  router.post('/login', controller.login);
  router.get('/me', authenticateToken, controller.me);
  return router;
}

export = authRoutes;
