const express = require('express');
const cors = require('cors');
const authRoutes = require('./routes/auth');
const productRoutes = require('./routes/products');
const reviewRoutes = require('./routes/reviews');
const favoriteRoutes = require('./routes/favorites');
const adminRoutes = require('./routes/admin');
const authController = require('./controllers/authController');
const productController = require('./controllers/productController');
const reviewController = require('./controllers/reviewController');
const favoriteController = require('./controllers/favoriteController');
const adminController = require('./controllers/adminController');
const { createAuthMiddleware } = require('./middleware/authMiddleware');
function createApp(services) {
  const app = express(); app.use(cors()); app.use(express.json());
  const authMiddleware = createAuthMiddleware(services.tokenService);
  app.get('/api', (req, res) => res.json({ app: 'SmartFoodPop API', city: 'Popayán, Colombia', version: '1.0.0', status: 'Online', endpoints: ['/api/auth/register', '/api/auth/login', '/api/products', '/api/products/offers', '/api/products/compare', '/api/reviews', '/api/favorites', '/api/admin/products'] }));
  app.use('/api/auth', authRoutes(authController(services.authService), authMiddleware));
  app.use('/api/products', productRoutes(productController(services)));
  app.use('/api/reviews', reviewRoutes(reviewController(services.reviewService), authMiddleware));
  app.use('/api/favorites', favoriteRoutes(favoriteController(services.favoriteService), authMiddleware));
  app.use('/api/admin', adminRoutes(adminController(services.productAdminService), authMiddleware));
  app.use((err, req, res, next) => { console.error('Unhandled Server Error:', err); res.status(500).json({ error: 'Ocurrió un error inesperado en el servidor' }); });
  return app;
}
module.exports = { createApp };
