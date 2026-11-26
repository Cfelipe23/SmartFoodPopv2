import { useEffect, useState } from 'react';
import { favoriteApi } from '../api/favoriteApi';
import { sessionStorageService } from '../storage/sessionStorage';
import type { Product, PublicUser } from '../types/api';

interface FavoritesOptions {
  user?: Pick<PublicUser, 'id'> | null;
  onAuthRequired: () => void;
}

interface FavoritesState {
  userId: PublicUser['id'] | null;
  revision: number;
  ids: Product['id'][];
}

// RF10: productos guardados por usuario, sincronizados con el servidor.
export function useFavorites({ user, onAuthRequired }: FavoritesOptions) {
  const userId = user?.id ?? null;
  const revision = sessionStorageService.getRevision();
  const [state, setState] = useState<FavoritesState>({ userId: null, revision, ids: [] });

  useEffect(() => {
    if (!userId) return undefined;
    let cancelled = false;
    const isCurrent = () => !cancelled && revision === sessionStorageService.getRevision();
    favoriteApi.getFavorites()
      .then(res => { if (isCurrent()) setState({ userId, revision, ids: (res?.favorites ?? []).map(product => product.id) }); })
      .catch(() => { if (isCurrent()) setState({ userId, revision, ids: [] }); });
    return () => { cancelled = true; };
  }, [userId, revision]);

  const favorites = userId && state.userId === userId && state.revision === revision ? state.ids : [];

  // Devuelve el mensaje de confirmación del servidor; lanza el error si falla.
  const toggleFavorite = async (productId: Product['id']): Promise<string | null> => {
    const isCurrent = () => revision === sessionStorageService.getRevision();
    if (!isCurrent()) return null;
    if (!userId) {
      onAuthRequired();
      return null;
    }
    try {
      const result = await favoriteApi.toggleFavorite(productId);
      if (!isCurrent()) return null;
      if (result === null) throw new Error('La respuesta del servidor no confirma el cambio en favoritos.');
      setState(prev => {
        const current = prev.userId === userId && prev.revision === revision ? prev.ids : [];
        const ids = result.isFavorite ? [...new Set([...current, productId])] : current.filter(id => id !== productId);
        return { userId, revision, ids };
      });
      return result.message;
    } catch (error) {
      if (isCurrent()) throw error;
      return null;
    }
  };

  return { favorites, toggleFavorite };
}
