"""Fuente VTEX (Intelligent Search) con paginación, reintentos y DTO estricto en inglés."""
import logging
import math
import time
from typing import Any, Optional

import requests

from .base import StoreSource

logger = logging.getLogger(__name__)

PAGE_SIZE = 50
SLEEP_BETWEEN_PAGES = 0.8
MAX_RETRIES = 3
BACKOFF_BASE = 1.5
REQUEST_TIMEOUT = 30
RETRY_STATUS = {429, 500, 502, 503, 504}
OK_STATUS = {200, 206}
ENDPOINT_TEMPLATE = (
    "https://{account_id}.vtexcommercestable.com.br"
    "/api/io/_v/api/intelligent-search/product_search/"
)
HEADERS = {
    "Accept": "application/json",
    "User-Agent": (
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
        "AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
    ),
}


def _safe_float(value: Any, default: Optional[float] = None) -> Optional[float]:
    try:
        number = float(value)
    except (TypeError, ValueError):
        return default
    if math.isnan(number) or math.isinf(number):
        return default
    return number


def _safe_int(value: Any, default: Optional[int] = None) -> Optional[int]:
    """Convierte a int; si falla devuelve default (None), NUNCA 0 silencioso."""
    number = _safe_float(value)
    if number is None:
        return default
    return int(round(number))


class VtexSource(StoreSource):
    """Implementación de StoreSource para plataformas de búsqueda inteligente VTEX."""

    def __init__(
        self,
        store_name: str,
        account_id: str,
        base_url: str,
        queries: list[str],
        cookies: Optional[dict[str, str]] = None,
    ):
        self.store_name = store_name
        self.account_id = account_id
        self.base_url = base_url.rstrip("/")
        self.queries = queries
        self.cookies = cookies or {}
        self.endpoint = ENDPOINT_TEMPLATE.format(account_id=account_id)

    def __repr__(self) -> str:
        return f"VtexSource({self.store_name})"

    # ---------- HTTP ----------
    def _request_page(
        self, query: str, offset_from: int, offset_to: int
    ) -> Optional[dict[str, Any]]:
        """Pide un bloque paginado a VTEX. Devuelve el JSON decodificado o None."""
        params = {
            "query": query,
            "map": "ft",
            "page": (offset_from // PAGE_SIZE) + 1,
            "count": PAGE_SIZE,
            "_from": offset_from,
            "_to": offset_to,
        }
        for attempt in range(1, MAX_RETRIES + 1):
            try:
                resp = requests.get(
                    self.endpoint,
                    params=params,
                    cookies=self.cookies,
                    headers=HEADERS,
                    timeout=REQUEST_TIMEOUT,
                )
            except requests.exceptions.RequestException as exc:
                logger.warning(
                    "[%s] '%s' intento %d/%d fallo de red: %s",
                    self.store_name,
                    query,
                    attempt,
                    MAX_RETRIES,
                    exc,
                )
            else:
                if resp.status_code in OK_STATUS:
                    try:
                        return resp.json()
                    except ValueError:
                        logger.error(
                            "[%s] '%s': Respuesta HTTP %s pero JSON inválido",
                            self.store_name,
                            query,
                            resp.status_code,
                        )
                        return None
                if resp.status_code not in RETRY_STATUS:
                    logger.error(
                        "[%s] '%s': HTTP %s no reintentable",
                        self.store_name,
                        query,
                        resp.status_code,
                    )
                    return None
                logger.warning(
                    "[%s] '%s' intento %d/%d: HTTP %s",
                    self.store_name,
                    query,
                    attempt,
                    MAX_RETRIES,
                    resp.status_code,
                )
            if attempt < MAX_RETRIES:
                time.sleep(BACKOFF_BASE**attempt)

        logger.error(
            "[%s] '%s' offset %d: reintentos agotados",
            self.store_name,
            query,
            offset_from,
        )
        return None

    # ---------- Normalización al Data Contract exacto ----------
    def _normalize(self, raw: dict[str, Any]) -> Optional[dict[str, Any]]:
        """Normaliza un producto crudo de VTEX al Data Contract v2 estricto.

        Si el nombre está vacío o el precio no es convertible a entero,
        el producto se descarta (retorna None).
        """
        raw_name = raw.get("productName")
        if not raw_name or not str(raw_name).strip():
            # Descartar producto si name es '' o None
            return None
        name = str(raw_name).strip()

        items = raw.get("items") or []
        item = items[0] if items else {}
        sellers = item.get("sellers") or []
        # 'commertialOffer' con doble m es el nombre de propiedad de VTEX
        offer = (sellers[0].get("commertialOffer") or {}) if sellers else {}

        parsed_price = _safe_int(offer.get("Price"))
        if parsed_price is None or parsed_price <= 0:
            # Descartar si el precio no es convertible a int o es <= 0 (no disponible en Popayán).
            return None
        price = parsed_price

        # original_price: ListPrice. Si no existe o es <= 0, repetir price.
        raw_list_price = _safe_int(offer.get("ListPrice"))
        if raw_list_price is not None and raw_list_price > 0:
            original_price = raw_list_price
        else:
            original_price = price

        # image_url: primera imagen o cadena vacía ''
        images = item.get("images") or []
        image_url = ""
        if images and isinstance(images[0], dict):
            image_url = images[0].get("imageUrl") or ""

        # is_offer: boolean real original_price > price
        is_offer = bool(original_price > price)

        # offer_desc: Teasers[0].name. Si no hay, cadena vacía '' (nunca null)
        teasers = offer.get("Teasers") or []
        offer_desc = ""
        if teasers and isinstance(teasers[0], dict):
            offer_desc = str(teasers[0].get("name") or "")

        # Retornar las claves del contrato, incluyendo trazabilidad y product_id interno para deduplicación
        return {
            "name": name,
            "price": price,
            "original_price": original_price,
            "image_url": image_url,
            "store": self.store_name,
            "is_offer": is_offer,
            "offer_desc": offer_desc,
            "product_id": str(raw.get("productId") or ""),
            "scraped_at": __import__("datetime").datetime.now(__import__("datetime").timezone.utc).isoformat(),
            "source_url": f"{self.base_url}/{raw.get('linkText', '')}",
            "sku_id": str((item.get("itemId") if item else "") or ""),
        }

    # ---------- API pública ----------
    def fetch(self) -> list[dict[str, Any]]:
        results: list[dict[str, Any]] = []
        seen: set[str] = set()
        for query in self.queries:
            offset = 0
            while True:
                data = self._request_page(query, offset, offset + PAGE_SIZE - 1)
                if data is None:
                    break
                raw_products = data.get("products") or []
                total = _safe_int(data.get("recordsFiltered"))
                for p in raw_products:
                    normalized = self._normalize(p)
                    if normalized is None:
                        continue
                    pid = normalized.get("product_id") or normalized["name"]
                    if pid in seen:
                        continue
                    seen.add(pid)
                    results.append(normalized)
                offset += PAGE_SIZE
                if len(raw_products) < PAGE_SIZE:
                    break
                if total is not None and offset >= total:
                    break
                time.sleep(SLEEP_BETWEEN_PAGES)
            logger.info("[%s] '%s': acumulados %d únicos", self.store_name, query, len(results))
        return results

    def _request_page_raw(self, params: dict, max_retries: int = 3, backoff: float = 2.0):
        """GET a Intelligent Search con params arbitrarios, con reintentos.

        Devuelve el JSON (dict) o None si todos los intentos fallan.
        """
        url = self.endpoint
        last_error = None
        for attempt in range(1, max_retries + 1):
            try:
                response = requests.get(url, params=params, cookies=self.cookies, timeout=30)
                if response.status_code == 200:
                    return response.json()
                logging.warning(
                    "HTTP %s en %s (intento %d/%d)",
                    response.status_code, url, attempt, max_retries,
                )
            except Exception as exc:  # requests / json
                last_error = exc
                logging.warning(
                    "Error de red en %s (intento %d/%d): %s",
                    url, attempt, max_retries, exc,
                )
            time.sleep(backoff * attempt)
        logging.error("Falló la petición tras %d intentos: %s", max_retries, last_error)
        return None

    def fetch_full_catalog(self, page_size: int = 50, max_pages: int = 100) -> list:
        """Pagina el catálogo completo con query= vacío hasta agotar recordsFiltered.

        Cada producto normalizado lleva una clave temporal '_raw_categories'
        (lista de rutas de categoría) que scraper.py usa para filtrar y luego elimina.
        """
        products = []
        total = None
        for page in range(1, max_pages + 1):
            data = self._request_page_raw(
                {"query": "", "page": page, "count": page_size}
            )
            if not data:
                logging.warning("Página %d sin datos; se detiene la paginación.", page)
                break

            if total is None:
                total = data.get("recordsFiltered", 0)
                logging.info("Catálogo completo: recordsFiltered=%s", total)

            raw_items = data.get("products") or []
            if not raw_items:
                break

            for raw in raw_items:
                normalized = self._normalize(raw)
                if not normalized:
                    continue
                normalized["_raw_categories"] = raw.get("categories") or []
                products.append(normalized)

            if total and len(products) >= total:
                break
            if len(raw_items) < page_size:
                break

        logging.info("fetch_full_catalog devolvió %d productos", len(products))
        return products

