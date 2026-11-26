"""Genera búsquedas para una tienda a partir de los productos ya obtenidos de otra.

Sirve para que Olímpica se consulte con los mismos tipos de producto que tiene D1
(p. ej. "Queso Mozzarella Tajado Latti 400 Grs" -> "queso mozzarella") y así la
comparación de precios entre tiendas (RF07) cubra la mayor parte del catálogo.
"""
import re
import unicodedata

_STOPWORDS = {
    "de", "del", "la", "el", "los", "las", "en", "con", "sin", "y", "a", "para", "por", "al",
    "x", "un", "una", "und", "unds", "unid", "unidad", "unidades", "neto", "pack", "paca",
    "bolsa", "caja", "botella", "tarro", "frasco", "sobre", "lata", "uht",
}
_SIZE = re.compile(r"\b\d+(?:[.,]\d+)*\s*(?:kgs?|kilos?|gramos?|grs?|g|ml|cc|lts?|litros?|l|unds?|un)\b")


def _fold(text: str) -> str:
    text = unicodedata.normalize("NFD", str(text))
    text = "".join(c for c in text if unicodedata.category(c) != "Mn")
    return text.lower()


def derive_queries(products: list[dict], limit: int = 400, words: int = 2) -> list[str]:
    """Devuelve hasta `limit` búsquedas únicas con las primeras `words` palabras significativas del nombre."""
    queries: list[str] = []
    seen: set[str] = set()
    for product in products:
        name = _SIZE.sub(" ", _fold(product.get("name", "")))
        tokens = [t for t in re.findall(r"[a-z0-9]+", name) if len(t) > 1 and not t.isdigit() and t not in _STOPWORDS]
        if not tokens:
            continue
        query = " ".join(tokens[:words])
        if query in seen:
            continue
        seen.add(query)
        queries.append(query)
        if len(queries) >= limit:
            break
    return queries
