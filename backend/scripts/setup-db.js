// Configura PostgreSQL para SmartFoodPop en un solo paso:
//   1. busca PostgreSQL en este equipo (puertos 5432-5434) y, si el servicio está apagado, explica cómo encenderlo,
//   2. pide la contraseña del usuario "postgres" (hasta 3 intentos; no se muestra ni se guarda fuera de backend/.env),
//   3. crea la base de datos "smartfoodpop" si no existe,
//   4. escribe DATABASE_URL (y un JWT_SECRET aleatorio) en backend/.env.
// Las tablas y el catálogo los crea el backend al arrancar.
// Uso: npm run db:setup          (opcional: PGUSER, PGHOST, PGPORT, PGDATABASE, PGPASSWORD como variables de entorno)
// Código de salida: 0 listo · 1 error · 2 PostgreSQL no disponible (start.bat sigue en modo memoria).
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const readline = require('readline');
const net = require('net');
const { execSync } = require('child_process');
const { Client } = require('pg');
const { describeDbError } = require('../dist/data/PostgresPersistence');

const ENV_PATH = path.join(__dirname, '../.env');
const host = process.env.PGHOST || 'localhost';
const CANDIDATE_PORTS = process.env.PGPORT ? [process.env.PGPORT] : ['5432', '5433', '5434'];
const MAX_ATTEMPTS = 3;
const user = process.env.PGUSER || 'postgres';
const database = process.env.PGDATABASE || 'smartfoodpop';

// Un único lector de la entrada para todos los intentos (no pierde líneas) y sin eco: la clave no se ve.
let reader = null;
let lines = null;
function inputLines() {
  if (!reader) {
    reader = readline.createInterface({ input: process.stdin, output: process.stdout, terminal: Boolean(process.stdin.isTTY) });
    reader._writeToOutput = () => {};
    lines = reader[Symbol.asyncIterator]();
  }
  return lines;
}

async function askHidden(question) {
  process.stdout.write(question);
  const { value, done } = await inputLines().next();
  process.stdout.write('\n');
  if (done) throw new Error('No se recibió la contraseña.');
  return value;
}

function closeInput() {
  if (reader) reader.close();
}

// Conserva las demás variables del .env y reemplaza (o agrega) solo las indicadas.
function upsertEnv(values) {
  const lines = fs.existsSync(ENV_PATH) ? fs.readFileSync(ENV_PATH, 'utf8').split(/\r?\n/) : [];
  for (const [key, value] of Object.entries(values)) {
    const index = lines.findIndex(line => line.startsWith(`${key}=`));
    if (index === -1) lines.push(`${key}=${value}`);
    else if (key === 'DATABASE_URL') lines[index] = `${key}=${value}`;
  }
  fs.writeFileSync(ENV_PATH, lines.filter((line, i) => line !== '' || i < lines.length - 1).join('\n').trimEnd() + '\n');
}

// ¿Hay algo escuchando en host:port?
function isListening(port) {
  return new Promise(resolve => {
    const socket = net.connect({ host, port: Number(port) });
    const done = ok => { socket.destroy(); resolve(ok); };
    socket.setTimeout(1500, () => done(false));
    socket.once('connect', () => done(true));
    socket.once('error', () => done(false));
  });
}

// Windows: servicios de PostgreSQL instalados y su estado. La salida de `sc` cambia de idioma
// (SERVICE_NAME / NOMBRE_SERVICIO), pero los estados (RUNNING, STOPPED…) siempre van en inglés.
function windowsPostgresServices() {
  if (process.platform !== 'win32') return [];
  const run = command => execSync(command, { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] });
  try {
    const names = [...run('sc query state= all').matchAll(/^[A-Z_]+:\s*(postgresql\S*)\s*$/gim)].map(match => match[1]);
    return names.map(name => {
      const state = run(`sc query "${name}"`).match(/:\s*\d\s+(RUNNING|STOPPED|START_PENDING|STOP_PENDING|PAUSED)/);
      return { name, state: state ? state[1] : 'UNKNOWN' };
    });
  } catch {
    return [];
  }
}

function explainNotRunning() {
  const services = windowsPostgresServices();
  const stopped = services.find(service => service.state !== 'RUNNING');
  if (stopped) {
    console.error(`✖ PostgreSQL está instalado pero apagado (servicio "${stopped.name}").`);
    console.error('  Enciéndelo: tecla Windows → "Servicios" → busca el servicio → clic derecho → Iniciar');
    console.error(`  (o en una terminal de administrador: net start ${stopped.name}) y vuelve a abrir start.bat.`);
  } else if (services.length) {
    console.error(`✖ PostgreSQL (${services[0].name}) está encendido pero no responde en ${host} (puertos ${CANDIDATE_PORTS.join(', ')}).`);
    console.error('  Si usa otro puerto, ejecuta: set PGPORT=<puerto> y luego npm run db:setup');
  } else {
    console.error(`✖ No se encontró PostgreSQL en ${host} (puertos ${CANDIDATE_PORTS.join(', ')}).`);
    console.error('  Instálalo desde https://www.postgresql.org/download/ y vuelve a abrir start.bat.');
  }
}

async function connectWithRetries(port) {
  const fixedPassword = process.env.PGPASSWORD;
  for (let attempt = 1; attempt <= (fixedPassword === undefined ? MAX_ATTEMPTS : 1); attempt++) {
    const password = fixedPassword ?? await askHidden(
      `Contraseña de PostgreSQL del usuario "${user}" (la que pusiste al instalarlo): `
    );
    const client = new Client({ host, port: Number(port), user, password, database: 'postgres' });
    try {
      await client.connect();
      return { client, password };
    } catch (error) {
      await client.end().catch(() => {});
      const wrongPassword = error.code === '28P01' || error.code === '28000';
      if (!wrongPassword) throw new Error(describeDbError(error));
      console.error(`✖ Contraseña incorrecta (intento ${attempt} de ${fixedPassword === undefined ? MAX_ATTEMPTS : 1}).`);
    }
  }
  throw new Error('No se pudo entrar a PostgreSQL. Si olvidaste la contraseña, cámbiala en pgAdmin y ejecuta de nuevo: npm run db:setup');
}

async function main() {
  if (!/^[a-z_][a-z0-9_]*$/i.test(database)) throw new Error(`Nombre de base de datos no válido: ${database}`);

  let port = null;
  for (const candidate of CANDIDATE_PORTS) {
    if (await isListening(candidate)) { port = candidate; break; }
  }
  if (!port) {
    explainNotRunning();
    process.exit(2);
  }
  console.log(`✔ PostgreSQL encontrado en ${host}:${port}.`);

  const { client: admin, password } = await connectWithRetries(port);
  const { rows } = await admin.query('SELECT 1 FROM pg_database WHERE datname = $1', [database]);
  if (rows.length) {
    console.log(`✔ La base "${database}" ya existe.`);
  } else {
    await admin.query(`CREATE DATABASE ${database}`);
    console.log(`✔ Base "${database}" creada.`);
  }
  await admin.end();

  const url = `postgres://${encodeURIComponent(user)}:${encodeURIComponent(password)}@${host}:${port}/${database}`;
  upsertEnv({ PORT: '5000', JWT_SECRET: crypto.randomBytes(32).toString('hex'), DATABASE_URL: url });
  console.log('✔ backend/.env creado: el backend creará las tablas y guardará el catálogo al arrancar.');
  console.log(`  Para verlas en pgAdmin: Databases → ${database} → Schemas → public → Tables (clic derecho → Refresh).`);
}

main().then(closeInput, error => {
  closeInput();
  console.error(`✖ ${error.message}`);
  process.exit(1);
});
