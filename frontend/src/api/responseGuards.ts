import type {
  CatalogResponse, Category, ComparisonResponse, CurrentUserResponse, DetailPrice, EquivalentProduct,
  FavoritesResponse, FavoriteToggledResponse, HealthResponse, MessageResponse, OffersResponse,
  PriceWithStore, PriceWithUnit, Product, ProductDetailResponse, ProductPrice, ProductSavedResponse,
  PublicUser, Review, ReviewCreatedResponse, ReviewsResponse, SessionResponse, SimilarProduct, Store, UnitPrice
} from '../types/api';

type RecordValue = Record<string, unknown>;
type Guard<T> = (value: unknown) => value is T;

function isRecord(value: unknown): value is RecordValue {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function isArrayOf<T>(value: unknown, guard: Guard<T>): value is T[] {
  return Array.isArray(value) && value.every(guard);
}

function isStringOrNull(value: unknown): value is string | null {
  return typeof value === 'string' || value === null;
}

function isNumberOrNull(value: unknown): value is number | null {
  return typeof value === 'number' || value === null;
}

export function readErrorMessage(value: unknown): string | undefined {
  return isRecord(value) && typeof value.error === 'string' ? value.error : undefined;
}

export function isPublicUser(value: unknown): value is PublicUser {
  return isRecord(value) && typeof value.id === 'number' && typeof value.name === 'string'
    && typeof value.email === 'string' && (value.role === 'consumer' || value.role === 'admin' || value.role === null);
}

export function isSession(value: unknown): value is SessionResponse {
  return isRecord(value) && isMessage(value) && typeof value.token === 'string' && isPublicUser(value.user);
}

export function isCurrentUser(value: unknown): value is CurrentUserResponse {
  if (!isRecord(value) || !isRecord(value.user)) return false;
  const { iat, exp } = value.user;
  return isPublicUser(value.user) && typeof iat === 'number' && typeof exp === 'number';
}

function isUnitPrice(value: unknown): value is UnitPrice {
  return isRecord(value) && typeof value.value === 'number' && (value.per === 'kg' || value.per === 'L' || value.per === 'm');
}

function isPrice(value: unknown): value is ProductPrice {
  return isRecord(value) && isNumberOrNull(value.store_id) && typeof value.price === 'number'
    && isNumberOrNull(value.previous_price) && typeof value.is_offer === 'boolean'
    && typeof value.offer_description === 'string' && (value.source_url === undefined || typeof value.source_url === 'string');
}

function isPriceWithUnit(value: unknown): value is PriceWithUnit {
  const unit = isRecord(value) ? value.unit_price : undefined;
  return isPrice(value) && (unit === null || isUnitPrice(unit));
}

function isPriceWithStore(value: unknown): value is PriceWithStore {
  if (!isRecord(value)) return false;
  const { store_name, store_logo, store_code } = value;
  return isPrice(value) && typeof store_name === 'string' && typeof store_logo === 'string' && typeof store_code === 'string';
}

function isDetailPrice(value: unknown): value is DetailPrice {
  return isPriceWithUnit(value) && isPriceWithStore(value);
}

function hasProductSummary(value: RecordValue): boolean {
  return typeof value.id === 'number' && typeof value.name === 'string'
    && isStringOrNull(value.unit) && isStringOrNull(value.image_url);
}

function isProduct(value: unknown): value is Product {
  return isRecord(value) && hasProductSummary(value) && isStringOrNull(value.description)
    && isNumberOrNull(value.category_id) && isArrayOf(value.prices, isPrice);
}

function isEquivalent(value: unknown): value is EquivalentProduct {
  return isRecord(value) && hasProductSummary(value) && typeof value.score === 'number'
    && isArrayOf(value.prices, isPriceWithUnit);
}

function isCatalogProduct(value: unknown): value is CatalogResponse['products'][number] {
  if (!isRecord(value)) return false;
  const { equivalent } = value;
  return isProduct(value) && isArrayOf(value.prices, isPriceWithUnit)
    && (equivalent === null || isEquivalent(equivalent));
}

function isStore(value: unknown): value is Store {
  return isRecord(value) && typeof value.id === 'number' && typeof value.name === 'string' && typeof value.code === 'string'
    && isStringOrNull(value.logo) && isStringOrNull(value.city) && isStringOrNull(value.address);
}

function isCategory(value: unknown): value is Category {
  return isRecord(value) && typeof value.id === 'number' && typeof value.name === 'string'
    && typeof value.slug === 'string' && isStringOrNull(value.icon);
}

export function isCatalog(value: unknown): value is CatalogResponse {
  return isRecord(value) && typeof value.total === 'number' && isMessage(value)
    && isArrayOf(value.products, isCatalogProduct) && isArrayOf(value.stores, isStore) && isArrayOf(value.categories, isCategory);
}

export function isOffers(value: unknown): value is OffersResponse {
  return isRecord(value) && typeof value.total === 'number' && isArrayOf(value.offers, isCatalogProduct);
}

function isComparedProduct(value: unknown): value is ComparisonResponse['products'][number] {
  if (!isRecord(value)) return false;
  const { lowest_price, highest_price, potential_savings } = value;
  return isProduct(value) && isArrayOf(value.prices, isPriceWithStore) && isNumberOrNull(lowest_price)
    && isNumberOrNull(highest_price) && typeof potential_savings === 'number';
}

export function isComparison(value: unknown): value is ComparisonResponse {
  return isRecord(value) && typeof value.total === 'number' && isMessage(value) && isArrayOf(value.products, isComparedProduct);
}

function isReview(value: unknown): value is Review {
  return isRecord(value) && typeof value.id === 'number' && isNumberOrNull(value.user_id)
    && isStringOrNull(value.user_name) && isNumberOrNull(value.product_id) && isNumberOrNull(value.rating)
    && isStringOrNull(value.comment) && isStringOrNull(value.created_at);
}

function isSimilarProduct(value: unknown): value is SimilarProduct {
  return isRecord(value) && hasProductSummary(value) && isArrayOf(value.prices, isDetailPrice);
}

export function isProductDetail(value: unknown): value is ProductDetailResponse {
  if (!isRecord(value) || !isRecord(value.product) || !isRecord(value.review_summary)) return false;
  const { product, review_summary } = value;
  const { category_name } = product;
  return isProduct(product) && typeof category_name === 'string' && isArrayOf(product.prices, isDetailPrice)
    && isReviews(value) && typeof review_summary.count === 'number' && typeof review_summary.average === 'number'
    && isArrayOf(value.similar, isSimilarProduct);
}

export function isReviews(value: unknown): value is ReviewsResponse {
  return isRecord(value) && isArrayOf(value.reviews, isReview);
}

export function isReviewCreated(value: unknown): value is ReviewCreatedResponse {
  return isRecord(value) && isMessage(value) && isReview(value.review);
}

export function isFavorites(value: unknown): value is FavoritesResponse {
  return isRecord(value) && isArrayOf(value.favorites, isProduct);
}

export function isFavoriteToggled(value: unknown): value is FavoriteToggledResponse {
  return isRecord(value) && isMessage(value) && typeof value.isFavorite === 'boolean';
}

export function isProductSaved(value: unknown): value is ProductSavedResponse {
  return isRecord(value) && isMessage(value) && isProduct(value.product);
}

export function isMessage(value: unknown): value is MessageResponse {
  return isRecord(value) && typeof value.message === 'string';
}

export function isHealth(value: unknown): value is HealthResponse {
  return isRecord(value) && value.status === 'ok' && (value.storage === 'postgres' || value.storage === 'memory');
}
