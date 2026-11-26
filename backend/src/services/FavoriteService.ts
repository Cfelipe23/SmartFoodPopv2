import type { FavoriteToggledResponse } from '../contracts/api';
import type { Product } from '../domain/entities';
import { httpError } from '../domain/httpError';
import type FavoriteRepository = require('../repositories/FavoriteRepository');
import type ProductRepository = require('../repositories/ProductRepository');

interface FavoriteOptions {
  favoriteRepository: Pick<FavoriteRepository, 'findByUserId' | 'toggle'>;
  productRepository: Pick<ProductRepository, 'findAll' | 'findById'>;
}

// RF10: productos guardados por usuario.
class FavoriteService {
  readonly favoriteRepository: FavoriteOptions['favoriteRepository'];
  readonly productRepository: FavoriteOptions['productRepository'];

  constructor({ favoriteRepository, productRepository }: FavoriteOptions) {
    this.favoriteRepository = favoriteRepository;
    this.productRepository = productRepository;
  }

  listProductsForUser(userId: number): Product[] {
    const favProductIds = new Set(this.favoriteRepository.findByUserId(userId).map(f => f.product_id));
    return this.productRepository.findAll().filter(p => favProductIds.has(p.id));
  }

  toggle(userId: number, productId: unknown): Pick<FavoriteToggledResponse, 'isFavorite'> {
    const numericProductId = Number.parseInt(`${productId}`, 10);
    if (!numericProductId || !this.productRepository.findById(numericProductId)) {
      throw httpError(404, 'Producto no encontrado');
    }
    return this.favoriteRepository.toggle(userId, numericProductId);
  }
}

export = FavoriteService;
