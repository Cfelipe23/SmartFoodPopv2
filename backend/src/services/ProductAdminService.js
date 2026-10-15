const DEFAULT_IMAGE = 'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=600&q=80';
class ProductAdminService {
  constructor({ productRepository, reviewRepository, favoriteRepository }) { Object.assign(this, { productRepository, reviewRepository, favoriteRepository }); }
  create(data) {
    if (!data?.name || !data?.category_id) { const error = new Error('El nombre y la categoría son obligatorios'); error.status = 400; throw error; }
    return this.productRepository.create({ name: data.name, description: data.description || '', category_id: Number.parseInt(data.category_id, 10), unit: data.unit || '1 Unidad', image_url: data.image_url || DEFAULT_IMAGE, prices: data.prices || [] });
  }
  update(id, data) { return this.productRepository.update(Number(id), data); }
  delete(id) {
    const numericId = Number(id); const deleted = this.productRepository.remove(numericId);
    if (deleted) { this.reviewRepository.removeByProductId(numericId); this.favoriteRepository.removeByProductId(numericId); }
    return deleted;
  }
}
module.exports = ProductAdminService;
