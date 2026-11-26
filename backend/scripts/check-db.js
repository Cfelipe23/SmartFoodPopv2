// Comprueba la conexión a PostgreSQL con la configuración de backend/.env.
// Uso: npm run db:check   (desde la carpeta backend o desde la raíz: npm --prefix backend run db:check)
require('dotenv').config();

const env = require('../src/config/env');
const { PostgresPersistence, describeDbError } = require('../dist/data/PostgresPersistence');

async function main() {
  const persistence = PostgresPersistence.fromEnv(env);
  if (!persistence) {
    console.error('✖ PostgreSQL NO está configurado.');
    console.error('  Crea backend/.env (copia backend/.env.example) y define DATABASE_URL, por ejemplo:');
    console.error('  DATABASE_URL=postgres://postgres:TU_CLAVE@localhost:5432/smartfoodpop');
    process.exit(1);
  }

  try {
    const { rows: info } = await persistence.pool.query('SELECT current_database() AS db, current_user AS usuario, version() AS version');
    console.log(`✔ Conectado a la base "${info[0].db}" como "${info[0].usuario}"`);
    console.log(`  ${info[0].version.split(',')[0]}`);

    const { rows: tables } = await persistence.pool.query(
      "SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' ORDER BY table_name"
    );
    if (!tables.length) {
      console.log('  Aún no hay tablas: se crearán solas la primera vez que arranques el backend (npm run dev).');
    } else {
      for (const { table_name: name } of tables) {
        const { rows } = await persistence.pool.query(`SELECT COUNT(*) AS total FROM "${name}"`);
        console.log(`  · ${name}: ${rows[0].total} filas`);
      }
    }
    await persistence.pool.end();
  } catch (error) {
    console.error(`✖ ${describeDbError(error)}`);
    await persistence.pool.end().catch(() => {});
    process.exit(1);
  }
}

main();
