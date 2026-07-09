// v19: Skin detay sayfaları için URL slug üretimi
// "★ Karambit | Doppler" → "karambit-doppler"

import { Skin } from './loadout';

export function skinSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/★/g, '')
    .replace(/™/g, '')
    .normalize('NFKD')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

/**
 * Tüm skinler için benzersiz slug haritası üretir.
 * Çakışmada (örn. Japonca karakterli isimler) -2, -3 soneki eklenir;
 * dizi sırası deterministik olduğu için slug'lar build'ler arası sabittir.
 */
export function buildSlugMap(skins: Skin[]): Map<string, Skin> {
  const map = new Map<string, Skin>();
  for (const s of skins) {
    let slug = skinSlug(s.name);
    let i = 2;
    while (map.has(slug)) slug = `${skinSlug(s.name)}-${i++}`;
    map.set(slug, s);
  }
  return map;
}

/** Skin → slug (buildSlugMap ile aynı kurallar). */
export function slugForSkin(skins: Skin[], target: Skin): string {
  for (const [slug, s] of buildSlugMap(skins)) {
    if (s.id === target.id) return slug;
  }
  return skinSlug(target.name);
}
