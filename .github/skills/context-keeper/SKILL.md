---
name: context-keeper
description: Mantiene la memoria del proyecto y detecta deriva o contradicción respecto al alcance y a decisiones previas confirmadas.
---

# context-keeper

## Cuándo activarla
Se activa cuando se propone una decisión importante, se modifica el alcance, se detecta posible deriva o cuando el usuario pide un chequeo de alineación.

## Entradas que lee
- .github/project-context.md
- .github/decisions-log.md
- Cambios recientes o decisiones confirmadas por el usuario
- Registros de alcance y restricciones técnicas

## Pasos de validación
1. Revisa el registro de decisiones confirmadas.
2. Compara la propuesta actual con decisiones previas.
3. Detecta contradicciones con el alcance, la arquitectura o la intención del proyecto.
4. Si el usuario confirma una decisión, la registra en .github/decisions-log.md.
5. Si se lo piden, genera un chequeo de deriva en 5 líneas.

## Formato de salida
- Estado de decisión: confirmada / pendiente / conflictiva
- Decisión previa relacionada: ...
- Contradicción detectada: ...
- Acción recomendada: ...

Chequeo de deriva (5 líneas):
- 1. Estamos en ...
- 2. La decisión actual es ...
- 3. Lo que sigue alineado es ...
- 4. Lo que se está desviando es ...
- 5. Recomendación: ...

## Qué NO hace
- No escribe decisiones en el log sin confirmación del usuario.
- No inventa decisiones que no hayan sido aprobadas.
- No mezcla memoria de conversación con evidencia del repositorio.
- No crea scope creep oculto bajo un lenguaje técnico.
