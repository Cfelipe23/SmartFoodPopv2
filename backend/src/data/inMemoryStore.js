const { initialStores, initialCategories, initialProducts, demoUsers, initialReviews, initialFavorites } = require('./initialData');
const { BcryptPasswordHasher } = require('../services/PasswordHasher');

// Hash de las cuentas de demostración (nunca se guarda la contraseña en texto plano).
function buildDemoUsers(hasher = new BcryptPasswordHasher()) {
  return demoUsers.map(({ passwordEnv, defaultPassword, ...user }) => ({
    ...user,
    password_hash: hasher.hashSync(process.env[passwordEnv] || defaultPassword)
  }));
}

// Estado en memoria. Con PostgreSQL configurado se rellena desde la base (ver PostgresPersistence).
function createInMemoryStore() {
  return {
    stores: initialStores.map(store => ({ ...store })),
    categories: initialCategories.map(category => ({ ...category })),
    products: initialProducts.map(product => ({ ...product, prices: product.prices.map(price => ({ ...price })) })),
    users: buildDemoUsers(),
    reviews: [...initialReviews],
    favorites: [...initialFavorites]
  };
}

module.exports = { createInMemoryStore, buildDemoUsers };
