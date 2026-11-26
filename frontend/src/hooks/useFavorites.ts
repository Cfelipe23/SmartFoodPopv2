import { useEffect, useState } from 'react';
import { favoriteApi } from '../api/favoriteApi';
import type { Product, PublicUser } from '../types/api';

interface FavoritesOptions {
  user?: Pick<PublicUser, 'id'> | null;
  onAuthRequired: () => void;
}

interface FavoritesState {
  userId: PublicUser['id'] | null;
  ids: Product['id'][];
}

// RF10: productos guardados por usuario, sincronizados con el servidor.
export function useFavorites({ user, onAuthRequired }: FavoritesOptions) {
  const userId = user?.id ?? null;
  const [state, setState] = useState<FavoritesState>({ userId: null, ids: [] });

  useEffect(() => {
    if (!userId) return undefined;
    let cancelled = false;
    favoriteApi.getFavorites()
      .then(res => { if (!cancelled) setState({ userId, ids: (res?.favorites ?? []).map(product => product.id) }); })
      .catch(() => { if (!cancelled) setState({ userId, ids: [] }); });
    return () => { cancelled = true; };
  }, [userId]);

  const favorites = userId && state.userId === userId ? state.ids : [];

  // Devuelve el mensaje de confirmación del servidor; lanza el error si falla.
  const toggleFavorite = async (productId: Product['id']): Promise<string | null> => {
    if (!userId) {
      onAuthRequired();
      return null;
    }
    const result = await favoriteApi.toggleFavorite(productId);
    if (result === null) throw new Error('La respuesta del servidor no confirma el cambio en favoritos.');
    setState(prev => {
      const current = prev.userId === userId ? prev.ids : [];
      const ids = result.isFavorite ? [...new Set([...current, productId])] : current.filter(id => id !== productId);
      return { userId, ids };
    });
    return result.message;
  };

  return { favorites, toggleFavorite };
}
