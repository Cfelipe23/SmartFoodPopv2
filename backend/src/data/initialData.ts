// Seed Data and In-Memory Data Store for SmartFoodPop (Popayán)
// Alcance: Exclusivamente tiendas locales D1 y Olímpica según sección 2.4 del documento de alcance

import type { Category, Favorite, Product, Review, Store, User } from '../domain/entities';

type DemoUser = Omit<User, 'password_hash'> & { passwordEnv: string; defaultPassword: string };

export const initialStores: Store[] = [
  { id: 1, name: 'Tiendas D1', code: 'd1', logo: '🏬', city: 'Popayán', address: 'Calle 5 # 7-23, Centro' },
  { id: 2, name: 'Supermercado Olímpica', code: 'olimpica', logo: '🛒', city: 'Popayán', address: 'Carrera 9 # 18N-12, Catay' }
];

// Categorías del alcance (documento, sección 6.1 ítem 8) más «Aseo Personal», aprobada por el equipo el 26-nov-2026.
export const initialCategories: Category[] = [
  { id: 1, name: 'Granos y Básicos', slug: 'granos-y-basicos', icon: '🌾' },
  { id: 2, name: 'Lácteos', slug: 'lacteos', icon: '🥛' },
  { id: 3, name: 'Aseo del Hogar', slug: 'aseo-del-hogar', icon: '🧹' },
  { id: 4, name: 'Otros', slug: 'otros', icon: '🛍️' },
  { id: 5, name: 'Aseo Personal', slug: 'aseo-personal', icon: '🧴' }
];

export const initialProducts: Product[] = [
  {
    id: 1,
    name: 'Arroz Blanco Seleccionado (Diana / Albar)',
    description: 'Arroz blanco de grano entero de alta calidad para el hogar en Popayán.',
    category_id: 1,
    unit: 'Bolsa 1000g - 2500g',
    image_url: 'https://d1tiendas.vtexassets.com/arquivos/ids/207234/Diana-vitamor-talega500g-Alimentos-300001-Rojo-Lateral-12002073-01.png?v=639270713083670000',
    prices: [
      { store_id: 1, price: 3990, previous_price: 4200, is_offer: true, offer_description: 'Precio Ahorro D1 (Albar 1000g)' },
      { store_id: 2, price: 4450, previous_price: 4700, is_offer: false, offer_description: 'Precio regular Olímpica' }
    ]
  },
  {
    id: 2,
    name: 'Leche Deslactosada UHT (Latti / Alpina 900ml - 1.1L)',
    description: 'Leche líquida deslactosada UHT de fácil digestión para toda la familia.',
    category_id: 2,
    unit: 'Bolsa / Tetrapak 900ml - 1100ml',
    image_url: 'https://d1tiendas.vtexassets.com/arquivos/ids/199194/leche-deslactosada-latti-900ml-12000245-01.png.png?v=639179635419670000',
    prices: [
      { store_id: 1, price: 3400, previous_price: 3600, is_offer: true, offer_description: 'Oferta Latti D1' },
      { store_id: 2, price: 4250, previous_price: 4250, is_offer: false, offer_description: '' }
    ]
  },
  {
    id: 3,
    name: 'Huevos Rojos Tipo A / AA X30 (Sol Naciente / Kikes)',
    description: 'Cubeta de 30 huevos frescos clasificados producidos en la región.',
    category_id: 4,
    unit: 'Cubeta x30 unidades',
    image_url: 'https://d1tiendas.vtexassets.com/arquivos/ids/199498/huevo-tipo-a-sol-naciente-30und-12000344-01.png.png?v=639179641011170000',
    prices: [
      { store_id: 1, price: 13490, previous_price: 14500, is_offer: true, offer_description: 'Ahorro especial D1 (Sol Naciente)' },
      { store_id: 2, price: 14100, previous_price: 15900, is_offer: true, offer_description: 'Miércoles de mercado Olímpica' }
    ]
  },
  {
    id: 4,
    name: 'Aceite Vegetal / Girasol 900ml (Imatá / Medalla de Oro)',
    description: 'Aceite 100% puro libre de colesterol para preparaciones cotidianas.',
    category_id: 1,
    unit: 'Botella 900 ml',
    image_url: 'https://d1tiendas.vtexassets.com/arquivos/ids/201946/aceite-vegetal-imata-900ml-12004358-01.png.png?v=639179698978470000',
    prices: [
      { store_id: 1, price: 6950, previous_price: 7500, is_offer: true, offer_description: 'Precio Bajo D1 (Imatá)' },
      { store_id: 2, price: 6490, previous_price: 6490, is_offer: false, offer_description: 'Medalla de Oro Olímpica' }
    ]
  },
  {
    id: 5,
    name: 'Detergente Multiusos en Polvo (Bonaropa / UltraLimp)',
    description: 'Detergente concentrado para lavado de ropa y superficies del hogar.',
    category_id: 3,
    unit: 'Bolsa 2.5 kg - 2.8 kg',
    image_url: 'https://d1tiendas.vtexassets.com/arquivos/ids/199406/detergente-en-polvo-multiusos-bonaropa-2800gr-12000310-01.png.png?v=639179639341530000',
    prices: [
      { store_id: 1, price: 10850, previous_price: 11900, is_offer: true, offer_description: 'Bonaropa 2800g D1' },
      { store_id: 2, price: 9650, previous_price: 10500, is_offer: true, offer_description: 'UltraLimp 2500g Olímpica' }
    ]
  },
  {
    id: 6,
    name: 'Fríjol Cargamanto Rojo (El Estío D1 / Zenú Olímpica)',
    description: 'Fríjol seleccionado de excelente cocción para bandeja tradicional y sopas.',
    category_id: 1,
    unit: 'Bolsa 500g',
    image_url: 'https://d1tiendas.vtexassets.com/arquivos/ids/198841/frijol-cargamanto-rojo-500gr-12000041-1.png.png?v=639179627679600000',
    prices: [
      { store_id: 1, price: 5850, previous_price: 6200, is_offer: true, offer_description: 'El Estío Cargamanto D1 500g' },
      { store_id: 2, price: 7850, previous_price: 7850, is_offer: false, offer_description: 'Zenú / Azteca Olímpica' }
    ]
  }
];

// Cuentas de demostración. Las contraseñas se toman del entorno (o valores de desarrollo)
// y SIEMPRE se guardan como hash bcrypt (ver inMemoryStore.js).
export const demoUsers: DemoUser[] = [
  { id: 1, name: 'Usuario Demo Popayán', email: 'usuario@popayan.com', role: 'consumer', passwordEnv: 'SEED_USER_PASSWORD', defaultPassword: 'user123' },
  { id: 2, name: 'Administrador SmartFood', email: 'admin@smartfood.com', role: 'admin', passwordEnv: 'SEED_ADMIN_PASSWORD', defaultPassword: 'admin123' }
];

// Las reseñas y favoritos los generan los usuarios reales; no se siembran datos inventados.
export const initialReviews: Review[] = [];
export const initialFavorites: Favorite[] = [];
