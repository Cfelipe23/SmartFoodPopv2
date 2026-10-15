module.exports = (productAdminService) => ({
  create(req, res) {
    try {
      const { name, description, category_id, unit, image_url, prices } = req.body;
      const product = productAdminService.create({ name, description, category_id, unit, image_url, prices: prices || [{ store_id: 1, price: 5000, previous_price: 5000, is_offer: false, offer_description: '' }] });
      return res.status(201).json({ message: 'Producto creado exitosamente por el administrador', product });
    } catch (error) { return res.status(error.status || 500).json({ error: error.status ? error.message : 'Error al agregar producto' }); }
  },
  update(req, res) {
    try { const product = productAdminService.update(req.params.id, req.body); if (!product) return res.status(404).json({ error: 'Producto no encontrado' }); return res.json({ message: 'Producto actualizado exitosamente', product }); }
    catch { return res.status(500).json({ error: 'Error al actualizar producto' }); }
  },
  remove(req, res) {
    try { if (!productAdminService.delete(req.params.id)) return res.status(404).json({ error: 'Producto no encontrado o ya eliminado' }); return res.json({ message: 'Producto eliminado del catálogo correctamente' }); }
    catch { return res.status(500).json({ error: 'Error al eliminar producto' }); }
  }
});
