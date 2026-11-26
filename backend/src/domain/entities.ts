export interface ProductPrice {
  store_id: number | null;
  price: number;
  previous_price: number | null;
  is_offer: boolean;
  offer_description: string;
  source_url?: string;
}

export interface Product {
  id: number;
  name: string;
  description: string | null;
  category_id: number | null;
  unit: string | null;
  image_url: string | null;
  prices: ProductPrice[];
}

export interface Store {
  id: number;
  name: string;
  code: string;
  logo: string | null;
  city: string | null;
  address: string | null;
}

export interface Category {
  id: number;
  name: string;
  slug: string;
  icon: string | null;
}

export type UserRole = 'consumer' | 'admin';

export interface User {
  id: number;
  name: string;
  email: string;
  role: UserRole | null;
  password_hash: string;
}

export interface Review {
  id: number;
  user_id: number | null;
  user_name: string | null;
  product_id: number | null;
  rating: number | null;
  comment: string | null;
  created_at: string | null;
}

export interface Favorite {
  id: number;
  user_id: number | null;
  product_id: number | null;
}

export type BaseUnit = 'g' | 'ml';

export interface ProductSize {
  amount: number | null;
  unit: BaseUnit | null;
  count: number;
  sizeText: string;
  countText: string;
}

export interface ProductAnalysis {
  normalized: string;
  size: ProductSize;
  tokens: string[];
  signature: string;
  sizeLabel: string;
}

export interface UnitPrice {
  value: number;
  per: 'kg' | 'L';
}

export interface ProductEquivalence {
  product: Product;
  prices: ProductPrice[];
  score: number;
  closeness: number;
}

export interface CatalogRefreshResult {
  products: Product[];
  changedProducts: Product[];
  removedIds: number[];
  remap: Map<number, number>;
  skippedStores: (number | null)[];
  stats: {
    total: number;
    updated: number;
    created: number;
    removed: number;
    unchanged: number;
  };
}
