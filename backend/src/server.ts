import { join } from 'node:path';
import { config } from 'dotenv';

// Carga las variables antes de evaluar los módulos que las leen.
config({ path: join(__dirname, '../.env') });

import env = require('./config/env');
import { bootstrapContainer } from './container';
import { createApp } from './app';

async function main(): Promise<void> {
  const { PORT } = env;
  const container = await bootstrapContainer();
  const app = createApp(container);
  const onListening = () => {
    console.log(`🚀 SmartFoodPop Backend Server corriendo en http://localhost:${PORT}`);
  };
  const server = typeof PORT === 'string' ? app.listen(PORT, onListening) : app.listen(PORT, onListening);
  // Cuando el scraper termina (npm run dev lo ejecuta al iniciar), se cargan los precios nuevos.
  const stopWatching = container.catalogRefreshService.watch();

  const shutdown = async (): Promise<void> => {
    stopWatching();
    server.close();
    await container.persistence.close();
    process.exit(0);
  };
  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);
}

main().catch((error: unknown) => {
  const message = error instanceof Error ? error.message : String(error);
  console.error('❌ No se pudo iniciar el servidor:', message);
  process.exit(1);
});
