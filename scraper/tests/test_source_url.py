"""El enlace del producto debe abrir su página en la tienda (VTEX: /{linkText}/p)."""
import os
import sys
import unittest

SCRAPER_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if SCRAPER_DIR not in sys.path:
    sys.path.insert(0, SCRAPER_DIR)

from sources.vtex import VtexSource


def raw_product(link_text):
    return {
        "productName": "Blanqueador Brilla King 2000 Ml",
        "productId": "1",
        "linkText": link_text,
        "items": [{"itemId": "9", "images": [], "sellers": [{"commertialOffer": {"Price": 3100, "ListPrice": 3100}}]}],
    }


class TestSourceUrl(unittest.TestCase):
    def setUp(self):
        self.source = VtexSource(store_name="d1", account_id="d1tiendas", base_url="https://www.d1.com.co/", queries=["x"])

    def test_enlace_termina_en_p(self):
        product = self.source._normalize(raw_product("blanqueador-brilla-king-2000ml-12000089"))
        self.assertEqual(product["source_url"], "https://www.d1.com.co/blanqueador-brilla-king-2000ml-12000089/p")

    def test_sin_link_text_no_inventa_enlace(self):
        product = self.source._normalize(raw_product(""))
        self.assertEqual(product["source_url"], "")


if __name__ == "__main__":
    unittest.main()
