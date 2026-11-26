require('dotenv').config();

const { PORT } = require('./config/env');
const { bootstrapContainer } = require('./container');
const { createApp } = require('./app');

async function main() {
  const container = await bootstrapContainer();
  const app = createApp(container);
  const server = app.listen(PORT, () => {
    console.log(`🚀 SmartFoodPop Backend Server corriendo en http://localhost:${PORT}`);
  });
  // Cuando el scraper termina (npm run dev lo ejecuta al iniciar), se cargan los precios nuevos.
  const stopWatching = container.catalogRefreshService.watch();

  const shutdown = async () => {
    stopWatching();
    server.close();
    await container.persistence.close();
    process.exit(0);
  };
  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);
}

main().catch(error => {
  console.error('❌ No se pudo iniciar el servidor:', error.message);
  process.exit(1);
});
