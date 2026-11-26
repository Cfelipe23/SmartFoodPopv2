"""El scraper debe conservar las categorías del alcance: básicos, lácteos y aseo del hogar."""
import os
import sys
import unittest

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

import scraper  # noqa: E402


class TargetCategoriesTest(unittest.TestCase):
    def test_keeps_food_and_home_cleaning_categories(self):
        self.assertTrue(scraper._matches_target_category(["/Despensa/Arroz/"]))
        self.assertTrue(scraper._matches_target_category(["/Lacteos y huevos/Leches/"]))
        self.assertTrue(scraper._matches_target_category(["/Hogar/Aseo y limpieza/Cuidado de la ropa/"]))
        self.assertTrue(scraper._matches_target_category(["/Hogar/Aseo y limpieza/Cuidado de superficies y cocina/"]))

    def test_discards_unrelated_home_categories(self):
        self.assertFalse(scraper._matches_target_category(["/Hogar/Decohogar/"]))
        self.assertFalse(scraper._matches_target_category(["/Hogar/Aseo y limpieza/Pilas bombillos y desechables/"]))
        self.assertFalse(scraper._matches_target_category(["/Hogar/Aseo y limpieza/Otros hogar/"]))
        self.assertFalse(scraper._matches_target_category(["/Moda/Mujer/"]))
        self.assertFalse(scraper._matches_target_category([]))


class TopLevelCategoryTest(unittest.TestCase):
    def test_olimpica_keeps_only_the_supermarket(self):
        allowed = ["Supermercado"]
        self.assertTrue(scraper._matches_top_level(["/Supermercado/Despensa/Arroces/"], allowed))
        self.assertTrue(scraper._matches_top_level(["/Supermercado/Aseo del Hogar/Cuidado De La Ropa/"], allowed))
        self.assertFalse(scraper._matches_top_level(["/Hogar/Muebles y Colchones/Colchones/"], allowed))
        self.assertFalse(scraper._matches_top_level(["/Electrodomésticos y Tecnología/Electro hogar/"], allowed))
        self.assertFalse(scraper._matches_top_level([], allowed))


if __name__ == "__main__":
    unittest.main()
