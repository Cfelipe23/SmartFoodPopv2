import type { CatalogRefreshResult, Product, ProductPrice } from './entities';

export class CatalogRefreshResultBuilder {
  private readonly existing: Product[] = [];
  private readonly updated: Product[] = [];
  private readonly created: Product[] = [];
  private readonly removedIds: number[] = [];
  private readonly remap = new Map<number, number>();

  keep(product: Product): void {
    this.existing.push(product);
  }

  update(product: Product): void {
    this.existing.push(product);
    this.updated.push(product);
  }

  create(product: Product): void {
    this.created.push(product);
  }

  remove(id: number, destination?: number): void {
    this.removedIds.push(id);
    if (destination !== undefined) this.remap.set(id, destination);
  }

  build(skippedStores: ReadonlySet<ProductPrice['store_id']>): CatalogRefreshResult {
    const products = [...this.existing, ...this.created];
    return {
      products,
      changedProducts: [...this.updated, ...this.created],
      removedIds: [...this.removedIds],
      remap: new Map(this.remap),
      skippedStores: [...skippedStores],
      stats: {
        total: products.length,
        updated: this.updated.length,
        created: this.created.length,
        removed: this.removedIds.length,
        unchanged: this.existing.length - this.updated.length
      }
    };
  }
}
