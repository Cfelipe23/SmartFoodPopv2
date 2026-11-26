import { fileURLToPath } from 'node:url';
import { createServer } from 'vite';

// Vite resuelve TypeScript e import.meta.env con el mismo cargador que usa la aplicación.
export function createTestModules() {
  return createServer({
    root: fileURLToPath(new URL('../', import.meta.url)),
    configFile: false,
    envDir: false,
    mode: 'test',
    optimizeDeps: { noDiscovery: true, include: [] },
    server: { middlewareMode: true, watch: null, hmr: false, ws: false }
  });
}
