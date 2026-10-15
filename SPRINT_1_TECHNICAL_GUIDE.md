# Sprint 1 — Guía maestra: alcance, ejecución y validación técnica

## Propósito
Este documento es la guía única para el Sprint 1. Tiene dos objetivos:
1. definir qué debe entregarse según el alcance del proyecto
2. definir cómo validarlo técnicamente para que cumpla los criterios de evaluación sin desviarse del objetivo

Se basa en el alcance oficial del proyecto y en la intención del curso: entregar un MVP funcional, estable y consistente, no una versión completa del producto.

---

## 1. Regla de prioridad del Sprint 1
El Sprint 1 debe enfocarse exclusivamente en estas historias:
- HU01: Registro de usuario
- HU02: Inicio de sesión
- HU03: Consulta del catálogo de productos

Cualquier función fuera de estas historias queda fuera del corte actual salvo aprobación explícita del docente o del equipo.

## 2. Alcance oficial del proyecto
El proyecto SmartFoodPop busca centralizar productos, precios y ofertas de diferentes tiendas de Popayán para facilitar compras más informadas.

### Funcionalidades incluidas
- Registro e inicio de sesión de usuarios
- Consulta de productos
- Búsqueda y filtrado de productos
- Consulta de reseñas y calificaciones
- Publicación de reseñas
- Visualización de ofertas
- Consulta y comparación de precios
- Guardado de productos de interés
- Gestión del administrador

### Funcionalidades excluidas
- Compra directa desde la plataforma
- Servicio de entrega a domicilio
- Garantizar disponibilidad física real de una oferta

### Restricciones técnicas
- Frontend en React con JavaScript
- Backend en Node.js con Express
- Base de datos relacional
- Scraping en Python
- Arquitectura cliente-servidor
- Control de versiones con GitHub

---

## 3. Historias de usuario del Sprint 1

### HU01 — Registro de usuario
**Tipo:** Normal
**Requerimiento asociado:** RF01
**Historia:**
Como visitante, quiero registrarme en SmartFoodPop mediante un formulario, para crear una cuenta y acceder a las funcionalidades de la plataforma.

**Criterios de aceptación:**
1. El visitante puede acceder al formulario de registro.
2. El sistema solicita los datos necesarios para crear una cuenta.
3. El sistema valida que los campos obligatorios estén completos.
4. El sistema impide registrar un correo ya existente.
5. El sistema muestra un mensaje de confirmación cuando el registro es exitoso.
6. El usuario puede iniciar sesión inmediatamente después de registrarse.

**Validación técnica mínima:**
- formulario visible y funcional
- validación de campos obligatorios
- email único
- manejo de errores
- persistencia del usuario
- respuesta clara del backend

### HU02 — Inicio de sesión
**Tipo:** Normal
**Requerimiento asociado:** RF02
**Historia:**
Como usuario registrado, quiero iniciar sesión con mi correo y contraseña, para acceder a las funcionalidades disponibles en SmartFoodPop.

**Criterios de aceptación:**
1. El usuario puede acceder al formulario de inicio de sesión.
2. El sistema solicita correo y contraseña.
3. El sistema valida que los campos no estén vacíos.
4. El sistema verifica las credenciales ingresadas.
5. El sistema muestra un mensaje de error si las credenciales son incorrectas.
6. El usuario accede con sesión activa cuando las credenciales son correctas.

**Validación técnica mínima:**
- login correcto
- login incorrecto
- login con campos vacíos
- generación y comprobación de sesión/token
- manejo de errores HTTP y UI

### HU03 — Consulta del catálogo de productos
**Tipo:** Épica funcional base del MVP
**Requerimiento asociado:** RF03
**Historia:**
Como usuario, quiero consultar un listado de productos de diferentes tiendas desde una sola plataforma, para conocer las opciones disponibles sin recurrir a múltiples fuentes.

**Criterios de aceptación:**
1. El sistema muestra un listado de productos disponible.
2. Cada producto tiene información mínima visible: nombre, precio y tienda.
3. El catálogo puede consultar datos desde la fuente disponible.
4. Si no hay productos, muestra un estado informativo.
5. Los productos se presentan en una estructura clara para la vista principal.

**Validación técnica mínima:**
- carga del catálogo
- estructura estable del JSON o respuesta
- renderización sin errores de UI
- manejo de casos vacíos
- no depender de módulos aún no validados

---

## 4. Reglas técnicas que deben respetarse

### 4.1 Sintaxis y ejecución
Antes de considerar una funcionalidad lista, debe verificarse:
- que no haya errores de sintaxis JavaScript o JSX
- que no haya errores de importación o exportación
- que no haya rutas rotas
- que no haya referencias a componentes inexistentes
- que el backend arranque correctamente
- que el frontend compile y renderice sin errores críticos

### 4.2 Contratos y flujo
Debe existir consistencia real entre:
- frontend y backend
- endpoints y payloads
- nombres de campos
- respuestas del backend
- estado de la UI y manejo de errores

### 4.3 Alcance y control de deltas
No debe añadirse funcionalidad que pertenezca a otros sprints o a un alcance no validado. Los principales ejemplos fuera del corte son:
- administración completa
- lógica avanzada de reseñas
- comparación avanzada de precios
- panel administrativo con CRUD completo
- favoritos con lógica compleja
- scraping como objetivo principal sin validación funcional

Nota técnica del scraper actual: la implementación real usa `requests` contra la API de VTEX para obtener JSON. No usa Playwright ni Chromium en el estado actual del proyecto.

La regla es simple: si la funcionalidad no está en HU01, HU02 o HU03, no debe entrar al Sprint 1 salvo aprobación expresa.

---

## 5. Qué debe estar OK para cerrar el Sprint 1

### Backend
- [ ] Registro funciona
- [ ] Login funciona
- [ ] Autenticación básica está validada
- [ ] Catálogo responde con datos reales o simulados válidos
- [ ] Endpoints principales responden correctamente
- [ ] Errores HTTP son consistentes
- [ ] No se exponen endpoints avanzados sin validación previa

### Frontend
- [ ] Registro visible y funcional
- [ ] Login visible y funcional
- [ ] Catálogo visible y funcional
- [ ] Manejo de carga y error implementado
- [ ] La app no se rompe con datos vacíos o errores del backend
- [ ] La interfaz es clara y coherente con el flujo principal

### Scraping / datos
- [ ] El scraper ejecuta correctamente
- [ ] Genera JSON estable y útil para la app
- [ ] Los datos entregados incluyen las propiedades mínimas para catálogo
- [ ] El scraping no rompe el flujo principal del sprint
- [ ] La tecnología del scraper coincide con el código real: `requests` para VTEX, sin asumir Playwright/Chromium si no está implementado

---

## 6. Qué testear antes de declarar Sprint 1 listo

### Caso 1: registro funcional
1. Abrir formulario de registro.
2. Ingresar información válida.
3. Confirmar registro.
4. Verificar almacenamiento del usuario.
5. Verificar que el flujo de login puede continuar.

### Caso 2: login funcional
1. Ingresar credenciales correctas.
2. Validar acceso.
3. Verificar sesión o token activo.
4. Intentar credenciales incorrectas.
5. Verificar manejo del error.

### Caso 3: catálogo funcional
1. Abrir la vista principal.
2. Verificar que aparecen productos.
3. Confirmar que muestra nombre, precio y tienda.
4. Verificar caso sin productos.
5. Confirmar que la pantalla no se rompe.

### Caso 4: validación técnica de integridad
- revisar scripts de paquete
- revisar imports y exports
- revisar paquetes y dependencias
- revisar que no existan archivos duplicados o residuos que alteren el flujo
- revisar ejecución consistente del proyecto

---

## 7. Reglas de validación para agentes o colaboradores
Antes de aceptar una tarea, responde estas preguntas:
1. ¿A qué historia del sprint corresponde?
2. ¿Está respaldada por el alcance del proyecto?
3. ¿Afecta el flujo principal de registro/login/catálogo?
4. ¿Es necesaria para el MVP o es solo una mejora?
5. ¿Puede romper la funcionalidad del primer corte?

Si la respuesta es desconocida o negativa, la tarea queda en espera.

---

## 8. Regla de corrección minimalista
No se debe hacer un refactor grande ni reestructurar todo el sistema. Lo importante es:
- corregir fallos funcionales del flujo principal
- cerrar validaciones de HU01, HU02 y HU03
- mantener estabilidad sin ampliar alcance
- evitar cambios que no estén cubiertos por el sprint actual

---

## 9. Checklist final de entrega
### Registro
- [ ] El formulario existe
- [ ] Los campos son obligatorios
- [ ] El email duplicado no se permite
- [ ] La respuesta es correcta y clara
- [ ] El usuario queda registrado

### Login
- [ ] El formulario existe
- [ ] La autenticación funciona
- [ ] Las credenciales inválidas muestran error
- [ ] La sesión se crea correctamente

### Catálogo
- [ ] Se listan productos
- [ ] Hay información básica visible
- [ ] La vista está funcional
- [ ] Maneja caso sin datos
- [ ] No depende de módulos avanzados no validados

---

## 10. Criterio de cierre del Sprint 1
El Sprint 1 se considera entregado cuando:
- el registro funciona
- el login funciona
- el catálogo funciona
- la UI no se rompe
- el backend responde establemente
- las rutas principales tienen consistencia
- no hay funciones avanzadas sin aprobación

La entrega debe verse como un MVP sólido y evaluable, no como una versión completa del sistema.

---

## 11. Resumen ejecutivo
Los requerimientos que deben funcionar en Sprint 1 son:
- RF01: Registro de usuario
- RF02: Inicio de sesión
- RF03: Consulta del catálogo de productos

Todo lo demás queda como trabajo posterior o debe ser validado antes de entrar formalmente al corte actual.

La clave para no fallar en la evaluación es esta:
Si no está en la historia y no cumple su criterio de aceptación, no va en Sprint 1.
