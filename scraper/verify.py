"""Verificación post-scraping. Uso: python verify.py"""
import json
import base64
import os
import sys

OUTPUT = "output/scraped_products_api.json"
COOKIES_DIR = "cookies"


def main():
    if not os.path.exists(OUTPUT):
        print(f"❌ No existe {OUTPUT}. Corre 'python scraper.py' primero.")
        sys.exit(1)

    with open(OUTPUT, encoding="utf-8") as f:
        d = json.load(f)

    print("=" * 60)
    print(f"📦 Total productos: {len(d)}")
    if not d:
        print("❌ JSON vacío. Revisa cookies y API.")
        sys.exit(1)

    # Conteo por tienda
    stores = {}
    for x in d:
        stores[x.get("store", "?")] = stores.get(x.get("store", "?"), 0) + 1
    print(f"🏪 Por tienda: {stores}")

    # Estadísticas
    ofertas = sum(1 for x in d if x.get("is_offer"))
    sin_img = sum(1 for x in d if not x.get("image_url"))
    sin_precio = sum(1 for x in d if not x.get("price"))
    duplicados_nombre = len(d) - len(set(x["name"] for x in d))

    print(f"🏷️  Ofertas: {ofertas} ({100*ofertas/len(d):.1f}%)")
    print(f"🖼️  Sin imagen: {sin_img}")
    print(f"💲 Sin precio: {sin_precio}")
    print(f"🔁 Duplicados por nombre: {duplicados_nombre}")

    # Contrato
    REQUIRED = {"name", "price", "original_price", "image_url", "store", "is_offer", "offer_desc"}
    FORBIDDEN = {"nombre", "precio", "tienda", "es_oferta", "imagen_url", "product_id",
                 "categoria", "unidad", "precio_por_unidad", "disponibilidad", "_raw_categories"}
    keys = set(d[0].keys())
    faltantes = REQUIRED - keys
    prohibidas = FORBIDDEN & keys
    print()
    print(f"🔑 Claves presentes: {sorted(keys)}")
    print(f"❌ Claves requeridas faltantes: {faltantes or 'ninguna'}")
    print(f"🚫 Claves prohibidas presentes: {prohibidas or 'ninguna'}")

    # Ejemplos
    print()
    print("--- Primeros 5 productos ---")
    for p in d[:5]:
        print(f"  [{p['store']}] {p['name'][:60]}")
        print(f"      ${p['price']:,} | antes ${p['original_price']:,} | oferta={p['is_offer']}")

    # Cookies regionales
    print()
    print("--- Cookies regionales ---")
    for store in stores:
        path = os.path.join(COOKIES_DIR, f"{store}_popayan.json")
        if not os.path.exists(path):
            print(f"  ❌ {store}: {path} no existe")
            continue
        with open(path, encoding="utf-8") as f:
            c = json.load(f)
        seg = c.get("vtex_segment", "")
        if not seg:
            print(f"  ❌ {store}: vtex_segment vacío")
            continue
        try:
            padded = seg + "=" * (-len(seg) % 4)
            payload = json.loads(base64.urlsafe_b64decode(padded))
            facets = payload.get("facets", "")
            tiene_zip = "zip-code=190001" in facets
            print(f"  {'✅' if tiene_zip else '⚠️ '} {store}: zip-code=190001 {'presente' if tiene_zip else 'AUSENTE'}")
            print(f"      facets: {facets[:100]}...")
        except Exception as e:
            print(f"  ❌ {store}: no se pudo decodificar vtex_segment ({e})")

    # Diagnóstico
    print()
    print("=" * 60)
    if len(d) < 100:
        print("❌ Volumen bajo (<100). Posible rotura o cookie inválida.")
    elif stores.get("d1", 0) < 200:
        print(f"⚠️  D1 tiene solo {stores.get('d1', 0)} productos (esperado >200). Revisar cookie D1.")
    else:
        print("✅ Todo parece OK.")


if __name__ == "__main__":
    main()