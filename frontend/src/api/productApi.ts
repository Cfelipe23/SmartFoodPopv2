import { request } from './httpClient';
import { isCatalog, isComparison, isOffers, isProductDetail } from './responseGuards';
import type { ProductIdInput, ProductQuery } from '../types/api';

export const productApi = {
  getProducts: (params: ProductQuery = {}) => {
    const query = new URLSearchParams(params).toString();
    return request(`/products${query ? '?' + query : ''}`, isCatalog);
  },
  getProductDetail: (id: ProductIdInput['product_id']) => request(`/products/${id}`, isProductDetail),
  getOffers: () => request('/products/offers', isOffers),
  compareProducts: (params: ProductQuery = {}) => {
    const query = new URLSearchParams(params).toString();
    return request(`/products/compare${query ? '?' + query : ''}`, isComparison);
  }
};
