---
name: scope-guardian
description: Controla el alcance del proyecto comparando propuestas con el contexto oficial y detecta scope creep, tecnologías o funciones fuera del plan.
---

# scope-guardian

## Cuándo activarla
Se activa cuando se propone una nueva funcionalidad, dependencia, integración, patrón o tecnología, o cuando hay dudas sobre si algo entra en el alcance.

## Entradas que lee
- .github/project-context.md
- SmartFood Alcance Proyecto Software.docx.md
- Cambios propuestos por el usuario o por una idea de implementación

## Pasos de validación
1. Compara la propuesta con la sección de alcance incluido y excluido.
2. Revisa si la propuesta afecta tecnologías permitidas o restricciones técnicas.
3. Detecta si hay scope creep por funcionalidad, dependencia o complejidad no contemplada.
4. Evalúa la propuesta con una de estas categorías:
   - ✅ dentro: coincide con el alcance o la tecnología definida.
   - ⚠️ dudoso: podría entrar, pero necesita decisión o aclaración.
   - ❌ fuera: contradice el alcance o es explícitamente excluido.
5. Cita la sección que lo respalda o contradice.

## Formato de salida
- Veredicto: ✅ dentro / ⚠️ dudoso / ❌ fuera
- Propuesta: ...
- Evidencia: sección del alcance o restricción que lo soporta o niega
- Riesgo: ...

## Qué NO hace
- No aprueba cambios aunque sean técnicamente útiles si contradicen el alcance.
- No crea nuevas funcionalidades por iniciativa propia.
- No ignora la sección de excluidos ni las restricciones técnicas.
- No reemplaza la decisión formal del equipo o docente.
