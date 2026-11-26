import type { Category, Product, ProductPrice, Review, Store, UnitPrice, User } from '../domain/entities';
import type { ProductFilterQuery } from '../domain/productFilters';

export interface ErrorResponse {
  error: string;
}

export interface MessageResponse {
  message: string;
}

export interface LoginInput {
  email: string;
  password: string;
}

export interface RegisterInput extends LoginInput {
  name: string;
}

export type PublicUser = Omit<User, 'password_hash'>;

export interface SessionResponse extends MessageResponse {
  token: string;
  user: PublicUser;
}

export interface CurrentUserResponse {
  user: PublicUser & { iat: number; exp: number };
}

export type ProductQuery = Partial<Record<keyof ProductFilterQuery, string>>;

export interface PriceWithUnit extends ProductPrice {
  unit_price: UnitPrice | null;
}

export interface PriceWithStore extends ProductPrice {
  store_name: string;
  store_logo: string;
  store_code: string;
}

export type DetailPrice = PriceWithStore & PriceWithUnit;

type ProductSummary = Pick<Product, 'id' | 'name' | 'unit' | 'image_url'>;

export interface EquivalentProduct extends ProductSummary {
  prices: PriceWithUnit[];
  score: number;
}

export interface CatalogProduct extends Product {
  prices: PriceWithUnit[];
  equivalent: EquivalentProduct | null;
}

export interface CatalogResponse extends MessageResponse {
  total: number;
  products: CatalogProduct[];
  stores: Store[];
  categories: Category[];
}

export interface OffersResponse {
  total: number;
  offers: CatalogProduct[];
}

export interface ComparisonProduct extends Product {
  prices: PriceWithStore[];
  lowest_price: number | null;
  highest_price: number | null;
  potential_savings: number;
}

export interface ComparisonResponse extends MessageResponse {
  total: number;
  products: ComparisonProduct[];
}

export interface DetailProduct extends Product {
  category_name: string;
  prices: DetailPrice[];
}

export interface SimilarProduct extends ProductSummary {
  prices: DetailPrice[];
}

export interface ReviewsResponse {
  reviews: Review[];
}

export interface ProductDetailResponse extends ReviewsResponse {
  product: DetailProduct;
  review_summary: { count: number; average: number };
  similar: SimilarProduct[];
}

export interface ProductIdInput {
  product_id: number | string;
}

export interface CreateReviewInput extends ProductIdInput {
  rating: number | string;
  comment: string;
}

export interface ReviewCreatedResponse extends MessageResponse {
  review: Review;
}

export interface FavoritesResponse {
  favorites: Product[];
}

export interface FavoriteToggledResponse extends MessageResponse {
  isFavorite: boolean;
}

export interface AdminPriceInput {
  store_id: number | string;
  price: number | string;
  previous_price?: number | string | null;
  is_offer?: boolean;
  offer_description?: string;
  source_url?: string;
}

export interface CreateProductInput {
  name: string;
  category_id: number | string;
  description?: string;
  unit?: string;
  image_url?: string;
  prices: AdminPriceInput[];
}

export type UpdateProductInput = Partial<CreateProductInput>;

export interface ProductSavedResponse extends MessageResponse {
  product: Product;
}

export interface HealthResponse {
  status: 'ok';
  storage: 'memory' | 'postgres';
}

export interface ApiInfoResponse {
  app: string;
  city: string;
  version: string;
  status: 'Online';
  endpoints: string[];
}
