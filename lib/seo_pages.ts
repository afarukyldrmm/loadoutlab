// v17: SEO kombinasyon sayfaları — slug üretimi ve sayfa verisi
// URL şeması: /loadout/{color}-under-{budget}  (örn. red-under-100)

import {
  Skin,
  recommendLoadout,
  themeMatchingSkins,
} from './loadout';

export const SEO_COLORS = [
  'red', 'blue', 'green', 'gold', 'purple', 'pink',
  'orange', 'yellow', 'brown', 'gray', 'black', 'white',
] as const;

export const SEO_BUDGETS = [100, 300, 500, 1000] as const;

export const SEO_WEAPONS = ['AK-47', 'M4A4', 'AWP', 'Desert Eagle'];

export function allSeoSlugs(): string[] {
  const slugs: string[] = [];
  for (const c of SEO_COLORS)
    for (const b of SEO_BUDGETS) slugs.push(`${c}-under-${b}`);
  return slugs;
}

export function parseSeoSlug(
  slug: string
): { color: string; budget: number } | null {
  const m = slug.match(/^([a-z]+)-under-(\d+)$/);
  if (!m) return null;
  const color = m[1];
  const budget = Number(m[2]);
  if (!SEO_COLORS.includes(color as never)) return null;
  if (!SEO_BUDGETS.includes(budget as never)) return null;
  return { color, budget };
}

export interface SeoLoadoutItem {
  label: string; // silah / Bıçak / Eldiven
  skin: Skin;
}

export interface SeoLoadout {
  items: SeoLoadoutItem[];
  total: number;
}

/**
 * SEO sayfası için deterministik loadout üretir (seed sabit).
 * Builder ile aynı mantık: bıçak+eldiven maliyeti silah bütçesinden düşülür.
 */
export function buildSeoLoadout(
  allSkins: Skin[],
  color: string,
  budget: number
): SeoLoadout {
  const knife = themeMatchingSkins(allSkins, 'knife', [color], 'auto')[0];
  const glove = themeMatchingSkins(allSkins, 'glove', [color], 'auto')[0];

  // Küçük bütçede eldiven bütçeyi yutmasın: bıçak+eldiven bütçenin
  // yarısından fazlasını istiyorsa eldiveni at, hâlâ fazlaysa bıçağı da at.
  let useKnife: Skin | undefined = knife;
  let useGlove: Skin | undefined = glove;
  let reserved =
    (useKnife?.entry_price ?? 0) + (useGlove?.entry_price ?? 0);
  if (reserved > budget * 0.5 && useGlove) {
    useGlove = undefined;
    reserved = useKnife?.entry_price ?? 0;
  }
  if (reserved > budget * 0.5 && useKnife) {
    useKnife = undefined;
    reserved = 0;
  }

  const lo = recommendLoadout(allSkins, {
    budget: Math.max(0, budget - reserved),
    themeColors: [color],
    themeStyles: [],
    strictColor: 'auto',
    respectThemeStrictly: true,
    enabledWeapons: SEO_WEAPONS,
    variationSeed: 1,
  });

  const items: SeoLoadoutItem[] = [];
  for (const w of SEO_WEAPONS) {
    const s = lo.items[w];
    if (s) items.push({ label: w, skin: s });
  }
  if (useKnife) items.push({ label: 'knife', skin: useKnife });
  if (useGlove) items.push({ label: 'glove', skin: useGlove });

  const total = items.reduce((sum, i) => sum + i.skin.entry_price, 0);
  return { items, total };
}
