import type { AdminPriceInput, CreateProductInput, Store } from '../types/api';
import type { ProductForm } from '../types/presentation';

type PayloadResult = { error: string; payload?: never } | { payload: CreateProductInput; error?: never };

// Valida los campos obligatorios antes de guardar (HU11) y arma el cuerpo que espera la API.
export function buildProductPayload(form: ProductForm, stores: readonly Pick<Store, 'id' | 'name'>[]): PayloadResult {
  if (!form.name.trim()) return { error: 'El nombre del producto es obligatorio' };
  const prices: AdminPriceInput[] = [];
  for (const store of stores) {
    const entry = form.prices[store.id];
    if (!entry || entry.price === '') continue;
    const price = Number(entry.price);
    if (!Number.isFinite(price) || price <= 0) return { error: `El precio en ${store.name} debe ser mayor que cero` };
    if (entry.is_offer) {
      const previous = Number(entry.previous_price);
      if (!(previous > price)) return { error: `En ${store.name}, el precio anterior de la oferta debe ser mayor que el precio actual` };
      prices.push({ store_id: store.id, price, previous_price: previous, is_offer: true });
    } else {
      prices.push({ store_id: store.id, price, previous_price: price, is_offer: false });
    }
  }
  if (!prices.length) return { error: 'Ingresa el precio en al menos una tienda' };
  return {
    payload: {
      name: form.name.trim(),
      description: form.description.trim(),
      category_id: Number(form.category_id),
      unit: form.unit.trim() || '1 Unidad',
      image_url: form.image_url.trim(),
      prices
    }
  };
}
