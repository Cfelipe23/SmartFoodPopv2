import { normalizeName } from './productNormalizer';

// Categorías del alcance (documento, sección 6.1 ítem 8): Granos y básicos, Lácteos,
// Aseo del hogar y Otros. «Aseo personal» la aprobó el equipo el 26-nov-2026 (AGENTS.md, sección 9).
export const CATEGORY = { BASICS: 1, DAIRY: 2, HOME_CLEANING: 3, OTHERS: 4, PERSONAL_CARE: 5 } as const;

const HOME_WORDS = new Set([
  'detergente', 'suavizante', 'blanqueador', 'cloro', 'desinfectante', 'limpiador', 'limpiavidrios',
  'lavaplatos', 'lavaloza', 'lavavajillas', 'ambientador', 'desengrasante', 'esponja', 'escoba',
  'trapero', 'insecticida', 'quitamanchas', 'lavadora'
]);
const PERSONAL_SOAP_SIGNALS = new Set([
  'antibacterial', 'tocador', 'facial', 'corporal', 'manos', 'protex', 'palmolive', 'dove', 'neutrogena',
  'nixoderm', 'intimo', 'intibon', 'alergibon', 'salilex', 'lux', 'nivea', 'johnson', 'johnsons', 'rexona', 'cetaphil', 'lifebuoy'
]);
// Higiene personal básica: las subcategorías de D1 que trae el scraper (cuidado oral, jabonería,
// desodorantes, cuidado capilar, protección femenina y afeitado).
const PERSONAL_WORDS = new Set([
  'dental', 'dentales', 'dientes', 'bucal', 'enjuague', 'shampoo', 'champu', 'acondicionador',
  'desodorante', 'antitranspirante', 'higienica', 'higienicas', 'tampon', 'tampones', 'afeitar',
  'afeitadora', 'prestobarba', 'tocador', 'panuelos', 'panitos'
]);
const DAIRY_FIRST_WORDS = new Set(['leche', 'queso', 'yogur', 'yogurt', 'yogurth', 'kumis', 'mantequilla', 'kefir', 'cuajada', 'requeson']);
const BASICS_FIRST_WORDS = new Set([
  'arroz', 'frijol', 'frijoles', 'frijo', 'lenteja', 'lentejas', 'garbanzo', 'garbanzos', 'arveja', 'arvejas',
  'maiz', 'espagueti', 'spaghetti', 'fideos', 'macarron', 'macarrones', 'harina', 'azucar', 'sal', 'panela',
  'aceite', 'quinua', 'trigo', 'cebada', 'maicena', 'pasta', 'pastas'
]);
const NOT_A_STAPLE_WORDS = ['leche', 'achocolatado', 'dulce', 'dental', 'tomate', 'corp', 'corporal', 'capilar', 'cabello', 'piel', 'bebe', 'masaje'];

export function classifyCategory(name: unknown): (typeof CATEGORY)[keyof typeof CATEGORY] {
  const words = normalizeName(name).replace(/[.,]/g, ' ').split(' ').filter(Boolean);
  const text = words.join(' ');
  const first = words[0] || '';

  if (words.some(word => HOME_WORDS.has(word)) || text.includes('papel higienico')) return CATEGORY.HOME_CLEANING;
  // Un jabón es de tocador solo con una señal clara (marca o uso); si no, es de lavar ropa o loza.
  if (words.includes('jabon') || first === 'jab') {
    return words.some(word => PERSONAL_SOAP_SIGNALS.has(word)) ? CATEGORY.PERSONAL_CARE : CATEGORY.HOME_CLEANING;
  }
  if (words.some(word => PERSONAL_WORDS.has(word))) return CATEGORY.PERSONAL_CARE;

  const isDairyFirst = DAIRY_FIRST_WORDS.has(first) && !words.includes('coco');
  const isCream = first === 'crema' && words.includes('leche');
  if (isDairyFirst || isCream || text.includes('lacteo') || text.includes('lactea')) return CATEGORY.DAIRY;

  if (BASICS_FIRST_WORDS.has(first) && !NOT_A_STAPLE_WORDS.some(word => words.includes(word))) return CATEGORY.BASICS;
  if (first === 'avena' && (words.includes('hojuelas') || words.includes('hojuela'))) return CATEGORY.BASICS;

  return CATEGORY.OTHERS;
}
