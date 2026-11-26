import { useCallback, useEffect, useState } from 'react';
import { productApi } from '../api/productApi';
import type { Product, ProductDetailResponse } from '../types/api';

interface DetailState {
  productId: Product['id'] | null;
  detail: ProductDetailResponse | null;
  error: string;
}

// RF05: detalle del producto (precios por tienda, reseñas y productos similares).
export function useProductDetail(productId?: Product['id'] | null) {
  const [state, setState] = useState<DetailState>({ productId: null, detail: null, error: '' });
  const [version, setVersion] = useState(0);

  useEffect(() => {
    if (!productId) return undefined;
    let cancelled = false;
    productApi.getProductDetail(productId)
      .then(detail => { if (!cancelled) setState({ productId, detail, error: '' }); })
      .catch((err: unknown) => {
        if (!cancelled) {
          const error = err instanceof Error ? err.message : 'No se pudo cargar el detalle del producto.';
          setState({ productId, detail: null, error });
        }
      });
    return () => { cancelled = true; };
  }, [productId, version]);

  const reload = useCallback(() => setVersion(current => current + 1), []);

  const isCurrent = Boolean(productId) && state.productId === productId;
  return {
    detail: isCurrent ? state.detail : null,
    error: isCurrent ? state.error : '',
    loading: Boolean(productId) && !isCurrent,
    reload
  };
}
