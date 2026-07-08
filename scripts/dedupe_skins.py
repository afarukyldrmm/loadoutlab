#!/usr/bin/env python3
"""
v11: skins.json / skins_popular.json duplicate temizliği.

Sorun: Doppler / Gamma Doppler gibi faz bazlı skinler veri üretiminde
isim bazında birleştirilirken her faz ayrı kayıt olarak kalmış (5-7 kopya).
Kopyalarda sadece `id` ve `image` (faz görseli) farklı; fiyat/wear verisi
hepsinde aynı (Phase-1). Bu yüzden galeri ve önerilerde aynı skin 5-7 kez
görünüyor.

Çözüm: Her isimden İLK kaydı tut, gerisini at. Faz bazlı ayrı fiyatlama
ileride ayrı bir iş (Skinport public API faz bazlı fiyat vermiyor).

Kullanım:  python3 scripts/dedupe_skins.py
Orijinaller .bak uzantısıyla yedeklenir.
"""

import json
import shutil
from pathlib import Path

FILES = [
    "public/data/skins.json",
    "public/data/skins_popular.json",
]


def dedupe(path: Path) -> None:
    skins = json.loads(path.read_text(encoding="utf-8"))
    seen: set[str] = set()
    result = []
    for s in skins:
        if s["name"] in seen:
            continue
        seen.add(s["name"])
        result.append(s)

    removed = len(skins) - len(result)
    if removed == 0:
        print(f"{path}: duplicate yok, dokunulmadı ({len(skins)} kayıt)")
        return

    backup = path.with_suffix(path.suffix + ".bak")
    shutil.copy2(path, backup)
    path.write_text(
        json.dumps(result, ensure_ascii=False, indent=2), encoding="utf-8"
    )
    print(
        f"{path}: {len(skins)} → {len(result)} kayıt "
        f"({removed} duplicate silindi, yedek: {backup.name})"
    )


if __name__ == "__main__":
    root = Path(__file__).resolve().parent.parent
    for rel in FILES:
        dedupe(root / rel)
