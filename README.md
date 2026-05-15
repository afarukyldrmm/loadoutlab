# LoadoutLab — CS2 Skin Öneri Sitesi Prototipi

Bütçeye ve temaya göre CS2 loadout öneren web sitesi. Gerçek Skinport
fiyatlarıyla, 2000+ skin veritabanıyla çalışır.

## Çalıştırma

```bash
npm install
npm run dev
```

Sonra tarayıcıda `http://localhost:3000` adresini aç.

## Yapı

```
loadoutlab/
├── app/                      # Next.js App Router sayfaları
│   ├── page.tsx              # Ana sayfa (server component)
│   ├── layout.tsx
│   └── globals.css
├── components/
│   └── LoadoutBuilder.tsx    # Ana etkileşimli bileşen
├── lib/
│   └── loadout.ts            # Öneri algoritması + tipler
└── public/data/
    ├── skins.json            # 2064 skin, tam veri
    └── skins_popular.json    # 400 popüler skin (hızlı yüklenir)
```

## Öneri Algoritması

İki aşamalı:

1. **Birinci pass**: Her slot için bütçe payı hesaplanır
   (AK %16, M4 %14, AWP %13, knife %20, glove %16, vs.).
   Önem sırasına göre slotlar dolar. Her slot, target bütçesinin
   ±%30 aralığında popüler skin seçer. Tema filtresi varsa, önce tema
   ile dener; bulamazsa tema gevşetilir.

2. **İkinci pass (upgrade)**: Bütçenin %5'inden fazla artakaldıysa,
   en değerli slotlardan başlayarak yükseltme yapılır.

`variationSeed` ile "yeniden öner" butonu farklı sonuç üretir.

## Veri Kaynakları

- **Skin metadata**: ByMykel CSGO-API (GitHub, ücretsiz)
- **Fiyatlar**: Skinport public API (`api.skinport.com/v1/items`)

Üretim sürümünde fiyat verisi 5 dakikada bir cron job ile güncellenmeli.

## Eksikler (V1 için yapılacak)

- [ ] Steam ile giriş (OpenID)
- [ ] Loadout kaydetme + paylaşma (URL)
- [ ] Daha fazla market entegrasyonu (CSFloat, DMarket)
- [ ] Renk tag'leri çoğunlukla isimden çıkarılıyor — manuel düzeltme şart
- [ ] Pro player loadoutları (s1mple, ZywOo)
- [ ] Affiliate link wrapper (gerçek affiliate ID'leri eklendiğinde)
- [ ] Fiyat geçmişi grafiği
- [ ] Mobil responsive iyileştirme
- [ ] Çoklu dil (EN, RU, DE)
