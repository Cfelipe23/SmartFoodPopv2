import { request } from './httpClient';
import { isMessage, isProductSaved } from './responseGuards';
import type { CreateProductInput, ProductIdInput, UpdateProductInput } from '../types/api';

export const adminApi = {
  addProduct: (productData: CreateProductInput) =>
    request('/admin/products', isProductSaved, { method: 'POST', body: JSON.stringify(productData) }),
  updateProduct: (id: ProductIdInput['product_id'], productData: UpdateProductInput) =>
    request(`/admin/products/${id}`, isProductSaved, { method: 'PUT', body: JSON.stringify(productData) }),
  deleteProduct: (id: ProductIdInput['product_id']) => request(`/admin/products/${id}`, isMessage, { method: 'DELETE' })
};
