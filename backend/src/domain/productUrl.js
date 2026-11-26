// En las tiendas VTEX (D1 y Olímpica) la página de un producto es `https://tienda/{slug}/p`.
// Sin el `/p` final, D1 responde 404 y Olímpica muestra una búsqueda vacía.
function toProductPageUrl(url) {
  const value = String(url || '').trim();
  if (!value) return '';
  const [base] = value.split(/[?#]/);
  const clean = base.replace(/\/+$/, '');
  if (!/^https?:\/\/[^/]+\/.+/.test(clean)) return '';
  return /\/p$/.test(clean) ? clean : `${clean}/p`;
}

// Identificador estable del producto dentro de su tienda (con o sin `/p`, mayúsculas, etc.).
function productUrlKey(url) {
  return toProductPageUrl(url).replace(/\/p$/, '').toLowerCase();
}

module.exports = { toProductPageUrl, productUrlKey };
