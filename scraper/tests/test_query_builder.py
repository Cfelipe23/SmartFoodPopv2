"""Las búsquedas derivadas de D1 deben ser cortas, únicas y sin tamaños ni stopwords."""
import os
import sys
import unittest

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from query_builder import derive_queries  # noqa: E402


class DeriveQueriesTest(unittest.TestCase):
    def test_uses_first_meaningful_words_without_sizes(self):
        products = [
            {"name": "Queso Mozzarella Tajado Latti 400 Grs"},
            {"name": "Arroz Diana 500 G"},
            {"name": "Leche Alpina Uht Deslactosada 1,1 Lt X6 Unds"},
        ]
        self.assertEqual(derive_queries(products), ["queso mozzarella", "arroz diana", "leche alpina"])

    def test_deduplicates_and_respects_limit(self):
        products = [{"name": "Arroz Diana 500 G"}, {"name": "ARROZ DIANA 1 Kg"}, {"name": "Aceite Imatá 900 Ml"}]
        self.assertEqual(derive_queries(products), ["arroz diana", "aceite imata"])
        self.assertEqual(derive_queries(products, limit=1), ["arroz diana"])

    def test_ignores_products_without_usable_name(self):
        self.assertEqual(derive_queries([{"name": ""}, {"name": "500 G"}, {}]), [])


if __name__ == "__main__":
    unittest.main()
