import { useCallback, useEffect, useState } from 'react';
import { productApi } from '../api/productApi';
import { adminApi } from '../api/adminApi';

const EMPTY_CATALOG = { products: [], stores: [], categories: [] };

// Catálogo (RF03) y acciones del administrador (RF11). Siempre refleja lo que confirma el servidor.
export function useProducts() {
  const [catalog, setCatalog] = useState(EMPTY_CATALOG);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    let cancelled = false;
    productApi.getProducts()
      .then(res => {
        if (cancelled) return;
        setCatalog({ products: res.products || [], stores: res.stores || [], categories: res.categories || [] });
        setError('');
      })
      .catch(err => { if (!cancelled) setError(err.message); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [reloadKey]);

  const reload = useCallback(() => {
    setLoading(true);
    setError('');
    setReloadKey(key => key + 1);
  }, []);

  const addProduct = async (productData) => {
    const res = await adminApi.addProduct(productData);
    setCatalog(prev => ({ ...prev, products: [res.product, ...prev.products] }));
    return res.message;
  };

  const updateProduct = async (id, productData) => {
    const res = await adminApi.updateProduct(id, productData);
    setCatalog(prev => ({ ...prev, products: prev.products.map(p => (p.id === id ? res.product : p)) }));
    return res.message;
  };

  const deleteProduct = async (id) => {
    const res = await adminApi.deleteProduct(id);
    setCatalog(prev => ({ ...prev, products: prev.products.filter(p => p.id !== id) }));
    return res.message;
  };

  return { ...catalog, loading, error, reload, addProduct, updateProduct, deleteProduct };
}
