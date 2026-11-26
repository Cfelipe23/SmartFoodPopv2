// Normalización de nombres de producto para comparar el mismo artículo entre tiendas (HU07).

import type { BaseUnit, ProductAnalysis, ProductSize } from './entities';

const STOPWORDS = new Set([
  'de', 'del', 'la', 'el', 'los', 'las', 'en', 'con', 'sin', 'y', 'a', 'para', 'por', 'al',
  'x', 'un', 'una', 'und', 'unds', 'unid', 'unidad', 'unidades', 'ud', 'uds', 'neto', 'pet',
  'pack', 'paca', 'bolsa', 'caja', 'botella', 'tarro', 'doypack', 'frasco', 'sobre', 'lata',
  'tetrapak', 'uht', 'g', 'gr', 'grs', 'gramo', 'gramos', 'kg', 'kgs', 'kilo', 'kilos',
  'ml', 'cc', 'l', 'lt', 'lts', 'litro', 'litros'
]);

const SIZE_PATTERN = /(\d+(?:[.,]\d+)*)\s*(kgs?|kilos?|gramos?|grs?|g|ml|cc|lts?|litros?|l)\b/;
const COUNT_PATTERNS = [
  /\bx\s*(\d+)\b(?!\s*(?:kgs?|kilos?|gramos?|grs?|g|ml|cc|lts?|litros?|l)\b)/,
  /\b(\d+)\s*x\b/,
  /\b(\d+)\s*(?:unds?|unid|unidades|uds?)\b/
];

export function stripAccents(text: unknown): string {
  return String(text ?? '').normalize('NFD').replace(/[̀-ͯ]/g, '');
}

export function normalizeName(name: unknown): string {
  return stripAccents(name).toLowerCase().replace(/[^a-z0-9.,\s]/g, ' ').replace(/\s+/g, ' ').trim();
}

// "2.500" → 2500 (separador de miles colombiano); "2,5" o "2.5" → 2.5
export function parseQuantity(raw: string): number {
  if (/^\d{1,3}(\.\d{3})+$/.test(raw)) return Number(raw.replace(/\./g, ''));
  return Number(raw.replace(',', '.'));
}

function toBaseUnit(amount: number, unit: string): { amount: number; unit: BaseUnit } {
  if (/^(kgs?|kilos?)$/.test(unit)) return { amount: amount * 1000, unit: 'g' };
  if (/^(lts?|litros?|l)$/.test(unit)) return { amount: amount * 1000, unit: 'ml' };
  if (/^(ml|cc)$/.test(unit)) return { amount, unit: 'ml' };
  return { amount, unit: 'g' };
}

// Contenido neto (g / ml) y número de unidades del empaque, p. ej. "Leche 1,1 Lt X6 Unds" → 1100 ml × 6
export function extractSize(normalized: string): ProductSize {
  let amount: number | null = null;
  let unit: BaseUnit | null = null;
  let sizeText = '';
  const sizeMatch = normalized.match(SIZE_PATTERN);
  if (sizeMatch) {
    const quantity = parseQuantity(sizeMatch[1]);
    if (Number.isFinite(quantity) && quantity > 0) {
      ({ amount, unit } = toBaseUnit(quantity, sizeMatch[2]));
      amount = Math.round(amount * 100) / 100;
      sizeText = sizeMatch[0];
    }
  }
  let count = 1;
  let countText = '';
  for (const pattern of COUNT_PATTERNS) {
    const match = normalized.match(pattern);
    if (match && Number(match[1]) > 1) { count = Number(match[1]); countText = match[0]; break; }
  }
  return { amount, unit, count, sizeText, countText };
}

function singularize(token: string): string {
  return token.length > 4 && token.endsWith('s') && !token.endsWith('ss') ? token.slice(0, -1) : token;
}

function extractTokens(normalized: string, size: ProductSize): string[] {
  let text = normalized;
  if (size.sizeText) text = text.replace(size.sizeText, ' ');
  if (size.countText) text = text.replace(size.countText, ' ');
  const tokens = text.split(/[\s.,]+/)
    .filter(token => token.length >= 2 && !/^\d+$/.test(token) && !STOPWORDS.has(token))
    .map(singularize);
  return [...new Set(tokens)];
}

function sizeSignature(size: ProductSize): string {
  if (size.amount === null && size.count === 1) return '';
  return `${size.amount ?? ''}${size.unit ?? ''}|${size.count}`;
}

export function formatSizeLabel(size: ProductSize): string {
  let base = '';
  if (size.amount !== null) {
    if (size.unit === 'g') base = size.amount >= 1000 ? `${size.amount / 1000} kg` : `${size.amount} g`;
    else base = size.amount >= 1000 ? `${size.amount / 1000} L` : `${size.amount} ml`;
  }
  if (size.count > 1 && !base) return `${size.count} unidades`;
  // Líquidos: 6 envases de 200 ml. Sólidos: el peso es el total del empaque.
  if (size.count > 1) return size.unit === 'ml' ? `${size.count} x ${base}` : `${base} (${size.count} unidades)`;
  return base || 'Unidad';
}

function toTitleCase(text: string): string {
  return String(text).toLowerCase().replace(/(^|[\s(/-])(\p{L})/gu, (_, separator: string, letter: string) => separator + letter.toUpperCase());
}

// Los nombres de Olímpica suelen venir en mayúsculas sostenidas.
export function cleanDisplayName(name: unknown): string {
  const trimmed = String(name ?? '').replace(/\s+/g, ' ').trim();
  const letters = trimmed.replace(/[^A-Za-zÁÉÍÓÚÑáéíóúñ]/g, '');
  return letters && letters === letters.toUpperCase() ? toTitleCase(trimmed) : trimmed;
}

export function analyzeName(name: unknown): ProductAnalysis {
  const normalized = normalizeName(name);
  const size = extractSize(normalized);
  return {
    normalized,
    size,
    tokens: extractTokens(normalized, size),
    signature: sizeSignature(size),
    sizeLabel: formatSizeLabel(size)
  };
}

export function jaccard(tokensA: readonly string[], tokensB: readonly string[]): number {
  if (!tokensA.length || !tokensB.length) return 0;
  const setB = new Set(tokensB);
  const shared = tokensA.filter(token => setB.has(token)).length;
  return shared / (tokensA.length + tokensB.length - shared);
}
