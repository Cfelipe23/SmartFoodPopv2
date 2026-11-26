import { Router } from 'express';
import type productController = require('../controllers/productController');

function productRoutes(controller: ReturnType<typeof productController>): Router {
  const router = Router();
  router.get('/', controller.list);
  router.get('/offers', controller.offers);
  router.get('/compare', controller.compare);
  router.get('/:id', controller.detail);
  return router;
}

export = productRoutes;
