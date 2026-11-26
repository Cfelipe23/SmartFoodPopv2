const { analyzeName, jaccard, cleanDisplayName } = require('./productNormalizer');
const { classifyCategory } = require('./productClassifier');
const { getProductImageByName } = require('./imageResolver');
const { toProductPageUrl } = require('./productUrl');

const MATCH_THRESHOLD = 0.6;
const STORE_IDS = { d1: 1, olimpica: 2 };
const STORE_LABELS = { 1: 'Tiendas D1', 2: 'Olímpica' };

function formatCop(value) {
  return Number(value).toLocaleString('es-CO', { maximumFractionDigits: 0 });
}

// Detalle de la oferta (HU08): usa el texto de la tienda o lo deriva del precio anterior.
function describeOffer(price, previousPrice, providedText) {
  if (providedText) return String(providedText);
  if (previousPrice > price) {
    const percentage = Math.round(((previousPrice - price) / previousPrice) * 100);
    return `Antes $${formatCop(previousPrice)} · ahorras ${percentage}%`;
  }
  return '';
}

// Olímpica publica una imagen genérica cuando no tiene foto del producto: no sirve para identificarlo.
const isPlaceholderImage = url => /imagen-gener[ic]a/i.test(url || '');

function toListing(raw, storeId) {
  const price = Number(raw.price);
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
function collectListings(rawItems) {
  const listings = [];
  const seen = new Map();
  for (const raw of rawItems) {
    const storeId = STORE_IDS[String(raw?.store || '').toLowerCase()];
    if (!storeId || !raw.name || !(Number(raw.price) > 0)) continue;
    const listing = toListing(raw, storeId);
    const key = `${storeId}:${raw.sku_id || raw.name}`;
    const existingIndex = seen.get(key);
    if (existingIndex === undefined) { seen.set(key, listings.length); listings.push(listing); }
    else if (listing.price.price < listings[existingIndex].price.price) listings[existingIndex] = listing;
  }
  return listings;
}

// Entity matching (HU07): mismo contenido neto + nombre/marca suficientemente parecidos.
function matchAcrossStores(listingsA, listingsB) {
  const bySignature = new Map();
  listingsB.forEach((listing, index) => {
    const { signature } = listing.analysis;
    if (!bySignature.has(signature)) bySignature.set(signature, []);
    bySignature.get(signature).push(index);
  });

  const candidates = [];
  listingsA.forEach((a, indexA) => {
    for (const indexB of bySignature.get(a.analysis.signature) || []) {
      const score = jaccard(a.analysis.tokens, listingsB[indexB].analysis.tokens);
      const hasSize = a.analysis.signature !== '';
      const enoughEvidence = hasSize ? score >= MATCH_THRESHOLD : score === 1 && a.analysis.tokens.length >= 2;
      if (enoughEvidence) candidates.push({ indexA, indexB, score });
    }
  });

  candidates.sort((x, y) => y.score - x.score || x.indexA - y.indexA || x.indexB - y.indexB);
  const usedA = new Set();
  const usedB = new Set();
  const pairs = [];
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

function buildCard(listings) {
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
function buildCatalogCards(rawItems) {
  const listings = collectListings(rawItems);
  const d1 = listings.filter(listing => listing.price.store_id === STORE_IDS.d1);
  const olimpica = listings.filter(listing => listing.price.store_id === STORE_IDS.olimpica);
  const { pairs, singlesA, singlesB } = matchAcrossStores(d1, olimpica);

  const byName = (a, b) => a.name.localeCompare(b.name, 'es');
  const matched = pairs.map(buildCard).sort(byName);
  const unmatched = [...singlesA, ...singlesB].map(listing => buildCard([listing])).sort(byName);

  // Primero los productos comparables entre tiendas; los ids son estables mientras no cambie el JSON.
  return [...matched, ...unmatched].map((card, index) => ({ id: index + 1, ...card }));
}

module.exports = { buildCatalogCards, describeOffer, matchAcrossStores, collectListings, STORE_IDS };
