import { bestDiscount } from './format.js';
import { isComparable } from './comparison.js';

function normalizeText(value) {
  return String(value ?? '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().trim();
}

// Filtrado del catálogo (RF04 búsqueda, RF08 ofertas, RF09 tienda/categoría, RF10 guardados).
// La búsqueda ignora tildes y mayúsculas ("frijol" encuentra "Fríjol").
export function filterProducts({ products, categories, stores, favorites, searchTerm, selectedCategory, selectedStore, activeTab, onlyComparable = false }) {
  const query = normalizeText(searchTerm);
  const category = selectedCategory !== 'all' ? categories.find(c => c.slug === selectedCategory || c.id === Number(selectedCategory)) : null;
  const store = selectedStore !== 'all' ? stores.find(s => s.code === selectedStore || s.id === Number(selectedStore)) : null;

  const result = products.filter(product => {
    if (query && !normalizeText(`${product.name} ${product.description || ''}`).includes(query)) return false;
    if (category && product.category_id !== category.id) return false;
    if (store && !(product.prices || []).some(price => price.store_id === store.id)) return false;
    if (onlyComparable && !isComparable(product)) return false;
    if (activeTab === 'offers' && !(product.prices || []).some(price => price.is_offer)) return false;
    if (activeTab === 'favorites' && !favorites.includes(product.id)) return false;
    return true;
  });

  // En ofertas se muestran primero las de mayor descuento.
  if (activeTab === 'offers') {
    return [...result].sort((a, b) => bestDiscount(b.prices) - bestDiscount(a.prices));
  }
  return result;
}
