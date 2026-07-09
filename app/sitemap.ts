import fs from 'fs';
import path from 'path';
import type { MetadataRoute } from 'next';
import { allSeoSlugs } from '@/lib/seo_pages';
import { buildSlugMap } from '@/lib/skin_slugs';

const BASE = 'https://loadoutlab-pi.vercel.app';
const LOCALE_PREFIXES = ['', '/ru', '/tr']; // EN prefix'siz (as-needed)

export default function sitemap(): MetadataRoute.Sitemap {
  const entries: MetadataRoute.Sitemap = [];

  const skins = JSON.parse(
    fs.readFileSync(
      path.join(process.cwd(), 'public', 'data', 'skins_popular.json'),
      'utf-8'
    )
  );
  const skinSlugs = Array.from(buildSlugMap(skins).keys());

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
    for (const slug of skinSlugs) {
      entries.push({
        url: `${BASE}${prefix}/skin/${slug}`,
        changeFrequency: 'weekly',
        priority: 0.6,
      });
    }
  }
  return entries;
}
