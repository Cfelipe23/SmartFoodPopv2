import { join } from 'node:path';

const isProduction = process.env.NODE_ENV === 'production';

if (isProduction && !process.env.JWT_SECRET) {
  throw new Error('JWT_SECRET es obligatorio cuando NODE_ENV=production');
}

const env = {
  NODE_ENV: process.env.NODE_ENV || 'development',
  IS_PRODUCTION: isProduction,
  PORT: process.env.PORT || 5000,
  // Solo para desarrollo: en producción el secreto debe venir del entorno.
  JWT_SECRET: process.env.JWT_SECRET || 'dev-only-secret-change-me',
  // PostgreSQL (opcional en desarrollo; sin estas variables el servidor usa memoria).
  DATABASE_URL: process.env.DATABASE_URL || '',
  PGHOST: process.env.PGHOST || '',
  PGUSER: process.env.PGUSER || '',
  PGPASSWORD: process.env.PGPASSWORD || '',
  PGPORT: process.env.PGPORT || 5432,
  PGDATABASE: process.env.PGDATABASE || '',
  // Si es "true", reconstruye el catálogo en la base desde el JSON del scraper.
  RESEED_CATALOG: process.env.RESEED_CATALOG === 'true',
  SCRAPED_PRODUCTS_PATH: process.env.SCRAPED_PRODUCTS_PATH
    || join(__dirname, '../../../scraper/output/scraped_products_api.json')
};

export = env;
