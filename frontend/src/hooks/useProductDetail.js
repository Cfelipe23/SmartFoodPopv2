import { useCallback, useEffect, useState } from 'react';
import { productApi } from '../api/productApi';

// RF05: detalle del producto (precios por tienda, reseñas y productos similares).
export function useProductDetail(productId) {
  const [state, setState] = useState({ productId: null, detail: null, error: '' });
  const [version, setVersion] = useState(0);

  useEffect(() => {
    if (!productId) return undefined;
    let cancelled = false;
    productApi.getProductDetail(productId)
      .then(detail => { if (!cancelled) setState({ productId, detail, error: '' }); })
      .catch(err => { if (!cancelled) setState({ productId, detail: null, error: err.message }); });
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
