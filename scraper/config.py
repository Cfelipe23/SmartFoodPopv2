"""Configuración declarativa de SmartFoodPop.

Define la región geográfica objetivo (Popayán, Cauca), las tiendas VTEX
a consultar y las rutas de salida requeridas por el backend.
"""
import os

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
OUTPUT_DIR = os.path.join(BASE_DIR, "output")
OUTPUT_FILE = os.path.join(OUTPUT_DIR, "scraped_products_api.json")
COOKIES_DIR = os.path.join(BASE_DIR, "cookies")

REGION = {
    "country": "COL",
    "state": "Cauca",
    "city": "Popayán",
    "postal_code": "190001",
    "geo": "-76.6147,2.4448",
    "geo_lat": 2.4448,
    "geo_lng": -76.6147,
    "timezone": "America/Bogota",
    "locale": "es-CO",
}

HEADLESS = True

_DEFAULT_QUERIES = [
    "leche",
    "leche entera",
    "leche deslactosada",
    "leche en polvo",
    "frijol",
    "frijol rojo",
    "frijol cargamanto",
    "huevos",
    "huevos aa",
    "huevos a",
    "arroz",
    "arroz 1000g",
    "arroz 5000g",
    "aceite",
    "aceite vegetal",
    "aceite girasol",
    "aceite oliva",
    "detergente",
    "detergente polvo",
    "detergente liquido",
]

VTEX_STORES = [
    {
        "store_name": "olimpica",
        "account_id": "olimpica",
        "base_url": "https://www.olimpica.com",
        "queries": list(_DEFAULT_QUERIES),
        "use_full_catalog": False,
    },
    {
        "store_name": "d1",
        "account_id": "d1tiendas",
        "base_url": "https://www.d1.com.co",
        "queries": list(_DEFAULT_QUERIES),
        "use_full_catalog": True,
    },
]

# Categorías de primer nivel de D1 a conservar (alimentos y canasta básica).
# Comparación case-insensitive y sin tildes contra los segmentos de la ruta de categoría.
D1_TARGET_CATEGORIES = [
    "Despensa",
    "Lácteos y huevos",
    "Bebidas",
    "Pollo carne y pescado",
    "Panadería y repostería",
    "Carnes Frías y delikatessen",
    "Frutas y verduras",
]

