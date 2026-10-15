"""Gestor de regionalización de sesión VTEX para Popayán.

Implementa:
1. Verificación de expiración de token/cookie vtex_segment (umbral < 12h).
2. Estrategia primaria rápida vía peticiones requests a /api/sessions.
3. Estrategia secundaria (fallback) mediante Playwright headless si la primaria falla.
4. Persistencia en cookies/{store_name}_popayan.json.
"""
import base64
import json
import logging
import os
import time
from typing import Any, Optional

import requests

try:
    from playwright.sync_api import sync_playwright
except ImportError:
    sync_playwright = None

logger = logging.getLogger(__name__)

DEFAULT_COOKIES_DIR = os.path.join(
    os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "cookies"
)

EXPIRATION_THRESHOLD_SECONDS = 12 * 3600  # 12 horas en segundos

REQUEST_HEADERS = {
    "User-Agent": (
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
        "AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
    ),
    "Accept": "application/json, text/plain, */*",
    "Accept-Language": "es-CO,es;q=0.9",
}

_PLAYWRIGHT_SESSION_JS = """
async (payload) => {
    const res = await fetch('/api/sessions', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify(payload),
    });
    return res.status;
}
"""


class RegionalizationError(RuntimeError):
    """Excepción cuando no es posible regionalizar la tienda."""


def _cookie_path(store_name: str, cookies_dir: str) -> str:
    return os.path.join(cookies_dir, f"{store_name}_popayan.json")


def _to_cookie_dict(cookies: Any) -> dict[str, str]:
    """Convierte formato de cookies de Playwright (lista de dicts) o dict simple a {name: value}."""
    if isinstance(cookies, dict):
        return {str(k): str(v) for k, v in cookies.items()}
    if isinstance(cookies, list):
        result = {}
        for c in cookies:
            if isinstance(c, dict) and "name" in c and "value" in c:
                result[c["name"]] = c["value"]
        return result
    return {}


def is_segment_expired(segment_token: str, threshold_seconds: int = EXPIRATION_THRESHOLD_SECONDS) -> bool:
    """vtex_segment es Base64 puro de JSON, no JWT. Si no trae 'exp',
    valida por presencia de 'zip-code=' en facets."""
    if not segment_token:
        return True
    try:
        padded = segment_token + "=" * (-len(segment_token) % 4)
        data = json.loads(base64.urlsafe_b64decode(padded.encode("ascii")).decode("utf-8"))
    except Exception:
        return True
    exp = data.get("exp")
    if exp is not None:
        return (exp - time.time()) < threshold_seconds
    facets = data.get("facets") or ""
    return "zip-code=" not in facets


def is_session_expired(session_token: str, threshold_seconds: int = EXPIRATION_THRESHOLD_SECONDS) -> bool:
    """vtex_session SÍ es JWT con campo exp."""
    if not session_token:
        return True
    try:
        parts = session_token.split(".")
        if len(parts) < 2:
            return True
        padded = parts[1] + "=" * (-len(parts[1]) % 4)
        data = json.loads(base64.urlsafe_b64decode(padded.encode("ascii")))
        return (data.get("exp", 0) - time.time()) < threshold_seconds
    except Exception:
        return True


def _build_session_payload(region: dict[str, Any]) -> dict[str, Any]:
    return {
        "public": {
            "country": {"value": region.get("country", "COL")},
            "postalCode": {"value": region.get("postal_code", "190001")},
            "geoCoordinates": {"value": region.get("geo", "-76.6147,2.4448")},
            "city": {"value": region.get("city", "Popayán")},
            "state": {"value": region.get("state", "Cauca")},
        }
    }


def _run_primary_requests_strategy(base_url: str, region: dict[str, Any]) -> Optional[dict[str, str]]:
    """Estrategia primaria rápida con requests puro (~1s)."""
    session = requests.Session()
    session.headers.update(REQUEST_HEADERS)
    payload = _build_session_payload(region)

    try:
        # Paso 1: GET inicial para obtener cookies de sesión
        resp_init = session.get(base_url, timeout=10)
        if resp_init.status_code >= 400:
            logger.warning("Estrategia primaria GET inicial falló con HTTP %d", resp_init.status_code)
            return None

        # Paso 2: POST a /api/sessions
        sessions_url = f"{base_url.rstrip('/')}/api/sessions"
        resp_session = session.post(
            sessions_url,
            json=payload,
            headers={"Content-Type": "application/json"},
            timeout=10,
        )
        if resp_session.status_code not in (200, 201):
            logger.warning("Estrategia primaria POST /api/sessions falló con HTTP %d", resp_session.status_code)
            return None

        # Paso 3: re-GET para que el storefront regenere vtex_segment
        session.get(base_url, timeout=10)

        cookies = session.cookies.get_dict()
        if "vtex_segment" in cookies:
            return cookies

        logger.warning("Estrategia primaria no generó la cookie vtex_segment.")
        return None
    except Exception as exc:
        logger.warning("Estrategia primaria requests falló: %s", exc)
        return None


def _run_fallback_playwright_strategy(
    base_url: str, region: dict[str, Any], headless: bool = True
) -> dict[str, str]:
    """Estrategia de respaldo mediante Playwright Chromium headless (~15s)."""
    if sync_playwright is None:
        raise RegionalizationError(
            "Playwright no está instalado o falló el import. Instalar con: "
            "pip install playwright && playwright install chromium"
        )

    lng, lat = (float(x) for x in region.get("geo", "-76.6147,2.4448").split(","))

    try:
        with sync_playwright() as pw:
            browser = pw.chromium.launch(headless=headless)
            context = browser.new_context(
                locale=region.get("locale", "es-CO"),
                timezone_id=region.get("timezone", "America/Bogota"),
                geolocation={"latitude": lat, "longitude": lng},
                permissions=["geolocation"],
            )
            context.clear_cookies()
            page = context.new_page()
            page.goto(base_url, wait_until="domcontentloaded", timeout=30000)
            page.evaluate(_PLAYWRIGHT_SESSION_JS, _build_session_payload(region))
            page.reload(wait_until="domcontentloaded", timeout=30000)
            raw_cookies = context.cookies()
            browser.close()
            return _to_cookie_dict(raw_cookies)
    except Exception as exc:
        raise RegionalizationError(f"Estrategia de respaldo Playwright falló: {exc}") from exc


def fetch_regional_cookies(
    store_name: str,
    base_url: str,
    region: dict[str, Any],
    headless: bool = True,
    cookies_dir: Optional[str] = None,
) -> dict[str, str]:
    """Obtiene cookies regionalizadas de Popayán para la tienda dada.

    Verifica la caché en cookies/{store_name}_popayan.json. Si no existe o
    el vtex_segment expira en menos de 12 horas, renueva la sesión probando
    primero requests y recurriendo a Playwright en caso de fallo.
    """
    cookies_dir = cookies_dir or DEFAULT_COOKIES_DIR
    path = _cookie_path(store_name, cookies_dir)

    # 1. Verificar si existen cookies en caché y si siguen vigentes
    if os.path.exists(path):
        try:
            with open(path, "r", encoding="utf-8") as fh:
                cached_cookies = _to_cookie_dict(json.load(fh))
            segment_ok = not is_segment_expired(cached_cookies.get("vtex_segment", ""))
            session_ok = not is_session_expired(cached_cookies.get("vtex_session", ""))
            if segment_ok and session_ok:
                logger.info("[%s] Reutilizando cookies válidas desde %s", store_name, path)
                return cached_cookies
            logger.info("[%s] Cookies expiradas o inválidas; renovando sesión", store_name)
        except Exception as exc:
            logger.warning("[%s] Error leyendo caché (%s); se renovará", store_name, exc)

    # 2. Intentar Estrategia Primaria (requests)
    logger.info("[%s] Intentando regionalización primaria (requests rápido)...", store_name)
    cookies = _run_primary_requests_strategy(base_url, region)

    # 3. Si falló la primaria, ejecutar Fallback (Playwright)
    if not cookies or "vtex_segment" not in cookies:
        logger.warning(
            "[%s] Primaria no disponible o incompleta. Activando fallback con Playwright...",
            store_name,
        )
        cookies = _run_fallback_playwright_strategy(base_url, region, headless=headless)

    if not cookies:
        raise RegionalizationError(f"No se pudieron obtener cookies para {store_name}")

    # 4. Persistir cookies para subsiguientes ejecuciones
    os.makedirs(cookies_dir, exist_ok=True)
    with open(path, "w", encoding="utf-8") as fh:
        json.dump(cookies, fh, ensure_ascii=False, indent=2)

    logger.info("[%s] Cookies regionalizadas de Popayán guardadas con éxito en %s", store_name, path)
    return cookies
