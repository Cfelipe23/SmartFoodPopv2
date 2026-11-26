import { request } from './httpClient';
import { isFavorites, isFavoriteToggled } from './responseGuards';
import type { ProductIdInput } from '../types/api';

export const favoriteApi = {
  getFavorites: () => request('/favorites', isFavorites),
  toggleFavorite: (productId: ProductIdInput['product_id']) => request('/favorites/toggle', isFavoriteToggled, {
    method: 'POST', body: JSON.stringify({ product_id: productId })
  })
};
