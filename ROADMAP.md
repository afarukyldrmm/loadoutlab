# LoadoutLab Yol Haritası

*Son güncelleme: 8 Temmuz 2026 — v12 sonrası*

## Tamamlananlar

- v11: Kademeli renk eşleşme (tam → yakın ton → boş) + YAKIN TON rozeti
- v11: 152 duplicate Doppler kaydı temizlendi (`scripts/dedupe_skins.py`)
- v11: 22 pattern ailesine kural bazlı renk sabitleri (`PATTERN_COLOR_DEFAULTS`)
- v12: UI sadeleştirme — panel sırası: Bütçe → Silahlar → Wear → Renk → Koleksiyonlar (katlanır)
- v12: Wear/float filtresi (FN/MW/FT/WW/BS) — fiyat ve linkler seçili kaliteye göre
- v12: "Sadece tam eşleşme" renk anahtarı
- v13: Otomatik fiyat pipeline'ı — Skinport API + GitHub Actions (Pzt+Prş 06:00 UTC), header'da son güncelleme tarihi
- v14: Çoklu dil — EN varsayılan (prefix'siz), /ru, /tr; next-intl; header'da dil seçici
- v15: Paylaşım linki (URL state) + bütçe aşımı düzeltmesi (bıçak/eldiven maliyeti silah bütçesinden düşülür)
- v16: Karttan wear değiştirme (FN/MW/FT fiyat çipleri)
- v17: Ucuz Benzeri motoru (findLookalikes — renk+pattern benzerlik skoru) + SEO kombinasyon sayfaları (144)
- v18: Keskin renk kademesi (tam→2.renk→komşu), COLOR_NEIGHBORS sıkılaştırıldı; Inter font, logo, emoji temizliği, kompakt hazır-loadout listesi
- v19: Skin detay sayfaları — /skin/[slug], 1911 skin × 3 dil (wear tablosu, ucuz benzerleri, aile linkleri)
- v20: /cheap-alternatives keşif sayfası + header nav

## Strateji notu (v17+)
Pazar kalabalık (10+ bütçe/renk builder'ı). Farklılaşma: (1) Ucuz Benzeri motoru = imza özellik,
(2) fiyat geçmişi/trend (git geçmişi veri biriktiriyor — henüz UI yok), (3) TR+RU yerelleştirme,
(4) paylaşılabilir OG görsel kartı (yapılmadı).

## Sıradaki işler (önem sırasıyla)

### 1. Fiyat tazeliği — otomatik veri güncelleme ⭐ EN ÖNEMLİ
Statik fiyat = güven kaybı. Yapılacaklar:
- Skinport API'den veri çeken üretim scriptini yeniden yaz (repo'da yok)
- `dedupe_skins.py` pipeline'a entegre
- GitHub Action ile haftalık cron → otomatik commit → Vercel deploy
- Sitede "Fiyatlar son güncelleme: X" ibaresi

### 2. Çoklu dil altyapısı (EN varsayılan + RU + TR)
Site global; CS2'nin en büyük kitlelerinden biri Rusya'da.
- next-intl kurulumu, tüm UI metinleri mesaj dosyalarına
- Varsayılan İngilizce; dil seçici header'da; locale URL'de (/en, /ru, /tr)
- Erken yapılmalı: her yeni özellik yeni metin demek, geciktikçe çeviri borcu büyür
- SEO sayfaları (madde 6) locale'lere göre üretilecek

### 3. Loadout paylaşım linki (URL state)
Seçimler URL'e yazılır/okunur: `?b=500&c=red&w=ak47,awp&q=fn&seed=3`
- "Linki kopyala" butonu
- Backend gerekmez; sitenin kendi kendini pazarlama kanalı
- variationSeed URL'e girmeli (deterministik sonuç)

### 4. Mobil kontrol
Panel + kartlar 375px'te test, kırılanlar düzeltilir. Paylaşım linkleri mobilde açılacağı için 2'nin hemen ardından.

### 5. Karttan wear değiştirme
Kartta FN 149€ / MW 89€ / FT 45€ ... seçenekleri; tıklayınca fiyat+link o wear'e geçer.

### 6. SEO kombinasyon sayfaları
`/en/loadout/red-under-100` gibi locale bazlı statik sayfalar (generateStaticParams + OG meta). Organik trafik; CSFloat farklılaşması: onlar envanter aracı, biz "bütçeyle keşif" motoru.

### 7. Steam Login (Phase 4)
Giriş gerektirecek değerle birlikte: kayıtlı loadout'lar, envanter analizi. NextAuth + Steam OpenID.

## Ertelenen / notlar

- Doppler faz ayrımı (Sapphire, Ruby ayrı ürün): faz bazlı fiyat verisi Skinport public API'de yok
- Skin aileleri verisi `lib/skin_families.ts`'te hazır, koleksiyon UI'ı mevcut
- ⚠️ Eski Anthropic API key (`sk-ant-api03-fRHZP...`) iptali teyit edilmedi — console.anthropic.com/settings/keys
