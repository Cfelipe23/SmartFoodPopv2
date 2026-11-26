import { readScraperRecord } from '../contracts/scraper';
import type { ScraperRecord, ScraperStore } from '../contracts/scraper';
import type { Product, ProductAnalysis, ProductPrice } from './entities';
import { analyzeName, jaccard, cleanDisplayName } from './productNormalizer';
import { classifyCategory } from './productClassifier';
import { getProductImageByName } from './imageResolver';
import { toProductPageUrl } from './productUrl';

const MATCH_THRESHOLD = 0.6;
export const STORE_IDS = { d1: 1, olimpica: 2 } as const satisfies Record<ScraperStore, number>;
const STORE_LABELS = { 1: 'Tiendas D1', 2: 'Olímpica' };

type ScraperStoreId = (typeof STORE_IDS)[ScraperStore];

interface Listing {
  name: string;
  imageUrl: string | null | undefined;
  analysis: ProductAnalysis;
  price: ProductPrice & { store_id: ScraperStoreId };
}

function formatCop(value: number): string {
  return Number(value).toLocaleString('es-CO', { maximumFractionDigits: 0 });
}

// Detalle de la oferta (HU08): usa el texto de la tienda o lo deriva del precio anterior.
export function describeOffer(price: number, previousPrice: number, providedText?: unknown): string {
  if (providedText) return String(providedText);
  if (previousPrice > price) {
    const percentage = Math.round(((previousPrice - price) / previousPrice) * 100);
    return `Antes $${formatCop(previousPrice)} · ahorras ${percentage}%`;
  }
  return '';
}

// Olímpica publica una imagen genérica cuando no tiene foto del producto: no sirve para identificarlo.
const isPlaceholderImage = (url: string | null | undefined) => /imagen-gener[ic]a/i.test(url || '');

function toListing(raw: ScraperRecord, storeId: ScraperStoreId): Listing {
  const price = raw.price;
  const originalPrice = Number(raw.original_price);
  const previousPrice = originalPrice > price ? originalPrice : price;
  const isOffer = Boolean(raw.is_offer) && previousPrice > price;
  return {
    name: raw.name,
    imageUrl: isPlaceholderImage(raw.image_url) ? '' : raw.image_url,
    analysis: analyzeName(raw.name),
    price: {
      store_id: storeId,
      price,
      previous_price: previousPrice,
      is_offer: isOffer,
      offer_description: isOffer ? describeOffer(price, previousPrice, raw.offer_desc) : '',
      source_url: toProductPageUrl(raw.source_url)
    }
  };
}

// Una ficha por tienda y SKU (se conserva el precio más bajo si el SKU se repite).
export function collectListings(rawItems: readonly unknown[]): Listing[] {
  const listings: Listing[] = [];
  const seen = new Map<string, number>();
  for (const item of rawItems) {
    const raw = readScraperRecord(item);
    if (!raw) continue;
    const storeId = STORE_IDS[raw.store];
    const listing = toListing(raw, storeId);
    const key = `${storeId}:${raw.sku_id || raw.name}`;
    const existingIndex = seen.get(key);
    if (existingIndex === undefined) { seen.set(key, listings.length); listings.push(listing); }
    else if (listing.price.price < listings[existingIndex].price.price) listings[existingIndex] = listing;
  }
  return listings;
}

// Entity matching (HU07): mismo contenido neto + nombre/marca suficientemente parecidos.
export function matchAcrossStores(listingsA: readonly Listing[], listingsB: readonly Listing[]) {
  const bySignature = new Map<string, number[]>();
  listingsB.forEach((listing, index) => {
    const { signature } = listing.analysis;
    const indexes = bySignature.get(signature);
    if (indexes) indexes.push(index);
    else bySignature.set(signature, [index]);
  });

  const candidates: { indexA: number; indexB: number; score: number }[] = [];
  listingsA.forEach((a, indexA) => {
    for (const indexB of bySignature.get(a.analysis.signature) || []) {
      const score = jaccard(a.analysis.tokens, listingsB[indexB].analysis.tokens);
      const hasSize = a.analysis.signature !== '';
      const enoughEvidence = hasSize ? score >= MATCH_THRESHOLD : score === 1 && a.analysis.tokens.length >= 2;
      if (enoughEvidence) candidates.push({ indexA, indexB, score });
    }
  });

  candidates.sort((x, y) => y.score - x.score || x.indexA - y.indexA || x.indexB - y.indexB);
  const usedA = new Set<number>();
  const usedB = new Set<number>();
  const pairs: [Listing, Listing][] = [];
  for (const { indexA, indexB } of candidates) {
    if (usedA.has(indexA) || usedB.has(indexB)) continue;
    usedA.add(indexA);
    usedB.add(indexB);
    pairs.push([listingsA[indexA], listingsB[indexB]]);
  }
  return {
    pairs,
    singlesA: listingsA.filter((_, index) => !usedA.has(index)),
    singlesB: listingsB.filter((_, index) => !usedB.has(index))
  };
}

function buildCard(listings: [Listing, ...Listing[]]): Omit<Product, 'id'> {
  const primary = listings[0];
  const unit = primary.analysis.sizeLabel;
  const stores = listings.map(listing => STORE_LABELS[listing.price.store_id]).join(' y ');
  return {
    name: cleanDisplayName(primary.name),
    description: `Presentación: ${unit}. Disponible en ${stores} (Popayán).`,
    category_id: classifyCategory(primary.name),
    unit,
    image_url: listings.map(listing => listing.imageUrl).find(Boolean) || getProductImageByName(primary.name),
    prices: listings.map(listing => listing.price)
  };
}

// Convierte los registros crudos del scraper en tarjetas comparativas
// (un producto por tarjeta, con un precio por tienda).
export function buildCatalogCards(rawItems: readonly unknown[]): Product[] {
  const listings = collectListings(rawItems);
  const d1 = listings.filter(listing => listing.price.store_id === STORE_IDS.d1);
  const olimpica = listings.filter(listing => listing.price.store_id === STORE_IDS.olimpica);
  const { pairs, singlesA, singlesB } = matchAcrossStores(d1, olimpica);

  const byName = (a: Pick<Product, 'name'>, b: Pick<Product, 'name'>) => a.name.localeCompare(b.name, 'es');
  const matched = pairs.map(buildCard).sort(byName);
  const unmatched = [...singlesA, ...singlesB].map(listing => buildCard([listing])).sort(byName);

  // Primero los productos comparables entre tiendas; los ids son estables mientras no cambie el JSON.
  return [...matched, ...unmatched].map((card, index) => ({ id: index + 1, ...card }));
}
