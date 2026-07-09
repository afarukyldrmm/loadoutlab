import type { MetadataRoute } from 'next';
import { allSeoSlugs } from '@/lib/seo_pages';

const BASE = 'https://loadoutlab-pi.vercel.app';
const LOCALE_PREFIXES = ['', '/ru', '/tr']; // EN prefix'siz (as-needed)

export default function sitemap(): MetadataRoute.Sitemap {
  const entries: MetadataRoute.Sitemap = [];

  for (const prefix of LOCALE_PREFIXES) {
    entries.push({
      url: `${BASE}${prefix || '/'}`.replace(/\/$/, '') || BASE,
      changeFrequency: 'daily',
      priority: 1,
    });
    for (const slug of allSeoSlugs()) {
      entries.push({
        url: `${BASE}${prefix}/loadout/${slug}`,
        changeFrequency: 'weekly',
        priority: 0.7,
      });
    }
  }
  return entries;
}
