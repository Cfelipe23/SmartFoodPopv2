const test = require('node:test');
const assert = require('node:assert/strict');
const { buildEquivalenceIndex, computeUnitPrice, analysisOf } = require('../src/domain/productEquivalence');
const { analyzeName } = require('../src/domain/productNormalizer');

const item = (id, name, store_id, price) => ({ id, name, description: '', category_id: 1, unit: '', image_url: '', prices: [{ store_id, price, previous_price: price, is_offer: false }] });

test('RF07: las marcas propias de una tienda no impiden emparejar el mismo tipo de producto', () => {
  const products = [
    item(1, 'Leche Deslactosada Bolsa UHT Latti 900 Ml', 1, 3200),
    item(2, 'Leche Colanta Deslactosada 1000 ml', 2, 4100),
    item(3, 'Leche Entera Alpina 1000 ml', 2, 4300),
    item(4, 'Leche Entera Latti 1000 ml', 1, 3300)
  ];
  const index = buildEquivalenceIndex(products);
  assert.equal(index.get(1).product.id, 2, 'deslactosada con deslactosada');
  assert.equal(index.get(4).product.id, 3, 'entera con entera');
});

test('RF07: no se empareja un tipo de producto con otro distinto que solo comparte una palabra', () => {
  const products = [
    item(1, 'Arepa Extra Queso Masmai 480 Gr', 1, 5000),
    item(2, 'Queso Colanta Mozzarella 450 G', 2, 12000),
    item(3, 'Queso Alpina Mozzarella 450 G', 1, 11000),
    item(4, 'Arepa Gransoli con Queso 450 G', 2, 4800)
  ];
  const index = buildEquivalenceIndex(products);
  assert.equal(index.get(1).product.id, 4, 'arepa con arepa');
  assert.equal(index.get(3).product.id, 2, 'queso con queso');
});

test('RF07: precio por litro multiplica los envases; en sólidos el peso ya es el total del empaque', () => {
  assert.deepEqual(computeUnitPrice(6000, analyzeName('Té Hatsu 200 Ml X6 Unds')), { value: 5000, per: 'L' });
  assert.deepEqual(computeUnitPrice(9000, analyzeName('Butifarra Montefrío 450 G X18 Unds')), { value: 20000, per: 'kg' });
  assert.deepEqual(computeUnitPrice(3600, analyzeName('Arroz Diana 1 Kg')), { value: 3600, per: 'kg' });
  assert.equal(computeUnitPrice(500, analyzeName('Banano Unidad')), null);
  assert.equal(typeof analysisOf, 'function');
});
