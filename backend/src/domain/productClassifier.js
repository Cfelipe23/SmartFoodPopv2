const { getProductImageByName } = require('./imageResolver');

// Clasifica y agrupa productos raspados en tarjetas canónicas
function getCanonicalProductGroup(name, providedImageUrl) {
  const nameLower = (name || '').toLowerCase();

  if (nameLower.includes('leche')) {
    if (nameLower.includes('condensada')) {
      return {
        key: 'leche-condensada',
        name: 'Leche Condensada (300g)',
        category_id: 2,
        unit: 'Doypack / Lata 300g',
        image_url: providedImageUrl || getProductImageByName(name),
        description: 'Leche condensada azucarada ideal para postres y repostería.'
      };
    }
    if (nameLower.includes('polvo')) {
      return {
        key: 'leche-en-polvo',
        name: 'Leche en Polvo Entera',
        category_id: 2,
        unit: 'Bolsa / Tarro 350g - 1000g',
        image_url: providedImageUrl || getProductImageByName(name),
        description: 'Leche entera en polvo deshidratada de alta solubilidad.'
      };
    }
    if (nameLower.includes('x6') || nameLower.includes('6 und') || nameLower.includes('6x') || nameLower.includes('6un')) {
      if (nameLower.includes('deslactosada') || nameLower.includes('deslac')) {
        return {
          key: 'leche-sixpack-deslactosada',
          name: 'Sixpack Leche Deslactosada UHT (6 x 1000ml - 1100ml)',
          category_id: 2,
          unit: 'Paquete 6 Unidades',
          image_url: providedImageUrl || getProductImageByName(name),
          description: 'Pack de 6 bolsas o cajas de leche deslactosada UHT de fácil digestión.'
        };
      }
      return {
        key: 'leche-sixpack-entera',
        name: 'Sixpack Leche Entera UHT (6 x 1000ml - 1100ml)',
        category_id: 2,
        unit: 'Paquete 6 Unidades',
        image_url: providedImageUrl || getProductImageByName(name),
        description: 'Pack de 6 bolsas o cajas de leche entera UHT pasteurizada.'
      };
    }
    if (nameLower.includes('deslactosada') || nameLower.includes('deslac')) {
      return {
        key: 'leche-deslactosada-individual',
        name: 'Leche Deslactosada UHT (900ml - 1.1L)',
        category_id: 2,
        unit: 'Bolsa / Tetrapak 900ml - 1.1L',
        image_url: providedImageUrl || getProductImageByName(name),
        description: 'Leche deslactosada ultra pasteurizada de fácil digestión.'
      };
    }
    return {
      key: 'leche-entera-individual',
      name: 'Leche Entera UHT (900ml - 1.1L)',
      category_id: 2,
      unit: 'Bolsa / Tetrapak 900ml - 1.1L',
      image_url: providedImageUrl || getProductImageByName(name),
      description: 'Leche entera pasteurizada rica en calcio y proteína natural.'
    };
  }

  // Frijoles
  if (nameLower.includes('frijol') || nameLower.includes('fríjol')) {
    if (nameLower.includes('refrito')) {
      return {
        key: 'frijol-refrito',
        name: 'Fríjoles Refritos Listos (300g)',
        category_id: 1,
        unit: 'Doypack / Lata 300g',
        image_url: providedImageUrl || getProductImageByName(name),
        description: 'Fríjoles refritos listos para servir en tortillas y desayunos.'
      };
    }
    if (nameLower.includes('rojo') || nameLower.includes('cargamanto')) {
      return {
        key: 'frijol-cargamanto-rojo',
        name: 'Fríjol Cargamanto Rojo (500g)',
        category_id: 1,
        unit: 'Bolsa 500g',
        image_url: providedImageUrl || getProductImageByName(name),
        description: 'Fríjol cargamanto seleccionado para sancocho y bandeja paisa.'
      };
    }
    return {
      key: 'frijoles-grano-seleccionado',
      name: 'Fríjoles en Grano Seleccionado',
      category_id: 1,
      unit: 'Bolsa 500g',
      image_url: providedImageUrl || getProductImageByName(name),
      description: 'Granos de fríjol de alta calidad cosechados en el suroccidente.'
    };
  }

  // Huevos
  if (nameLower.includes('huevo')) {
    if (nameLower.includes('30') || nameLower.includes('x30')) {
      return {
        key: 'huevos-cubeta-30',
        name: 'Huevos Rojos Cubeta X30 Unidades',
        category_id: 2,
        unit: 'Cubeta x30 unidades',
        image_url: providedImageUrl || getProductImageByName(name),
        description: 'Cubeta de 30 huevos frescos clasificados tamaño A / AA.'
      };
    }
    if (nameLower.includes('12') || nameLower.includes('15')) {
      return {
        key: 'huevos-panal-12-15',
        name: 'Huevos Frescos Tipo AA (12 - 15 Unidades)',
        category_id: 2,
        unit: 'Estuche 12 - 15 Unidades',
        image_url: providedImageUrl || getProductImageByName(name),
        description: 'Estuche de huevos seleccionados para consumo personal o semanal.'
      };
    }
  }

  // Arroz
  if (nameLower.includes('arroz')) {
    return {
      key: 'arroz-blanco-familiar',
      name: 'Arroz Blanco de Grano Entero',
      category_id: 1,
      unit: 'Bolsa 1000g - 2500g',
      image_url: providedImageUrl || getProductImageByName(name),
      description: 'Arroz blanco seleccionado para las comidas de las familias en Popayán.'
    };
  }

  // Aceite
  if (nameLower.includes('aceite')) {
    return {
      key: 'aceite-vegetal-girasol',
      name: 'Aceite Vegetal / Girasol 900ml',
      category_id: 4,
      unit: 'Botella 900 ml',
      image_url: providedImageUrl || getProductImageByName(name),
      description: 'Aceite puro comestible de alta pureza y rendimiento culinario.'
    };
  }

  // Detergente
  if (nameLower.includes('detergente')) {
    return {
      key: 'detergente-lavado-ropa',
      name: 'Detergente Multiusos para Lavado',
      category_id: 3,
      unit: 'Bolsa / Galón 2.5kg - 3L',
      image_url: providedImageUrl || getProductImageByName(name),
      description: 'Detergente en polvo o líquido concentrado para limpieza profunda.'
    };
  }

  // Título limpio genérico
  const cleanTitle = name
    .replace(/\s*(uht|tetrapak|doypack|bolsa|x\d+\s*unds?|\d+\s*ml|\d+\s*grs?)\s*/gi, ' ')
    .trim();

  let detectedCat = 1;
  if (nameLower.includes('jabón') || nameLower.includes('limpieza') || nameLower.includes('papel')) detectedCat = 3;
  else if (nameLower.includes('leche') || nameLower.includes('yogur') || nameLower.includes('queso')) detectedCat = 2;
  else if (nameLower.includes('aceite') || nameLower.includes('sal') || nameLower.includes('azucar')) detectedCat = 4;
  else if (nameLower.includes('jugo') || nameLower.includes('gaseosa') || nameLower.includes('galleta')) detectedCat = 5;

  return {
    key: cleanTitle.toLowerCase(),
    name: cleanTitle,
    category_id: detectedCat,
    unit: 'Unidad',
    image_url: providedImageUrl || getProductImageByName(name),
    description: `Producto obtenido en vivo de supermercados de Popayán.`
  };
}

module.exports = { getCanonicalProductGroup };
