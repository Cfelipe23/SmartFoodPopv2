import { readFileSync } from 'node:fs';
import { buildCatalogCards } from '../domain/catalogBuilder';
import type { Product } from '../domain/entities';

export interface ScrapedCatalogSource {
  readCards(): Product[];
}

export class ScrapedCatalogAdapter implements ScrapedCatalogSource {
  constructor(private readonly path: string) {}

  readCards(): Product[] {
    const items: unknown = JSON.parse(readFileSync(this.path, 'utf8'));
    if (!Array.isArray(items)) throw new Error('el JSON del scraper debe ser una lista');
    const cards = buildCatalogCards(items);
    if (!cards.length) throw new Error('el JSON no contiene productos válidos');
    return cards;
  }
}
