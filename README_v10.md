# v10 patch — Faz 1: Renk filtresi kök-neden çözümü

## Değişen / yeni dosyalar

- `lib/loadout.ts` — değişti
  - `COLOR_TAGS` 9 → **12** renk (yellow + brown + gray eklendi)
  - `COLOR_NEIGHBORS` üç yeni rengin komşuluk haritası
  - `THEME_TAGS` 15 → **~30 tag** (renk + stil + pattern üç grup, `kind` alanı)
  - Yeni: `matchesThemeFilter(skin, colors[], styles[], strict)` — çoklu renk + sıkı/esnek
  - Eski `matchesThemeTag` geriye uyumlu, yenisinin üzerine sarıyor
  - `RecommendOptions`: `themeColors[]`, `themeStyles[]`, `strictColor`, **`respectThemeStrictly`** (eski `themeTag` da çalışır)
  - `recommendLoadout` ve `findAlternatives` yeni API kullanıyor
  - `getEffectiveTags` artık pattern tag'ini de döndürüyor (Doppler skinleri → "doppler" tag'i otomatik)
  - **Silent fallback bug fix:** Tema filtresinde uygun skin yoksa artık rastgele bir skin seçilmiyor; slot boş kalıyor, `Loadout.unmatchedWeapons` listesinde döner. UI bunun için uyarı kartı gösterir.

- `lib/pattern_skins.ts` — **yeni**
  - `PatternType` enum (Doppler, Gamma Doppler, Fade, Marble Fade, Case Hardened, Tiger Tooth, Crimson Web, Slaughter, Lore, Damascus Steel, Autotronic, Bright Water, Safari Mesh, ...)
  - `detectPattern(skinName)` — skin adından pattern tipini bulur
  - `isPatternSkin`, `filterByPattern`, `PATTERN_LABELS` yardımcıları

- `lib/manual_color_overrides.ts` — küçük güncelleme (sadece header / yorum revizyonu)
  - İlk renk = dominant kuralını netleştirdi
  - Pattern skinler için kurallar belgelendi
  - İçindeki entry'ler aynı (zaten doğruydu)

- `scripts/analyze_skin_colors_ai.py` — değişti
  - PROMPT 12 renk listesine genişletildi
  - "MOST DOMINANT FIRST" kuralı vurgulandı (AI'nın sıralaması güvenilir olsun)
  - yellow/brown/gray için hint eklendi

- `UI_GUIDE.md` — UI tarafı için yapılması gereken `LoadoutBuilder.tsx` değişiklikleri

## Uygulama adımları (Mac'inde)

```bash
cd ~/Desktop/loadoutlab

# 1) Patch'i aç
unzip -o ~/Downloads/loadoutlab_v10_patch.zip

# 2) Değişen dosyaları gör
git status
# Beklenen:
#   modified:   lib/loadout.ts
#   modified:   lib/manual_color_overrides.ts
#   new file:   lib/pattern_skins.ts
#   (scripts/analyze_skin_colors_ai.py — projeye kopyalamaya gerek yok eğer halihazırda kullanmıyorsan; UI_GUIDE.md de aynı şekilde)

# 3) Build'in temiz olduğundan emin ol (önemli — TypeScript hatası var mı bak)
npm run build

# Hata yoksa:

# 4) UI değişikliklerini yap — components/LoadoutBuilder.tsx'i UI_GUIDE.md'ye göre güncelle
#    (themeColors / themeStyles / strictColor state'leri + chip render değişiklikleri)

# 5) Yerel test
npm run dev
# localhost:3000 → mavi seç → tüm gelenler dominant mavi olmalı; pattern testi yap

# 6) Push
git add lib/loadout.ts lib/manual_color_overrides.ts lib/pattern_skins.ts components/LoadoutBuilder.tsx
git commit -m "v10 / Faz 1: çoklu renk + sıkı toggle + pattern desteği"
git push
```

## Nasıl test edilir

UI_GUIDE.md'de detaylı senaryolar var. Hızlı kontrol:

- Mavi seç → AK Vulcan, Glock Water Elemental, M4A4 Tornado, Frontside Misty geliyor; Case Hardened veya Violet Beadwork **gelmiyor**
- Kırmızı + Premium → ikisinin AND'i
- "Doppler" pattern → tüm Doppler bıçaklar
- "Doppler" + Mavi → sadece mavi-dominant Doppler'lar (Sapphire, Phase 4)
- "Sıkı" toggle kapat → daha çok skin

## Bilinen sınırlar

- AI çıktısı hâlâ %5-10 yanlış olabilir; manuel override bunu kapatıyor ama yeni skinler için Faz 4'te "yanlış renk?" feedback butonu eklenmeli.
- Pattern detect sadece skin adından bakıyor; "Doppler" kelimesi içermeyen ama desen olan skin yok (CS isimlendirmesi tutarlı).
