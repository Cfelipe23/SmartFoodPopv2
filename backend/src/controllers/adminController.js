function respondWithError(res, error, fallbackMessage) {
  if (error.status) return res.status(error.status).json({ error: error.message });
  console.error(fallbackMessage, error);
  return res.status(500).json({ error: fallbackMessage });
}

module.exports = (productAdminService) => ({
  create(req, res) {
    try {
      const product = productAdminService.create(req.body);
      return res.status(201).json({ message: 'Producto creado exitosamente', product });
    } catch (error) { return respondWithError(res, error, 'Error al agregar producto'); }
  },
  update(req, res) {
    try {
      const product = productAdminService.update(req.params.id, req.body);
      if (!product) return res.status(404).json({ error: 'Producto no encontrado' });
      return res.json({ message: 'Producto actualizado exitosamente', product });
    } catch (error) { return respondWithError(res, error, 'Error al actualizar producto'); }
  },
  remove(req, res) {
    try {
      if (!productAdminService.delete(req.params.id)) return res.status(404).json({ error: 'Producto no encontrado o ya eliminado' });
      return res.json({ message: 'Producto eliminado del catálogo correctamente' });
    } catch (error) { return respondWithError(res, error, 'Error al eliminar producto'); }
  }
});
