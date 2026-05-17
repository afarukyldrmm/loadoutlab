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

// Her silah modelinin en ucuz mevcut fiyatı (Skinport canlı verisinden)
// Bütçe yetmediğinde "En ucuz X €Y" uyarısında kullanılır
export const MIN_WEAPON_PRICES: Record<string, number> = {
  'AK-47': 0.08,
  'AUG': 0.02,
  'AWP': 0.13,
  'Bayonet': 117.37,
  'Bloodhound Gloves': 77.27,
  'Bowie Knife': 51.64,
  'Broken Fang Gloves': 54.64,
  'Butterfly Knife': 393.88,
  'CZ75-Auto': 0.02,
  'Classic Knife': 66.29,
  'Desert Eagle': 0.03,
  'Driver Gloves': 35.86,
  'Dual Berettas': 0.02,
  'FAMAS': 0.02,
  'Falchion Knife': 54.68,
  'Five-SeveN': 0.02,
  'Flip Knife': 99.61,
  'G3SG1': 0.02,
  'Galil AR': 0.02,
  'Glock-18': 0.06,
  'Gut Knife': 44.69,
  'Hand Wraps': 46.17,
  'Huntsman Knife': 55.19,
  'Hydra Gloves': 35.04,
  'Karambit': 338.75,
  'Kukri Knife': 42.66,
  'M249': 0.02,
  'M4A1-S': 0.04,
  'M4A4': 0.02,
  'M9 Bayonet': 270.86,
  'MAC-10': 0.02,
  'MAG-7': 0.02,
  'MP5-SD': 0.02,
  'MP7': 0.02,
  'MP9': 0.02,
  'Moto Gloves': 41.09,
  'Navaja Knife': 41.32,
  'Negev': 0.02,
  'Nomad Knife': 80.96,
  'Nova': 0.02,
  'P2000': 0.03,
  'P250': 0.02,
  'P90': 0.02,
  'PP-Bizon': 0.02,
  'Paracord Knife': 43.69,
  'R8 Revolver': 0.02,
  'SCAR-20': 0.02,
  'SG 553': 0.02,
  'SSG 08': 0.02,
  'Sawed-Off': 0.02,
  'Shadow Daggers': 39.74,
  'Skeleton Knife': 112.00,
  'Specialist Gloves': 54.95,
  'Sport Gloves': 95.33,
  'Stiletto Knife': 109.94,
  'Survival Knife': 40.58,
  'Talon Knife': 187.70,
  'Tec-9': 0.02,
  'UMP-45': 0.02,
  'USP-S': 0.05,
  'Ursus Knife': 56.31,
  'XM1014': 0.02,
};

/**
 * Bir silah için aynı kategoride daha ucuz bir alternatif bulur.
 * "Karambit pahalı → Navaja Knife önersin" gibi.
 */
export function findCheaperAlternative(weaponName: string): string | null {
  const def = WEAPON_BY_NAME[weaponName];
  if (!def) return null;
  const currentMin = MIN_WEAPON_PRICES[weaponName] ?? 0;

  // Aynı kategoride daha ucuz olanları bul
  const cheaper = WEAPONS
    .filter((w) => w.category === def.category && w.name !== weaponName)
    .map((w) => ({
      name: w.name,
      min: MIN_WEAPON_PRICES[w.name] ?? 0,
    }))
    .filter((w) => w.min < currentMin && w.min > 0.5) // çok ucuz olanları ele (spam)
    .sort((a, b) => b.min - a.min); // en pahalı ucuz olanı seç (en iyi kalite)

  return cheaper[0]?.name ?? null;
}

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

// Hazır preset'ler — oyun stiline göre
export const LOADOUT_PRESETS: { id: string; label: string; icon: string; description: string; weapons: string[] }[] = [
  {
    id: 'classic',
    label: 'Klasik',
    icon: '⚔️',
    description: 'En sık kullanılan silahlar',
    weapons: ['AK-47', 'M4A4', 'AWP', 'Desert Eagle', 'Karambit', 'Sport Gloves'],
  },
  {
    id: 'awper',
    label: "AWP'er",
    icon: '🎯',
    description: 'Sniper odaklı oyun',
    weapons: ['AWP', 'Desert Eagle', 'USP-S', 'Glock-18', 'Karambit', 'Sport Gloves'],
  },
  {
    id: 'entry',
    label: 'Entry Fragger',
    icon: '🔥',
    description: 'Saldırgan, tüfek ağırlıklı',
    weapons: ['AK-47', 'M4A4', 'Glock-18', 'Desert Eagle', 'MAC-10', 'Karambit', 'Sport Gloves'],
  },
  {
    id: 'anchor',
    label: 'Site Anchor',
    icon: '🛡️',
    description: 'CT savunma odaklı',
    weapons: ['M4A1-S', 'AWP', 'USP-S', 'Desert Eagle', 'MP9', 'Karambit', 'Sport Gloves'],
  },
  {
    id: 'rifler',
    label: 'Rifler',
    icon: '💪',
    description: 'Sadece tüfekler',
    weapons: ['AK-47', 'M4A4', 'M4A1-S', 'AWP'],
  },
  {
    id: 'showpiece',
    label: 'Showpiece',
    icon: '🎭',
    description: 'Sadece bıçak + eldiven',
    weapons: ['Karambit', 'Sport Gloves'],
  },
  {
    id: 'all',
    label: 'Hepsi',
    icon: '📦',
    description: 'Tüm 50+ silah modeli',
    weapons: WEAPONS.map((w) => w.name),
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
import { MANUAL_COLOR_OVERRIDES } from './manual_color_overrides';
import { detectPattern } from './pattern_skins';

let VISUAL_COLOR_TAGS: Record<string, string[]> = {};
try {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  VISUAL_COLOR_TAGS = require('../public/data/skin_colors.json');
} catch {
  VISUAL_COLOR_TAGS = {};
}

// v10: 12 renk — yellow/brown/gray AI çıktısıyla hizalandı, ilk-sınıf tema rengi
const COLOR_TAGS = [
  'red', 'blue', 'green', 'purple', 'gold', 'black', 'white', 'orange', 'pink',
  'yellow', 'brown', 'gray',
];

// Birbiriyle uyumlu / yakın renk grupları
// "Esnek" modda kullanılır: kullanıcı mavi seçtiğinde mor da kabul edilir gibi
export const COLOR_NEIGHBORS: Record<string, string[]> = {
  red:    ['red', 'orange', 'pink'],
  orange: ['orange', 'red', 'gold', 'yellow'],
  gold:   ['gold', 'orange', 'yellow', 'white'],
  pink:   ['pink', 'red', 'purple'],
  purple: ['purple', 'pink', 'blue'],
  blue:   ['blue', 'purple'],
  green:  ['green'],
  black:  ['black', 'gray'],
  white:  ['white', 'gold', 'gray'],
  yellow: ['yellow', 'gold', 'orange'],
  brown:  ['brown', 'gold', 'orange'],
  gray:   ['gray', 'black', 'white'],
};

/**
 * Bir skin için doğru renk/stil etiketleri.
 * Öncelik sırası:
 *  1. MANUEL düzeltmeler (en güvenilir, elle kontrol edildi)
 *  2. GÖRSEL analiz (Python K-means)
 *  3. OTOMATİK isim etiketi (fallback)
 *
 * Stil etiketleri (cyberpunk, vintage, vs.) tüm kaynaklardan birleştirilir.
 */
export function getEffectiveTags(skin: Skin): string[] {
  const override = MANUAL_COLOR_OVERRIDES[skin.name];
  const visual = VISUAL_COLOR_TAGS[skin.name];
  const manual = MANUAL_TAGS[skin.name];
  const auto = skin.tags;

  // Renk seçimi: manuel override > visual > manuel (eski) > auto
  let chosenColors: string[] = [];
  if (override && override.length > 0) {
    chosenColors = override.filter((t) => COLOR_TAGS.includes(t));
  } else if (visual && visual.length > 0) {
    chosenColors = visual.filter((t) => COLOR_TAGS.includes(t));
  } else if (manual) {
    chosenColors = manual.filter((t) => COLOR_TAGS.includes(t));
  } else {
    chosenColors = auto.filter((t) => COLOR_TAGS.includes(t));
  }

  // Stil tag'leri: tüm kaynaklardan birleştir
  const styleTags = new Set<string>();
  [visual, manual, auto].forEach((src) => {
    if (src)
      src.forEach((t) => {
        if (!COLOR_TAGS.includes(t)) styleTags.add(t);
      });
  });

  // v10: pattern (desen) tipi varsa ek bir tag olarak ekle
  // Bu sayede pattern skinler hem dominant rengiyle renk filtresine girer
  // hem de "Doppler / Fade / Case Hardened" koleksiyon sekmelerinde görünür.
  const pattern = detectPattern(skin.name);
  if (pattern) styleTags.add(pattern);

  return [...chosenColors, ...Array.from(styleTags)];
}

/**
 * v10: Çoklu renk + sıkı/esnek eşleşme.
 *
 * @param skin   — kontrol edilen skin
 * @param colors — kullanıcının seçtiği renkler (boş array = renk filtresi yok)
 * @param styles — kullanıcının seçtiği stiller/desenler (boş array = stil filtresi yok)
 * @param strict — true: sadece ilk renk dominant kabul; false: ilk 2 renk + komşular
 *
 * Kural: skin uygun olmak için
 *   - colors boş değilse: dominant rengi seçilen renklerden BİRİ olmalı
 *   - styles boş değilse: tüm stil/desen tag'leri set'i seçili stillerin EN AZ BİRİSİYLE kesişmeli
 *   - her iki filtre de geçilmeli (AND mantığı)
 */
export function matchesThemeFilter(
  skin: Skin,
  colors: string[],
  styles: string[],
  strict: boolean = true,
): boolean {
  const tags = getEffectiveTags(skin);
  const colorsOnly = tags.filter((t) => COLOR_TAGS.includes(t));
  const stylesOnly = tags.filter((t) => !COLOR_TAGS.includes(t));

  // Renk filtresi
  if (colors.length > 0) {
    if (colorsOnly.length === 0) return false;
    const dominant = strict ? [colorsOnly[0]] : colorsOnly.slice(0, 2);
    let colorMatch = false;
    for (const wanted of colors) {
      const acceptable = strict ? [wanted] : (COLOR_NEIGHBORS[wanted] ?? [wanted]);
      if (dominant.some((c) => acceptable.includes(c))) {
        colorMatch = true;
        break;
      }
    }
    if (!colorMatch) return false;
  }

  // Stil/Desen filtresi
  if (styles.length > 0) {
    const styleMatch = styles.some((s) => stylesOnly.includes(s));
    if (!styleMatch) return false;
  }

  return true;
}

/**
 * Geriye uyumluluk için eski API. Tek renk/stil tag'i kabul eder.
 * Strict modda çalışır (v9 davranışı).
 */
export function matchesThemeTag(skin: Skin, themeTag: string): boolean {
  if (COLOR_TAGS.includes(themeTag)) {
    return matchesThemeFilter(skin, [themeTag], [], true);
  }
  return matchesThemeFilter(skin, [], [themeTag], true);
}

// ============================================================
// ÖNERİ ALGORİTMASI (artık weapon bazlı)
// ============================================================

export interface RecommendOptions {
  budget: number;
  /** @deprecated v10: tek tag yerine themeColors + themeStyles kullan */
  themeTag?: string;
  /** v10: çoklu renk seçimi — boş array = renk filtresi yok */
  themeColors?: string[];
  /** v10: çoklu stil/desen seçimi — boş array = stil filtresi yok */
  themeStyles?: string[];
  /** v10: sıkı (sadece ilk renk) vs esnek (ilk 2 + komşular). Default true. */
  strictColor?: boolean;
  /**
   * v10: Tema filtresi seçildiğinde uyumlu skin yoksa fallback yapılsın mı?
   * - true (default): Slot boş kalır, UI uyarı kartı gösterir. KESİN davranış.
   * - false: Eski v9 davranışı — bulunamazsa filtre kalkar, herhangi bir skin seçilir.
   */
  respectThemeStrictly?: boolean;
  enabledWeapons: string[]; // ['AK-47', 'M4A4', 'AWP', ...]
  variationSeed?: number;
}

export interface Loadout {
  items: Record<string, Skin>; // weapon name -> skin
  /**
   * v10: Tema filtresi yüzünden doldurulamayan silahlar.
   * UI uyarı kartı göstermek için: "Bu temada uygun {weapon} yok"
   */
  unmatchedWeapons?: string[];
  totalPrice: number;
  budget: number;
  themeTag?: string;
  themeColors?: string[];
  themeStyles?: string[];
}

export function recommendLoadout(
  allSkins: Skin[],
  options: RecommendOptions
): Loadout {
  const {
    budget,
    themeTag,
    themeColors = [],
    themeStyles = [],
    strictColor = true,
    respectThemeStrictly = true,
    enabledWeapons,
    variationSeed = 0,
  } = options;

  // Geriye uyumluluk: eski API themeTag verilmiş ama yeni alanlar boşsa, eskiyi çevir
  let activeColors = themeColors;
  let activeStyles = themeStyles;
  if (themeTag && activeColors.length === 0 && activeStyles.length === 0) {
    if (COLOR_TAGS.includes(themeTag)) activeColors = [themeTag];
    else activeStyles = [themeTag];
  }

  // Deterministik random (variation seed)
  let rngState = variationSeed * 2654435761;
  const rand = () => {
    rngState = (rngState * 1664525 + 1013904223) | 0;
    return ((rngState >>> 0) % 10000) / 10000;
  };

  // Aktif silahlar (geçerli olanlar)
  const activeWeapons = enabledWeapons.filter((w) => w in WEAPON_BY_NAME);
  if (activeWeapons.length === 0) {
    return {
      items: {},
      totalPrice: 0,
      budget,
      themeTag,
      themeColors: activeColors,
      themeStyles: activeStyles,
    };
  }

  const hasThemeFilter = activeColors.length > 0 || activeStyles.length > 0;

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
  const unmatchedWeapons: string[] = [];
  let totalSpent = 0;

  // Önem sırasına göre işle (önemli silahlar önce, kalan bütçe önemsizler için)
  const weaponsByImportance = [...activeWeapons].sort(
    (a, b) => WEAPON_BY_NAME[b].weight - WEAPON_BY_NAME[a].weight
  );

  const candidatesFor = (weaponName: string, applyTheme: boolean): Skin[] => {
    return allSkins.filter((s) => {
      if (s.weapon !== weaponName) return false;
      if (
        applyTheme &&
        hasThemeFilter &&
        !matchesThemeFilter(s, activeColors, activeStyles, strictColor)
      ) {
        return false;
      }
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
    let pickedWithTheme = false;

    // v10: Tema sıkı modda (default) → sadece tema ile dene; yoksa fallback YAPMA.
    // Eski v9 davranışı için respectThemeStrictly=false geçilebilir.
    const themeAttempts: boolean[] = hasThemeFilter
      ? (respectThemeStrictly ? [true] : [true, false])
      : [false];

    for (const useTheme of themeAttempts) {
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
      pickedWithTheme = useTheme;
      break;
    }

    if (pick) {
      items[weaponName] = pick;
      totalSpent += pick.entry_price;
    } else if (hasThemeFilter) {
      // Tema seçili ama uygun skin yok → slot boş, uyarı listesine ekle
      unmatchedWeapons.push(weaponName);
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

      // v10: upgrade pass de tema sıkı kuralına uyar
      const upgradeAttempts: boolean[] = hasThemeFilter
        ? (respectThemeStrictly ? [true] : [true, false])
        : [false];

      for (const useTheme of upgradeAttempts) {
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

  return {
    items,
    unmatchedWeapons: unmatchedWeapons.length > 0 ? unmatchedWeapons : undefined,
    totalPrice: totalSpent,
    budget,
    themeTag,
    themeColors: activeColors,
    themeStyles: activeStyles,
  };
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
    /** @deprecated v10: themeColors + themeStyles kullan */
    themeTag?: string;
    themeColors?: string[];
    themeStyles?: string[];
    strictColor?: boolean;
    maxResults?: number;
    priceTolerancePct?: number;
  } = {}
): Skin[] {
  const {
    themeTag,
    themeColors = [],
    themeStyles = [],
    strictColor = true,
    maxResults = 8,
    priceTolerancePct = 0.5,
  } = options;

  // Geriye uyumluluk
  let activeColors = themeColors;
  let activeStyles = themeStyles;
  if (themeTag && activeColors.length === 0 && activeStyles.length === 0) {
    if (COLOR_TAGS.includes(themeTag)) activeColors = [themeTag];
    else activeStyles = [themeTag];
  }
  const hasThemeFilter = activeColors.length > 0 || activeStyles.length > 0;

  const targetPrice = currentSkin.entry_price;
  const lower = targetPrice * (1 - priceTolerancePct);
  const upper = targetPrice * (1 + priceTolerancePct);

  // Alternatifler: AYNI WEAPON modelinden, farklı skin
  const candidates = allSkins.filter((s) => {
    if (s.weapon !== currentSkin.weapon) return false;
    if (s.id === currentSkin.id) return false;
    if (s.entry_price < lower * 0.3) return false;
    if (s.entry_price > upper * 2) return false;
    if (
      hasThemeFilter &&
      !matchesThemeFilter(s, activeColors, activeStyles, strictColor)
    ) {
      return false;
    }
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
  // Renkler (12) — kullanıcı çoklu seçim yapabilir
  { id: 'red', label: 'Kırmızı', kind: 'color' as const },
  { id: 'blue', label: 'Mavi', kind: 'color' as const },
  { id: 'green', label: 'Yeşil', kind: 'color' as const },
  { id: 'gold', label: 'Altın', kind: 'color' as const },
  { id: 'purple', label: 'Mor', kind: 'color' as const },
  { id: 'pink', label: 'Pembe', kind: 'color' as const },
  { id: 'orange', label: 'Turuncu', kind: 'color' as const },
  { id: 'yellow', label: 'Sarı', kind: 'color' as const },
  { id: 'brown', label: 'Kahverengi', kind: 'color' as const },
  { id: 'gray', label: 'Gri', kind: 'color' as const },
  { id: 'black', label: 'Siyah', kind: 'color' as const },
  { id: 'white', label: 'Beyaz', kind: 'color' as const },
  // Stiller
  { id: 'cyberpunk', label: 'Cyberpunk', kind: 'style' as const },
  { id: 'neon', label: 'Neon', kind: 'style' as const },
  { id: 'vintage', label: 'Vintage', kind: 'style' as const },
  { id: 'military', label: 'Military', kind: 'style' as const },
  { id: 'premium', label: 'Premium', kind: 'style' as const },
  { id: 'tactical', label: 'Tactical', kind: 'style' as const },
  { id: 'futuristic', label: 'Futuristic', kind: 'style' as const },
  // Desenler (pattern aileleri) — pattern_skins.ts'de detectPattern ile eşleşir
  { id: 'doppler', label: 'Doppler', kind: 'pattern' as const },
  { id: 'gamma-doppler', label: 'Gamma Doppler', kind: 'pattern' as const },
  { id: 'marble-fade', label: 'Marble Fade', kind: 'pattern' as const },
  { id: 'fade', label: 'Fade', kind: 'pattern' as const },
  { id: 'case-hardened', label: 'Case Hardened', kind: 'pattern' as const },
  { id: 'tiger-tooth', label: 'Tiger Tooth', kind: 'pattern' as const },
  { id: 'crimson-web', label: 'Crimson Web', kind: 'pattern' as const },
  { id: 'slaughter', label: 'Slaughter', kind: 'pattern' as const },
  { id: 'lore', label: 'Lore', kind: 'pattern' as const },
  { id: 'damascus-steel', label: 'Damascus Steel', kind: 'pattern' as const },
  // Eski geriye uyumluluk
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
