// Skin tipleri
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
  weapon: string; // 'AK-47', 'M4A4', 'M4A1-S', 'Karambit', vs. — silah modelinin tam adı
  slot: Slot;
  rarity: string;
  image: string;
  tags: string[];
  wears: WearPrice[];
  entry_price: number;
  entry_wear: string;
  entry_url: string;
}

// ============================================================
// SİLAH MODELLERİ (her biri ayrı seçilebilir)
// ============================================================

export interface WeaponDef {
  name: string;        // 'AK-47', 'M4A4', 'Karambit', vs.
  slot: Slot;          // hangi slotta (eski sistemde kategorize)
  team: 'T' | 'CT' | 'shared'; // hangi takım kullanır
  weight: number;      // bütçe dağılımındaki önemi
  category: WeaponCategory; // UI gruplandırma için
}

export type WeaponCategory =
  | 'rifle'      // AK, M4, Galil, FAMAS, AUG, SG553
  | 'sniper'     // AWP, SSG, SCAR-20, G3SG1
  | 'pistol'     // Glock, USP, Deagle, vs.
  | 'smg'        // MP9, MAC-10, P90, vs.
  | 'heavy'      // Nova, Mag-7, M249, vs.
  | 'knife'      // Karambit, M9, Butterfly, vs.
  | 'glove';     // Sport, Driver, Specialist, vs.

// Tüm silah modelleri — her biri ayrı bir slot olarak davranır
export const WEAPONS: WeaponDef[] = [
  // Tüfekler — T
  { name: 'AK-47',    slot: 'rifle_t',  team: 'T',  weight: 0.16, category: 'rifle' },
  { name: 'Galil AR', slot: 'rifle_t',  team: 'T',  weight: 0.06, category: 'rifle' },
  { name: 'SG 553',   slot: 'rifle_t',  team: 'T',  weight: 0.06, category: 'rifle' },
  // Tüfekler — CT
  { name: 'M4A4',     slot: 'rifle_ct', team: 'CT', weight: 0.14, category: 'rifle' },
  { name: 'M4A1-S',   slot: 'rifle_ct', team: 'CT', weight: 0.14, category: 'rifle' },
  { name: 'AUG',      slot: 'rifle_ct', team: 'CT', weight: 0.06, category: 'rifle' },
  { name: 'FAMAS',    slot: 'rifle_ct', team: 'CT', weight: 0.05, category: 'rifle' },
  // Sniper
  { name: 'AWP',      slot: 'sniper',   team: 'shared', weight: 0.13, category: 'sniper' },
  { name: 'SSG 08',   slot: 'sniper',   team: 'shared', weight: 0.05, category: 'sniper' },
  { name: 'SCAR-20',  slot: 'sniper',   team: 'CT', weight: 0.04, category: 'sniper' },
  { name: 'G3SG1',    slot: 'sniper',   team: 'T',  weight: 0.04, category: 'sniper' },
  // Tabancalar — T
  { name: 'Glock-18', slot: 'pistol_t', team: 'T',  weight: 0.05, category: 'pistol' },
  { name: 'Tec-9',    slot: 'pistol_t', team: 'T',  weight: 0.04, category: 'pistol' },
  // Tabancalar — CT
  { name: 'USP-S',    slot: 'pistol_ct', team: 'CT', weight: 0.05, category: 'pistol' },
  { name: 'P2000',    slot: 'pistol_ct', team: 'CT', weight: 0.04, category: 'pistol' },
  { name: 'Five-SeveN', slot: 'pistol_ct', team: 'CT', weight: 0.04, category: 'pistol' },
  // Tabancalar — shared
  { name: 'Desert Eagle',  slot: 'pistol_shared', team: 'shared', weight: 0.06, category: 'pistol' },
  { name: 'P250',          slot: 'pistol_shared', team: 'shared', weight: 0.03, category: 'pistol' },
  { name: 'CZ75-Auto',     slot: 'pistol_shared', team: 'shared', weight: 0.03, category: 'pistol' },
  { name: 'Dual Berettas', slot: 'pistol_shared', team: 'shared', weight: 0.03, category: 'pistol' },
  { name: 'R8 Revolver',   slot: 'pistol_shared', team: 'shared', weight: 0.03, category: 'pistol' },
  // SMG
  { name: 'MP9',      slot: 'smg', team: 'CT', weight: 0.04, category: 'smg' },
  { name: 'MAC-10',   slot: 'smg', team: 'T',  weight: 0.04, category: 'smg' },
  { name: 'MP7',      slot: 'smg', team: 'shared', weight: 0.04, category: 'smg' },
  { name: 'MP5-SD',   slot: 'smg', team: 'shared', weight: 0.04, category: 'smg' },
  { name: 'UMP-45',   slot: 'smg', team: 'shared', weight: 0.04, category: 'smg' },
  { name: 'P90',      slot: 'smg', team: 'shared', weight: 0.04, category: 'smg' },
  { name: 'PP-Bizon', slot: 'smg', team: 'shared', weight: 0.03, category: 'smg' },
  // Heavy
  { name: 'Nova',      slot: 'heavy', team: 'shared', weight: 0.03, category: 'heavy' },
  { name: 'XM1014',    slot: 'heavy', team: 'shared', weight: 0.03, category: 'heavy' },
  { name: 'MAG-7',     slot: 'heavy', team: 'CT', weight: 0.03, category: 'heavy' },
  { name: 'Sawed-Off', slot: 'heavy', team: 'T',  weight: 0.03, category: 'heavy' },
  { name: 'M249',      slot: 'heavy', team: 'shared', weight: 0.02, category: 'heavy' },
  { name: 'Negev',     slot: 'heavy', team: 'shared', weight: 0.02, category: 'heavy' },
  // Bıçaklar — her biri ayrı model
  { name: 'Karambit',         slot: 'knife', team: 'shared', weight: 0.20, category: 'knife' },
  { name: 'Butterfly Knife',  slot: 'knife', team: 'shared', weight: 0.20, category: 'knife' },
  { name: 'M9 Bayonet',       slot: 'knife', team: 'shared', weight: 0.20, category: 'knife' },
  { name: 'Bayonet',          slot: 'knife', team: 'shared', weight: 0.18, category: 'knife' },
  { name: 'Talon Knife',      slot: 'knife', team: 'shared', weight: 0.20, category: 'knife' },
  { name: 'Skeleton Knife',   slot: 'knife', team: 'shared', weight: 0.20, category: 'knife' },
  { name: 'Stiletto Knife',   slot: 'knife', team: 'shared', weight: 0.20, category: 'knife' },
  { name: 'Flip Knife',       slot: 'knife', team: 'shared', weight: 0.18, category: 'knife' },
  { name: 'Huntsman Knife',   slot: 'knife', team: 'shared', weight: 0.18, category: 'knife' },
  { name: 'Bowie Knife',      slot: 'knife', team: 'shared', weight: 0.15, category: 'knife' },
  { name: 'Gut Knife',        slot: 'knife', team: 'shared', weight: 0.12, category: 'knife' },
  { name: 'Falchion Knife',   slot: 'knife', team: 'shared', weight: 0.15, category: 'knife' },
  { name: 'Shadow Daggers',   slot: 'knife', team: 'shared', weight: 0.15, category: 'knife' },
  { name: 'Navaja Knife',     slot: 'knife', team: 'shared', weight: 0.15, category: 'knife' },
  { name: 'Ursus Knife',      slot: 'knife', team: 'shared', weight: 0.15, category: 'knife' },
  { name: 'Survival Knife',   slot: 'knife', team: 'shared', weight: 0.15, category: 'knife' },
  { name: 'Paracord Knife',   slot: 'knife', team: 'shared', weight: 0.15, category: 'knife' },
  { name: 'Nomad Knife',      slot: 'knife', team: 'shared', weight: 0.15, category: 'knife' },
  { name: 'Classic Knife',    slot: 'knife', team: 'shared', weight: 0.15, category: 'knife' },
  { name: 'Kukri Knife',      slot: 'knife', team: 'shared', weight: 0.15, category: 'knife' },
  // Eldivenler — her biri ayrı model
  { name: 'Sport Gloves',       slot: 'glove', team: 'shared', weight: 0.16, category: 'glove' },
  { name: 'Driver Gloves',      slot: 'glove', team: 'shared', weight: 0.15, category: 'glove' },
  { name: 'Specialist Gloves',  slot: 'glove', team: 'shared', weight: 0.15, category: 'glove' },
  { name: 'Hand Wraps',         slot: 'glove', team: 'shared', weight: 0.13, category: 'glove' },
  { name: 'Moto Gloves',        slot: 'glove', team: 'shared', weight: 0.13, category: 'glove' },
  { name: 'Bloodhound Gloves',  slot: 'glove', team: 'shared', weight: 0.12, category: 'glove' },
  { name: 'Broken Fang Gloves', slot: 'glove', team: 'shared', weight: 0.12, category: 'glove' },
  { name: 'Hydra Gloves',       slot: 'glove', team: 'shared', weight: 0.11, category: 'glove' },
];

export const WEAPON_CATEGORIES: { id: WeaponCategory; label: string }[] = [
  { id: 'rifle', label: 'Tüfekler' },
  { id: 'sniper', label: 'Sniper' },
  { id: 'pistol', label: 'Tabancalar' },
  { id: 'smg', label: 'SMG' },
  { id: 'heavy', label: 'Heavy' },
  { id: 'knife', label: 'Bıçaklar' },
  { id: 'glove', label: 'Eldivenler' },
];

// Pratik bir lookup: weapon name -> def
export const WEAPON_BY_NAME: Record<string, WeaponDef> = Object.fromEntries(
  WEAPONS.map((w) => [w.name, w])
);

// Hazır preset'ler
export const LOADOUT_PRESETS: { id: string; label: string; weapons: string[] }[] = [
  {
    id: 'classic',
    label: 'Klasik',
    weapons: ['AK-47', 'M4A4', 'AWP', 'Desert Eagle', 'Karambit', 'Sport Gloves'],
  },
  {
    id: 'competitive',
    label: 'Rekabetçi (Pro)',
    weapons: ['AK-47', 'M4A1-S', 'AWP', 'Desert Eagle', 'Glock-18', 'USP-S', 'Karambit', 'Sport Gloves'],
  },
  {
    id: 'rifles_only',
    label: 'Sadece Tüfekler',
    weapons: ['AK-47', 'M4A4', 'M4A1-S', 'AWP'],
  },
  {
    id: 'pistols_only',
    label: 'Sadece Tabancalar',
    weapons: ['Glock-18', 'USP-S', 'Desert Eagle'],
  },
  {
    id: 'show_pieces',
    label: 'Bıçak + Eldiven',
    weapons: ['Karambit', 'Sport Gloves'],
  },
];

// Eski slot etiketleri (UI'da hala gerekli olabilir)
export const SLOT_LABELS: Record<Slot, string> = {
  rifle_t: 'T Rifle',
  rifle_ct: 'CT Rifle',
  sniper: 'Sniper',
  pistol_t: 'T Pistol',
  pistol_ct: 'CT Pistol',
  pistol_shared: 'Shared Pistol',
  smg: 'SMG',
  heavy: 'Heavy',
  knife: 'Knife',
  glove: 'Gloves',
};

// ============================================================
// MANUEL & GÖRSEL ETİKETLER
// ============================================================

import { MANUAL_TAGS } from './manual_tags';

let VISUAL_COLOR_TAGS: Record<string, string[]> = {};
try {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  VISUAL_COLOR_TAGS = require('../public/data/skin_colors.json');
} catch {
  VISUAL_COLOR_TAGS = {};
}

export function getEffectiveTags(skin: Skin): string[] {
  const visual = VISUAL_COLOR_TAGS[skin.name];
  const manual = MANUAL_TAGS[skin.name];
  const auto = skin.tags;

  const colorTags = ['red', 'blue', 'green', 'purple', 'gold', 'black', 'white', 'orange', 'pink'];

  let chosenColors: string[] = [];
  if (visual && visual.length > 0) {
    chosenColors = visual.filter((t) => colorTags.includes(t));
  } else if (manual) {
    chosenColors = manual.filter((t) => colorTags.includes(t));
  } else {
    chosenColors = auto.filter((t) => colorTags.includes(t));
  }

  const styleTags = new Set<string>();
  [visual, manual, auto].forEach((src) => {
    if (src) src.forEach((t) => {
      if (!colorTags.includes(t)) styleTags.add(t);
    });
  });

  return [...chosenColors, ...Array.from(styleTags)];
}

// ============================================================
// ÖNERİ ALGORİTMASI (artık weapon bazlı)
// ============================================================

export interface RecommendOptions {
  budget: number;
  themeTag?: string;
  enabledWeapons: string[]; // ['AK-47', 'M4A4', 'AWP', ...]
  variationSeed?: number;
}

export interface Loadout {
  items: Record<string, Skin>; // weapon name -> skin
  totalPrice: number;
  budget: number;
  themeTag?: string;
}

export function recommendLoadout(
  allSkins: Skin[],
  options: RecommendOptions
): Loadout {
  const { budget, themeTag, enabledWeapons, variationSeed = 0 } = options;

  // Deterministik random (variation seed)
  let rngState = variationSeed * 2654435761;
  const rand = () => {
    rngState = (rngState * 1664525 + 1013904223) | 0;
    return ((rngState >>> 0) % 10000) / 10000;
  };

  // Aktif silahlar (geçerli olanlar)
  const activeWeapons = enabledWeapons.filter((w) => w in WEAPON_BY_NAME);
  if (activeWeapons.length === 0) {
    return { items: {}, totalPrice: 0, budget, themeTag };
  }

  // Ağırlıkları normalize et — toplam = 1
  const totalWeight = activeWeapons.reduce(
    (sum, w) => sum + WEAPON_BY_NAME[w].weight,
    0
  );
  const weaponBudgets: Record<string, number> = {};
  for (const w of activeWeapons) {
    weaponBudgets[w] = (budget * WEAPON_BY_NAME[w].weight) / totalWeight;
  }

  const items: Record<string, Skin> = {};
  let totalSpent = 0;

  // Önem sırasına göre işle (önemli silahlar önce, kalan bütçe önemsizler için)
  const weaponsByImportance = [...activeWeapons].sort(
    (a, b) => WEAPON_BY_NAME[b].weight - WEAPON_BY_NAME[a].weight
  );

  const candidatesFor = (weaponName: string, applyTheme: boolean): Skin[] => {
    return allSkins.filter((s) => {
      if (s.weapon !== weaponName) return false;
      if (applyTheme && themeTag && !getEffectiveTags(s).includes(themeTag)) return false;
      return true;
    });
  };

  for (const weaponName of weaponsByImportance) {
    const target = weaponBudgets[weaponName];
    const remainingBudget = budget - totalSpent;
    const weaponsRemaining = weaponsByImportance.filter(
      (w) => !(w in items) && w !== weaponName
    ).length;
    const maxAllowed = Math.min(
      target * 1.5,
      Math.max(0.5, remainingBudget - weaponsRemaining * 0.5)
    );

    let pick: Skin | undefined;

    // Önce tema ile dene, bulunamazsa tema olmadan
    for (const useTheme of [true, false]) {
      const candidates = candidatesFor(weaponName, useTheme).filter(
        (c) => c.entry_price <= maxAllowed
      );
      if (candidates.length === 0) continue;

      // Sweet spot: target'ın %50-100'ü arasındaki en popüler skin
      const sweetSpot = candidates.filter(
        (c) => c.entry_price >= target * 0.5 && c.entry_price <= target
      );

      if (sweetSpot.length > 0) {
        const topPicks = [...sweetSpot]
          .sort((a, b) => sumQuantity(b) - sumQuantity(a))
          .slice(0, Math.max(3, Math.ceil(sweetSpot.length * 0.3)));
        pick = topPicks[Math.floor(rand() * topPicks.length)];
      } else {
        // Sweet spot yoksa: max altında olan en pahalı (kaliteli)
        const sorted = candidates.sort((a, b) => b.entry_price - a.entry_price);
        pick = sorted[Math.floor(rand() * Math.min(2, sorted.length))];
      }
      break;
    }

    if (pick) {
      items[weaponName] = pick;
      totalSpent += pick.entry_price;
    }
  }

  // Upgrade pass: kalan bütçeyi en önemli silahlara harca
  let headroom = budget - totalSpent;
  if (headroom > budget * 0.05) {
    for (const weaponName of weaponsByImportance) {
      if (headroom <= budget * 0.02) break;
      const current = items[weaponName];
      if (!current) continue;
      const upgradeBudget = current.entry_price + headroom;

      for (const useTheme of [true, false]) {
        const better = candidatesFor(weaponName, useTheme)
          .filter(
            (s) =>
              s.entry_price > current.entry_price &&
              s.entry_price <= upgradeBudget
          )
          .sort((a, b) => b.entry_price - a.entry_price)[0];

        if (better) {
          const cost = better.entry_price - current.entry_price;
          items[weaponName] = better;
          totalSpent += cost;
          headroom -= cost;
          break;
        }
      }
    }
  }

  return { items, totalPrice: totalSpent, budget, themeTag };
}

function sumQuantity(s: Skin): number {
  return s.wears.reduce((sum, w) => sum + w.quantity, 0);
}

// ============================================================
// ALTERNATİFLER
// ============================================================

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

  // Alternatifler: AYNI WEAPON modelinden, farklı skin
  const candidates = allSkins.filter((s) => {
    if (s.weapon !== currentSkin.weapon) return false;
    if (s.id === currentSkin.id) return false;
    if (s.entry_price < lower * 0.3) return false;
    if (s.entry_price > upper * 2) return false;
    if (themeTag && !getEffectiveTags(s).includes(themeTag)) return false;
    return true;
  });

  const scored = candidates.map((s) => {
    const priceDiff = Math.abs(s.entry_price - targetPrice) / targetPrice;
    const popularity = sumQuantity(s);
    const score = -priceDiff * 2 + Math.log10(popularity + 1) * 0.5;
    return { skin: s, score };
  });

  scored.sort((a, b) => b.score - a.score);
  return scored.slice(0, maxResults).map((x) => x.skin);
}

// ============================================================
// AFFILIATE & TEMA TAGLERİ
// ============================================================

export function affiliateUrl(originalUrl: string, source: string = 'loadoutlab'): string {
  try {
    const u = new URL(originalUrl);
    u.searchParams.set('utm_source', source);
    u.searchParams.set('utm_medium', 'recommendation');
    return u.toString();
  } catch {
    return originalUrl;
  }
}

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
