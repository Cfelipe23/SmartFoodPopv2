import type { Product, ProductPrice } from '../domain/entities';
import { analysisOf, computeUnitPrice } from '../domain/productEquivalence';
import type CatalogRepository = require('../repositories/CatalogRepository');

export type PricePresenter<T extends ProductPrice> = (product: Product, price: ProductPrice) => T;

export const basePrice: PricePresenter<ProductPrice> = (_product, price) => price;

export function withUnitPrice<T extends ProductPrice>(present: PricePresenter<T>) {
  return (product: Product, price: ProductPrice) => ({
    ...present(product, price),
    unit_price: computeUnitPrice(price.price, analysisOf(product))
  });
}

export function withStore<T extends ProductPrice>(
  present: PricePresenter<T>,
  catalog: Pick<CatalogRepository, 'getStores'>
) {
  return (product: Product, price: ProductPrice) => {
    const store = catalog.getStores().find(item => Number(item.id) === Number(price.store_id));
    return {
      ...present(product, price),
      store_name: store?.name || 'Tienda',
      store_logo: store?.logo || '🏬',
      store_code: store?.code || 'store'
    };
  };
}
