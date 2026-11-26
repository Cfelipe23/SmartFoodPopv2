const { copyFileSync, mkdirSync } = require('node:fs');
const { join } = require('node:path');

function copySchema() {
  const target = join(__dirname, '../dist/data');
  mkdirSync(target, { recursive: true });
  copyFileSync(join(__dirname, '../src/data/schema.sql'), join(target, 'schema.sql'));
}

if (require.main === module) copySchema();

module.exports = { copySchema };
