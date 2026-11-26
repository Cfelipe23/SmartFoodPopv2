import type { Store } from '../types/api';
import type { ComparisonRow, ComparisonSource } from '../types/presentation';

// Comparación de precios dentro de una misma tarjeta (RF07).
// Reúne los precios del propio producto y los de su equivalente en la otra tienda
// y decide cuál es la opción más económica (por kg/L cuando la presentación difiere).

export function buildComparison<T extends Pick<Store, 'id'>>(product: ComparisonSource, stores: readonly T[] = []) {
  const rows = (product.prices || []).map((price): ComparisonRow => ({
    key: `own-${price.store_id}`,
    store_id: price.store_id,
    name: null,
    unit: null,
    price: price.price,
    previous_price: price.previous_price,
    is_offer: price.is_offer,
    unit_price: price.unit_price || null,
    source_url: price.source_url || '',
    isEquivalent: false
  }));

  const equivalent = product.equivalent;
  if (equivalent) {
    for (const price of equivalent.prices || []) {
      rows.push({
        key: `eq-${price.store_id}`,
        store_id: price.store_id,
        name: equivalent.name,
        unit: equivalent.unit,
        price: price.price,
        previous_price: price.previous_price,
        is_offer: price.is_offer,
        unit_price: price.unit_price || null,
        source_url: price.source_url || '',
        isEquivalent: true
      });
    }
  }

  const comparable = rows.length > 1;
  const unitMeasure = rows[0]?.unit_price?.per ?? null;
  const sameMeasure = unitMeasure !== null && rows.every(row => row.unit_price?.per === unitMeasure);
  const basis = sameMeasure ? 'unit' : 'price';
  const valueOf = (row: ComparisonRow) => (sameMeasure ? row.unit_price?.value ?? row.price : row.price);

  let best: ComparisonRow | null = null;
  if (comparable) best = rows.reduce((winner, row) => (valueOf(row) < valueOf(winner) ? row : winner), rows[0]);

  const coveredStores = new Set(rows.map(row => row.store_id));
  const missingStores = stores.filter(store => !coveredStores.has(store.id));
  // Si la presentación es distinta, la comparación justa es por kg/L.
  const differentSizes = comparable && basis === 'unit' && rows.some(row => row.isEquivalent && row.unit !== product.unit);

  return { rows, comparable, best, basis, missingStores, differentSizes, measure: sameMeasure ? unitMeasure : null };
}

export function isComparable(product: Pick<ComparisonSource, 'prices'> & { equivalent?: unknown }): boolean {
  return (product.prices || []).length > 1 || Boolean(product.equivalent);
}
