import type { Category, Favorite, Product, Review, Store, User } from '../domain/entities';
import { BcryptPasswordHasher } from '../services/PasswordHasher';
import { initialStores, initialCategories, initialProducts, demoUsers, initialReviews, initialFavorites } from './initialData';

export interface InMemoryStore {
  stores: Store[];
  categories: Category[];
  products: Product[];
  users: User[];
  reviews: Review[];
  favorites: Favorite[];
  catalogVersion?: number;
}

interface SyncPasswordHasher {
  hashSync(password: string): string;
}

// Hash de las cuentas de demostración (nunca se guarda la contraseña en texto plano).
export function buildDemoUsers(hasher: SyncPasswordHasher = new BcryptPasswordHasher()): User[] {
  return demoUsers.map(({ passwordEnv, defaultPassword, ...user }) => ({
    ...user,
    password_hash: hasher.hashSync(process.env[passwordEnv] || defaultPassword)
  }));
}

// Estado en memoria. Con PostgreSQL configurado se rellena desde la base (ver PostgresPersistence).
export function createInMemoryStore(): InMemoryStore {
  return {
    stores: initialStores.map(store => ({ ...store })),
    categories: initialCategories.map(category => ({ ...category })),
    products: initialProducts.map(product => ({ ...product, prices: product.prices.map(price => ({ ...price })) })),
    users: buildDemoUsers(),
    reviews: [...initialReviews],
    favorites: [...initialFavorites]
  };
}
