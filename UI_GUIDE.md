# v10 UI Entegrasyon Kılavuzu — LoadoutBuilder.tsx

v10 backend tarafı (`lib/loadout.ts` + `lib/pattern_skins.ts`) çoklu renk + sıkı/esnek toggle + pattern desteğini içeriyor. UI'nın bunu kullanması için `components/LoadoutBuilder.tsx`'de 3 değişiklik gerekiyor.

## State değişikliği

Mevcut state'te `themeTag: string | undefined` veya benzeri tek-tag yapısı var. Bunu çoklu yapıya çevir:

```tsx
const [themeColors, setThemeColors] = useState<string[]>([]);
const [themeStyles, setThemeStyles] = useState<string[]>([]);
const [strictColor, setStrictColor] = useState<boolean>(true);
```

Eski `setThemeTag('red')` çağrılarını şuna dönüştür:

```tsx
const toggleColor = (id: string) =>
  setThemeColors((cur) => cur.includes(id) ? cur.filter(x => x !== id) : [...cur, id]);

const toggleStyle = (id: string) =>
  setThemeStyles((cur) => cur.includes(id) ? cur.filter(x => x !== id) : [...cur, id]);
```

## recommendLoadout çağrısı

Eskiden:
```tsx
const loadout = useMemo(
  () => recommendLoadout(skins, { budget, themeTag, enabledWeapons, variationSeed }),
  [skins, budget, themeTag, enabledWeapons, variationSeed]
);
```

Yenisi:
```tsx
const loadout = useMemo(
  () => recommendLoadout(skins, {
    budget,
    themeColors,
    themeStyles,
    strictColor,
    enabledWeapons,
    variationSeed,
  }),
  [skins, budget, themeColors, themeStyles, strictColor, enabledWeapons, variationSeed]
);
```

`findAlternatives` çağrısı da aynı şekilde — `themeTag` yerine `themeColors`, `themeStyles`, `strictColor` ver.

## Filter UI (renk + stil + desen chip'leri)

Mevcut THEME_TAGS rendering'i şuna benzer olabilir:

```tsx
{THEME_TAGS.map((t) => (
  <button key={t.id} onClick={() => setThemeTag(t.id)} className={...}>
    {t.label}
  </button>
))}
```

Bunu üç gruba ayır:

```tsx
import { THEME_TAGS } from '@/lib/loadout';

const colorChips = THEME_TAGS.filter(t => t.kind === 'color');
const styleChips = THEME_TAGS.filter(t => t.kind === 'style');
const patternChips = THEME_TAGS.filter(t => t.kind === 'pattern');

return (
  <div className="space-y-4">
    {/* Renkler */}
    <div>
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-sm font-medium">Renkler</h3>
        <label className="flex items-center gap-1 text-xs text-gray-400">
          <input
            type="checkbox"
            checked={strictColor}
            onChange={(e) => setStrictColor(e.target.checked)}
          />
          Sıkı eşleşme
        </label>
      </div>
      <div className="flex flex-wrap gap-2">
        {colorChips.map((t) => (
          <button
            key={t.id}
            onClick={() => toggleColor(t.id)}
            className={`px-3 py-1 rounded-full text-sm transition ${
              themeColors.includes(t.id)
                ? 'bg-blue-600 text-white'
                : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
            }`}
            title={strictColor
              ? `Sadece dominant rengi ${t.label.toLowerCase()} olan skinler`
              : `Dominant veya ikincil rengi ${t.label.toLowerCase()} olan skinler`}
          >
            {t.label}
          </button>
        ))}
      </div>
      {themeColors.length > 1 && (
        <p className="text-xs text-gray-400 mt-1">
          {themeColors.length} renk seçili — herhangi birine uyan skinler gelir.{' '}
          <button onClick={() => setThemeColors([])} className="underline">Temizle</button>
        </p>
      )}
    </div>

    {/* Stiller */}
    <div>
      <h3 className="text-sm font-medium mb-2">Stiller</h3>
      <div className="flex flex-wrap gap-2">
        {styleChips.map((t) => (
          <button
            key={t.id}
            onClick={() => toggleStyle(t.id)}
            className={`px-3 py-1 rounded-full text-sm transition ${
              themeStyles.includes(t.id)
                ? 'bg-purple-600 text-white'
                : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>
    </div>

    {/* Desenler */}
    <div>
      <h3 className="text-sm font-medium mb-2">Desenler (Pattern)</h3>
      <div className="flex flex-wrap gap-2">
        {patternChips.map((t) => (
          <button
            key={t.id}
            onClick={() => toggleStyle(t.id)}
            className={`px-3 py-1 rounded-full text-sm transition ${
              themeStyles.includes(t.id)
                ? 'bg-amber-600 text-white'
                : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>
      <p className="text-xs text-gray-500 mt-1">
        Pattern skinleri renk filtresinde de görünür (dominant rengiyle).
      </p>
    </div>
  </div>
);
```

> **Not:** Hem `kind: 'style'` hem `kind: 'pattern'` tag'leri `themeStyles` state'ine yazılıyor; backend ikisini de tek liste olarak alıyor (`themeStyles` parametresi). Görsel ayrım sadece UI'da.

## "Sıkı / Esnek" toggle davranışı

- **Sıkı** (default): `colorsOnly[0] === seçilenRenklerdenBiri` — Vulcan dominant blue, mavi seçilince gelir; Case Hardened dominant gold, mavi seçilince GELMEZ.
- **Esnek**: `colorsOnly.slice(0,2)` içinde komşu renklerden biri varsa kabul — daha geniş ağ, ama "biraz mavi var" skinleri de girer.

## Silent fallback fix — `unmatchedWeapons` uyarı kartı

v10 artık tema filtresinde uygun skin yoksa **rastgele bir skin seçmiyor**, slot boş bırakıyor. `loadout.unmatchedWeapons` o silahların listesini döner. UI'da bunlar için uyarı kartı göster:

```tsx
{loadout.unmatchedWeapons?.map((weaponName) => (
  <div key={weaponName} className="border border-amber-600 rounded-lg p-4 bg-amber-900/20">
    <div className="text-xs text-amber-400 uppercase">{weaponName}</div>
    <div className="text-amber-200 font-medium mt-2">
      Bu temada uygun {weaponName} bulunamadı
    </div>
    <p className="text-xs text-gray-400 mt-1">
      Temayı esnetmeyi (Sıkı toggle kapat), bütçeyi artırmayı veya bu silahı seçimden çıkarmayı dene.
    </p>
    <div className="flex gap-2 mt-3">
      <button onClick={() => setStrictColor(false)} className="text-xs px-3 py-1 bg-amber-700 rounded">
        Esnek modu dene
      </button>
      <button onClick={() => removeWeapon(weaponName)} className="text-xs px-3 py-1 bg-gray-700 rounded">
        Bu silahı çıkar
      </button>
    </div>
  </div>
))}
```

`respectThemeStrictly` opsiyonel; default `true` ile fallback kapalı. Eğer eski v9 davranışına dönmek istersen `recommendLoadout({ ..., respectThemeStrictly: false })` ver.

## "Tema seçimini temizle" butonu

```tsx
<button onClick={() => { setThemeColors([]); setThemeStyles([]); }}>
  Tüm temayı temizle
</button>
```

## Test senaryoları

Push'tan sonra test et:

1. **Tek renk, sıkı**: Mavi seç → tüm gelenler dominant olarak mavi.
2. **Çoklu renk**: Mavi + beyaz → dominant rengi ikisinden biri olan skinler gelmeli.
3. **Renk + stil kombinasyonu**: Kırmızı + Premium → ikisinin AND'i.
4. **Pattern seçimi**: "Doppler" tek başına seçili → tüm Doppler skinleri gelir.
5. **Pattern + renk**: "Doppler" + Mavi → Doppler Sapphire / Phase 4 gibi mavi-dominant Doppler'lar.
6. **Esnek toggle**: Sıkı kapat, mavi seç → daha çok sonuç, "biraz mavi" da girer.

## Geriye uyumluluk

`recommendLoadout({ themeTag: 'red', ... })` hala çalışır — backend tek tag'i otomatik `themeColors: ['red']` veya `themeStyles: ['red']` olarak çevirir. Yani UI'yı tek seferde değiştirmek zorunda değilsin, eskisi de kırılmaz.
