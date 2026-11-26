import type { AdminPriceInput, Category, Product, ProductPrice, Store, UnitPrice } from './api';

export type DisplayPrice = Pick<ProductPrice, 'store_id' | 'price'>
  & Partial<Pick<ProductPrice, 'previous_price' | 'is_offer' | 'source_url'>>
  & { unit_price?: UnitPrice | null };

export interface ComparisonSource {
  prices?: readonly DisplayPrice[] | null;
  unit?: string | null;
  equivalent?: { name: string; unit?: string | null; prices?: readonly DisplayPrice[] | null } | null;
}

export interface ComparisonRow {
  key: string;
  store_id: DisplayPrice['store_id'];
  name: string | null;
  unit: string | null | undefined;
  price: number;
  previous_price: DisplayPrice['previous_price'];
  is_offer: DisplayPrice['is_offer'];
  unit_price: UnitPrice | null;
  source_url: string;
  isEquivalent: boolean;
}

export type ProductTab = 'catalog' | 'offers' | 'favorites';

export interface ProductFilters<T extends FilterableProduct> {
  products: readonly T[];
  categories: readonly Pick<Category, 'id' | 'slug'>[];
  stores: readonly Pick<Store, 'id' | 'code'>[];
  favorites: readonly Product['id'][];
  searchTerm: string;
  selectedCategory: string | number;
  selectedStore: string | number;
  activeTab: ProductTab;
  onlyComparable?: boolean;
}

export type FilterableProduct = Pick<Product, 'id' | 'name'>
  & Partial<Pick<Product, 'description' | 'category_id'>>
  & { prices?: ComparisonSource['prices']; equivalent?: unknown };

export interface ProductForm {
  name: string;
  description: string;
  category_id: string | number;
  unit: string;
  image_url: string;
  prices: Partial<Record<Store['id'], Pick<AdminPriceInput, 'price' | 'previous_price' | 'is_offer'>>>;
}
