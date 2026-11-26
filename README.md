# SmartFoodPop

Aplicación web que centraliza productos, precios, ofertas y reseñas de **Tiendas D1** y **Supermercado Olímpica** en **Popayán**, para comparar precios y comprar de forma informada.

Proyecto de la asignatura *Construcción de Software*.

**Stack:** React (Vite) · Node.js + Express · PostgreSQL · scraper en Python.

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
| [Node.js](https://nodejs.org) 20.19 o superior (LTS) | Sí | Ejecutar backend y frontend |
| [PostgreSQL](https://www.postgresql.org/download/) | Recomendado | Guardar usuarios, reseñas y guardados. Sin él, la app funciona en memoria y los pierde al cerrarse. |
| [Python](https://www.python.org) 3.10 o superior | Opcional | Actualizar precios. Sin él, se usan los precios incluidos en el repositorio. |
| [Git](https://git-scm.com) | Sí | Clonar el repositorio |

## Instalación y ejecución

### Windows (recomendado)

```bat
git clone https://github.com/Cfelipe23/SmartFoodPopv2.git
cd SmartFoodPopv2
start.bat
```

También puedes hacer doble clic en `start.bat`. **La primera vez**, el script:

1. Instala las dependencias de Node.js y, si hay Python, las del scraper.
2. Configura PostgreSQL. Solo pide **una vez** la contraseña del usuario `postgres`, la que elegiste al instalar PostgreSQL. Con ella crea la base `smartfoodpop` y el archivo `backend/.env`.
3. Arranca la app.

Las siguientes veces solo arranca. Cuando la consola muestre la dirección **Local** del frontend (normalmente http://localhost:5173), ábrela en el navegador. Para detener la app, pulsa `Ctrl + C`.

### Cualquier sistema (manual)

```bash
git clone https://github.com/Cfelipe23/SmartFoodPopv2.git
cd SmartFoodPopv2
npm run install:all                               # dependencias del backend y del frontend
python -m pip install -r scraper/requirements.txt  # opcional: para actualizar precios
npm run db:setup                                  # opcional: crea la base PostgreSQL y backend/.env
npm run dev                                       # backend :5000 + frontend + scraper en segundo plano
```

## Uso

| Rol | Correo | Contraseña |
|---|---|---|
| Consumidor | `usuario@popayan.com` | `user123` |
| Administrador | `admin@smartfood.com` | `admin123` |

También puedes registrar una cuenta nueva desde **Ingresar / Registro**.

**Actualización de precios:** cada arranque ejecuta el scraper en segundo plano, que tarda unos 18 minutos. La app se usa mientras tanto con los últimos precios guardados. Cuando la consola muestre `[SCRAPER ] Listo`, recarga la página. Para arrancar sin actualizar precios (más rápido y sin internet):

```bash
start.bat --no-scrape        # o: npm run dev -- --no-scrape
```

## Problemas frecuentes

| Síntoma | Solución |
|---|---|
| Aviso amarillo «Base de datos NO conectada» | PostgreSQL no está configurado. Enciéndelo y vuelve a abrir `start.bat`, o ejecuta `npm run db:setup`. |
| «PostgreSQL está instalado pero apagado» | Tecla Windows → **Servicios** → `postgresql-x64-…` → clic derecho → **Iniciar**. |
| Olvidé la contraseña de PostgreSQL | Cámbiala en pgAdmin, borra `backend/.env` y vuelve a abrir `start.bat`. |
| Comprobar la conexión a la base | `npm run db:check`: muestra la base y cuántas filas tiene cada tabla. |
| «No se pudo ejecutar Python» | Instala Python 3 o arranca con `--no-scrape`. La app funciona igual con los precios guardados. |
| El puerto 5173 está ocupado | Vite usa el siguiente (5174, …). Abre la dirección **Local** que muestra la consola. |

## Pruebas

```bash
npm test                                            # backend y frontend
npm --prefix backend run typecheck                   # comprobación de tipos del backend
npm --prefix backend run build                       # compila el backend a backend/dist/
npm run lint                                        # análisis estático del frontend
npm run build                                       # compilación de producción del frontend
cd scraper && python -m unittest discover -s tests  # scraper
```

## Estructura

```text
backend/    API REST con Express: rutas, controladores, servicios, dominio, repositorios y persistencia PostgreSQL
frontend/   Interfaz en React + Vite: componentes, hooks, cliente de la API y utilidades
scraper/    Scraper en Python de D1 y Olímpica (API VTEX); su salida está en scraper/output/
start.bat   Prepara y arranca todo en Windows
run-dev.js  Arranca backend, frontend y scraper a la vez (npm run dev)
```

## Documentación

- **[`AGENTS.md`](AGENTS.md):** documentación técnica completa. Incluye arquitectura, modelo de datos, API, trazabilidad de requisitos (RF) e historias de usuario (HU), pruebas, decisiones, guion de la demo y **reglas para contribuir sin romper nada** (también para agentes de IA).
- **[`SmartFood Alcance Proyecto Software.docx.md`](SmartFood%20Alcance%20Proyecto%20Software.docx.md):** documento oficial de alcance, la fuente de verdad funcional.
