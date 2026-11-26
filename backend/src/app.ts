import express = require('express');
import cors = require('cors');
import type { Express, Response } from 'express';
import type { Container } from './container';
import type { ApiInfoResponse, ErrorResponse, HealthResponse } from './contracts/api';
import authRoutes = require('./routes/auth');
import productRoutes = require('./routes/products');
import reviewRoutes = require('./routes/reviews');
import favoriteRoutes = require('./routes/favorites');
import adminRoutes = require('./routes/admin');
import authController = require('./controllers/authController');
import productController = require('./controllers/productController');
import reviewController = require('./controllers/reviewController');
import favoriteController = require('./controllers/favoriteController');
import adminController = require('./controllers/adminController');
import { createAuthMiddleware } from './middleware/authMiddleware';
import { apiErrorHandler } from './middleware/errorMiddleware';

type AppServices = Pick<Container,
  'tokenService' | 'authService' | 'productService' | 'productDetailService' |
  'productComparisonService' | 'reviewService' | 'favoriteService' | 'productAdminService'
> & Partial<Pick<Container, 'storage'>>;

export function createApp(services: AppServices): Express {
  const app = express();
  app.use(cors());
  app.use(express.json());
  const authMiddleware = createAuthMiddleware(services.tokenService);

  // Estado del servicio: indica si los datos se guardan en PostgreSQL o solo en memoria.
  app.get('/api/health', (_req, res: Response<HealthResponse>) => res.json({ status: 'ok', storage: services.storage || 'memory' }));

  app.get('/api', (_req, res: Response<ApiInfoResponse>) => res.json({
    app: 'SmartFoodPop API',
    city: 'Popayán, Colombia',
    version: '1.0.0',
    status: 'Online',
    endpoints: ['/api/auth/register', '/api/auth/login', '/api/products', '/api/products/offers', '/api/products/compare', '/api/reviews', '/api/favorites', '/api/admin/products']
  }));
  app.use('/api/auth', authRoutes(authController(services.authService), authMiddleware));
  app.use('/api/products', productRoutes(productController(services)));
  app.use('/api/reviews', reviewRoutes(reviewController(services.reviewService), authMiddleware));
  app.use('/api/favorites', favoriteRoutes(favoriteController(services.favoriteService), authMiddleware));
  app.use('/api/admin', adminRoutes(adminController(services.productAdminService), authMiddleware));

  app.use('/api', (_req, res: Response<ErrorResponse>) => res.status(404).json({ error: 'Ruta no encontrada' }));

  app.use(apiErrorHandler);
  return app;
}
