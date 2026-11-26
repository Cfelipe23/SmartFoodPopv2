"""Persistencia: serialización de productos a JSON."""
import json
import logging
import os
import shutil
from typing import Any

logger = logging.getLogger(__name__)


def write_json(products: list[dict[str, Any]], output_file: str) -> None:
    """Escribe la lista de productos en formato JSON plano con codificación UTF-8."""
    directory = os.path.dirname(output_file)
    if directory:
        os.makedirs(directory, exist_ok=True)
    if os.path.exists(output_file):
        shutil.copyfile(output_file, output_file + ".bak")  # respaldo por si la nueva extracción sale incompleta
    # Escritura atómica: el backend vigila este archivo y nunca debe leerlo a medio escribir.
    temp_file = output_file + ".tmp"
    with open(temp_file, "w", encoding="utf-8") as fh:
        json.dump(products, fh, ensure_ascii=False, indent=2)
    os.replace(temp_file, output_file)
    logger.info("Archivo escrito exitosamente: %s con %d registros", output_file, len(products))
