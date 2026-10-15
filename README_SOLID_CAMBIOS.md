# Cambios SOLID aplicados a SmartFoodPop

Se implementaron las piezas que faltaban según `SOLID.docx` para RF01, RF02, RF03, RF04, RF05, RF07 y RF09.

## Backend
- `services/PasswordHasher.js`: `BcryptPasswordHasher` y `PlainPasswordVerifier` con contrato común `supports/verify`.
- `services/TokenService.js`: emisión y verificación JWT centralizadas.
- `middleware/authMiddleware.js`: middleware creado con inyección de `TokenService`.
- `services/ProductService.js`: solo lectura/listado y ofertas.
- `services/ProductDetailService.js`: detalle, precios por tienda y resumen de reseñas.
- `services/ProductComparisonService.js`: comparación de precios y ahorro potencial.
- `services/ProductAdminService.js`: creación, edición y borrado de productos.
- `domain/productFilters.js` y `domain/queryHelpers.js`: filtros composables, normalización y mensajes de resultados vacíos.
- `container.js`, controladores y rutas: dependencias conectadas desde un composition root.
- `tests/solid.test.js`: pruebas para los requerimientos y la sustitución de dependencias.

Endpoint añadido: `GET /api/products/compare?search=&category=&store=`.

## Pruebas
En `backend/`, ejecutar `npm ci` y `npm test`. Resultado durante esta revisión: 17/17 pruebas pasan.

## Importante
La autenticación de cuentas semilla antiguas conserva temporalmente verificación de contraseña en texto plano. Las cuentas nuevas guardan hash bcrypt. Antes de producción, migrar las cuentas semilla y eliminar el verificador de texto plano. El almacenamiento de datos sigue siendo en memoria en la implementación actual; no se debe interpretar esta refactorización como una migración completa a PostgreSQL.
