import type { DetailPrice, ProductDetailResponse, SimilarProduct } from '../contracts/api';
import type { PricePresenter } from './pricePresenter';
import type { Product, Review } from '../domain/entities';
import { jaccard } from '../domain/productNormalizer';
import { analysisOf, computeUnitPrice } from '../domain/productEquivalence';
import type CatalogRepository = require('../repositories/CatalogRepository');
import type ProductRepository = require('../repositories/ProductRepository');
import type ReviewRepository = require('../repositories/ReviewRepository');

interface DetailOptions {
  detailPrice: PricePresenter<DetailPrice>;
  productRepository: Pick<ProductRepository, 'findAll' | 'findById'>;
  catalogRepository: Pick<CatalogRepository, 'getStores' | 'getCategories'>;
  reviewRepository: Pick<ReviewRepository, 'findByProductId'>;
}

const SIMILARITY_THRESHOLD = 0.5;
const MAX_SIMILAR = 4;

export function summarizeReviews(reviews: readonly Pick<Review, 'rating'>[] = []): ProductDetailResponse['review_summary'] {
  if (!reviews.length) return { count: 0, average: 0 };
  return { count: reviews.length, average: Number((reviews.reduce((sum, review) => sum + Number(review.rating || 0), 0) / reviews.length).toFixed(2)) };
}

export class ProductDetailService {
  private readonly detailPrice: PricePresenter<DetailPrice>;
  readonly productRepository: DetailOptions['productRepository'];
  readonly catalogRepository: DetailOptions['catalogRepository'];
  readonly reviewRepository: DetailOptions['reviewRepository'];

  constructor({ productRepository, catalogRepository, reviewRepository, detailPrice }: DetailOptions) {
    this.detailPrice = detailPrice;
    this.productRepository = productRepository;
    this.catalogRepository = catalogRepository;
    this.reviewRepository = reviewRepository;
  }

  enrichPrices(product: Product): DetailPrice[] {
    return (product.prices || []).map(price => this.detailPrice(product, price))
      .sort((a, b) => Number(a.price) - Number(b.price));
  }

  // Productos parecidos (misma clase de producto y misma unidad de medida) con su precio por kg/L.
  findSimilar(product: Product): SimilarProduct[] {
    const base = analysisOf(product);
    if (!base.tokens.length) return [];
    return this.productRepository.findAll()
      .filter(other => other.id !== product.id && (other.prices || []).length)
      .map(other => ({ other, score: jaccard(base.tokens, analysisOf(other).tokens) }))
      .filter(({ other, score }) => score >= SIMILARITY_THRESHOLD && analysisOf(other).size.unit === base.size.unit)
      .sort((a, b) => b.score - a.score || a.other.name.localeCompare(b.other.name, 'es'))
      .slice(0, MAX_SIMILAR)
      .map(({ other }) => ({
        id: other.id,
        name: other.name,
        unit: other.unit,
        image_url: other.image_url,
        prices: this.enrichPrices(other)
      }));
  }

  getDetail(productId: number | string): ProductDetailResponse | null {
    const product = this.productRepository.findById(Number(productId));
    if (!product) return null;
    const category = this.catalogRepository.getCategories().find(item => Number(item.id) === Number(product.category_id));
    const reviews = this.reviewRepository.findByProductId(Number(productId));
    return {
      product: { ...product, category_name: category?.name || 'Otros', prices: this.enrichPrices(product) },
      reviews,
      review_summary: summarizeReviews(reviews),
      similar: this.findSimilar(product)
    };
  }
}

export { computeUnitPrice };
