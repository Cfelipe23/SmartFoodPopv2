/**
 * SmartFoodPop - Orchestrator Script
 * Runs both Backend (Express) and Frontend (Vite React) simultaneously.
 */

const { spawn } = require('child_process');
const path = require('path');

const rootDir = __dirname;
const isWin = process.platform === 'win32';
const npmCmd = isWin ? 'npm.cmd' : 'npm';

// ANSI Color Codes for terminal readability
const colors = {
  reset: '\x1b[0m',
  cyan: '\x1b[36m',
  magenta: '\x1b[35m',
  yellow: '\x1b[33m',
  red: '\x1b[31m',
  green: '\x1b[32m'
};

console.log(`${colors.cyan}====================================================${colors.reset}`);
console.log(`${colors.cyan}  🚀 SmartFoodPop - Starting Full-Stack Application  ${colors.reset}`);
console.log(`${colors.cyan}====================================================${colors.reset}\n`);

function logPrefix(prefix, color, data) {
  const lines = data.toString().split('\n');
  lines.forEach((line) => {
    if (line.trim().length > 0) {
      console.log(`${color}[${prefix}]${colors.reset} ${line}`);
    }
  });
}

// 1. Start Backend Server
const backendProc = spawn(`${npmCmd} run dev`, {
  cwd: path.join(rootDir, 'backend'),
  shell: true
});

backendProc.stdout.on('data', (data) => logPrefix('BACKEND ', colors.magenta, data));
backendProc.stderr.on('data', (data) => logPrefix('BACKEND ', colors.red, data));

// 2. Start Frontend Server
const frontendProc = spawn(`${npmCmd} run dev`, {
  cwd: path.join(rootDir, 'frontend'),
  shell: true
});

frontendProc.stdout.on('data', (data) => logPrefix('FRONTEND', colors.cyan, data));
frontendProc.stderr.on('data', (data) => logPrefix('FRONTEND', colors.red, data));

// 3. Actualiza los precios: ejecuta el scraper en segundo plano. La app ya funciona con los
//    últimos precios guardados y el backend carga los nuevos en cuanto el scraper termina.
//    Para omitirlo: `npm run dev -- --no-scrape` o SCRAPE_ON_START=false.
const skipScrape = process.argv.includes('--no-scrape') || process.env.SCRAPE_ON_START === 'false';
let scraperProc = null;

function startScraper() {
  const python = process.env.PYTHON || (isWin ? 'python' : 'python3');
  console.log(`${colors.yellow}[SCRAPER ] Actualizando precios de D1 y Olímpica en segundo plano (tarda unos minutos)...${colors.reset}`);
  scraperProc = spawn(python, [path.join('scraper', 'scraper.py')], { cwd: rootDir, env: { ...process.env, PYTHONIOENCODING: 'utf-8' } });
  // El scraper registra cada petición; solo se muestran avisos, errores y el resumen final.
  const relevant = line => /WARNING|ERROR|productos válidos|Proceso finalizado/.test(line);
  const onData = data => data.toString().split(/\r?\n/).filter(relevant).forEach(line => logPrefix('SCRAPER ', colors.yellow, line));
  scraperProc.stdout.on('data', onData);
  scraperProc.stderr.on('data', onData);
  scraperProc.on('error', error => {
    console.log(`${colors.red}[SCRAPER ] No se pudo ejecutar Python (${error.message}). La app sigue con los precios guardados; instala Python 3 y "pip install requests".${colors.reset}`);
  });
  scraperProc.on('close', code => {
    scraperProc = null;
    if (code === 0) console.log(`${colors.green}[SCRAPER ] Listo: el backend cargó los precios nuevos (recarga la página).${colors.reset}`);
    else if (code !== null) console.log(`${colors.red}[SCRAPER ] Terminó con errores (código ${code}); se conservan los precios anteriores.${colors.reset}`);
  });
}

if (skipScrape) console.log(`${colors.yellow}[SCRAPER ] Omitido: se usan los precios guardados.${colors.reset}`);
else startScraper();

// Graceful Termination
function cleanup() {
  console.log(`\n${colors.yellow}Shutting down Backend and Frontend processes...${colors.reset}`);
  if (isWin) {
    if (backendProc.pid) spawn('taskkill', ['/pid', backendProc.pid, '/f', '/t']);
    if (frontendProc.pid) spawn('taskkill', ['/pid', frontendProc.pid, '/f', '/t']);
    if (scraperProc?.pid) spawn('taskkill', ['/pid', scraperProc.pid, '/f', '/t']);
  } else {
    backendProc.kill('SIGTERM');
    frontendProc.kill('SIGTERM');
    scraperProc?.kill('SIGTERM');
  }
  process.exit(0);
}

process.on('SIGINT', cleanup);
process.on('SIGTERM', cleanup);
