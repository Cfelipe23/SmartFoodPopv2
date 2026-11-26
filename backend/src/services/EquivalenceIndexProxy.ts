import type { ProductEquivalence } from '../domain/entities';
import { buildEquivalenceIndex } from '../domain/productEquivalence';
import type ProductRepository = require('../repositories/ProductRepository');

export interface EquivalenceIndexProvider {
  getIndex(): ReadonlyMap<number, ProductEquivalence>;
}

export class CatalogEquivalenceIndex implements EquivalenceIndexProvider {
  constructor(private readonly products: Pick<ProductRepository, 'findAll'>) {}

  getIndex() {
    return buildEquivalenceIndex(this.products.findAll());
  }
}

export class EquivalenceIndexProxy implements EquivalenceIndexProvider {
  private cached?: { version: number; index: ReadonlyMap<number, ProductEquivalence> };

  constructor(
    private readonly provider: EquivalenceIndexProvider,
    private readonly catalog: Pick<ProductRepository, 'version'>
  ) {}

  getIndex(): ReadonlyMap<number, ProductEquivalence> {
    const version = this.catalog.version;
    if (this.cached?.version === version) return this.cached.index;
    const index = this.provider.getIndex();
    this.cached = { version, index };
    return index;
  }
}
