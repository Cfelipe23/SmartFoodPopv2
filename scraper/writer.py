"""Persistencia: serialización de productos a JSON."""
import json
import logging
import os
from typing import Any

logger = logging.getLogger(__name__)


def write_json(products: list[dict[str, Any]], output_file: str) -> None:
    """Escribe la lista de productos en formato JSON plano con codificación UTF-8."""
    directory = os.path.dirname(output_file)
    if directory:
        os.makedirs(directory, exist_ok=True)
    with open(output_file, "w", encoding="utf-8") as fh:
        json.dump(products, fh, ensure_ascii=False, indent=2)
    logger.info("Archivo escrito exitosamente: %s con %d registros", output_file, len(products))
