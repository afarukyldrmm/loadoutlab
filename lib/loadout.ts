// Skin type definitions
export type Slot =
  | 'rifle_t'
  | 'rifle_ct'
  | 'sniper'
  | 'pistol_t'
  | 'pistol_ct'
  | 'pistol_shared'
  | 'smg'
  | 'heavy'
  | 'knife'
  | 'glove';

export interface WearPrice {
  wear: string;
  min_price: number;
  median_price: number;
  quantity: number;
  url: string;
}

export interface Skin {
  id: string;
  name: string;
  weapon: string;
  slot: Slot;
  rarity: string;
  image: string;
  tags: string[];
  wears: WearPrice[];
  entry_price: number;
  entry_wear: string;
  entry_url: string;
}

// Slot importance for budget allocation
export const SLOT_WEIGHTS: Record<Slot, number> = {
  rifle_t: 0.16,
  rifle_ct: 0.14,
  sniper: 0.13,
  pistol_t: 0.05,
  pistol_ct: 0.05,
  pistol_shared: 0.04,
  smg: 0.04,
  heavy: 0.03,
  knife: 0.20,
  glove: 0.16,
};

export const SLOT_LABELS: Record<Slot, string> = {
  rifle_t: 'AK-47 / T Rifle',
  rifle_ct: 'M4 / CT Rifle',
  sniper: 'AWP / Sniper',
  pistol_t: 'Glock / T Pistol',
  pistol_ct: 'USP / CT Pistol',
  pistol_shared: 'Deagle / Shared',
  smg: 'SMG',
  heavy: 'Heavy',
  knife: 'Knife',
  glove: 'Gloves',
};

export const ALL_SLOTS: Slot[] = [
  'rifle_t',
  'rifle_ct',
  'sniper',
  'pistol_t',
  'pistol_ct',
  'pistol_shared',
  'smg',
  'heavy',
  'knife',
  'glove',
];

// Slot kategorileri (UI'da gruplama için)
export const SLOT_GROUPS: { label: string; slots: Slot[] }[] = [
  { label: 'Tüfekler', slots: ['rifle_t', 'rifle_ct'] },
  { label: 'Sniper', slots: ['sniper'] },
  { label: 'Tabancalar', slots: ['pistol_t', 'pistol_ct', 'pistol_shared'] },
  { label: 'Diğer', slots: ['smg', 'heavy'] },
  { label: 'Ekstra', slots: ['knife', 'glove'] },
];

// Hazır preset'ler — kullanıcı hızlıca seçebilsin
export const LOADOUT_PRESETS: { id: string; label: string; slots: Slot[] }[] = [
  {
    id: 'classic',
    label: 'Klasik',
    slots: ['rifle_t', 'rifle_ct', 'sniper', 'pistol_shared', 'knife', 'glove'],
  },
  {
    id: 'full',
    label: 'Hepsi',
    slots: [...ALL_SLOTS],
  },
  {
    id: 'rifles_only',
    label: 'Sadece tüfekler',
    slots: ['rifle_t', 'rifle_ct', 'sniper'],
  },
  {
    id: 'pistols_only',
    label: 'Sadece tabancalar',
    slots: ['pistol_t', 'pistol_ct', 'pistol_shared'],
  },
  {
    id: 'show_pieces',
    label: 'Show-piece (bıçak + eldiven)',
    slots: ['knife', 'glove'],
  },
];

// Manuel etiketleri import et — bunlar otomatik etiketleri ezer (override eder)
import { MANUAL_TAGS } from './manual_tags';

// Görsel analizinden gelen renk etiketleri (Python script üretiyor).
// Varsa otomatik yüklenir; yoksa boş obje ile devam eder (geri uyumlu).
// eslint-disable-next-line @typescript-eslint/no-var-requires
let VISUAL_COLOR_TAGS: Record<string, string[]> = {};
try {
  // require ile dene; dosya yoksa hata fırlatır ve catch'e düşer
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  VISUAL_COLOR_TAGS = require('../public/data/skin_colors.json');
} catch {
  VISUAL_COLOR_TAGS = {};
}

/**
 * Bir skin için kullanılacak gerçek tag listesi.
 * Öncelik:
 *  1. Görsel analizi (Python script üretti, en doğru)
 *  2. Manuel etiket (elle yazıldı, güvenilir)
 *  3. Otomatik isim etiketi (fallback)
 *
 * Stil etiketleri (cyberpunk, vintage, military, premium, neon, doppler-family)
 * her zaman tüm kaynaklardan birleştirilir.
 */
export function getEffectiveTags(skin: Skin): string[] {
  const visual = VISUAL_COLOR_TAGS[skin.name];
  const manual = MANUAL_TAGS[skin.name];
  const auto = skin.tags;

  // Renk etiketleri için öncelikli kaynak: görsel > manuel > otomatik
  const colorTags = ['red', 'blue', 'green', 'purple', 'gold', 'black', 'white', 'orange', 'pink'];
  
  let chosenColors: string[] = [];
  if (visual && visual.length > 0) {
    chosenColors = visual.filter(t => colorTags.includes(t));
  } else if (manual) {
    chosenColors = manual.filter(t => colorTags.includes(t));
  } else {
    chosenColors = auto.filter(t => colorTags.includes(t));
  }

  // Stil etiketleri: tüm kaynaklardan birleştir (cyberpunk, vintage, neon, vb.)
  const styleTags = new Set<string>();
  [visual, manual, auto].forEach(src => {
    if (src) src.forEach(t => {
      if (!colorTags.includes(t)) styleTags.add(t);
    });
  });

  return [...chosenColors, ...Array.from(styleTags)];
}

export interface RecommendOptions {
  budget: number;
  themeTag?: string; // e.g. 'red', 'cyberpunk'
  enabledSlots: Slot[]; // explicit list of slots to include
  variationSeed?: number; // for "regenerate" button to produce different picks
}

export interface Loadout {
  items: Partial<Record<Slot, Skin>>;
  totalPrice: number;
  budget: number;
  themeTag?: string;
}

/**
 * Bütçe bazlı loadout öneri algoritması.
 *
 * Mantık:
 * 1. Aktif slotları belirle (knife/glove dahil mi)
 * 2. Ağırlıkları yeniden normalize et
 * 3. Her slot için bütçe payını hesapla
 * 4. Her slotta, o pay ±%50 aralığında uygun skin bul (tema varsa filtrele)
 * 5. Artan bütçe varsa, eksik kalan slotları üst-sınırla yükselt
 * 6. Eksik bütçe varsa, en düşük popülerlikteki slotları küçült
 */
export function recommendLoadout(
  allSkins: Skin[],
  options: RecommendOptions
): Loadout {
  const { budget, themeTag, enabledSlots, variationSeed = 0 } = options;

  // Deterministic pseudo-random based on seed for "regenerate" reproducibility within a session
  let rngState = variationSeed * 2654435761;
  const rand = () => {
    rngState = (rngState * 1664525 + 1013904223) | 0;
    return ((rngState >>> 0) % 10000) / 10000;
  };

  // Active slots
  // Use only the slots that the user enabled
  const activeSlots = ALL_SLOTS.filter((s) => enabledSlots.includes(s));

  // Normalize weights
  const totalWeight = activeSlots.reduce((sum, s) => sum + SLOT_WEIGHTS[s], 0);
  const slotBudgets = Object.fromEntries(
    activeSlots.map((s) => [s, (budget * SLOT_WEIGHTS[s]) / totalWeight])
  ) as Record<Slot, number>;

  const items: Partial<Record<Slot, Skin>> = {};
  let totalSpent = 0;

  // Slot için aday havuzunu hazırla (tema fallback dahil)
  function candidatesFor(slot: Slot, applyTheme: boolean): Skin[] {
    return allSkins.filter((s) => {
      if (s.slot !== slot) return false;
      if (applyTheme && themeTag && !getEffectiveTags(s).includes(themeTag)) return false;
      return true;
    });
  }

  // First pass: target budget per slot, STRICT (target üstünde gitme)
  // Önemli slotları önce işle ki kalan bütçe önemsizler için kalsın
  const slotsByImportance = [...activeSlots].sort(
    (a, b) => SLOT_WEIGHTS[b] - SLOT_WEIGHTS[a]
  );

  for (const slot of slotsByImportance) {
    const target = slotBudgets[slot];
    // Kalan bütçeyi de hesaba kat — slot target'ı aşamaz ama kalan bütçenin de %80'inden fazlasını yiyemez
    const remainingBudget = budget - totalSpent;
    const slotsRemaining = slotsByImportance.filter(
      (s) => !(s in items) && s !== slot
    ).length;
    // En çok bu kadar harcayabilir: target ile remainingBudget'ın diğer slotlara minimum 1€ bırakacak değeri arasında
    const maxAllowed = Math.min(
      target * 1.3,
      Math.max(0.5, remainingBudget - slotsRemaining * 0.5)
    );

    // Önce tema ile dene, bulunamazsa tema olmadan dene
    for (const useTheme of [true, false]) {
      const candidates = candidatesFor(slot, useTheme).filter(
        (c) => c.entry_price <= maxAllowed
      );
      if (candidates.length === 0) continue;

      // Target'a en yakın ama altında olanları tercih et
      // Hedef: target'ın %70-100'ü arasındaki en popüler skin
      const sweetSpot = candidates.filter(
        (c) => c.entry_price >= target * 0.5 && c.entry_price <= target
      );

      let pick: Skin;
      if (sweetSpot.length > 0) {
        // Popülerliğe göre sırala, top 3'ten rastgele birini seç (variasyon için)
        const topPicks = [...sweetSpot]
          .sort((a, b) => sumQuantity(b) - sumQuantity(a))
          .slice(0, Math.max(3, Math.ceil(sweetSpot.length * 0.3)));
        pick = topPicks[Math.floor(rand() * topPicks.length)];
      } else {
        // Sweet spot yoksa, max allowed altında olan en pahalı (kaliteli) skin
        // Top 2'den rastgele
        const sorted = candidates.sort((a, b) => b.entry_price - a.entry_price).slice(0, 2);
        pick = sorted[Math.floor(rand() * sorted.length)];
      }

      items[slot] = pick;
      totalSpent += pick.entry_price;
      break;
    }
  }

  // Second pass: kalan bütçeyle slot upgrade
  let headroom = budget - totalSpent;
  if (headroom > budget * 0.05) {
    // En değerli slotlardan başlayarak yükselt
    for (const slot of slotsByImportance) {
      if (headroom <= budget * 0.02) break;
      const current = items[slot];
      if (!current) continue;

      const upgradeBudget = current.entry_price + headroom;
      // Önce tema, sonra tema olmadan dene
      for (const useTheme of [true, false]) {
        const better = candidatesFor(slot, useTheme)
          .filter(
            (s) =>
              s.entry_price > current.entry_price &&
              s.entry_price <= upgradeBudget
          )
          .sort((a, b) => b.entry_price - a.entry_price)[0];

        if (better) {
          const cost = better.entry_price - current.entry_price;
          items[slot] = better;
          totalSpent += cost;
          headroom -= cost;
          break;
        }
      }
    }
  }

  return {
    items,
    totalPrice: totalSpent,
    budget,
    themeTag,
  };
}

function sumQuantity(s: Skin): number {
  return s.wears.reduce((sum, w) => sum + w.quantity, 0);
}

/**
 * Bir slot için seçili skin'e alternatif olabilecek skinleri bulur.
 * Aynı bütçe bandında (±50%) farklı opsiyonlar gösterir.
 */
export function findAlternatives(
  allSkins: Skin[],
  currentSkin: Skin,
  options: {
    themeTag?: string;
    maxResults?: number;
    priceTolerancePct?: number;
  } = {}
): Skin[] {
  const { themeTag, maxResults = 8, priceTolerancePct = 0.5 } = options;

  const targetPrice = currentSkin.entry_price;
  const lower = targetPrice * (1 - priceTolerancePct);
  const upper = targetPrice * (1 + priceTolerancePct);

  // Adayları filtrele: aynı slot, farklı skin, makul fiyat aralığı
  let candidates = allSkins.filter((s) => {
    if (s.slot !== currentSkin.slot) return false;
    if (s.id === currentSkin.id) return false;
    if (s.entry_price < lower * 0.3) return false; // çok ucuz olanlar hariç
    if (s.entry_price > upper * 2) return false; // çok pahalı olanlar hariç
    if (themeTag && !getEffectiveTags(s).includes(themeTag)) return false;
    return true;
  });

  // Hedef fiyata yakınlığa + popülerliğe göre skorla
  const scored = candidates.map((s) => {
    const priceDiff = Math.abs(s.entry_price - targetPrice) / targetPrice;
    const popularity = sumQuantity(s);
    // Daha yakın fiyat + daha popüler = daha yüksek skor
    const score = -priceDiff * 2 + Math.log10(popularity + 1) * 0.5;
    return { skin: s, score };
  });

  scored.sort((a, b) => b.score - a.score);
  return scored.slice(0, maxResults).map((x) => x.skin);
}

/**
 * Skinport affiliate URL wrapper.
 * Production'da gerçek affiliate ID'si ile r= param eklenir.
 */
export function affiliateUrl(originalUrl: string, source: string = 'loadoutlab'): string {
  // Skinport şu an public bir affiliate program açmıyor, promo kod modeli var.
  // Placeholder olarak utm parametreleri ekliyoruz.
  try {
    const u = new URL(originalUrl);
    u.searchParams.set('utm_source', source);
    u.searchParams.set('utm_medium', 'recommendation');
    return u.toString();
  } catch {
    return originalUrl;
  }
}

// Tema filtreleri — renkler ve stiller birlikte.
// Renkler: Python görsel analizi sonrası güvenilir.
// Stiller: isim/rarity'den çıkarılır.
export const THEME_TAGS = [
  { id: 'red', label: 'Kırmızı', kind: 'color' as const },
  { id: 'blue', label: 'Mavi', kind: 'color' as const },
  { id: 'green', label: 'Yeşil', kind: 'color' as const },
  { id: 'gold', label: 'Altın', kind: 'color' as const },
  { id: 'purple', label: 'Mor', kind: 'color' as const },
  { id: 'pink', label: 'Pembe', kind: 'color' as const },
  { id: 'orange', label: 'Turuncu', kind: 'color' as const },
  { id: 'black', label: 'Siyah', kind: 'color' as const },
  { id: 'white', label: 'Beyaz', kind: 'color' as const },
  { id: 'cyberpunk', label: 'Cyberpunk', kind: 'style' as const },
  { id: 'neon', label: 'Neon', kind: 'style' as const },
  { id: 'vintage', label: 'Vintage', kind: 'style' as const },
  { id: 'military', label: 'Military', kind: 'style' as const },
  { id: 'premium', label: 'Premium', kind: 'style' as const },
  { id: 'doppler-family', label: 'Doppler / Fade', kind: 'style' as const },
];

export const RARITY_COLORS: Record<string, string> = {
  'Consumer Grade': 'text-rarity-consumer',
  'Industrial Grade': 'text-rarity-industrial',
  'Mil-Spec Grade': 'text-rarity-milspec',
  'Restricted': 'text-rarity-restricted',
  'Classified': 'text-rarity-classified',
  'Covert': 'text-rarity-covert',
  'Contraband': 'text-rarity-contraband',
  'Extraordinary': 'text-rarity-covert',
};
