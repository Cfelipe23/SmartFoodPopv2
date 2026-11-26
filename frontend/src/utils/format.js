const copFormatter = new Intl.NumberFormat('es-CO', { maximumFractionDigits: 0 });

export function formatCop(value) {
  return `$${copFormatter.format(Number(value) || 0)}`;
}

// Porcentaje de descuento entre el precio anterior y el actual (0 si no hay rebaja).
export function discountPercent(previousPrice, price) {
  const previous = Number(previousPrice);
  const current = Number(price);
  if (!(previous > current) || !(current > 0)) return 0;
  return Math.round(((previous - current) / previous) * 100);
}

// Mayor descuento entre las ofertas de un producto.
export function bestDiscount(prices = []) {
  return prices.reduce((best, price) => (price.is_offer ? Math.max(best, discountPercent(price.previous_price, price.price)) : best), 0);
}
