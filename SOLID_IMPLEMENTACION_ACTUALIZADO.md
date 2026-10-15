# SmartFoodPop — implementación SOLID (Sprint 1 y Sprint 2)

## Alcance abordado
Se implementaron en backend los componentes que el documento `SOLID.docx` describía pero que no estaban en el código base: `PasswordHasher`, `TokenService`, `ProductDetailService`, `ProductComparisonService`, `ProductAdminService`, `productFilters.js`, `queryHelpers.js` y pruebas unitarias. También se creó el hook de frontend `useProductDetail.js` para separar la carga del detalle de la interfaz.

## RF01 — Registro de usuarios
- `AuthService` valida datos y coordina el registro.
- `BcryptPasswordHasher` se ocupa del hash.
- `TokenService` firma tokens JWT.
- Las dependencias llegan al servicio por constructor.

## RF02 — Inicio de sesión y validación del token
- `AuthService` selecciona un verificador que cumple el contrato `supports/verify`.
- `BcryptPasswordHasher` verifica contraseñas con hash.
- `PlainPasswordVerifier` permite autenticar usuarios semilla heredados que todavía tienen contraseña de texto plano; esto es compatibilidad transitoria y debería retirarse al migrar esas cuentas.
- El middleware recibe `TokenService` y no importa directamente `jsonwebtoken` ni lee el secreto.

## RF03 — Consulta de productos y ofertas
- `ProductService` se limita a lectura/listado y ofertas.
- Las escrituras están en `ProductAdminService`.
- Los filtros se inyectan para facilitar extensión y pruebas.

## RF04 y RF09 — Búsqueda y filtros
- `queryHelpers.js` centraliza lectura y normalización de texto.
- `productFilters.js` contiene filtros intercambiables de búsqueda, categoría, tienda y ofertas.
- Las categorías/tiendas inválidas devuelven error HTTP 400 en vez de mostrar silenciosamente el catálogo sin filtrar.
- `applyFilters` recibe explícitamente la lista de filtros.

## RF05 — Detalle del producto
- `ProductDetailService` reúne producto, precios enriquecidos con tienda y reseñas.
- `summarizeReviews` siempre devuelve cantidad y promedio definidos.
- `frontend/src/hooks/useProductDetail.js` separa la carga asíncrona del detalle del componente visual.

## RF07 — Comparación de precios
- `ProductComparisonService` compara precios ordenados por valor, identifica mínimo/máximo y calcula ahorro potencial.
- No depende de reseñas, favoritos ni administración.
- El endpoint es `GET /api/products/compare`.

## Pruebas
Ejecutar desde `backend/`:

```bash
npm test
```

Las pruebas unitarias cubren autenticación, separación de responsabilidades, filtros, detalle, comparación y administración. En el entorno de revisión se ejecutaron **17 pruebas: 17 aprobadas, 0 fallidas**.

## Límites conocidos
- El verificador de contraseña en texto plano es una compatibilidad para cuentas semilla, no una práctica recomendada para cuentas nuevas.
- El proyecto mantiene almacenamiento en memoria para la ejecución actual; esta refactorización SOLID no convierte por sí sola todos los repositorios en persistencia PostgreSQL.
- No se afirma que Liskov y segregación de interfaces estén demostrados matemáticamente: se mejoraron contratos e inyección de dependencias y se añadieron pruebas de sustitución con colaboradores falsos donde corresponde.
- El build del frontend no se pudo validar en este entorno porque la instalación de dependencias no terminó correctamente. El hook se integró en `App.jsx`, pero debe correrse `npm ci` y `npm run build` en el equipo de desarrollo.
