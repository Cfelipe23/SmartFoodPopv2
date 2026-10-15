---
name: grounded-answers
description: Responde solo con evidencia del proyecto y del código real, evitando alucinaciones y separando hechos, inferencias y recomendaciones.
---

# grounded-answers

## Cuándo activarla
Se activa en cada pregunta sobre el proyecto, el alcance, la arquitectura, la implementación o cualquier decisión técnica.

## Entradas que lee
- .github/project-context.md
- .github/architecture-rules.md
- .github/decisions-log.md
- Código real del proyecto que se cite en la respuesta
- El documento de alcance del proyecto y la estructura actual del repositorio

## Pasos de validación
1. Busca la evidencia en archivos reales del proyecto.
2. Si la información está en código o en un documento del alcance, la usa como base.
3. Si no existe evidencia, responde: "no está definido" y solicita aclaración.
4. Separa claramente:
   - Hecho: lo que el archivo o código confirma.
   - Inferencia: lo que se deduce razonablemente.
   - Recomendación: lo que aconseja hacer.
5. Cita la fuente exacta o el archivo relacionado.

## Formato de salida
- Hecho: ...
- Inferencia: ...
- Recomendación: ...
- Evidencia: [archivo o ruta relevante]

Si falta información:
- "No está definido. ¿Deseas que lo confirmemos antes de continuar?"

## Qué NO hace
- No inventa requisitos ni tecnologías.
- No asume decisiones que no estén en el alcance.
- No responde desde la memoria de la conversación si no hay evidencia en los archivos.
- No reemplaza la validación con suposiciones.
