"""Las búsquedas por término deben conservar la ruta de categoría para poder filtrar por sección de la tienda."""
import os
import sys
import unittest
from unittest.mock import patch

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from sources.vtex import VtexSource  # noqa: E402


def raw_product(name, category):
    return {
        "productName": name,
        "categories": [category],
        "items": [{"images": [{"imageUrl": "https://cdn/x.jpg"}], "sellers": [{"commertialOffer": {"Price": 1000, "ListPrice": 1000}}]}],
    }


class QueryCategoriesTest(unittest.TestCase):
    @patch("sources.vtex.time.sleep")
    def test_fetch_queries_keeps_raw_categories(self, _sleep):
        source = VtexSource("olimpica", "olimpica", "https://www.olimpica.com", queries=[])
        page = {"products": [raw_product("Arroz Diana 5 Kg", "/Supermercado/Despensa/Arroces/"), raw_product("Colchón Doble", "/Hogar/Muebles y Colchones/")], "recordsFiltered": 2}
        with patch.object(source, "_request_page", return_value=page):
            result = source.fetch_queries(["arroz"], max_pages=1)
        self.assertEqual([p["_raw_categories"] for p in result], [["/Supermercado/Despensa/Arroces/"], ["/Hogar/Muebles y Colchones/"]])


if __name__ == "__main__":
    unittest.main()
