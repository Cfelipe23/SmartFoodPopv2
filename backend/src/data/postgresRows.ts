import type { Category, Favorite, Product, ProductPrice, Review, Store, User } from '../domain/entities';

// Proyecciones de las consultas de carga en PostgresPersistence, previas al mapeo.
export type CategoryRow = Category;
export type FavoriteRow = Favorite;
export type StoreRow = Store;
export type UserRow = User;
export type ProductRow = Omit<Product, 'prices'>;

export interface ProductPriceRow extends Pick<ProductPrice, 'store_id'> {
  product_id: number | null;
  price: string | number;
  previous_price: string | number | null;
  is_offer: boolean | null;
  offer_description: string | null;
  source_url: string | null;
}

export interface ReviewRow extends Omit<Review, 'created_at'> {
  created_at: Date | string | null;
}
