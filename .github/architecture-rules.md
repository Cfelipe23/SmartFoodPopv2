# SmartFoodPop — reglas de arquitectura y consistencia

## Principios base
- Mantener separación por capas: frontend, backend, repositorios, servicios, dominio y datos.
- Preferir reutilización sobre creación nueva si ya existe una abstracción o servicio compatible.
- Cada módulo debe tener una responsabilidad clara y una sola razón para cambiar.
- Priorizar inyección de dependencias y contratos claros antes que acoplamientos directos.

## Stack permitido
- Frontend: React + JavaScript.
- Backend: Node.js + Express.
- Persistencia: PostgreSQL cuando aplique.
- Scraping: Python.
- Cambio de tecnología o dependencia requiere justificación explícita.

## Convenciones
- Los nombres de rutas, controladores y servicios deben reflejar el caso de uso.
- Los endpoints deben ser consistentes con el dominio del producto, reseñas, favoritos y administrador.
- Las validaciones de negocio deben vivir en servicios y no mezclarse con la capa HTTP.
- Los errores de dominio deben serializarse con códigos y mensajes claros.

## Contratos a respetar
- Endpoint y firma de funciones deben mantenerse coherentes con el uso real del código.
- DTOs y payloads de entrada/salida deben ser congruentes con el contrato del backend.
- Las dependencias de servicios deben inyectarse por constructor o contenedor, no crearse ad hoc dentro del flujo.

## Reutilización obligatoria
Antes de crear una nueva implementación, verificar:
1. si ya existe una capa o servicio equivalente;
2. si el patrón actual ya cubre la necesidad;
3. si la nueva creación duplica lógica o rompe consistencia.

## SOLID
- Responsabilidad única: servicios no mezclan lectura, escritura, autenticación y comparación.
- Desarrollo abierto a extensión pero cerrado a modificación cuando la lógica puede inyectarse por dependencia.
- Sustituibilidad: los colaboradores deben cumplir contratos y poder intercambiarse en pruebas o contextos.

## Regla de veto
Si un cambio contradice el alcance, la arquitectura o la reutilización existente, no debe avanzar sin revisión.
