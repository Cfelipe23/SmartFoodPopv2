// Solo tipos compartidos. Vite elimina estas exportaciones y nunca carga código del servidor.
export type {
  AdminPriceInput, CatalogProduct, CatalogResponse, ComparisonResponse, CreateProductInput,
  CreateReviewInput, CurrentUserResponse, DetailPrice, EquivalentProduct, ErrorResponse,
  FavoritesResponse, FavoriteToggledResponse, HealthResponse, LoginInput, MessageResponse,
  OffersResponse, PriceWithStore, PriceWithUnit, ProductDetailResponse, ProductIdInput,
  ProductQuery, ProductSavedResponse, PublicUser, RegisterInput, ReviewCreatedResponse,
  ReviewsResponse, SessionResponse, SimilarProduct, UpdateProductInput
} from '../../../backend/src/contracts/api';
export type { Category, Product, ProductPrice, Review, Store, UnitPrice, UserRole } from '../../../backend/src/domain/entities';
