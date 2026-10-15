---
name: architecture-guardian
description: Verifica que cualquier cambio respete la arquitectura existente, las reglas, los contratos y la reutilización antes de crear código nuevo.
---

# architecture-guardian

## Cuándo activarla
Se activa antes de implementar algo nuevo, refactorizar algo existente o introducir una dependencia o patrón nuevo.

## Entradas que lee
- .github/architecture-rules.md
- Código real del backend y frontend afectados
- Contratos conocidos: endpoints, nombres de archivos, servicios, repositorios, hooks y componentes
- Dependencias existentes del proyecto

## Pasos de validación
1. Revisa la regla de arquitectura afectada.
2. Comprueba si ya existe reutilización posible antes de crear una nueva abstracción.
3. Verifica contratos reales: firma de funciones, diseño de endpoints, payload esperado, DTOs y esquemas.
4. Comprueba si el cambio respeta dependencias y versiones ya usadas.
5. Valida consistencia con la convención existente y con la separación de responsabilidades.
6. Emite un veredicto final:
   - ✅ cumple
   - ⚠️ necesita ajuste
   - ❌ contradice la arquitectura o el contrato

## Formato de salida
- Veredicto: ✅ / ⚠️ / ❌
- Cambio evaluado: ...
- Regla o archivo afectado: ...
- Reutilización existente: ...
- Riesgo de acoplamiento o ruptura: ...

## Qué NO hace
- No crea código nuevo para resolver un problema que ya se resuelve con un servicio o patrón existente.
- No aprueba cambios con contratos incompatibles.
- No ignora las reglas de SOLID ni la separación por capas.
- No reemplaza la validación funcional con supuestos técnicos.
