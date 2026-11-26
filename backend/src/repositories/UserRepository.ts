import type { InMemoryStore } from '../data/inMemoryStore';
import { NoopPersistence } from '../data/persistence';
import type { Persistence } from '../data/persistence';
import type { User } from '../domain/entities';

class UserRepository {
  constructor(readonly store: InMemoryStore, readonly persistence: Persistence = new NoopPersistence()) {}

  add(newUser: Omit<User, 'id'>): User {
    const users = this.store.users;
    const id = users.length ? Math.max(...users.map(u => u.id)) + 1 : 1;
    const user = Object.assign(newUser, { id });
    users.push(user);
    this.persistence.saveUser(user);
    return user;
  }

  findByEmail(email: unknown): User | undefined {
    return this.store.users.find(u => u.email.toLowerCase() === String(email).toLowerCase());
  }
}

export = UserRepository;
