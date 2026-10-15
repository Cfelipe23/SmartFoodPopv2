

**CONSOLIDACIÓN DEL ALCANCE**  
**DEL PROYECTO DE SOFTWARE**

**Asignatura: Construcción de Software**

Guía de trabajo para proyectos académicos de pequeña escala

# **1\. Propósito del documento**

El presente documento consolida el alcance del proyecto **SmartFoodPop**, una aplicación web para centralizar productos, ofertas y reseñas de tiendas en la ciudad de Popayán, para tomar decisiones de consumo más informadas. En el marco de la asignatura Construcción de Software, se define de forma clara y verificable la problemática, los objetivos, los usuarios involucrados y las funcionalidades.

Asimismo, se aplicará el marco ágil Scrum para gestionar, organizar y dar trazabilidad a los sprints y sus entregables.

# **2\. Descripción general del proyecto**

## **2.1 Nombre del proyecto**

SmartFoodPop

## **2.2 Descripción del problema**

La gran mayoría de consumidores de la ciudad de Popayán no cuentan con un canal unificado para consultar y comparar productos y precios de diferentes tiendas de la ciudad. La información disponible se encuentra dispersa entre páginas webs y establecimientos físicos, lo que obliga a los usuarios a consultar múltiples  fuentes de forma independiente para tomar decisiones de compra. esa fragmentación dificulta la comparación y pérdida de tiempo al consumidor a la hora de identificar las opciones más convenientes.

## **2.4 Solución propuesta**

SmartFoodPop es una aplicación web que centraliza en una sola plataforma la información de productos y precios proveniente de diferentes tiendas “D1 y Olimpica” de la ciudad, a través de funcionalidades de búsqueda, filtrado y comparación de precios, el sistema  permite acceder a la información necesaria para tomar decisiones para una compra informada, sin necesidad de recurrir a múltiples fuentes externas.

# **3\. Justificación del proyecto**

**¿Qué problema se pretende solucionar?** La dificultad para consultar y comparar información de productos, precios y ofertas de diferentes tiendas desde un solo lugar, debido a que esta información se encuentra distribuida en diferentes plataformas y establecimientos.

**¿Quiénes tienen el problema?** Los consumidores que desean conocer los productos y precios disponibles en diferentes tiendas y tomar una decisión de compra sin tener que consultar cada establecimiento por separado.

**¿Cómo se realiza actualmente el proceso?** Los consumidores consultan de manera individual las páginas web, aplicaciones, redes sociales o establecimientos de diferentes tiendas para conocer los productos, precios y ofertas disponibles.

**¿Qué dificultades existen?** La información se encuentra dispersa, lo que dificulta la comparación de precios y productos entre diferentes tiendas. Además, consultar varias fuentes por separado puede generar pérdida de tiempo y dificultar la elección de la opción más conveniente.

**¿Qué beneficios proporciona la solución?** SmartFood centralizará la información obtenida de diferentes fuentes en una sola aplicación web, facilitando la búsqueda y consulta de productos, la comparación de precios y ofertas, y el acceso a reseñas realizadas por otros usuarios.

**¿Por qué es viable desarrollar esta solución durante la asignatura?** El proyecto cuenta con un alcance definido y está enfocado en un MVP con funcionalidades básicas de consulta de productos, búsqueda, filtros, comparación, reseñas y registro de usuarios. La aplicación será desarrollada utilizando React, JavaScript y Node.js, junto con una base de datos relacional.

# **4\. Objetivo general del producto**

Desarrollar una aplicación web utilizando React, JavaScript y Node.js, junto con una base de datos relacional y el consumo de APIs propias o webScraping, que permita a los usuarios consultar y comparar productos, precios y ofertas de diferentes tiendas desde un solo lugar, así como registrar y consultar reseñas sobre los productos, con el propósito de facilitar la toma de decisiones de compra.

# **5\. Usuarios y actores del sistema**

| Actor/Usuario | Descripción | Principales necesidades |
| :---- | :---- | :---- |
| Consumidor / Usuario |  Persona que utiliza SmartFoodPop para consultar información sobre productos, comparar precios y encontrar ofertas disponibles en la ciudad. Puede consultar y publicar reseñas  | Registrarse, iniciar sesion, buscar y filtrar productos por nombre, categoria y tienda, ver detalles de los productos (nombre, precio, descripción), Publicar reseñas |
| Administrador |  Persona encargada de la gestión y supervisión de la plataforma. Cuenta con privilegios máximos  | Gestiona los productos, los precios, el detalle de estos mismos, puede agregar, actualizar y eliminar |

# **6\. Alcance del proyecto**

## **6.1 Funcionalidades incluidas**

1\.  Registro e inicio de sesion de usuarios

2\. Consulta de productos

3\. Búsqueda y filtrado de productos

4\. Consulta de reseñas y calificaciones de productos

5.Publicación de reseñas por parte de los usuarios

6.. Visualización de diferentes ofertas

7\. Consulta y comparación de precios

8.Productos seleccionados: Granos y básicos, Lácteos, Aseo del hogar, Otros

## **6.2 Funcionalidades excluidas**

1\. Realizar compras directamente de la página web 

2\. Servicio de entrega o domicilio de productos

3\. Garantizar que una oferta está disponible físicamente en el establecimiento

Importante: esta sección permite controlar el crecimiento descontrolado del proyecto. Una funcionalidad que no esté dentro del alcance no deberá incorporarse sin una decisión formal del equipo y del docente.

# **7\. Límites del proyecto**

## **7.1 Restricciones técnicas**

El desarrollo de SmartFoodPop estará sujeto a las siguientes restricciones técnicas:

* Aplicación web con arquitectura cliente-servidor.  
* FrontEnd desarrollado en React con javaScript  
* BackEnd desarrollado en Node.js con Express  
* Base de datos en PostgreSQL  
* Script en Python para el escaneo de páginas (web scraping)  
* Control de versiones con GitHub 

Complementariamente, el sistema se limitará al ámbito geográfico de la ciudad de Popayán. El sistema integrará información de productos y tiendas mediante el consumo de APIs propias o mediante técnicas de scraping de sitios web locales según la viabilidad técnica de cada fuente. El sistema gestionará la autenticación de usuarios de manera propia mediante correo electrónico y contraseña. El sistema no contempla integraciones con proveedores de identidad externos como Google o Facebook.

# **8\. Product Backlog**

Cada equipo deberá definir mínimo 10 requerimientos. Se recomienda utilizar requerimientos funcionales expresados de manera clara y verificable.

| ID | Requerimiento | Prioridad | Complejidad | Sprint | Estado |
| :---- | :---- | :---- | :---- | :---- | :---- |
| RF03 | Consulta del catálogo de productos desde fuentes externas | Alta | Alta | 1 | Pendiente |
| RF04 | Búsqueda de productos por nombre  | Alta | Media | 2 | Pendiente |
| RF05 | Consulta del detalle de un producto | Alta | Media | 2 | Pendiente |
| RF07 | Comparación de precios de un producto entre tiendas | Alta | Alta | 3 | Pendiente |
| RF01 | Registro de usuario mediante formulario  | Medio | Baja | 1 | Pendiente |
| RF02 | Inicio de sesión con credenciales | Media | Baja | 1 | Pendiente |
| RF06 | Consulta y aplicación de reseñas de productos | Media | Media | 2 | Pendiente |
| RF08 | Consulta de ofertas disponibles | Media | Media | 3 | Pendiente |
| RF09 | Filtrado de productos por tienda o categoria | Media | Media | 3 | Pendiente |
| RF11 | Administrar mediante un dashboard el panel de los productos | Media | Media | 3 | Pendiente |
| RF10 | Guardado de productos de interés por usuario | Baja | Baja | 3 | Pendiente |

Prioridad sugerida: Alta \= indispensable; Media \= importante pero no indispensable; Baja \= complementaria.

# **9\. Definición detallada de requerimientos**

## **Requerimiento RF01**

Nombre: REGISTRO USUARIO

Descripción: El sistema permite que un visitante cree una cuenta en SmartFoodPop proporcionando sus datos básicos mediante un formulario de registro

Tipo (Funcional / No funcional / Regla de negocio / Otro): Funcional

Prioridad: Media

Actores relacionados:Consumidor/Usuario

Entrada: Nombre, Correo, contraseña 

Proceso esperado: El sistema valida que los campos obligatorios estén completos, verifica que el correo no esté registrado previamente y almacena las credenciales del nuevo usuario en la base de datos 

Salida: Mensaje de confirmación de registro exitoso; el usuario queda habilitado para iniciar sesión

Dependencias: Ninguna

## **Requerimiento RF02**

Nombre: Inicio de sesión

Descripción: El sistema permite que un usuario registrado acceda a la plataforma mediante sus credenciales.

Tipo: Funcional

Prioridad: Media

Actores relacionados: Consumidor / Usuario, Administrador

Entrada: Correo electrónico y contraseña.

Proceso esperado: El sistema valida que los campos no estén vacíos, verifica las credenciales contra la base de datos y, si son correctas, habilita el acceso a las funcionalidades de la plataforma.

Salida: Acceso a la plataforma con sesión activa, o mensaje de error si las credenciales son incorrectas.

Dependencias: RF01.

## **Requerimiento RF03**

Nombre: Consulta del catálogo de productos

Descripción: El sistema obtiene y muestra al usuario un listado de productos disponibles en diferentes tiendas de la ciudad, a partir de fuentes externas consultadas mediante web scraping o APIs propias

Tipo: Funcional

Prioridad: Alta

Actores relacionados: Consumidor / Usuario

Entrada: Solicitud de consulta del catálogo por parte del usuario.

Proceso esperado: El sistema recupera la información de productos desde las fuentes externas disponibles y la presenta en un listado con nombre, precio y tienda de origen.

Salida: Listado de productos con información básica; mensaje informativo si no hay productos disponibles.

Dependencias: Disponibilidad de las fuentes externas de datos (APIs o sitios susceptibles de scraping).

## **Requerimiento RF04**

Nombre: Búsqueda de productos por nombre

Descripción: El sistema permite al usuario ingresar un término de búsqueda para localizar productos específicos dentro del catálogo disponible.

Tipo: Funcional

Prioridad: Alta

Actores relacionados: Consumidor / Usuario

Entrada: Término de búsqueda ingresado por el usuario.

Proceso esperado: El sistema filtra el catálogo de productos según el término ingresado y retorna los resultados que coincidan.

Salida: Listado de productos coincidentes, o mensaje informativo si no se encuentran resultados.

Dependencias: RF03.

## **Requerimiento RF05**

Nombre: Consulta del detalle de un producto

Descripción: El sistema muestra la información completa disponible de un producto seleccionado por el usuario, incluyendo precio, tienda y características adicionales.

Tipo: Funcional

Prioridad: Alta

Actores relacionados: Consumidor / Usuario

Entrada: Selección de un producto del listado.

Proceso esperado: El sistema recupera y presenta toda la información disponible del producto seleccionado, incluyendo las reseñas asociadas.

Salida: Vista de detalle del producto con su información completa y reseñas disponibles.

Dependencias: RF03.

## **Requerimiento RF06**

Nombre: Consulta y publicación de reseñas

Descripción: El sistema permite a cualquier usuario consultar las reseñas de un producto y a los usuarios registrados publicar nuevas reseñas.

Tipo: Funcional

Prioridad: Media

Actores relacionados: Consumidor / Usuario

Entrada: Selección de un producto; texto de la reseña ingresado por el usuario registrado.

Proceso esperado: El sistema muestra las reseñas existentes del producto. Si el usuario está autenticado, valida los campos del formulario de reseña y almacena el registro en la base de datos.

Salida: Listado de reseñas del producto; confirmación de publicación exitosa de la nueva reseña.

Dependencias: RF01, RF02, RF05.

## **Requerimiento RF07**

Nombre: Comparación de precios entre tiendas

Descripción: El sistema permite al usuario consultar un mismo producto disponible en diferentes tiendas y comparar sus precios de forma organizada.

Tipo: Funcional

Prioridad: Alta

Actores relacionados: Consumidor / Usuario

Entrada: Selección de un producto para comparar.

Proceso esperado: El sistema identifica las tiendas que ofrecen el producto seleccionado y presenta los precios disponibles de forma comparativa.

Salida: Vista comparativa del producto con precios por tienda, organizada para facilitar la identificación de la opción más conveniente.

Dependencias: RF03, RF05.

 

## **Requerimiento RF08**

Nombre: Consulta de ofertas disponibles

Descripción: El sistema identifica y presenta los productos que cuentan con información de oferta o promoción disponible en las fuentes externas consultadas.

Tipo: Funcional

Prioridad: Media

Actores relacionados: Consumidor / Usuario

Entrada: Solicitud de consulta de ofertas por parte del usuario.

Proceso esperado: El sistema filtra del catálogo los productos que tengan información de oferta y los presenta diferenciados del resto.

Salida: Listado de productos en oferta con precio y detalle de la promoción; mensaje informativo si no hay ofertas disponibles.

Dependencias: RF03.

 

## **Requerimiento RF09**

Nombre: Filtrado de productos por tienda o categoría

Descripción: El sistema permite al usuario aplicar filtros sobre el catálogo de productos para acotar los resultados por tienda o categoría.

Tipo: Funcional

Prioridad: Media

Actores relacionados: Consumidor / Usuario

Entrada: Selección de filtro por tienda y/o categoría.

Proceso esperado: El sistema aplica el filtro seleccionado sobre el catálogo disponible y actualiza los resultados mostrados.

Salida: Listado de productos filtrado; mensaje informativo si no hay productos que coincidan con el filtro aplicado.

Dependencias: RF03.

## **Requerimiento RF10**

Nombre: Guardado de productos de interés

Descripción: El sistema permite a los usuarios registrados guardar productos de su interés para consultarlos posteriormente en una sección dedicada.

Tipo: Funcional

Prioridad: Baja

Actores relacionados: Consumidor / Usuario

Entrada: Selección de la opción de guardar sobre un producto del catálogo.

Proceso esperado: El sistema almacena la referencia del producto asociada a la cuenta del usuario. El usuario puede acceder a su lista de productos guardados y eliminar entradas de la misma.

Salida: Confirmación de guardado; listado de productos guardados accesible desde el perfil del usuario.

Dependencias: RF01, RF02, RF03.

Requerimiento RF10

## **Requerimiento RF11**

Nombre: Panel de administrador

Descripción: El sistema permite al administrador editar detalles de un producto de un catálogo.

Tipo: Funcional

Prioridad: Media

Actores relacionados: Administrador

Entrada: Selección de la opción de  editar,  guardar, eliminar sobre un producto del catálogo.

Proceso esperado: El sistema almacena, guarda, elimina los productos (detalle, precio…) que el administrador crea necesario

Salida: Confirmación de editado, guardado o eliminado 

Dependencias: RF03

# **10\. Historias de usuario**

1. HU01 – Registro de usuario  
   Tipo: Normal

   Como visitante, quiero registrarme en SmartFoodPop mediante un formulario, para crear una cuenta y acceder a las funcionalidades de la plataforma.

   **Por qué es Historia Normal**: Es una historia bien acotada y autosuficiente. Consiste en la implementación de un formulario estándar, validación de datos en backend y persistencia básica de usuario. No requiere arquitecturas complejas y se completa fácilmente en 1 sprint 

   

2. HU02 – Inicio de sesión  
   Tipo: Normal

   Como usuario registrado, quiero iniciar sesión con mi correo y contraseña, para acceder a las funcionalidades disponibles en SmartFoodPop.

   **Por qué es Historia Normal:** Funcionalidad puntual de autenticación y manejo de sesión (JWT o cookies). Es un flujo lineal de baja complejidad técnica con criterios de aceptación directos.

   

3. HU03 – Consulta del catálogo de productos  
   Tipo: Epica

   Como usuario, quiero consultar un listado de productos de diferentes tiendas desde una sola plataforma, para conocer las opciones disponibles sin recurrir a múltiples fuentes.

   **Por qué es Épica:** Aunque se le asignaron 5 puntos en la planificación inicial, desde la perspectiva de arquitectura de software es una ÉPICA. Involucra construir scrapers, conectores API, manejo de fallos de fuentes externas, limpieza/normalización de datos e ingesta masiva. Requiere desglosarse en tareas de infraestructura backend e interfaz.

4. HU04 – Búsqueda de productos por nombre  
   Tipo: Normal

   Como usuario, quiero buscar productos ingresando su nombre, para encontrar rápidamente las opciones de interés dentro del catálogo.

   **Por qué es Historia Normal:** Se trata de un filtro por coincidencia textual sobre una base de datos o índice ya poblado. El alcance es claro y se resuelve a nivel de query/filtro frontend/backend.

5. HU05 – Consulta del detalle de un producto  
   Tipo: Normal

   Como usuario, quiero consultar la información completa de un producto, para conocer su precio, tienda y características antes de tomar una decisión de compra.

   **Por qué es Historia Normal:** Vista de detalle estándar de lectura (GET por ID de producto). La complejidad es baja al consumir la entidad completa almacenada.

   

6. HU06 – Consulta y publicación de reseñas  
   Tipo: Epica

   Como usuario registrado, quiero consultar y publicar reseñas sobre los productos, para conocer la experiencia de otros consumidores y compartir la mía.

   **Por qué es Épica:** Es una ÉPICA porque mezcla dos responsabilidades distintas y con reglas de autorización diferentes: lectura pública de reseñas y un subsistema de calificación/creación con moderación y autenticación. Deben separarse en dos historias individuales.

   

7. HU07 – Comparación de precios entre tiendas  
   Tipo: Epica

   Como usuario, quiero comparar el precio de un producto en diferentes tiendas, para identificar la opción más conveniente antes de realizar mi compra.

   **Por qué es Épica:** Constituye una ÉPICA debido al desafío técnico subyacente: el emparejamiento u homologación de productos (Entity Matching) entre distintas fuentes externas (ej. identificar que 'Arroz 1kg Marca X' en Tienda A es el mismo producto en Tienda B), además de la UI gráfica de comparación.

   

   

8. HU08 – Consulta de ofertas disponibles  
   Tipo: Normal

   Como usuario, quiero consultar los productos que tienen oferta disponible, para aprovechar promociones al momento de decidir mi compra.

   **Por qué es Historia Normal:** Consiste en un listado filtrado por el atributo u oferta previamente extraído de la base de datos. No añade complejidad lógica extra.

   

9. HU09 – Filtrado de productos por tienda o categoría  
   Tipo: Normal

   Como usuario, quiero filtrar el catálogo de productos por tienda o categoría, para encontrar más fácilmente las opciones que me interesan.

   **Por qué es Historia Normal:** Operación clásica de interfaz y filtrado de base de datos paramétrico (where tienda\_id \= X y categoria\_id \= Y).

   

10. HU10 – Guardado de productos de interés  
    Tipo: Normal

    Como usuario registrado, quiero guardar productos de mi interés, para consultarlos posteriormente sin tener que buscarlos de nuevo.

    **Por qué es Historia Normal:** Implementación simple de la tabla de favoritos (Usuario\_ID, Producto\_ID) con su correspondiente vista de eliminación y consulta.

11. HU11 – Panel de administrador   
    Tipo: Epica

    Como administrador quiero agregar, editar y eliminar productos del catálogo para mantener la información de la plataforma actualizada y confiable.

    **Por qué es Épica:** Es una ÉPICA evidente según las directrices Agile. Agrupa múltiples operaciones del ciclo CRUD (Create, Read, Update, Delete) con políticas de seguridad, permisos de usuario y modales interactivos. Debe ser fragmentada en historias independientes.

# **11\. Ficha de historia de usuario**

## **HU01**

Requerimiento asociado (RF01): \_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_

Título: Registro de usuario

Tipo:Normal

Historia de usuario:  
Como visitante  
quiero registrarme en SmartFoodPop mediante un formulario  
para crear una cuenta y acceder a las funcionalidades de la plataforma..

Prioridad: ☐ Alta    ☐ Media    ☐ Baja

1. Criterios de aceptación:  
2. El visitante puede acceder al formulario de registro.  
3. El sistema solicita los datos necesarios para crear una cuenta.  
4. El sistema valida que los campos obligatorios estén completos.  
5. El sistema impide registrar un correo que ya exista.  
6. El sistema muestra un mensaje de confirmación cuando el registro es exitoso.  
7. El usuario puede iniciar sesión inmediatamente después de registrarse.

Dependencias: Ninguna

Puntos de historia: 3

Sprint asignado: 1

## **HU02**

Requerimiento asociado (RF02): \_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_

Título: Inicio de sesión

Tipo:Normal

Historia de usuario:  
Como usuario registrado  
quiero iniciar sesión con mi correo y contraseña  
para acceder a las funcionalidades disponibles en SmartFoodPop..

Prioridad: ☐ Alta    ☐ Media    ☐ Baja

Criterios de aceptación:

1. El usuario puede acceder al formulario de inicio de sesión.  
2. El sistema solicita correo electrónico y contraseña.  
3. El sistema valida que los campos no estén vacíos.  
4. El sistema verifica las credenciales ingresadas contra la base de datos.  
5. El sistema muestra un mensaje de error cuando las credenciales son incorrectas.  
6. El usuario accede a la plataforma con sesión activa cuando las credenciales son correctas.

Dependencias: HU01

Puntos de historia: 2

Sprint asignado: 1

## **HU03**

Requerimiento asociado (RF03): \_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_

Título: Consulta del catálogo de productos

Tipo: Epica

Historia de usuario:  
Como usuario  
quiero consultar un listado de productos de diferentes tiendas desde una sola plataforma  
para conocer las opciones disponibles sin recurrir a múltiples fuentes..

Prioridad: ☐ Alta    ☐ Media    ☐ Baja

Criterios de aceptación:

1. El usuario puede acceder al listado de productos desde la pantalla principal.  
2. El sistema obtiene la información de productos desde las fuentes externas disponibles.  
3. El sistema muestra los productos con nombre, precio y tienda de origen.  
4. El sistema informa al usuario cuando no hay productos disponibles.

Dependencias: Disponibilidad de fuentes externas.

Puntos de historia: 5

Sprint asignado: 1

## **HU04** 

Requerimiento asociado (RF04): \_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_

Título: Búsqueda de productos por nombre

Tipo:Normal

Historia de usuario:  
Como usuario  
quiero buscar productos ingresando su nombre  
para encontrar rápidamente las opciones de interés dentro del catálogo..

Prioridad: ☐ Alta    ☐ Media    ☐ Baja

Criterios de aceptación:

1. El usuario puede ingresar un término de búsqueda en el campo habilitado.  
2. El sistema realiza la búsqueda utilizando el término ingresado.  
3. El sistema muestra los productos que coinciden con el término de búsqueda.  
4. El sistema informa cuando no se encuentran resultados para el término ingresado.  
5. El usuario puede realizar una nueva búsqueda sin recargar la página.

Dependencias: HU03

Puntos de historia: 5

Sprint asignado: 2

## **HU05**

Requerimiento asociado (RF05): \_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_

Título: Consulta del detalle de un producto

Tipo:Normal

Historia de usuario:  
Como usuario  
quiero consultar la información completa de un producto  
para conocer su precio, tienda y características antes de tomar una decisión de compra..

Prioridad: ☐ Alta    ☐ Media    ☐ Baja

Criterios de aceptación:

1. El usuario puede seleccionar un producto del listado para ver su detalle.  
2. El sistema muestra toda la información disponible del producto seleccionado.  
3. Se muestra el precio registrado y la tienda correspondiente.  
4. Se muestran las características adicionales disponibles del producto.  
5. El usuario puede consultar las reseñas asociadas al producto desde la vista de detalle.

Dependencias: HU03

Puntos de historia: 3

Sprint asignado: 2

## **HU06**

Requerimiento asociado (RF06): \_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_

Título: Consulta y publicación de reseñas

Tipo: Epica

Historia de usuario:  
Como usuario registrado  
quiero consultar y publicar reseñas sobre los productos  
para conocer la experiencia de otros consumidores y compartir la mía..

Prioridad: ☐ Alta    ☐ Media    ☐ Baja

Criterios de aceptación:

1. El usuario puede consultar las reseñas de un producto desde su vista de detalle.  
2. El usuario registrado puede acceder al formulario para agregar una reseña.  
3. El sistema solicita la información necesaria para registrar la reseña.  
4. El sistema valida que los campos requeridos estén completos.  
5. El sistema almacena la reseña en la base de datos y la muestra disponible para consulta.

Dependencias: HU01, HU02, HU05.

Puntos de historia: 3

Sprint asignado: 2

## **HU07**

Requerimiento asociado (RF07): \_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_

Título: Comparación de precios entre tiendas

Tipo: Epica

Historia de usuario:  
Como usuario  
quiero comparar el precio de un producto en diferentes tiendas  
para identificar la opción más conveniente antes de realizar mi compra..

Prioridad: ☐ Alta    ☐ Media    ☐ Baja

Criterios de aceptación:

1. El usuario puede seleccionar un producto para ver su comparación de precios.  
2. El sistema muestra las tiendas que ofrecen el producto seleccionado.  
3. El sistema muestra el precio disponible en cada tienda de forma organizada.  
4. El usuario puede identificar visualmente las diferencias de precio entre tiendas.

Dependencias: HU03, HU05.

Puntos de historia: 5

Sprint asignado: 5

## **HU08**

Requerimiento asociado (RF08): \_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_

Título: Consulta de ofertas disponibles

Tipo:Normal

Historia de usuario:  
Como usuario  
quiero consultar los productos que tienen oferta disponible  
para aprovechar promociones al momento de decidir mi compra..

Prioridad: ☐ Alta    ☐ Media    ☐ Baja

Criterios de aceptación:

1. El usuario puede acceder a una sección de ofertas desde la plataforma.  
2. El sistema muestra los productos que cuentan con información de oferta disponible.  
3. El sistema diferencia visualmente los productos en oferta de los que no la tienen.  
4. El usuario puede consultar el precio y el detalle de la oferta de cada producto.  
5. El sistema informa cuando no existen ofertas disponibles en ese momento.

Dependencias: HU03

Puntos de historia: 3

Sprint asignado: 3

## **HU09**

Requerimiento asociado (RF09): \_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_

Título: Filtrado de productos por tienda o categoría

Tipo:Normal

Historia de usuario:  
Como usuario  
quiero filtrar el catálogo de productos por tienda o categoría  
para encontrar más fácilmente las opciones que me interesan..

Prioridad: ☐ Alta    ☐ Media    ☐ Baja

Criterios de aceptación:

1. El usuario puede acceder a las opciones de filtrado desde el listado de productos.  
2. El sistema permite filtrar por tienda.  
3. El sistema permite filtrar por categoría cuando dicha información esté disponible.  
4. El sistema actualiza los resultados de acuerdo con el filtro seleccionado.  
5. El sistema informa cuando no hay productos que coincidan con el filtro aplicado.

Dependencias: HU03

Puntos de historia: 3

Sprint asignado: 3

## **HU10**

Requerimiento asociado (RF10): \_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_

Título: Guardado de productos de interés

Tipo:Normal

Historia de usuario:  
Como usuario registrado  
quiero guardar productos de mi interés  
para consultarlos posteriormente sin tener que buscarlos de nuevo.

Prioridad: ☐ Alta    ☐ Media    ☐ Baja

Criterios de aceptación:

1. El usuario registrado puede guardar un producto desde el listado o la vista de detalle.  
2. El sistema almacena el producto asociado a la cuenta del usuario.  
3. El usuario puede acceder a una sección de productos guardados desde su perfil.  
4. El sistema muestra los productos que el usuario ha guardado.  
5. El usuario puede eliminar un producto de su lista de guardados.

Dependencias: HU01,HU02,HU03.

Puntos de historia: 3

Sprint asignado: 3

## **HU11**

Requerimiento asociado (RF11): \_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_

Título: Panel de administrador 

Tipo: Epica	

Historia de usuario:  
Como administrador  
quiero agregar, editar y eliminar productos del catálogo   
para mantener la información de la plataforma actualizada y confiable.

Prioridad: ☐ Alta    ☐  Media    ☐Baja

Criterios de aceptación:

6. El administrador puede acceder al panel de gestión de productos con su sesión activa.  
7. El sistema muestra el listado de productos disponibles en el catálogo.  
8. El administrador puede seleccionar un producto y editar su información (nombre, precio, descripción, tienda).  
9. El administrador puede eliminar un producto del catálogo.  
10. El sistema solicita confirmación antes de ejecutar una eliminación.  
11. El sistema valida que los campos obligatorios estén completos antes de guardar cambios.  
12. El sistema muestra un mensaje de confirmación tras cada operación exitosa (edición o eliminación).  
13. Los cambios realizados se reflejan de inmediato en el catálogo visible para los usuarios.

Dependencias: HU02,HU03

Puntos de historia: 5

Sprint asignado: 3

# **12\. Matriz de requerimientos e historias de usuario**

| Requerimiento | Historia | Descripción | Prioridad | Puntos | Sprint |
| :---- | :---- | :---- | :---- | :---- | :---- |
| RF01 | HU01 | Permitir que las nuevas personas se registren en la plataforma mediante un formulario, proporcionando datos para crear su cuenta. | MEDIA | 3 | 1 |
| RF02 | HU02 | Permitir que los usuarios registrados ingresen al sistema mediante sus credenciales para acceder a las funcionalidades de SmartFoodPop. | MEDIA | 2 | 1 |
| RF03 | HU03 | Permitir consultar productos obtenidos de diferentes tiendas desde una sola plataforma..  | ALTA | 5 | 1 |
| RF04 | HU04 | Permitir buscar productos por nombre para facilitar su consulta. | ALTA | 5 | 2 |
| RF05 | HU05 | Permitir consultar el detalle de un producto, incluyendo su precio, tienda y demás información disponible.  | ALTA | 3 | 2 |
| RF06 | HU06 | Permitir que los usuarios consulten y registren reseñas sobre los productos.  | MEDIA | 3 | 3 |
| RF07 | HU07 | Permitir consultar productos similares de diferentes tiendas para facilitar la comparación de precios. | ALTA | 5 | 1 |
| RF08 | HU08 | Permitir consultar las ofertas disponibles entre los productos obtenidos de las diferentes fuentes.  | MEDIA | 3 | 3 |
| RF09 | HU09 | Permitir filtrar los productos por tienda o categoría.  | MEDIA | 3 | 2 |
| RF10 | HU10 | Permitir guardar productos de interés para consultarlos posteriormente. | BAJA | 3 | 3 |
| RF11 | HU11 | Permitir al administrador realizar ajustes a los productos (agregar, editar, eliminar) | MEDIA | 3 | 3 |

Un requerimiento puede dar origen a varias historias de usuario; por ello, el número de historias puede ser superior a 10\.

# **13\. Criterios de aceptación**

### **HU 01 — Registro de usuario**

* El visitante puede acceder al formulario de registro.  
* El sistema solicita los datos necesarios para crear una cuenta.  
* El sistema valida que los campos obligatorios estén completos.  
* El sistema impide registrar un correo que ya exista.  
* El sistema muestra un mensaje cuando el registro se realiza correctamente.  
* El usuario puede iniciar sesión después de registrarse.

  ### **HU 02 — Inicio de sesión**

* El usuario puede acceder al formulario de inicio de sesión.  
* El sistema solicita correo y contraseña.  
* El sistema valida que los campos no estén vacíos.  
* El sistema verifica las credenciales ingresadas.  
* El sistema muestra un mensaje cuando las credenciales son incorrectas.  
* El usuario puede acceder a la plataforma cuando las credenciales son correctas.

  ### **HU 03 — Consulta de productos**

* El usuario puede acceder al listado de productos.  
* El sistema obtiene información de productos desde las fuentes externas disponibles.  
* El sistema muestra los productos obtenidos en la plataforma.  
* Cada producto muestra la información disponible, como nombre, precio y tienda.  
* El sistema informa cuando no existen productos disponibles.

  ### **HU 04 — Búsqueda de productos**

* El usuario puede ingresar el nombre de un producto.  
* El sistema realiza la búsqueda utilizando el término ingresado.  
* El sistema muestra los productos que coinciden con la búsqueda.  
* El sistema informa cuando no encuentra resultados.  
* El usuario puede realizar una nueva búsqueda.

  ### **HU 05 — Detalle del producto**

* El usuario puede seleccionar un producto del listado.  
* El sistema muestra la información disponible del producto.  
* Se muestra el precio registrado para el producto.  
* Se muestra la tienda correspondiente.  
* Se muestran las características disponibles del producto.  
* El usuario puede consultar las reseñas asociadas al producto.

  ### **HU 06 — Reseñas de productos**

* El usuario puede consultar las reseñas de un producto.  
* El usuario registrado puede agregar una reseña.  
* El sistema solicita la información necesaria para registrar la reseña.  
* El sistema valida los campos requeridos.  
* El sistema almacena la reseña en la base de datos.  
* La reseña registrada puede ser consultada posteriormente.

  ### **HU 07 — Comparación de productos**

* El usuario puede consultar un producto disponible en diferentes tiendas.  
* El sistema muestra las opciones encontradas para el producto.  
* El sistema muestra el precio disponible en cada tienda.  
* El usuario puede identificar las diferencias de precio.  
* La información se presenta de forma organizada para facilitar la comparación.

  ### **HU 08 — Consulta de ofertas**

* El usuario puede acceder a las ofertas disponibles.  
* El sistema muestra los productos que tengan información de oferta disponible.  
* El usuario puede consultar el precio y la información de la oferta.  
* El sistema diferencia los productos con oferta de aquellos sin oferta.  
* El sistema informa cuando no existen ofertas disponibles.

  ### **HU 09 — Filtros de productos**

* El usuario puede consultar el listado de productos.  
* El sistema permite filtrar por tienda.  
* El sistema permite filtrar por categoría cuando dicha información esté disponible.  
* El sistema actualiza los resultados de acuerdo con el filtro seleccionado.  
* El sistema informa cuando no existen productos que coincidan con el filtro.

  ### **HU 10 — Productos guardados**

* El usuario registrado puede guardar un producto de su interés.  
* El sistema almacena el producto asociado a la cuenta del usuario.  
* El usuario puede acceder a una sección de productos guardados.  
* El sistema muestra los productos que el usuario ha guardado.  
* El usuario puede eliminar un producto de su lista

  ### **HU 11 — Panel del administrador**

* El administrador puede acceder al panel de gestión de productos con su sesión activa.  
* El administrador puede agregar y editar productos, incluyendo nombre, precio, descripción y tienda.  
* El administrador puede eliminar un producto del catálogo.  
* El sistema solicita confirmación antes de eliminar un producto.  
* El sistema valida que los campos obligatorios estén completos antes de guardar cambios.  
* El sistema muestra un mensaje de confirmación después de cada operación exitosa.

# **14\. Priorización del Product Backlog**

| Orden | ID | Requerimiento | Prioridad | Justificación |
| :---- | :---- | :---- | :---- | :---- |
| 1 | RF01 | Permitir que las nuevas personas se registren en la plataforma mediante un formulario. | MEDIA | Es necesario para crear cuentas de usuario y permitir acceso a las funcionalidades de SmartFood. |
| 2 | RF02 | Permitir que los usuarios registrados ingresen al sistema mediante sus credenciales. | MEDIA | Permite identificar a los usuarios y brindarles acceso a la plataforma de manera segura.  |
| 3 | RF03 | Permitir consultar el catálogo de productos registrados en las diferentes tiendas. | ALTA | Es una de las funciones principales de SmartFood, ya que permite al usuario conocer los productos disponibles.  |
| 4 | RF04 | Permitir buscar y filtrar productos por nombre. | ALTA | Facilita la búsqueda de productos y permite encontrar más rápidamente las opciones de interés.  |
| 5 | RF05 | Permitir consultar el detalle de un producto seleccionado. | ALTA | Permite al usuario conocer información más completa del producto antes de tomar una decisión de compra.  |
| 6 | RF06 | Permitir que los usuarios consulten y registren reseñas sobre los productos disponibles. | MEDIA | Aporta opiniones de otros usuarios y permite compartir experiencias sobre los productos.  |
| 7 | RF07 | Permitir comparar los precios de un mismo producto disponible en diferentes tiendas  | ALTA | Permite al usuario identificar las diferencias de precio entre las tiendas y facilita la toma de decisiones de compra inteligentes.  |
| 8 | RF08 | Permitir consultar las ofertas disponibles.  | MEDIA | Complementa la consulta de productos y permite identificar opciones con promociones.  |
| 9 | RF09 | Permitir filtrar los productos por tienda o categoría.  | MEDIA | Facilita la organización de los resultados y la búsqueda de productos específicos. |
| 10 | RF10 | Permitir guardar productos de interés.  | BAJA | Es una función complementaria que mejora la experiencia del usuario, pero no es indispensable para el funcionamiento básico de SmartFood.  |
| 11 | RF11 | Panel de administrador: editar, guardar y eliminar productos del catálogo. | MEDIA | Es una función importante para que el administrador pueda actualizar el catálogo de SmartFood, permitiendo modificar detalles, precios y eliminar productos cuando sea necesario. |

Pregunta orientadora: ¿qué funcionalidades deben desarrollarse primero para obtener una versión funcional del producto lo antes posible?

# **15\. Definición de los Sprints**

El desarrollo se organizará mediante Sprints. Para un proyecto académico pequeño se recomienda trabajar entre 3 y 5 Sprints, dependiendo de la duración disponible.

| Sprint | Propósito | Actividades sugeridas |
| :---- | :---- | :---- |
| Sprint 0 | Preparación y planificación  | Establecer las bases de SmartFoodPop, definiendo el alcance, los requisitos y la estructura general del proyecto.  |
| Sprint 1 | MVP | Desarrollar una primera versión funcional que permita a los usuarios acceder a la plataforma y consultar productos.  |
| Sprint 2 | Funcionalidades principales | Incorporar las funcionalidades que representan el mayor valor para el usuario, especialmente la búsqueda de ofertas, comparación, reseñas y filtros  |
| Sprint 3 | Integración | Unificar los diferentes componentes del sistema y verificar que funcionen correctamente de manera conjunta.  |
| Sprint 4 | Entrega | Finalizar el producto, realizar las validaciones finales y presentar una versión estable de SmartFoodPop.  |

# **16\. Planificación de Sprints**

| Sprint | Objetivo | Requerimientos | Historias | Entregable |
| :---- | :---- | :---- | :---- | :---- |
|  Sprint 1  | Establecer las bases del proyecto.  | Ninguno (Fase de análisis) | Ninguna | Alcance definido, backlog inicial, diseño de arquitectura y estructura del sistema.  |
|  | Construir una primera versión funcional.  | RF01, RF02, RF03, RF07  | HU01, HU02, HU03, HU07 | MVP funcional con acceso de usuarios y consulta básica de productos.  |
| Sprint 2 | Incorporar las funciones que generan valor para el usuario.  | RF04, FR05, FR09 | HU04, HU05, HU09 | Versión funcional con ofertas, comparación de precios, filtros, seguimiento y reseñas.  |
|  Sprint 3  | Integrar y validar los diferentes componentes del sistema.  | RF06, RF08, RF10, RF11 | HU06, HU08, HU10, HU11 | Sistema integrado, probado y con las funciones del administrador implementadas.  |
|  | Finalizar y presentar el proyecto.  | Todos | Todas | Versión final de SmartFoodPop, documentación y presentación del proyecto.  |

# **17\. Cronograma de desarrollo Scrum**

| Actividad | Sprint 0 | Sprint 1 | Sprint 2 | Sprint 3 | Sprint 4 |
| :---- | :---- | :---- | :---- | :---- | :---- |
| Definición del alcance | ● |  |  |  |  |
| Product Backlog | ● |  |  |  |  |
| Diseño de arquitectura | ● | ● |  |  |  |
| Diseño de base de datos | ● | ● |  |  |  |
| Desarrollo |  | ● | ● | ● | ● |
| Pruebas |  | ● | ● | ● | ● |
| Integración |  |  |  | ● | ● |
| Corrección de errores |  |  | ● | ● | ● |
| Documentación |  |  |  |  | ● |
| Revisión del Sprint | ● | ● | ● | ● | ● |
| Presentación final |  |  |  |  | ● |

# **18\. Entregables del proyecto**

| Entregable | Contenido mínimo |
| :---- | :---- |
| 1\. Definición del proyecto | Problema, justificación, objetivos, usuarios, alcance y límites |
| 2\. Product Backlog | Mínimo 10 requerimientos, priorización y estimación |
| 3\. Historias de usuario | Historias, criterios de aceptación, prioridad, estimación y Sprint |
| 4\. Diseño | Arquitectura, modelo de datos e interfaces |
| 5\. Desarrollo | Código fuente, repositorio e incrementos funcionales |
| 6\. Pruebas | Casos, evidencias, resultados y correcciones |
| 7\. Producto final | Aplicación funcionando, documentación y demostración |

# **19\. Resumen ejecutivo del proyecto**

| Elemento | Definición |
| :---- | :---- |
| Nombre del proyecto | SmartFoodPop |
| Problema | La dificultad de los consumidores para encontrar, comprar y aprovechar ofertas de productos de manera rápida, informada y sostenible. |
| Solución | Desarrollar una plataforma que permita a los consumidores informarse sobre los diferentes precios y ofertas en las distintas tiendas con el fin de realizar una compra inteligente |
| Usuarios principales | El consumidor |
| Objetivo |  |
| Tipo de aplicación | Aplicación Web |
| No. de requerimientos | 10 requerimientos |
| No. de historias de usuario | 10 historias de usuario |
| No. de Sprints | 5 Sprints en total (0-4) siendo el sprint 0 de preparación |
| Duración | 4 sprints de desarrollo |
| Tecnologías | JavaScript y React para el frontend, y Node.js para el backend. Además de un script de python para realizar web scraping |
| Producto mínimo viable | Una aplicación web que permita registrarse e iniciar sesión, consultar productos con el fin de comparar los precios de cada uno de ellos. |
| Entregable final | Aplicación web completa con todos los requerimientos definidos en este documento |

