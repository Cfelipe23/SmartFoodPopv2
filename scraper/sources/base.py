"""Contrato común para todas las fuentes de tiendas."""
from abc import ABC, abstractmethod


class StoreSource(ABC):
    """Cada tienda es una implementación de esta interfaz."""

    @abstractmethod
    def fetch(self) -> list[dict]:
        """Devuelve una lista de dicts que cumplen el DTO de producto."""
        raise NotImplementedError
