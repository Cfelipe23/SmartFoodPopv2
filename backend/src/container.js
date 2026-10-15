const { createInMemoryStore } = require('./data/inMemoryStore');
const { loadScrapedProducts } = require('./data/scrapedProductsLoader');
const { connectPostgres } = require('./data/postgres');
const env = require('./config/env');
const ProductRepository = require('./repositories/ProductRepository');
const CatalogRepository = require('./repositories/CatalogRepository');
const UserRepository = require('./repositories/UserRepository');
const ReviewRepository = require('./repositories/ReviewRepository');
const FavoriteRepository = require('./repositories/FavoriteRepository');
const ProductService = require('./services/ProductService');
const { ProductDetailService } = require('./services/ProductDetailService');
const ProductComparisonService = require('./services/ProductComparisonService');
const ProductAdminService = require('./services/ProductAdminService');
const ReviewService = require('./services/ReviewService');
const FavoriteService = require('./services/FavoriteService');
const { AuthService } = require('./services/AuthService');
const { BcryptPasswordHasher, PlainPasswordVerifier } = require('./services/PasswordHasher');
const TokenService = require('./services/TokenService');
function buildContainer() {
  const store = createInMemoryStore();
  const productRepository = new ProductRepository(store), catalogRepository = new CatalogRepository(store), userRepository = new UserRepository(store), reviewRepository = new ReviewRepository(store), favoriteRepository = new FavoriteRepository(store);
  const passwordHasher = new BcryptPasswordHasher();
  const tokenService = new TokenService({ secret: env.JWT_SECRET });
  loadScrapedProducts(productRepository, env.SCRAPED_PRODUCTS_PATH);
  connectPostgres();
  return {
    tokenService,
    productService: new ProductService({ productRepository, catalogRepository }),
    productDetailService: new ProductDetailService({ productRepository, catalogRepository, reviewRepository }),
    productComparisonService: new ProductComparisonService({ productRepository, catalogRepository }),
    productAdminService: new ProductAdminService({ productRepository, reviewRepository, favoriteRepository }),
    reviewService: new ReviewService({ reviewRepository }),
    favoriteService: new FavoriteService({ favoriteRepository, productRepository }),
    authService: new AuthService({ userRepository, passwordHasher, passwordVerifiers: [passwordHasher, new PlainPasswordVerifier()], tokenService })
  };
}
module.exports = { buildContainer };
