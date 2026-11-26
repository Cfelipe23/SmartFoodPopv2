import { httpError } from './httpError';

export function readTextParam(value: unknown): string {
  if (value === undefined || value === null || value === '') return '';
  if (typeof value !== 'string' && typeof value !== 'number') {
    throw httpError(400, 'Parámetro de búsqueda inválido');
  }
  return String(value).trim();
}
export function normalizeText(value: unknown): string {
  return String(value ?? '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim();
}
export function readCatalogItem<Item extends { id: number }>(
  items: readonly Item[],
  value: string,
  field: keyof Item
): Item | null {
  if (!value) return null;
  const normalized = normalizeText(value);
  const found = items.find(item => normalizeText(item[field]) === normalized || String(item.id) === String(value));
  if (!found) throw httpError(400, `${field === 'code' ? 'Tienda' : 'Categoría'} no válida: ${value}`);
  return found;
}
