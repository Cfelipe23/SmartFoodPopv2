import type { Response } from 'express';
import type { ErrorResponse, FavoritesResponse, FavoriteToggledResponse, ProductIdInput } from '../contracts/api';
import { authenticatedIdentity } from '../middleware/authMiddleware';
import type FavoriteService = require('../services/FavoriteService');
import { readBody, respondWithServiceError } from './httpBoundary';
import type { HttpRequest } from './httpBoundary';

const favoriteController = (favoriteService: Pick<FavoriteService, 'listProductsForUser' | 'toggle'>) => ({
  list(req: HttpRequest, res: Response<FavoritesResponse | ErrorResponse>) {
    try {
      res.json({ favorites: favoriteService.listProductsForUser(authenticatedIdentity(req).id) });
    } catch (error) {
      respondWithServiceError(res, error, 'Error al obtener favoritos');
    }
  },

  toggle(req: HttpRequest, res: Response<FavoriteToggledResponse | ErrorResponse>) {
    try {
      const { product_id } = readBody<ProductIdInput>(req.body) ?? {};
      if (!product_id) return res.status(400).json({ error: 'ID de producto no proporcionado' });
      const result = favoriteService.toggle(authenticatedIdentity(req).id, product_id);
      res.json({
        message: result.isFavorite ? 'Producto guardado en favoritos' : 'Producto removido de favoritos',
        isFavorite: result.isFavorite
      });
    } catch (error) {
      respondWithServiceError(res, error, 'Error al actualizar favoritos');
    }
  }
});

export = favoriteController;
