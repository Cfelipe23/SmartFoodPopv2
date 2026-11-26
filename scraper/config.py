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

# Higiene personal básica (categoría «Aseo personal», aprobada el 26-nov-2026). Se buscan siempre en
# Olímpica porque las búsquedas derivadas de D1 tienen un tope y podrían no llegar a estos productos.
_PERSONAL_CARE_QUERIES = [
    "papel higienico",
    "crema dental",
    "cepillo dental",
    "seda dental",
    "enjuague bucal",
    "jabon de tocador",
    "jabon antibacterial",
    "shampoo",
    "acondicionador",
    "desodorante",
    "toallas higienicas",
    "protectores diarios",
    "maquina de afeitar",
    "panuelos desechables",
    "panitos humedos",
]

VTEX_STORES = [
    {
        "store_name": "olimpica",
        "account_id": "olimpica",
        "base_url": "https://www.olimpica.com",
        "queries": list(_DEFAULT_QUERIES) + list(_PERSONAL_CARE_QUERIES),
        "use_full_catalog": False,
        # Además de las búsquedas base, se consulta con los tipos de producto que tiene D1
        # para que la comparación entre tiendas cubra la mayor parte del catálogo.
        "queries_from_store": "d1",
        # Solo el supermercado: Olímpica también vende colchones, electrodomésticos, juguetes, etc.
        "target_top_categories": ["Supermercado"],
        "max_derived_queries": 400,
    },
    {
        "store_name": "d1",
        "account_id": "d1tiendas",
        "base_url": "https://www.d1.com.co",
        "queries": list(_DEFAULT_QUERIES),
        "use_full_catalog": True,
    },
]

# Categorías de D1 a conservar: alimentos y canasta básica, las subcategorías de aseo del hogar
# (categoría "Aseo del hogar" del alcance) y las de higiene personal básica ("Aseo personal").
# Comparación case-insensitive y sin tildes contra los segmentos de la ruta de categoría.
D1_TARGET_CATEGORIES = [
    "Despensa",
    "Lácteos y huevos",
    "Bebidas",
    "Pollo carne y pescado",
    "Panadería y repostería",
    "Carnes Frías y delikatessen",
    "Frutas y verduras",
    # Subcategorías de aseo del hogar (Hogar > Aseo y limpieza); se excluyen pilas, bombillos y desechables.
    "Cuidado de la ropa",
    "Cuidado de superficies y cocina",
    "Cuidado del aire",
    "Accesorios limpieza",
    "Organización aseo y lavandería",
    # Higiene personal básica (Cuidado personal y belleza > …) para la categoría «Aseo personal».
    # Se excluyen maquillaje, cuidado facial, solar y corporal, fragancias y botiquín.
    "Papel higiénico y pañuelos",
    "Cuidado oral",
    "Jabonería",
    "Desodorantes",
    "Cuidado capilar",
    "Protección femenina",
    "Afeitado",
]

