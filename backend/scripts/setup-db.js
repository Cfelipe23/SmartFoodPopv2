// Configura PostgreSQL para SmartFoodPop en un solo paso:
//   1. pide la contraseña del usuario de PostgreSQL (no se muestra ni se guarda en otro lugar que backend/.env),
//   2. crea la base de datos "smartfoodpop" si no existe,
//   3. escribe DATABASE_URL (y un JWT_SECRET aleatorio) en backend/.env.
// Uso: npm run db:setup          (opcional: PGUSER, PGHOST, PGPORT, PGDATABASE, PGPASSWORD como variables de entorno)
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const readline = require('readline');
const { Client } = require('pg');
const { describeDbError } = require('../src/data/PostgresPersistence');

const ENV_PATH = path.join(__dirname, '../.env');
const host = process.env.PGHOST || 'localhost';
const port = process.env.PGPORT || '5432';
const user = process.env.PGUSER || 'postgres';
const database = process.env.PGDATABASE || 'smartfoodpop';

function askHidden(question) {
  return new Promise(resolve => {
    const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
    rl.stdoutMuted = false;
    rl._writeToOutput = text => { if (!rl.stdoutMuted) rl.output.write(text); };
    rl.question(question, answer => { rl.output.write('\n'); rl.close(); resolve(answer); });
    rl.stdoutMuted = true;
  });
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

async function main() {
  if (!/^[a-z_][a-z0-9_]*$/i.test(database)) throw new Error(`Nombre de base de datos no válido: ${database}`);
  const password = process.env.PGPASSWORD ?? await askHidden(`Contraseña de PostgreSQL para el usuario "${user}" (${host}:${port}): `);

  const admin = new Client({ host, port: Number(port), user, password, database: 'postgres' });
  try {
    await admin.connect();
  } catch (error) {
    console.error(`✖ ${describeDbError(error)}`);
    process.exit(1);
  }

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
  console.log('✔ backend/.env actualizado (DATABASE_URL y JWT_SECRET).');
  console.log('\nListo. Ahora ejecuta "npm run dev": el backend creará las tablas y guardará el catálogo.');
  console.log('En pgAdmin: Databases → ' + database + ' → Schemas → public → Tables (clic derecho → Refresh).');
}

main().catch(error => {
  console.error(`✖ ${error.message}`);
  process.exit(1);
});
