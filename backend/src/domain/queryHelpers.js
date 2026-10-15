function readTextParam(value) {
  if (value === undefined || value === null || value === '') return '';
  if (typeof value !== 'string' && typeof value !== 'number') {
    const error = new Error('Parámetro de búsqueda inválido'); error.status = 400; throw error;
  }
  return String(value).trim();
}
function normalizeText(value) {
  return String(value ?? '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim();
}
function readCatalogItem(items, value, field) {
  if (!value) return null;
  const normalized = normalizeText(value);
  const found = items.find(item => normalizeText(item[field]) === normalized || String(item.id) === String(value));
  if (!found) { const error = new Error(`${field === 'code' ? 'Tienda' : 'Categoría'} no válida: ${value}`); error.status = 400; throw error; }
  return found;
}
module.exports = { readTextParam, normalizeText, readCatalogItem };
