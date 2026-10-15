"""Pruebas unitarias para VtexSource y session_provider usando unittest.mock.

Cubre los 9 casos de prueba especificados (T1 a T9).
"""
import json
import os
import sys
import time
import unittest
from unittest.mock import MagicMock, mock_open, patch

# Añadir el directorio scraper al PYTHONPATH para importar sus módulos
SCRAPER_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if SCRAPER_DIR not in sys.path:
    sys.path.insert(0, SCRAPER_DIR)

from sources.session_provider import (
    EXPIRATION_THRESHOLD_SECONDS,
    fetch_regional_cookies,
    is_segment_expired,
    is_session_expired,
)
from sources.vtex import VtexSource
from writer import write_json


class TestVtexSource(unittest.TestCase):
    def setUp(self):
        self.source = VtexSource(
            store_name="olimpica",
            account_id="olimpica",
            base_url="https://www.olimpica.com",
            queries=["leche"],
        )
        self.required_keys = {
            "name",
            "price",
            "original_price",
            "image_url",
            "store",
            "is_offer",
            "offer_desc",
        }

    # T1: Contrato exacto (exactamente las 7 claves requeridas)
    def test_contrato_exacto(self):
        raw_product = {
            "productName": "Leche Entera Alquería 1000ml",
            "items": [
                {
                    "images": [{"imageUrl": "https://cdn.vtex.com/img.jpg"}],
                    "sellers": [
                        {
                            "commertialOffer": {
                                "Price": 4800,
                                "ListPrice": 5200,
                                "Teasers": [{"name": "10% Descuento Popayán"}],
                            }
                        }
                    ],
                }
            ],
        }
        normalized = self.source._normalize(raw_product)
        self.assertIsNotNone(normalized)
        for key in self.required_keys:
            self.assertIn(key, normalized)
        self.assertEqual(normalized["name"], "Leche Entera Alquería 1000ml")
        self.assertEqual(normalized["price"], 4800)
        self.assertEqual(normalized["original_price"], 5200)
        self.assertTrue(normalized["is_offer"])
        self.assertEqual(normalized["offer_desc"], "10% Descuento Popayán")
        self.assertEqual(normalized["store"], "olimpica")
        self.assertEqual(normalized["image_url"], "https://cdn.vtex.com/img.jpg")

    # T2: Sin claves en español
    def test_sin_claves_espanol(self):
        raw_product = {
            "productName": "Arroz Diana 1000g",
            "items": [
                {
                    "sellers": [{"commertialOffer": {"Price": 3900, "ListPrice": 3900}}]
                }
            ],
        }
        normalized = self.source._normalize(raw_product)
        self.assertIsNotNone(normalized)
        forbidden_keys = {
            "nombre",
            "precio",
            "tienda",
            "es_oferta",
            "imagen_url",
            "categoria",
            "disponibilidad",
            "precio_por_unidad",
            "unidad",
            "offer_description",
        }
        for key in forbidden_keys:
            self.assertNotIn(key, normalized)

    # T3: Precio inválido (Price='abc' o no convertible → producto descartado)
    def test_precio_invalido(self):
        raw_product = {
            "productName": "Producto con precio corrupto",
            "items": [
                {
                    "sellers": [{"commertialOffer": {"Price": "abc", "ListPrice": "def"}}]
                }
            ],
        }
        normalized = self.source._normalize(raw_product)
        self.assertIsNone(normalized, "Un producto con precio no numérico debe ser descartado (None)")

    # T4: original_price fallback (ListPrice=0 o ausente → original_price = price)
    def test_original_price_fallback(self):
        raw_product = {
            "productName": "Aceite Vegetal 900ml",
            "items": [
                {
                    "sellers": [{"commertialOffer": {"Price": 7500, "ListPrice": 0}}]
                }
            ],
        }
        normalized = self.source._normalize(raw_product)
        self.assertIsNotNone(normalized)
        self.assertEqual(normalized["original_price"], 7500)
        self.assertFalse(normalized["is_offer"])

    # T5: offer_desc nunca null (sin Teasers → offer_desc == '')
    def test_offer_desc_nunca_null(self):
        raw_product = {
            "productName": "Detergente en Polvo 1kg",
            "items": [
                {
                    "sellers": [{"commertialOffer": {"Price": 8900, "ListPrice": 8900}}]
                }
            ],
        }
        normalized = self.source._normalize(raw_product)
        self.assertIsNotNone(normalized)
        self.assertEqual(normalized["offer_desc"], "")
        self.assertIsInstance(normalized["offer_desc"], str)

    # T6: Paginación completa (mock _request_page devuelve 120 en 3 páginas)
    @patch("sources.vtex.time.sleep", return_value=None)
    def test_paginacion_completa(self, mock_sleep):
        def fake_request_page(query, offset_from, offset_to):
            if offset_from == 0:
                return {
                    "recordsFiltered": 120,
                    "products": [
                        {
                            "productName": f"Prod {i}",
                            "items": [{"sellers": [{"commertialOffer": {"Price": 1000 + i}}]}],
                        }
                        for i in range(50)
                    ],
                }
            elif offset_from == 50:
                return {
                    "recordsFiltered": 120,
                    "products": [
                        {
                            "productName": f"Prod {i}",
                            "items": [{"sellers": [{"commertialOffer": {"Price": 1000 + i}}]}],
                        }
                        for i in range(50, 100)
                    ],
                }
            elif offset_from == 100:
                return {
                    "recordsFiltered": 120,
                    "products": [
                        {
                            "productName": f"Prod {i}",
                            "items": [{"sellers": [{"commertialOffer": {"Price": 1000 + i}}]}],
                        }
                        for i in range(100, 120)
                    ],
                }
            return {"recordsFiltered": 120, "products": []}

        with patch.object(self.source, "_request_page", side_effect=fake_request_page):
            products = self.source.fetch()
            self.assertEqual(len(products), 120)

    # T7: Reintentos (mock requests.get: 503, 503, 200 → éxito)
    @patch("sources.vtex.time.sleep", return_value=None)
    @patch("sources.vtex.requests.get")
    def test_reintentos(self, mock_get, mock_sleep):
        resp_503 = MagicMock()
        resp_503.status_code = 503

        resp_200 = MagicMock()
        resp_200.status_code = 200
        resp_200.json.return_value = {
            "recordsFiltered": 1,
            "products": [
                {
                    "productName": "Producto Resiliente",
                    "items": [{"sellers": [{"commertialOffer": {"Price": 2500}}]}],
                }
            ],
        }

        mock_get.side_effect = [resp_503, resp_503, resp_200]

        result = self.source._request_page("leche", 0, 49)
        self.assertIsNotNone(result)
        self.assertEqual(result["recordsFiltered"], 1)
        self.assertEqual(mock_get.call_count, 3)

    # T8: Array vacío válido (write_json([]) produce archivo con [])
    def test_array_vacio_valido(self):
        test_file = os.path.join(SCRAPER_DIR, "output", "test_empty.json")
        try:
            write_json([], test_file)
            self.assertTrue(os.path.exists(test_file))
            with open(test_file, "r", encoding="utf-8") as fh:
                data = json.load(fh)
            self.assertEqual(data, [])
        finally:
            if os.path.exists(test_file):
                os.remove(test_file)

    # T9: Cookie expirada (verificación de expiración para vtex_session y vtex_segment)
    def test_cookie_expirada(self):
        import base64

        # 1. Probar is_session_expired con JWT: exp a +6h (< 12h threshold) → expirado
        header = "eyJhbGciOiJIUzI1NiJ9"
        exp_time = int(time.time() + 6 * 3600)
        payload_data = {"exp": exp_time, "sub": "session"}
        payload_b64 = base64.urlsafe_b64encode(json.dumps(payload_data).encode("utf-8")).decode("ascii").rstrip("=")
        fake_jwt = f"{header}.{payload_b64}.fake_signature"
        self.assertTrue(is_session_expired(fake_jwt, threshold_seconds=EXPIRATION_THRESHOLD_SECONDS))

        # exp a +48h → no expirado
        exp_future = int(time.time() + 48 * 3600)
        future_b64 = base64.urlsafe_b64encode(json.dumps({"exp": exp_future}).encode("utf-8")).decode("ascii").rstrip("=")
        fake_future_jwt = f"{header}.{future_b64}.fake_signature"
        self.assertFalse(is_session_expired(fake_future_jwt, threshold_seconds=EXPIRATION_THRESHOLD_SECONDS))

        # 2. Probar is_segment_expired con Base64 JSON puro sin exp
        segment_with_zip = base64.urlsafe_b64encode(
            json.dumps({"facets": "zip-code=190001;coordinates=-76.6147,2.4448;"}).encode("utf-8")
        ).decode("ascii")
        self.assertFalse(is_segment_expired(segment_with_zip, threshold_seconds=EXPIRATION_THRESHOLD_SECONDS))

        segment_without_zip = base64.urlsafe_b64encode(
            json.dumps({"facets": "country=COL;"}).encode("utf-8")
        ).decode("ascii")
        self.assertTrue(is_segment_expired(segment_without_zip, threshold_seconds=EXPIRATION_THRESHOLD_SECONDS))

    # T10: Paginación completa de catálogo con query=''
    def test_fetch_full_catalog_paginates(self):
        from unittest.mock import patch

        def make_page(start, n):
            return {
                "recordsFiltered": 100,
                "products": [{"id": str(i)} for i in range(start, start + n)],
            }

        pages = [make_page(0, 50), make_page(50, 50)]

        with patch.object(self.source, "_request_page_raw", side_effect=pages) as mock_req, \
             patch.object(self.source, "_normalize",
                          side_effect=lambda raw: {"name": raw["id"], "price": 1000}):
            result = self.source.fetch_full_catalog(page_size=50, max_pages=10)

        self.assertEqual(len(result), 100)
        self.assertEqual(mock_req.call_count, 2)
        self.assertIn("_raw_categories", result[0])


if __name__ == "__main__":
    unittest.main()