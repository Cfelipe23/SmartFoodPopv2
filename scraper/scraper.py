"""Orquestador de SmartFoodPop: construye las fuentes y ejecuta el scraping."""
import logging
import sys
import unicodedata
from typing import Optional

from config import (
    D1_TARGET_CATEGORIES,
    HEADLESS,
    OUTPUT_FILE,
    REGION,
    VTEX_STORES,
)
from sources.base import StoreSource
from sources.session_provider import RegionalizationError, fetch_regional_cookies
from sources.vtex import VtexSource
from query_builder import derive_queries
from writer import write_json

logger = logging.getLogger("smartfoodpop")


def setup_logging() -> None:
    """Configura el logging estándar del sistema sin prints sueltos."""
    logging.basicConfig(
        level=logging.INFO,
        format="%(asctime)s | %(levelname)s | %(message)s",
        datefmt="%H:%M:%S",
        stream=sys.stdout,
    )


def _fold(text: str) -> str:
    """Minúsculas y sin tildes, para comparar nombres de categoría."""
    text = unicodedata.normalize("NFD", str(text))
    text = "".join(c for c in text if unicodedata.category(c) != "Mn")
    return text.strip().lower()


_TARGET_FOLDED = {_fold(c) for c in D1_TARGET_CATEGORIES}


def _matches_target_category(raw_categories) -> bool:
    """True si algún segmento de alguna ruta de categoría está en D1_TARGET_CATEGORIES."""
    for path in raw_categories or []:
        for segment in str(path).split("/"):
            if segment and _fold(segment) in _TARGET_FOLDED:
                return True
    return False


def _matches_top_level(raw_categories, allowed) -> bool:
    """True si el primer segmento de alguna ruta de categoría está en `allowed` (sin tildes ni mayúsculas)."""
    allowed_folded = {_fold(c) for c in allowed}
    for path in raw_categories or []:
        segments = [s for s in str(path).split("/") if s]
        if segments and _fold(segments[0]) in allowed_folded:
            return True
    return False


def build_sources() -> list[StoreSource]:
    """Crea una fuente por cada tienda declarada en config.VTEX_STORES."""
    sources: list[StoreSource] = []
    for store in VTEX_STORES:
        name = store["store_name"]
        try:
            cookies = fetch_regional_cookies(
                store_name=name,
                base_url=store["base_url"],
                region=REGION,
                headless=HEADLESS,
            )
        except RegionalizationError:
            logger.exception("No se pudo regionalizar '%s' para Popayán; se omite la tienda", name)
            continue

        # Si la tienda usa catálogo completo (D1), se consulta el catálogo nacional sin cookies regionales
        # para evitar que el regionId de Popayán devuelva Price=0 por falta de bodega online.
        store_cookies = {} if store.get("use_full_catalog", False) else cookies

        source = VtexSource(
            store_name=name,
            account_id=store["account_id"],
            base_url=store["base_url"],
            queries=store["queries"],
            cookies=store_cookies,
        )
        source.use_full_catalog = store.get("use_full_catalog", False)
        source.queries_from_store = store.get("queries_from_store")
        source.max_derived_queries = store.get("max_derived_queries", 400)
        source.target_top_categories = store.get("target_top_categories")
        sources.append(source)
    return sources


MIN_PRODUCTS_TO_WRITE = 20


def run(sources: Optional[list[StoreSource]] = None, output_file: str = OUTPUT_FILE) -> list[dict]:
    """Ejecuta el ciclo de extracción completo y persiste el resultado."""
    active_sources = sources if sources is not None else build_sources()
    # Las fuentes que dependen de otra (queries_from_store) se procesan después de ella.
    active_sources = sorted(active_sources, key=lambda src: 1 if getattr(src, "queries_from_store", None) else 0)
    all_products: list[dict] = []
    products_by_store: dict[str, list[dict]] = {}

    for source in active_sources:
        logger.info("Extrayendo catálogo desde fuente %s", source)
        try:
            if getattr(source, "use_full_catalog", False):
                products = source.fetch_full_catalog()
                before = len(products)
                products = [
                    p for p in products
                    if _matches_target_category(p.get("_raw_categories"))
                ]
                logger.info(
                    "%s: %d crudos -> %d tras filtro de categorías",
                    getattr(source, "store_name", "fuente"), before, len(products),
                )
            else:
                products = source.fetch()
                reference = getattr(source, "queries_from_store", None)
                if reference and products_by_store.get(reference):
                    derived = derive_queries(products_by_store[reference], limit=getattr(source, "max_derived_queries", 400))
                    logger.info("%s: %d búsquedas derivadas de %s", getattr(source, "store_name", "fuente"), len(derived), reference)
                    known = {p.get("product_id") or p["name"] for p in products}
                    extra = source.fetch_queries(derived, max_pages=1, pause_between_queries=0.8)
                    products.extend(p for p in extra if (p.get("product_id") or p["name"]) not in known)
        except Exception:
            logger.exception("Ocurrió un error inesperado en la fuente %s; continuando...", source)
            continue
        top_categories = getattr(source, "target_top_categories", None)
        if top_categories:
            before = len(products)
            products = [p for p in products if _matches_top_level(p.get("_raw_categories"), top_categories)]
            logger.info("%s: %d crudos -> %d en %s", getattr(source, "store_name", "fuente"), before, len(products), "/".join(top_categories))
        logger.info("[%s] %d productos válidos obtenidos", getattr(source, "store_name", "fuente"), len(products))
        products_by_store[getattr(source, "store_name", "fuente")] = products
        all_products.extend(products)

    if len(all_products) < MIN_PRODUCTS_TO_WRITE:
        logger.error(
            "⚠️ Solo %d productos extraídos. Posible rotura de API o sin conexión: se conserva el JSON anterior.",
            len(all_products),
        )
        return []

    for product in all_products:
        product.pop("_raw_categories", None)

    ALLOWED = {
        "name",
        "price",
        "original_price",
        "image_url",
        "store",
        "is_offer",
        "offer_desc",
        "scraped_at",
        "source_url",
        "sku_id",
    }
    clean_products = [{k: v for k, v in p.items() if k in ALLOWED} for p in all_products]

    write_json(clean_products, output_file)
    logger.info("Proceso finalizado. Total acumulado: %d productos -> %s", len(clean_products), output_file)
    return clean_products


if __name__ == "__main__":
    setup_logging()
    # Código de salida 1 si no se escribió nada (lo usa `npm run dev` para avisar).
    sys.exit(0 if run() else 1)
