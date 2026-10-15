module.exports = ({ productService, productDetailService, productComparisonService }) => ({
  list(req, res) {
    try { res.json(productService.list(req.query)); }
    catch (error) { res.status(error.status || 500).json({ error: error.status ? error.message : 'Error al consultar productos' }); }
  },
  offers(req, res) {
    try { res.json(productService.listOffers()); }
    catch { res.status(500).json({ error: 'Error al obtener ofertas' }); }
  },
  detail(req, res) {
    try {
      const detail = productDetailService.getDetail(Number(req.params.id));
      if (!detail) return res.status(404).json({ error: 'Producto no encontrado' });
      return res.json(detail);
    } catch (error) { return res.status(error.status || 500).json({ error: error.status ? error.message : 'Error al obtener detalle del producto' }); }
  },
  compare(req, res) {
    try { return res.json(productComparisonService.compare(req.query)); }
    catch (error) { return res.status(error.status || 500).json({ error: error.status ? error.message : 'Error al comparar precios' }); }
  }
});
