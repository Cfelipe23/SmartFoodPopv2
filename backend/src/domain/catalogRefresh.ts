import type { CatalogRefreshResult, Product, ProductPrice } from './entities';
import { productUrlKey } from './productUrl';
import { CatalogRefreshResultBuilder } from './CatalogRefreshResultBuilder';

// Si una tienda trae menos de esta fracción de los productos que ya había, se asume que el
// scraping de esa tienda falló (bloqueo, caída de la API) y sus precios actuales se conservan.
export const MIN_STORE_RATIO = 0.5;

type StoreId = ProductPrice['store_id'];
type FreshCard = Omit<Product, 'id'>;

const priceKey = (price: ProductPrice): string | null => {
  const url = productUrlKey(price.source_url);
  return url ? `${price.store_id}|${url}` : null;
};

const countScrapedByStore = (products: readonly FreshCard[]) => {
  const counts = new Map<StoreId, number>();
  for (const product of products) {
    for (const price of product.prices || []) {
      if (priceKey(price)) counts.set(price.store_id, (counts.get(price.store_id) || 0) + 1);
    }
  }
  return counts;
};

const byStore = (a: ProductPrice, b: ProductPrice) => Number(a.store_id) - Number(b.store_id);
const snapshot = (product: Product) => JSON.stringify([product.name, product.image_url, product.category_id, product.unit, product.description,
  [...(product.prices || [])].sort(byStore)]);

// Actualiza el catálogo con un nuevo resultado del scraper SIN cambiar los ids de los productos
// existentes (las reseñas y favoritos siguen apuntando al mismo producto).
// - Un producto se reconoce por el enlace de su página en cada tienda.
// - Los precios de productos que la tienda ya no publica se retiran; si el producto queda sin
//   precios se elimina (o, si su ficha pasó a otro producto, sus reseñas/favoritos se trasladan: `remap`).
// - Los productos creados por el administrador (sin enlace de tienda) no se tocan.
export function mergeCatalog(
  currentProducts: readonly Product[],
  freshCards: readonly FreshCard[],
  { minStoreRatio = MIN_STORE_RATIO } = {}
): CatalogRefreshResult {
  const currentCounts = countScrapedByStore(currentProducts);
  const freshCounts = countScrapedByStore(freshCards);
  const skippedStores = new Set(
    [...currentCounts].filter(([storeId, count]) => (freshCounts.get(storeId) || 0) < count * minStoreRatio).map(([storeId]) => storeId)
  );

  const ownerByKey = new Map<string | null, number>();
  for (const product of currentProducts) {
    for (const price of product.prices || []) {
      const key = priceKey(price);
      if (key && !ownerByKey.has(key)) ownerByKey.set(key, product.id);
    }
  }
  const result = new CatalogRefreshResultBuilder();

  let nextId = currentProducts.reduce((max, product) => Math.max(max, product.id), 0) + 1;
  const claimed = new Map<number, FreshCard>(); // id existente -> tarjeta nueva
  const keyDestination = new Map<string | null, number>(); // clave de precio -> id final

  for (const card of freshCards) {
    const prices = (card.prices || []).filter(price => !skippedStores.has(price.store_id));
    if (!prices.length) continue;
    const votes = new Map<number, number>();
    for (const price of prices) {
      const owner = ownerByKey.get(priceKey(price));
      if (owner !== undefined && !claimed.has(owner)) votes.set(owner, (votes.get(owner) || 0) + 1);
    }
    const [target] = [...votes].sort((a, b) => b[1] - a[1] || a[0] - b[0]).map(([id]) => id);
    const entry = { ...card, prices };
    const finalId = target ?? nextId++;
    if (target !== undefined) claimed.set(target, entry);
    else result.create({ ...entry, id: finalId });
    for (const price of prices) keyDestination.set(priceKey(price), finalId);
  }

  // Precios que se conservan del producto actual: los de tiendas omitidas y los cargados a mano.
  const keptPrices = (product: Product, coveredStores: ReadonlySet<StoreId>) => (product.prices || []).filter(price =>
    !coveredStores.has(price.store_id) && (skippedStores.has(price.store_id) || !priceKey(price)));

  for (const current of currentProducts) {
    const card = claimed.get(current.id);
    let next: Product;
    if (card) {
      const coveredStores = new Set(card.prices.map(price => price.store_id));
      next = {
        ...current,
        image_url: card.image_url || current.image_url,
        // La descripción automática dice en qué tiendas está; la escrita por el administrador se respeta.
        description: !current.description || current.description.startsWith('Presentación:') ? card.description : current.description,
        prices: [...card.prices, ...keptPrices(current, coveredStores)].sort(byStore)
      };
    } else {
      next = { ...current, prices: keptPrices(current, new Set()) };
      if (!next.prices.length) {
        const moved = (current.prices || []).map(price => keyDestination.get(priceKey(price))).find(id => id !== undefined);
        result.remove(current.id, moved);
        continue;
      }
    }
    if (snapshot(next) !== snapshot(current)) result.update(next);
    else result.keep(next);
  }

  return result.build(skippedStores);
}
