// Contrato de persistencia usado por los repositorios. La implementación nula se usa
// cuando no hay base de datos configurada (modo memoria de desarrollo).
class NoopPersistence {
  saveUser() {}
  saveReview() {}
  addFavorite() {}
  removeFavorite() {}
  saveProduct() {}
  deleteProduct() {}
  syncCatalog() {}
  async flush() {}
  async close() {}
}

module.exports = { NoopPersistence };
