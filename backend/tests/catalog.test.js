const test = require('node:test');
const assert = require('node:assert/strict');
const { analyzeName, extractSize, normalizeName } = require('../dist/domain/productNormalizer');
const { classifyCategory, CATEGORY } = require('../dist/domain/productClassifier');
const { buildCatalogCards, describeOffer } = require('../dist/domain/catalogBuilder');
const { ProductDetailService, computeUnitPrice } = require('../dist/services/ProductDetailService');
const { createInMemoryStore } = require('../dist/data/inMemoryStore');
const ProductRepository = require('../dist/repositories/ProductRepository');
const CatalogRepository = require('../dist/repositories/CatalogRepository');
const { basePrice, withStore, withUnitPrice } = require('../dist/services/pricePresenter');
const ReviewRepository = require('../dist/repositories/ReviewRepository');

const raw = (name, store, price, extra = {}) => ({ name, store, price, original_price: price, is_offer: false, image_url: '', sku_id: `${store}-${name}`, ...extra });

test('RF03: size extraction understands Colombian number formats', () => {
  assert.deepEqual(pick(extractSize(normalizeName('Arroz Estándar Albar 2.500 G'))), { amount: 2500, unit: 'g', count: 1 });
  assert.deepEqual(pick(extractSize(normalizeName('Arroz Diana 5 Kg'))), { amount: 5000, unit: 'g', count: 1 });
  assert.deepEqual(pick(extractSize(normalizeName('Leche Alpina Uht 1,1 Lt X6 Unds'))), { amount: 1100, unit: 'ml', count: 6 });
  assert.deepEqual(pick(extractSize(normalizeName('Aceite 900 Ml'))), { amount: 900, unit: 'ml', count: 1 });
  function pick({ amount, unit, count }) { return { amount, unit, count }; }
});

test('papel higiénico y seda dental se miden en metros y se comparan por metro', () => {
  const size = name => extractSize(normalizeName(name));
  assert.deepEqual([size('Papel Higiénico 3 H 12 Un Rendy 33 Mts').amount, size('Papel Higiénico 3 H 12 Un Rendy 33 Mts').unit, size('Papel Higiénico 3 H 12 Un Rendy 33 Mts').count], [33, 'm', 12]);
  assert.deepEqual([size('PAPEL HIGIÉNICO ROSAL 3P PLUS MEGA PACK 20M X15R').amount, size('PAPEL HIGIÉNICO ROSAL 3P PLUS MEGA PACK 20M X15R').count], [20, 15]);
  assert.deepEqual([size('PAPEL HIGIENICO SCOTT DOBLE HOJA X 16 ROLLOS X 20M').amount, size('PAPEL HIGIENICO SCOTT DOBLE HOJA X 16 ROLLOS X 20M').count], [20, 16]);
  assert.equal(size('Seda Dental Bucarine 50 Mts').unit, 'm');
  assert.equal(size('Esponja Scotch Brite 3M X2').amount, null, 'la marca 3M no es una medida');
  assert.equal(analyzeName('Papel Higiénico 3 H 12 Un Rendy 33 Mts').sizeLabel, '12 x 33 m');
  // 12 rollos × 33 m = 396 m → $14.800 / 396 ≈ $37 por metro
  assert.deepEqual(computeUnitPrice(14800, analyzeName('Papel Higiénico 3 H 12 Un Rendy 33 Mts')), { value: 37, per: 'm' });
  assert.deepEqual(computeUnitPrice(2000, analyzeName('Leche Entera 1 Lt')), { value: 2000, per: 'L' }, 'las demás medidas no cambian');
});

test('categories follow the scope document (plus Aseo personal, approved 26-nov-2026)', () => {
  assert.equal(classifyCategory('Arroz Diana 500 G'), CATEGORY.BASICS);
  assert.equal(classifyCategory('Aceite Vegetal Imatá 900 Ml'), CATEGORY.BASICS);
  assert.equal(classifyCategory('Fríjol Cargamanto Rojo 500 G'), CATEGORY.BASICS);
  assert.equal(classifyCategory('Leche Entera Alquería 1100 Ml'), CATEGORY.DAIRY);
  assert.equal(classifyCategory('Queso Mozzarella Tajado Latti 400 Grs'), CATEGORY.DAIRY);
  assert.equal(classifyCategory('Detergente en Polvo Ariel 2kg'), CATEGORY.HOME_CLEANING);
  assert.equal(classifyCategory('Jabón Rey Barra Ropa 300 G'), CATEGORY.HOME_CLEANING);
  // falsos amigos
  assert.equal(classifyCategory('Arroz con Leche Roa 150 g'), CATEGORY.OTHERS);
  assert.equal(classifyCategory('Aceite Corporal Nivea 100 Ml'), CATEGORY.OTHERS);
  assert.equal(classifyCategory('Pan Tajado Multigranos 450 G'), CATEGORY.OTHERS);
  assert.equal(classifyCategory('Huevos Rojos AA X30'), CATEGORY.OTHERS);
});

test('Aseo personal: higiene básica; los jabones de lavar siguen en Aseo del hogar', () => {
  for (const name of [
    'Crema Dental Colgate Triple Acción 100 ml', 'Pasta Dental Oral-B 3 Und', 'Cepillo de Dientes Medio Bucarine 2 Und',
    'Seda Dental Bucarine 50 Mts', 'Shampoo Tío Nacho Anticaída 415 Ml', 'Acondicionador Herbal Essences 250 ml',
    'Desodorante Dove Aerosol 150 Ml', 'Antitranspirante Old Spice en Barra 50 g', 'Toallas Higiénicas Kotex Nocturna 8 un',
    'Máquina de Afeitar Schick Quattro X 3', 'Pañuelos Familia 4 Paquetes', 'Pañitos Húmedos Almendra X 100 Und',
    'Dove Jabón Barra Leche de Coco 90 G', 'Jabón Antibacterial Protex Avena 110 G', 'Jabon Tocador Protex 220 Gr',
    'Jabón Íntimo Intibon Vinagre y Manzana 210 G'
  ]) assert.equal(classifyCategory(name), CATEGORY.PERSONAL_CARE, name);
  for (const name of [
    'Jabón de Coco Bonaropa 200 Grs', 'Jabón en Barra Brilla King 300 Gr', 'Jabón Coco Varela Original 300 G',
    'JAB DERSA BARRA LIMÓN 220G X3 UN', 'Jabón Líquido Panty Shower Ropa Íntima 300 Ml', 'Papel Higiénico Rendy 12 Un 33 Mts'
  ]) assert.equal(classifyCategory(name), CATEGORY.HOME_CLEANING, name);
  assert.equal(classifyCategory('Aceite Corporal Nivea 100 Ml'), CATEGORY.OTHERS, 'cuidado corporal no es higiene básica');
});

test('HU07: the same product in both stores becomes one card with two prices', () => {
  const cards = buildCatalogCards([
    raw('Arroz Diana 500 G', 'd1', 1990),
    raw('ARROZ DIANA 500 g', 'olimpica', 2100),
    raw('Arroz Diana 1 Kg', 'd1', 3900)
  ]);
  assert.equal(cards.length, 2);
  const both = cards.find(card => card.prices.length === 2);
  assert.deepEqual(both.prices.map(price => price.store_id).sort(), [1, 2]);
  assert.equal(both.unit, '500 g');
  assert.equal(cards[0].id, 1);
  assert.ok(cards[0].prices.length === 2, 'las tarjetas comparables van primero');
});

test('HU07: different sizes or brands are never merged into one comparison', () => {
  const cards = buildCatalogCards([
    raw('Arroz Diana 500 G', 'd1', 1990),
    raw('Arroz Diana 5 Kg', 'olimpica', 21950),
    raw('Aceite Imatá 900 Ml', 'd1', 6950),
    raw('Aceite Medalla de Oro Mezcla 900 Ml', 'olimpica', 6750)
  ]);
  assert.equal(cards.length, 4);
  assert.ok(cards.every(card => card.prices.length === 1));
});

test('catalog builder ignores invalid rows and unknown stores', () => {
  const cards = buildCatalogCards([
    raw('Sin precio', 'd1', 0),
    { name: '', store: 'd1', price: 100 },
    raw('Producto Exito', 'exito', 100),
    raw('Arroz Diana 500 G', 'd1', 1990)
  ]);
  assert.equal(cards.length, 1);
});

test('HU08: offers carry a readable detail even when the store gives none', () => {
  const [card] = buildCatalogCards([raw('Leche Alpina 1 Lt', 'olimpica', 3000, { original_price: 4000, is_offer: true, offer_desc: '' })]);
  assert.equal(card.prices[0].is_offer, true);
  assert.match(card.prices[0].offer_description, /Antes \$4\.000.*25%/);
  assert.equal(describeOffer(100, 100, ''), '');
  assert.equal(describeOffer(100, 200, 'Promo 2x1'), 'Promo 2x1');
});

test('RF07: product detail exposes unit prices and similar products from other sizes', () => {
  const store = createInMemoryStore();
  store.products = buildCatalogCards([
    raw('Arroz Diana 500 G', 'd1', 2000),
    raw('Arroz Diana 1 Kg', 'olimpica', 3600),
    raw('Detergente Ariel 2 Kg', 'd1', 20000)
  ]).map((card, index) => ({ ...card, id: index + 1 }));
  const catalogRepository = new CatalogRepository(store);
  const service = new ProductDetailService({ productRepository: new ProductRepository(store), catalogRepository,
    reviewRepository: new ReviewRepository(store), detailPrice: withUnitPrice(withStore(basePrice, catalogRepository)) });
  const target = store.products.find(product => product.name === 'Arroz Diana 500 G');
  const detail = service.getDetail(target.id);
  assert.deepEqual(detail.product.prices[0].unit_price, { value: 4000, per: 'kg' });
  assert.equal(detail.product.category_name, 'Granos y Básicos');
  assert.deepEqual(detail.similar.map(item => item.name), ['Arroz Diana 1 Kg']);
  assert.equal(detail.similar[0].prices[0].unit_price.value, 3600);
  assert.equal(computeUnitPrice(1000, analyzeName('Producto sin tamaño')), null);
});

test('las imágenes genéricas de relleno no se usan como foto del producto', () => {
  const placeholder = 'https://olimpica.vtexassets.com/arquivos/ids/737496/imagen-generia-supermercado.png';
  const real = 'https://d1tiendas.vtexassets.com/arquivos/ids/1/arroz.png';
  const cards = buildCatalogCards([
    { name: 'Arroz Diana 500 G', price: 2000, original_price: 2000, store: 'olimpica', image_url: placeholder },
    { name: 'Arroz Diana 500 G', price: 1900, original_price: 1900, store: 'd1', image_url: real }
  ]);
  assert.equal(cards.length, 1);
  assert.equal(cards[0].image_url, real);
});
