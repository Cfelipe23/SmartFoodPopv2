function respondWithError(res, error, fallbackMessage) {
  if (error.status) return res.status(error.status).json({ error: error.message });
  console.error(fallbackMessage, error);
  return res.status(500).json({ error: fallbackMessage });
}

module.exports = (reviewService) => ({
  listByProduct(req, res) {
    try {
      const productId = parseInt(req.params.productId, 10);
      res.json({ reviews: reviewService.listByProduct(productId) });
    } catch (error) {
      respondWithError(res, error, 'Error al consultar reseñas');
    }
  },

  create(req, res) {
    try {
      const { product_id, rating, comment } = req.body || {};
      const review = reviewService.add({ user_id: req.user.id, user_name: req.user.name, product_id, rating, comment });
      res.status(201).json({ message: 'Reseña publicada con éxito', review });
    } catch (error) {
      respondWithError(res, error, 'Error al publicar reseña');
    }
  }
});
