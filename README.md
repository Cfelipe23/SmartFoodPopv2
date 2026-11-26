# SmartFoodPop

Aplicación web que centraliza productos, precios, ofertas y reseñas de **Tiendas D1** y **Supermercado Olímpica** en **Popayán**, para comparar precios y comprar de forma informada. Proyecto de la asignatura *Construcción de Software*.

React (Vite) · Node.js + Express · PostgreSQL · scraper en Python.

## Inicio rápido

Requisitos: **Node.js 20.19+**. Recomendados: **PostgreSQL** (para que los datos persistan) y **Python 3.10+** (para actualizar precios).

**Windows:** clona el repositorio y ejecuta **`start.bat`** (o haz doble clic). La primera vez instala las dependencias y configura PostgreSQL por sí solo: solo pide **una vez** la contraseña del usuario `postgres` que se puso al instalarlo. Luego arranca la app. Abre la dirección «Local» que muestra el frontend (normalmente http://localhost:5173).

**Manual (cualquier sistema):**

```bash
npm run install:all     # dependencias del backend y del frontend
npm run db:setup        # crea la base PostgreSQL y backend/.env (opcional: sin ella funciona en memoria)
npm run dev             # backend :5000 + frontend + scraper en segundo plano
npm test                # pruebas
```

Cuentas demo: `usuario@popayan.com` / `user123` · `admin@smartfood.com` / `admin123`.

## Documentación

- **[`AGENTS.md`](AGENTS.md):** la única documentación técnica. Incluye las reglas para contribuir, la puesta en marcha, la arquitectura, el modelo de datos, la API, la trazabilidad RF/HU, las pruebas, las decisiones y el guion de la demo.
- **`SmartFood Alcance Proyecto Software.docx.md`:** el documento oficial de alcance (fuente de verdad funcional).
