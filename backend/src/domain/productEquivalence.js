const { analyzeName } = require('./productNormalizer');

// Equivalencia entre tiendas (HU07): para cada producto que solo está en una tienda se busca,
// en las otras tiendas, el producto más parecido (mismo tipo y misma unidad de medida)
// para mostrar la comparación en la misma tarjeta, aunque la marca o la presentación difieran.
//
// Las tiendas venden muchas marcas propias (p. ej. Latti o El Estío en D1) que nunca aparecen
// en la otra tienda. Por eso las palabras que solo existen en una tienda pesan menos que las
// palabras compartidas, que son las que describen el tipo de producto ("atún", "agua", "queso").

const MIN_SCORE = 0.5;
const MIN_SCORE_WITHOUT_SIZE = 0.8;
const EXCLUSIVE_TOKEN_WEIGHT = 0.35;
// Con similitud alta se acepta aunque el nombre empiece distinto ("Club Social" vs "Galleta Club Social").
const HIGH_CONFIDENCE_SCORE = 0.75;

const analysisCache = new WeakMap();
function analysisOf(product) {
  if (!analysisCache.has(product)) analysisCache.set(product, analyzeName(product.name));
  return analysisCache.get(product);
}

// Precio por kg o por litro, para comparar presentaciones de distinto tamaño.
// Contenido total del empaque. En líquidos "200 Ml X6 Unds" son 6 envases de 200 ml;
// en sólidos el peso indicado ya es el total ("Butifarra 450 G X18 Unds" pesa 450 g).
function totalAmount(analysis) {
  const { amount, unit, count } = analysis.size;
  if (!amount) return 0;
  return unit === 'ml' ? amount * count : amount;
}

function computeUnitPrice(price, analysis) {
  const total = totalAmount(analysis);
  if (!total || !analysis.size.unit) return null;
  return { value: Math.round((Number(price) / total) * 1000), per: analysis.size.unit === 'g' ? 'kg' : 'L' };
}

// El primer término del nombre suele ser el tipo de producto ("queso", "atún", "detergente").
function sameKindOfProduct(a, b) {
  const headA = a.tokens[0];
  const headB = b.tokens[0];
  return Boolean(headA && headB) && b.tokens.includes(headA) && a.tokens.includes(headB);
}

function sizeCloseness(a, b) {
  const x = totalAmount(a);
  const y = totalAmount(b);
  return x && y ? Math.min(x, y) / Math.max(x, y) : 0;
}

function storeIdsOf(product) {
  return new Set((product.prices || []).map(price => Number(price.store_id)));
}

// Palabras presentes en productos de dos o más tiendas: describen el producto, no una marca exclusiva.
function buildSharedVocabulary(products) {
  const storesByToken = new Map();
  for (const product of products) {
    const stores = storeIdsOf(product);
    for (const token of analysisOf(product).tokens) {
      if (!storesByToken.has(token)) storesByToken.set(token, new Set());
      for (const storeId of stores) storesByToken.get(token).add(storeId);
    }
  }
  const shared = new Set();
  for (const [token, stores] of storesByToken) if (stores.size > 1) shared.add(token);
  return shared;
}

// Jaccard ponderado: las palabras compartidas entre tiendas pesan 1; las exclusivas, menos.
function weightedSimilarity(tokensA, tokensB, sharedVocabulary) {
  const weight = token => (sharedVocabulary.has(token) ? 1 : EXCLUSIVE_TOKEN_WEIGHT);
  const setB = new Set(tokensB);
  let intersection = 0;
  let union = 0;
  for (const token of tokensA) {
    union += weight(token);
    if (setB.has(token)) intersection += weight(token);
  }
  const setA = new Set(tokensA);
  for (const token of tokensB) if (!setA.has(token)) union += weight(token);
  return union ? intersection / union : 0;
}

// Devuelve Map<idProducto, { product, prices, score }> con el mejor equivalente de cada producto.
function buildEquivalenceIndex(products) {
  const sharedVocabulary = buildSharedVocabulary(products);
  const byToken = new Map();
  for (const product of products) {
    if (!(product.prices || []).length) continue;
    const analysis = analysisOf(product);
    for (const token of analysis.tokens) {
      if (!sharedVocabulary.has(token)) continue;
      const key = `${analysis.size.unit || '-'}|${token}`;
      if (!byToken.has(key)) byToken.set(key, []);
      byToken.get(key).push(product);
    }
  }

  const index = new Map();
  for (const product of products) {
    const ownStores = storeIdsOf(product);
    if (!ownStores.size) continue;
    const analysis = analysisOf(product);
    const required = analysis.size.unit ? MIN_SCORE : MIN_SCORE_WITHOUT_SIZE;

    const candidates = new Set();
    for (const token of analysis.tokens) {
      for (const candidate of byToken.get(`${analysis.size.unit || '-'}|${token}`) || []) candidates.add(candidate);
    }

    let best = null;
    for (const candidate of candidates) {
      if (candidate === product) continue;
      const otherPrices = candidate.prices.filter(price => !ownStores.has(Number(price.store_id)));
      if (!otherPrices.length) continue;
      const candidateAnalysis = analysisOf(candidate);
      const score = weightedSimilarity(analysis.tokens, candidateAnalysis.tokens, sharedVocabulary);
      if (score < required) continue;
      if (score < HIGH_CONFIDENCE_SCORE && !sameKindOfProduct(analysis, candidateAnalysis)) continue;
      const closeness = sizeCloseness(analysis, candidateAnalysis);
      const better = !best
        || score > best.score
        || (score === best.score && closeness > best.closeness)
        || (score === best.score && closeness === best.closeness && candidate.name.localeCompare(best.product.name, 'es') < 0);
      if (better) best = { product: candidate, prices: otherPrices, score, closeness };
    }
    if (best) index.set(product.id, best);
  }
  return index;
}

module.exports = { analysisOf, computeUnitPrice, buildEquivalenceIndex, weightedSimilarity, buildSharedVocabulary, MIN_SCORE };
