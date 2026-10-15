---
name: change-gatekeeper
description: Orquesta la validación previa antes de implementar cambios y bloquea cambios que rompen alcance, arquitectura o contexto.
---

# change-gatekeeper

## Cuándo activarla
Se activa antes de implementar cualquier cambio relevante en el proyecto.

## Entradas que lee
- .github/project-context.md
- .github/architecture-rules.md
- .github/decisions-log.md
- Código real del módulo implicado
- Propuesta concreta de cambio

## Pasos de validación
Ejecuta en este orden:
1. grounded-answers
2. scope-guardian
3. architecture-guardian
4. context-keeper

Luego:
- Si alguna skill devuelve ❌: se detiene y explica la razón.
- Si alguna devuelve ⚠️: pide confirmación antes de continuar.
- Si todas devuelven ✅: se autoriza seguir con la implementación.

## Formato de salida
- grounded-answers: ✅ / ⚠️ / ❌
- scope-guardian: ✅ / ⚠️ / ❌
- architecture-guardian: ✅ / ⚠️ / ❌
- context-keeper: ✅ / ⚠️ / ❌
- Resultado final: proceder / confirmar / bloquear

## Qué NO hace
- No implementa código por sí misma.
- No ignora pausas por evidencia insuficiente.
- No supera un bloqueo de alcance o arquitectura sin confirmación.
- No registra decisiones sin validación previa del usuario.
