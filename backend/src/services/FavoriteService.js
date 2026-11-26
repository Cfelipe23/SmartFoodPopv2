const { httpError } = require('../domain/httpError');

// RF10: productos guardados por usuario.
class FavoriteService {
  constructor({ favoriteRepository, productRepository }) {
    this.favoriteRepository = favoriteRepository;
    this.productRepository = productRepository;
  }

  listProductsForUser(userId) {
    const favProductIds = new Set(this.favoriteRepository.findByUserId(userId).map(f => f.product_id));
    return this.productRepository.findAll().filter(p => favProductIds.has(p.id));
  }

  toggle(userId, productId) {
    const numericProductId = Number.parseInt(productId, 10);
    if (!numericProductId || !this.productRepository.findById(numericProductId)) {
      throw httpError(404, 'Producto no encontrado');
    }
    return this.favoriteRepository.toggle(userId, numericProductId);
  }
}

module.exports = FavoriteService;
