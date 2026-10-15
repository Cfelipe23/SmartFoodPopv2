function summarizeReviews(reviews = []) {
  if (!reviews.length) return { count: 0, average: 0 };
  return { count: reviews.length, average: Number((reviews.reduce((sum, review) => sum + Number(review.rating || 0), 0) / reviews.length).toFixed(2)) };
}
class ProductDetailService {
  constructor({ productRepository, catalogRepository, reviewRepository }) { Object.assign(this, { productRepository, catalogRepository, reviewRepository }); }
  getDetail(productId) {
    const product = this.productRepository.findById(Number(productId));
    if (!product) return null;
    const stores = this.catalogRepository.getStores();
    const prices = (product.prices || []).map(price => {
      const store = stores.find(item => Number(item.id) === Number(price.store_id));
      return { ...price, store_name: store?.name || 'Tienda', store_logo: store?.logo || '🏬', store_code: store?.code || 'store' };
    }).sort((a, b) => Number(a.price) - Number(b.price));
    const reviews = this.reviewRepository.findByProductId(Number(productId));
    return { product: { ...product, prices }, reviews, review_summary: summarizeReviews(reviews) };
  }
}
module.exports = { ProductDetailService, summarizeReviews };
