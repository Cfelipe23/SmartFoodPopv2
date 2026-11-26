export function getProductImageByName(name: string | null | undefined, providedImageUrl?: string | null): string {
  if (providedImageUrl && /^https?:\/\//i.test(providedImageUrl)) {
    return providedImageUrl;
  }

  const nameLower = (name || '').toLowerCase();

  // 1. Arroz y Granos
  if (nameLower.includes('arroz')) {
    return 'https://images.unsplash.com/photo-1586201375761-83865001e31c?auto=format&fit=crop&w=600&q=80';
  }
  if (nameLower.includes('frijol') || nameLower.includes('fríjol')) {
    return 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=600&q=80';
  }
  if (nameLower.includes('lenteja') || nameLower.includes('garbanzo')) {
    return 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=600&q=80';
  }

  // 2. Lácteos específicos
  if (nameLower.includes('condensada')) {
    return 'https://images.unsplash.com/photo-1589301760014-d929f3979dbc?auto=format&fit=crop&w=600&q=80';
  }
  if (nameLower.includes('polvo')) {
    return 'https://images.unsplash.com/photo-1550583724-b2692b85b150?auto=format&fit=crop&w=600&q=80';
  }
  if (nameLower.includes('sixpack') || nameLower.includes('x6') || nameLower.includes('6 und')) {
    return 'https://images.unsplash.com/photo-1528750997573-59b89d56f4f7?auto=format&fit=crop&w=600&q=80';
  }
  if (nameLower.includes('leche')) {
    return 'https://images.unsplash.com/photo-1563636619-e9143da7973b?auto=format&fit=crop&w=600&q=80';
  }
  if (nameLower.includes('yogurt') || nameLower.includes('yogur')) {
    return 'https://images.unsplash.com/photo-1488477181946-6428a0291777?auto=format&fit=crop&w=600&q=80';
  }
  if (nameLower.includes('queso')) {
    return 'https://images.unsplash.com/photo-1452195100486-9cc805987862?auto=format&fit=crop&w=600&q=80';
  }

  // 3. Huevos
  if (nameLower.includes('huevo')) {
    return 'https://images.unsplash.com/photo-1506976785307-8732e854ad03?auto=format&fit=crop&w=600&q=80';
  }

  // 4. Aceites y Condimentos
  if (nameLower.includes('aceite')) {
    return 'https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?auto=format&fit=crop&w=600&q=80';
  }
  if (nameLower.includes('sal') || nameLower.includes('azúcar') || nameLower.includes('azucar') || nameLower.includes('panela')) {
    return 'https://images.unsplash.com/photo-1622484212850-cab596d66e7b?auto=format&fit=crop&w=600&q=80';
  }
  if (nameLower.includes('cafe') || nameLower.includes('café')) {
    return 'https://images.unsplash.com/photo-1559056199-641a0ac8b55e?auto=format&fit=crop&w=600&q=80';
  }

  // 5. Aseo y Limpieza
  if (nameLower.includes('detergente') || nameLower.includes('jabón') || nameLower.includes('jabon') || nameLower.includes('limpieza') || nameLower.includes('lavaplatos')) {
    return 'https://images.unsplash.com/photo-1585832770485-e68a5fc88280?auto=format&fit=crop&w=600&q=80';
  }
  if (nameLower.includes('papel') || nameLower.includes('higiénico') || nameLower.includes('higienico')) {
    return 'https://images.unsplash.com/photo-1584556812952-905ffd0c611a?auto=format&fit=crop&w=600&q=80';
  }

  // 6. Bebidas y Snacks
  if (nameLower.includes('gaseosa') || nameLower.includes('jugo') || nameLower.includes('bebida') || nameLower.includes('agua')) {
    return 'https://images.unsplash.com/photo-1581009146145-b5ef050c2e1e?auto=format&fit=crop&w=600&q=80';
  }
  if (nameLower.includes('galleta') || nameLower.includes('snack') || nameLower.includes('papas')) {
    return 'https://images.unsplash.com/photo-1590080875515-8a3a8dc5735e?auto=format&fit=crop&w=600&q=80';
  }

  return 'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=600&q=80';
}
