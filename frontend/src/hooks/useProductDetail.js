import { useEffect, useState } from 'react';
import { productApi } from '../api/productApi';
export function useProductDetail(productId) {
  const [product, setProduct] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  useEffect(() => {
    if (!productId) { setProduct(null); setReviews([]); setError(null); return undefined; }
    let cancelled = false;
    setLoading(true); setError(null);
    productApi.getProductDetail(productId)
      .then(result => { if (!cancelled) { setProduct(result.product || null); setReviews(result.reviews || []); } })
      .catch(err => { if (!cancelled) setError(err); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [productId]);
  return { product, reviews, loading, error };
}
