import fs from 'fs';
import path from 'path';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import {
  Skin,
  affiliateUrl,
  findLookalikes,
  Lookalike,
} from '@/lib/loadout';
import { buildSlugMap } from '@/lib/skin_slugs';
import { Link } from '@/i18n/routing';

let skinsCache: Skin[] | null = null;
function getSkins(): Skin[] {
  if (!skinsCache) {
    skinsCache = JSON.parse(
      fs.readFileSync(
        path.join(process.cwd(), 'public', 'data', 'skins_popular.json'),
        'utf-8'
      )
    );
  }
  return skinsCache!;
}

interface DupeEntry {
  target: Skin;
  targetSlug: string;
  lookalikes: (Lookalike & { slug: string })[];
}

function buildEntries(): DupeEntry[] {
  const skins = getSkins();
  const slugMap = buildSlugMap(skins);
  const idToSlug = new Map<string, string>();
  for (const [sl, s] of slugMap) idToSlug.set(s.id, sl);

  const qty = (s: Skin) => s.wears.reduce((sum, w) => sum + w.quantity, 0);

  // Popüler + pahalı hedefler: 50€ üstü, popülerlik sıralı
  const targets = skins
    .filter((s) => s.entry_price >= 50)
    .sort((a, b) => qty(b) - qty(a))
    .slice(0, 40);

  const entries: DupeEntry[] = [];
  for (const target of targets) {
    if (entries.length >= 24) break;
    const lookalikes = findLookalikes(skins, target, { maxResults: 3 });
    if (lookalikes.length === 0) continue;
    entries.push({
      target,
      targetSlug: idToSlug.get(target.id) ?? '',
      lookalikes: lookalikes.map((l) => ({
        ...l,
        slug: idToSlug.get(l.skin.id) ?? '',
      })),
    });
  }
  return entries;
}

export async function generateMetadata({
  params: { locale },
}: {
  params: { locale: string };
}) {
  const t = await getTranslations({ locale, namespace: 'dupes' });
  return {
    title: t('metaTitle'),
    description: t('metaDescription'),
    alternates: {
      languages: {
        en: '/cheap-alternatives',
        ru: '/ru/cheap-alternatives',
        tr: '/tr/cheap-alternatives',
      },
    },
  };
}

export default async function CheapAlternativesPage({
  params: { locale },
}: {
  params: { locale: string };
}) {
  setRequestLocale(locale);
  const t = await getTranslations('dupes');
  const tCard = await getTranslations('card');
  const entries = buildEntries();

  return (
    <main className="min-h-screen max-w-6xl mx-auto px-4 py-8">
      <Link
        href="/"
        className="text-sm text-gray-400 hover:text-orange-400 transition-colors"
      >
        ← LoadoutLab
      </Link>

      <div className="bg-gradient-to-r from-emerald-500/10 to-emerald-600/5 border border-emerald-500/30 rounded-xl p-6 mt-4 mb-8">
        <h1 className="text-3xl font-bold">{t('title')}</h1>
        <p className="text-sm text-gray-400 mt-2 max-w-2xl">{t('intro')}</p>
      </div>

      <div className="space-y-6">
        {entries.map(({ target, targetSlug, lookalikes }) => (
          <div
            key={target.id}
            className="bg-[var(--bg-secondary,#131820)] border border-gray-800 rounded-xl p-4 md:p-5"
          >
            <div className="flex flex-col md:flex-row gap-5">
              {/* Hedef (pahalı) skin */}
              <Link
                href={`/skin/${targetSlug}`}
                className="md:w-64 flex-shrink-0 group"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={target.image}
                  alt={target.name}
                  className="w-full aspect-[4/3] object-contain bg-black/40 rounded-lg mb-2"
                  loading="lazy"
                />
                <div className="text-sm font-semibold leading-tight group-hover:text-orange-400 transition-colors">
                  {target.name}
                </div>
                <div className="text-lg font-bold text-orange-500 mt-0.5">
                  {target.entry_price.toFixed(2)}€
                </div>
              </Link>

              {/* Benzerleri */}
              <div className="flex-1 min-w-0">
                <div className="text-[11px] font-semibold uppercase tracking-wider text-emerald-500/80 mb-2">
                  {t('alternativesFor')}
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {lookalikes.map(({ skin: alt, similarity, savingsPct, slug }) => (
                    <div
                      key={alt.id}
                      className="bg-[var(--bg-tertiary,#1c232e)] border border-gray-800 hover:border-emerald-500/40 rounded-lg p-3 transition-colors flex flex-col"
                    >
                      <Link href={`/skin/${slug}`} className="group flex-1">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={alt.image}
                          alt={alt.name}
                          className="w-full aspect-[4/3] object-contain bg-black/40 rounded mb-2"
                          loading="lazy"
                        />
                        <div className="text-xs font-medium leading-tight group-hover:text-emerald-300 transition-colors">
                          {alt.name}
                        </div>
                      </Link>
                      <div className="text-[10px] text-emerald-400 mt-1">
                        {tCard('similarity', { pct: similarity })} · -{savingsPct}%
                      </div>
                      <div className="flex items-baseline justify-between mt-1">
                        <span className="text-sm font-bold text-orange-500">
                          {alt.entry_price.toFixed(2)}€
                        </span>
                        <a
                          href={affiliateUrl(alt.entry_url)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-[11px] text-gray-400 hover:text-orange-400 transition-colors"
                        >
                          {tCard('buy')}
                        </a>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </main>
  );
}
