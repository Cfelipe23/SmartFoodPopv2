import type { AdminPriceInput, CreateProductInput } from '../contracts/api';
import type { Product, ProductPrice } from '../domain/entities';
import { httpError } from '../domain/httpError';
import { describeOffer } from '../domain/catalogBuilder';
import type CatalogRepository = require('../repositories/CatalogRepository');
import type FavoriteRepository = require('../repositories/FavoriteRepository');
import type ProductRepository = require('../repositories/ProductRepository');
import type ReviewRepository = require('../repositories/ReviewRepository');

const MAX_NAME_LENGTH = 255;
const DEFAULT_UNIT = '1 Unidad';
const DEFAULT_IMAGE = 'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=600&q=80';
const MAX_DESCRIPTION_LENGTH = 2000;

type RawProduct = Partial<Record<keyof CreateProductInput, unknown>>;
type RawPrice = Partial<Record<keyof AdminPriceInput, unknown>>;

interface AdminOptions {
  productRepository: Pick<ProductRepository, 'create' | 'findById' | 'update' | 'remove'>;
  reviewRepository: Pick<ReviewRepository, 'removeByProductId'>;
  favoriteRepository: Pick<FavoriteRepository, 'removeByProductId'>;
  catalogRepository: Pick<CatalogRepository, 'getCategories' | 'getStores'>;
}

function isRawPrice(value: unknown): value is RawPrice {
  return (typeof value === 'object' && value !== null) || typeof value === 'function';
}

function readOptionalNumber(value: unknown, fallback: number): number {
  return value === undefined || value === null || value === '' ? fallback : Number(value);
}

// RF11 / HU11: la validación de campos obligatorios ocurre antes de guardar cambios.
class ProductAdminService {
  readonly productRepository: AdminOptions['productRepository'];
  readonly reviewRepository: AdminOptions['reviewRepository'];
  readonly favoriteRepository: AdminOptions['favoriteRepository'];
  readonly catalogRepository: AdminOptions['catalogRepository'];

  constructor({ productRepository, reviewRepository, favoriteRepository, catalogRepository }: AdminOptions) {
    this.productRepository = productRepository;
    this.reviewRepository = reviewRepository;
    this.favoriteRepository = favoriteRepository;
    this.catalogRepository = catalogRepository;
  }

  validateName(name: unknown): string {
    const value = typeof name === 'string' ? name.trim() : '';
    if (!value) throw httpError(400, 'El nombre del producto es obligatorio');
    if (value.length > MAX_NAME_LENGTH) throw httpError(400, `El nombre no puede superar ${MAX_NAME_LENGTH} caracteres`);
    return value;
  }

  validateCategory(categoryId: unknown): number {
    const id = Number.parseInt(`${categoryId}`, 10);
    if (!this.catalogRepository.getCategories().some(category => category.id === id)) {
      throw httpError(400, 'La categoría seleccionada no es válida');
    }
    return id;
  }

  validateImage(imageUrl: unknown): string {
    if (!imageUrl) return DEFAULT_IMAGE;
    if (!/^https?:\/\/\S+$/i.test(String(imageUrl))) throw httpError(400, 'La URL de la imagen no es válida');
    return String(imageUrl);
  }

  validatePrices(prices: unknown): ProductPrice[] {
    if (!Array.isArray(prices) || prices.length === 0) {
      throw httpError(400, 'Debe registrar el precio en al menos una tienda');
    }
    const stores = this.catalogRepository.getStores();
    const seenStores = new Set<number>();
    const entries: readonly unknown[] = prices;
    return entries.map(raw => {
      if (!isRawPrice(raw)) throw httpError(400, 'La tienda indicada no es válida');
      const storeId = Number(raw.store_id);
      if (!stores.some(store => store.id === storeId)) throw httpError(400, 'La tienda indicada no es válida');
      if (seenStores.has(storeId)) throw httpError(400, 'Hay más de un precio para la misma tienda');
      seenStores.add(storeId);

      const price = Number(raw.price);
      if (!Number.isFinite(price) || price <= 0) throw httpError(400, 'El precio debe ser un número mayor que cero');
      const previousPrice = readOptionalNumber(raw.previous_price, price);
      if (!Number.isFinite(previousPrice) || previousPrice <= 0) throw httpError(400, 'El precio anterior no es válido');

      const isOffer = Boolean(raw.is_offer);
      if (isOffer && previousPrice <= price) {
        throw httpError(400, 'Para marcar una oferta, el precio anterior debe ser mayor que el precio actual');
      }
      const offerText = String(raw.offer_description || '').trim();
      return {
        store_id: storeId,
        price,
        previous_price: previousPrice,
        is_offer: isOffer,
        offer_description: isOffer ? describeOffer(price, previousPrice, offerText) : '',
        source_url: raw.source_url ? String(raw.source_url) : ''
      };
    });
  }

  validateDescription(description: unknown): string {
    const value = typeof description === 'string' ? description.trim() : '';
    if (value.length > MAX_DESCRIPTION_LENGTH) throw httpError(400, `La descripción no puede superar ${MAX_DESCRIPTION_LENGTH} caracteres`);
    return value;
  }

  create(data: RawProduct = {}): Product {
    return this.productRepository.create({
      name: this.validateName(data.name),
      description: this.validateDescription(data.description),
      category_id: this.validateCategory(data.category_id),
      unit: String(data.unit || '').trim() || DEFAULT_UNIT,
      image_url: this.validateImage(data.image_url),
      prices: this.validatePrices(data.prices)
    });
  }

  update(id: unknown, data: RawProduct = {}): Product | null {
    const numericId = Number(id);
    const existing = this.productRepository.findById(numericId);
    if (!existing) return null;
    const changes: Partial<Omit<Product, 'id'>> = {};
    if (data.name !== undefined) changes.name = this.validateName(data.name);
    if (data.description !== undefined) changes.description = this.validateDescription(data.description);
    if (data.category_id !== undefined) changes.category_id = this.validateCategory(data.category_id);
    if (data.unit !== undefined) changes.unit = String(data.unit).trim() || DEFAULT_UNIT;
    if (data.image_url !== undefined) changes.image_url = this.validateImage(data.image_url);
    changes.prices = data.prices === undefined
      ? existing.prices.map(price => ({ ...price }))
      : this.validatePrices(data.prices);
    return this.productRepository.update(numericId, changes);
  }

  delete(id: unknown): boolean {
    const numericId = Number(id);
    const deleted = this.productRepository.remove(numericId);
    if (deleted) {
      this.reviewRepository.removeByProductId(numericId);
      this.favoriteRepository.removeByProductId(numericId);
    }
    return deleted;
  }
}

export = ProductAdminService;
