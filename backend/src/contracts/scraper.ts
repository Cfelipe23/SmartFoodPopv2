export type ScraperStore = 'd1' | 'olimpica';

// Contrato del JSON de Python, con campos opcionales para los archivos anteriores.
export interface ScraperRecord {
  store: ScraperStore;
  name: string;
  price: number;
  original_price?: number | null;
  sku_id?: string | null;
  source_url?: string | null;
  image_url?: string | null;
  is_offer?: boolean | null;
  offer_desc?: string | null;
  scraped_at?: string | null;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function optionalText(value: unknown): string | null | undefined {
  return typeof value === 'string' || value === null ? value : undefined;
}

export function readScraperRecord(value: unknown): ScraperRecord | null {
  if (!isRecord(value)) return null;
  const store = String(value.store || '').toLowerCase();
  if (store !== 'd1' && store !== 'olimpica') return null;
  if (typeof value.name !== 'string' || !value.name) return null;

  // Los precios numéricos en texto de archivos anteriores siguen siendo válidos.
  const price = Number(value.price);
  if (!(price > 0)) return null;
  const originalPrice = value.original_price;

  return {
    store,
    name: value.name,
    price,
    original_price: originalPrice == null ? originalPrice : Number(originalPrice),
    sku_id: value.sku_id ? String(value.sku_id) : optionalText(value.sku_id),
    source_url: value.source_url ? String(value.source_url) : optionalText(value.source_url),
    image_url: optionalText(value.image_url),
    is_offer: value.is_offer == null ? value.is_offer : Boolean(value.is_offer),
    offer_desc: value.offer_desc ? String(value.offer_desc) : optionalText(value.offer_desc),
    scraped_at: optionalText(value.scraped_at)
  };
}
