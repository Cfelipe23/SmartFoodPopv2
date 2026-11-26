const { NoopPersistence } = require('../data/persistence');

class UserRepository {
  constructor(store, persistence = new NoopPersistence()) {
    this.store = store;
    this.persistence = persistence;
  }

  add(newUser) {
    const users = this.store.users;
    newUser.id = users.length ? Math.max(...users.map(u => u.id)) + 1 : 1;
    users.push(newUser);
    this.persistence.saveUser(newUser);
    return newUser;
  }

  findByEmail(email) {
    return this.store.users.find(u => u.email.toLowerCase() === String(email).toLowerCase());
  }
}

module.exports = UserRepository;
