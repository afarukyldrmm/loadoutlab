#!/usr/bin/env python3
"""
LoadoutLab fiyat güncelleme pipeline'ı (v13).

Skinport public API'sinden güncel EUR fiyatları çeker ve mevcut
skins.json / skins_popular.json dosyalarını YENİDEN YAZAR.

Tasarım kararları:
- Skin metadata'sı (isim, silah, slot, rarity, görsel, tag'ler, id)
  mevcut skins.json'dan AYNEN korunur — sadece fiyat verisi tazelenir.
  Böylece renk sistemi (manuel override'lar, skin_colors.json) bozulmaz.
- StatTrak™ / Souvenir varyantları hariç tutulur (mevcut veri de böyle).
- Skinport'ta artık listelenmeyen skinler eski fiyatıyla kalır (stale sayılır,
  özet çıktıda raporlanır).
- skins_popular.json kuralı: entry_price >= 0.20€ VE toplam adet >= 2
  (mevcut veriden birebir doğrulandı).
- public/data/meta.json'a güncelleme zamanı yazılır (UI footer'da gösterilir).

Kullanım:
  pip3 install requests brotli --break-system-packages   # bir kere
  python3 scripts/update_prices.py

Not: Skinport API'si Brotli sıkıştırma ister (Accept-Encoding: br) ve
IP başına 5 dakikada 8 istekle sınırlıdır. Bu script tek istek atar.
"""

import json
import hashlib
import re
import sys
from datetime import datetime, timezone
from pathlib import Path

try:
    import requests
except ImportError:
    sys.exit("requests eksik → pip3 install requests brotli --break-system-packages")

ROOT = Path(__file__).resolve().parent.parent
SKINS_FILE = ROOT / "public/data/skins.json"
POPULAR_FILE = ROOT / "public/data/skins_popular.json"
META_FILE = ROOT / "public/data/meta.json"

API_URL = "https://api.skinport.com/v1/items"
PARAMS = {"app_id": 730, "currency": "EUR", "tradable": 0}

WEARS = [
    "Factory New",
    "Minimal Wear",
    "Field-Tested",
    "Well-Worn",
    "Battle-Scarred",
]
WEAR_RE = re.compile(r"^(.*) \((" + "|".join(WEARS) + r")\)$")

# Popüler liste kuralı (mevcut veriden doğrulandı)
POPULAR_MIN_PRICE = 0.20
POPULAR_MIN_QTY = 2


def fetch_skinport() -> list[dict]:
    print("Skinport API'den fiyatlar çekiliyor...")
    resp = requests.get(
        API_URL,
        params=PARAMS,
        headers={"Accept-Encoding": "br"},
        timeout=120,
    )
    resp.raise_for_status()
    items = resp.json()
    print(f"  {len(items)} kayıt geldi")
    return items


def build_price_map(items: list[dict]) -> dict[str, list[dict]]:
    """market_hash_name → base isim bazında wear fiyat listesi."""
    prices: dict[str, list[dict]] = {}
    for it in items:
        mhn = it.get("market_hash_name", "")
        # StatTrak / Souvenir hariç
        if mhn.startswith("StatTrak") or mhn.startswith("Souvenir"):
            continue
        m = WEAR_RE.match(mhn)
        if not m:
            continue  # wear'siz item (vanilla bıçak, ajan, sticker vs.)
        base, wear = m.group(1), m.group(2)
        min_price = it.get("min_price")
        if min_price is None or min_price <= 0:
            continue
        prices.setdefault(base, []).append(
            {
                "wear": wear,
                "min_price": round(float(min_price), 2),
                "median_price": round(float(it.get("median_price") or min_price), 2),
                "quantity": int(it.get("quantity") or 0),
                "url": it.get("item_page")
                or f"https://skinport.com/market?search={mhn}",
            }
        )
    # wear'leri iyiden kötüye sırala
    order = {w: i for i, w in enumerate(WEARS)}
    for lst in prices.values():
        lst.sort(key=lambda w: order[w["wear"]])
    return prices


def total_qty(skin: dict) -> int:
    return sum(w["quantity"] for w in skin["wears"])


def main() -> None:
    skins = json.loads(SKINS_FILE.read_text(encoding="utf-8"))
    print(f"Mevcut veri: {len(skins)} skin")

    items = fetch_skinport()
    price_map = build_price_map(items)
    print(f"  {len(price_map)} benzersiz skin fiyatı (StatTrak/Souvenir hariç)")

    updated, stale = 0, 0
    seen: set[str] = set()
    result = []
    for s in skins:
        if s["name"] in seen:  # emniyet: duplicate gelirse atla
            continue
        seen.add(s["name"])

        fresh = price_map.get(s["name"])
        if fresh:
            best = min(fresh, key=lambda w: w["min_price"])
            s = {
                **s,
                "wears": fresh,
                "entry_price": best["min_price"],
                "entry_wear": best["wear"],
                "entry_url": best["url"],
            }
            updated += 1
        else:
            stale += 1
        result.append(s)

    popular = [
        s
        for s in result
        if s["entry_price"] >= POPULAR_MIN_PRICE and total_qty(s) >= POPULAR_MIN_QTY
    ]

    SKINS_FILE.write_text(
        json.dumps(result, ensure_ascii=False, indent=2), encoding="utf-8"
    )
    POPULAR_FILE.write_text(
        json.dumps(popular, ensure_ascii=False, indent=2), encoding="utf-8"
    )
    META_FILE.write_text(
        json.dumps(
            {
                "prices_updated_at": datetime.now(timezone.utc).isoformat(),
                "skin_count": len(result),
                "popular_count": len(popular),
                "stale_count": stale,
                "source": "Skinport public API (EUR)",
            },
            ensure_ascii=False,
            indent=2,
        ),
        encoding="utf-8",
    )

    print(f"\nÖzet:")
    print(f"  Güncellenen : {updated}")
    print(f"  Eski kalan  : {stale} (Skinport'ta listelenmiyor)")
    print(f"  skins.json  : {len(result)} kayıt")
    print(f"  popular.json: {len(popular)} kayıt")
    print(f"  meta.json   : yazıldı")


if __name__ == "__main__":
    main()
