# SmartFoodPop

Aplicación web que centraliza productos, precios, ofertas y reseñas de **Tiendas D1** y **Supermercado Olímpica** en **Popayán**, para comparar precios y comprar de forma informada. Proyecto de la asignatura *Construcción de Software*.

React (Vite) · Node.js + Express · PostgreSQL · scraper en Python.

## Inicio rápido

```bash
npm run install:all     # dependencias del backend y del frontend
npm run db:setup        # crea la base PostgreSQL y backend/.env
npm run dev             # backend :5000 + frontend + scraper en segundo plano
npm test                # pruebas
```

Cuentas demo: `usuario@popayan.com` / `user123` · `admin@smartfood.com` / `admin123`.

## Documentación

- **[`AGENTS.md`](AGENTS.md):** la única documentación técnica. Incluye las reglas para contribuir, la puesta en marcha, la arquitectura, el modelo de datos, la API, la trazabilidad RF/HU, las pruebas, las decisiones y el guion de la demo.
- **`SmartFood Alcance Proyecto Software.docx.md`:** el documento oficial de alcance (fuente de verdad funcional).
