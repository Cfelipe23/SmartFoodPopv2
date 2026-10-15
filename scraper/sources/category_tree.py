"""Descubrimiento dinámico de categorías VTEX para expansión de queries."""
import logging
from typing import Any, Optional

import requests

logger = logging.getLogger(__name__)

CATEGORY_TREE_ENDPOINT = (
    "https://{account_id}.vtexcommercestable.com.br"
    "/api/catalog_system/pub/category/tree/{depth}"
)
HEADERS = {
    "Accept": "application/json",
    "User-Agent": (
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
        "AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
    ),
}


def get_category_tree(account_id: str, depth: int = 3) -> list[dict[str, Any]]:
    """Consulta el árbol de categorías oficial de la tienda VTEX."""
    url = CATEGORY_TREE_ENDPOINT.format(account_id=account_id, depth=depth)
    try:
        resp = requests.get(url, headers=HEADERS, timeout=15)
        resp.raise_for_status()
        data = resp.json()
        if isinstance(data, list):
            return data
        return []
    except Exception as exc:
        logger.warning("[%s] Error obteniendo árbol de categorías: %s", account_id, exc)
        return []


def extract_leaf_category_names(categories: list[dict[str, Any]]) -> list[str]:
    """Extrae nombres de categorías hoja para usarlas como queries o filtros."""
    leaf_names: list[str] = []

    def _traverse(node: dict[str, Any]) -> None:
        children = node.get("children") or []
        if not children:
            name = node.get("name")
            if name:
                leaf_names.append(str(name).strip())
        else:
            for child in children:
                if isinstance(child, dict):
                    _traverse(child)

    for item in categories:
        if isinstance(item, dict):
            _traverse(item)

    return leaf_names
