import { useCallback, useEffect, useState } from 'react';
import { productApi } from '../api/productApi';
import { adminApi } from '../api/adminApi';
import type { CatalogProduct, CatalogResponse, CreateProductInput, Product, ProductIdInput, UpdateProductInput } from '../types/api';

type CatalogState = Pick<CatalogResponse, 'stores' | 'categories'> & {
  products: (CatalogProduct | Product)[];
};

const EMPTY_CATALOG: CatalogState = { products: [], stores: [], categories: [] };

function confirmed<T>(response: T | null): T {
  if (response === null) throw new Error('La respuesta del servidor no confirma el cambio del producto.');
  return response;
}

// Catálogo (RF03) y acciones del administrador (RF11). Siempre refleja lo que confirma el servidor.
export function useProducts() {
  const [catalog, setCatalog] = useState<CatalogState>(EMPTY_CATALOG);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    let cancelled = false;
    productApi.getProducts()
      .then(res => {
        if (cancelled) return;
        if (res === null) throw new Error('La respuesta del servidor no contiene el catálogo.');
        setCatalog({ products: res.products || [], stores: res.stores || [], categories: res.categories || [] });
        setError('');
      })
      .catch((err: unknown) => {
        if (!cancelled) setError(err instanceof Error ? err.message : 'No se pudo cargar el catálogo.');
      })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [reloadKey]);

  const reload = useCallback(() => {
    setLoading(true);
    setError('');
    setReloadKey(key => key + 1);
  }, []);

  const addProduct = async (productData: CreateProductInput): Promise<string> => {
    const res = confirmed(await adminApi.addProduct(productData));
    setCatalog(prev => ({ ...prev, products: [res.product, ...prev.products] }));
    return res.message;
  };

  const updateProduct = async (id: ProductIdInput['product_id'], productData: UpdateProductInput): Promise<string> => {
    const res = confirmed(await adminApi.updateProduct(id, productData));
    setCatalog(prev => ({ ...prev, products: prev.products.map(p => (p.id === id ? res.product : p)) }));
    return res.message;
  };

  const deleteProduct = async (id: ProductIdInput['product_id']): Promise<string> => {
    const res = confirmed(await adminApi.deleteProduct(id));
    setCatalog(prev => ({ ...prev, products: prev.products.filter(p => p.id !== id) }));
    return res.message;
  };

  return { ...catalog, loading, error, reload, addProduct, updateProduct, deleteProduct };
}
