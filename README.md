# SmartFoodPop

Aplicación web que centraliza productos, precios, ofertas y reseñas de **Tiendas D1** y **Supermercado Olímpica** en **Popayán**, para comparar precios y comprar de forma informada.

Proyecto de la asignatura *Construcción de Software*.

React 19 y Vite 8 sirven el frontend ESM. Express 4 sirve la API REST desde un backend CommonJS. Ambas aplicaciones usan TypeScript 5.9.3 estricto. PostgreSQL guarda los datos y el scraper en Python publica un JSON que consume el backend.

## Funcionalidades

- **Registro e inicio de sesión** con correo y contraseña (contraseñas cifradas con bcrypt).
- **Catálogo** con unos 1.000 productos comparables entre D1 y Olímpica, obtenidos de las tiendas con un scraper.
- **Búsqueda** por nombre, que ignora tildes y mayúsculas, y **filtros** por categoría (*Granos y básicos, Lácteos, Aseo del hogar, Otros*) y por tienda.
- **Comparación de precios:** el mismo producto en ambas tiendas o su equivalente con **precio por kg/L**, marcando la opción más económica.
- **Detalle del producto** con enlace a su página en la tienda, productos similares y **reseñas** con calificación.
- **Ofertas** ordenadas por mayor descuento.
- **Productos guardados** desde la tarjeta o el detalle, accesibles desde el menú de perfil.
- **Panel de administrador** para crear, editar y eliminar productos.
- **Precios al día:** al arrancar, el scraper actualiza los precios sin perder reseñas ni guardados.

## Requisitos

| Programa | ¿Obligatorio? | Para qué |
|---|---|---|
| [Node.js](https://nodejs.org) 20.19+ de la serie 20, 22.12+ de la serie 22 o una LTS posterior | Sí | Se verificó en Windows con 20.19.0 y 24.14.0. |
| [PostgreSQL](https://www.postgresql.org/download/) | Recomendado | Se verificó con 18.6. Sin configuración de base de datos, usuarios, reseñas y guardados viven en memoria hasta cerrar el backend. |
| [Python](https://www.python.org) 3.10 o superior | Opcional | Actualiza el catálogo. Las pruebas sin conexión pasaron con 3.12.12 y 3.13.15. El JSON versionado basta para arrancar. |
| [Git](https://git-scm.com) | Sí | Clonar el repositorio |

## Instalación y ejecución

### Windows (recomendado)

```bat
git clone https://github.com/Cfelipe23/SmartFoodPopv2.git
cd SmartFoodPopv2
npm --prefix backend ci
npm --prefix frontend ci
start.bat --no-scrape
```

También puedes hacer doble clic en `start.bat` para iniciar con actualización de precios. En el primer arranque el script realiza estos pasos.

1. Instala las dependencias de Node.js si faltan y, si hay Python, las del scraper. Las instalaciones previas con `npm ci` reproducen los lockfiles versionados.
2. Si falta `backend/.env`, intenta configurar PostgreSQL con los datos del entorno o solicita la contraseña local. Crea la base `smartfoodpop` por defecto y escribe la conexión en `backend/.env`.
3. Arranca la app.

Las siguientes veces solo arranca. Cuando la consola muestre la dirección **Local** del frontend (normalmente http://localhost:5173), ábrela en el navegador. Para detener la app, pulsa `Ctrl + C`.

### Cualquier sistema (manual)

```bash
git clone https://github.com/Cfelipe23/SmartFoodPopv2.git
cd SmartFoodPopv2
npm --prefix backend ci
npm --prefix frontend ci
npm run dev -- --no-scrape
```

### Configuración local

Copia `backend/.env.example` a `backend/.env` para configurar una base existente. Define `DATABASE_URL` y un `JWT_SECRET` propio. El secreto es obligatorio en producción. Como alternativa, `npm run db:setup` crea la base indicada por `PGDATABASE` y guarda la conexión. Puedes verificarla con `npm run db:check`. Ejecuta estas herramientas con los datos de la base que quieras usar.

`PORT` controla el puerto del backend. Usa `VITE_API_URL` si el frontend debe apuntar a una URL de API distinta de `http://localhost:5000/api`. Para probar con una muestra fija, configura `SCRAPED_PRODUCTS_PATH` con una ruta absoluta. El catálogo de arranque está en `scraper/output/scraped_products_api.json`. Puedes instalar el scraper con `python -m pip install -r scraper/requirements.txt`.

## Uso

Puedes registrar una cuenta nueva desde **Ingresar / Registro**. El formulario muestra accesos de demostración cuando Vite se ejecuta en desarrollo.

**Actualización de precios:** cada arranque ejecuta el scraper en segundo plano, que tarda unos 18 minutos. La app se usa mientras tanto con los últimos precios guardados. Cuando la consola muestre `[SCRAPER ] Listo`, recarga la página. Para arrancar sin actualizar precios (más rápido y sin internet):

```bash
start.bat --no-scrape        # o: npm run dev -- --no-scrape
```

## Problemas frecuentes

| Síntoma | Solución |
|---|---|
| Aviso amarillo «Base de datos NO conectada» | PostgreSQL no está configurado. Enciéndelo y vuelve a abrir `start.bat`, o ejecuta `npm run db:setup`. |
| «PostgreSQL está instalado pero apagado» | Tecla Windows → **Servicios** → `postgresql-x64-…` → clic derecho → **Iniciar**. |
| Cambió la contraseña de PostgreSQL | Actualiza la conexión en `backend/.env` y ejecuta `npm run db:check`. |
| Comprobar la conexión a la base | `npm run db:check`: muestra la base y cuántas filas tiene cada tabla. |
| «No se pudo ejecutar Python» | Instala Python 3 o arranca con `--no-scrape`. La app funciona igual con los precios guardados. |
| El puerto 5173 está ocupado | Vite usa el siguiente (5174, …). Abre la dirección **Local** que muestra la consola. |

## Pruebas

```bash
npm test                                            # backend y frontend
npm --prefix backend run typecheck                   # comprobación de tipos del backend
npm --prefix backend run build                       # compila el backend a backend/dist/
npm --prefix backend start                           # sirve el backend compilado
npm --prefix frontend run typecheck                  # comprobación de tipos del frontend
npm run lint                                        # análisis estático del frontend
npm run build                                       # comprobación de tipos y compilación de producción del frontend
cd scraper && python -m unittest discover -s tests  # scraper
```

## Estructura

```text
backend/    API REST con Express: rutas, controladores, servicios, dominio, repositorios y persistencia PostgreSQL
frontend/   Interfaz React, TSX y Vite, con hooks y cliente HTTP en TypeScript
scraper/    Scraper en Python de D1 y Olímpica (API VTEX); su salida está en scraper/output/
start.bat   Prepara y arranca todo en Windows
run-dev.js  Arranca backend, frontend y scraper a la vez (npm run dev)
```

Los seis archivos `*.test.js` del frontend y las pruebas del backend siguen ejecutándose con `node:test`. También quedan scripts auxiliares JavaScript para Vite, las pruebas, la compilación, la base de datos y el arranque. Los contratos HTTP y las rutas están en la sección 6 del documento técnico. Las configuraciones temporales, las cookies y los directorios de compilación deben mantenerse fuera de Git.

## Documentación

- **[`AGENTS.md`](AGENTS.md):** documentación técnica completa. Incluye arquitectura, modelo de datos, API, trazabilidad de requisitos (RF) e historias de usuario (HU), pruebas, decisiones, guion de la demo y **reglas para contribuir sin romper nada** (también para agentes de IA).
- **[`SmartFood Alcance Proyecto Software.docx.md`](SmartFood%20Alcance%20Proyecto%20Software.docx.md):** documento oficial de alcance, la fuente de verdad funcional.
