import fs from 'fs';
import path from 'path';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { Skin, affiliateUrl, RARITY_COLORS } from '@/lib/loadout';
import { buildSlugMap } from '@/lib/skin_slugs';
import { Link } from '@/i18n/routing';

interface SalesData {
  updated_at: string;
  // isim → [24s hacim, 7g hacim, trend %]
  items: Record<string, [number, number, number | null]>;
}

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

function getSales(): SalesData | null {
  try {
    return JSON.parse(
      fs.readFileSync(
        path.join(process.cwd(), 'public', 'data', 'sales.json'),
        'utf-8'
      )
    );
  } catch {
    return null; // henüz üretilmedi — sayfa boş durumla render olur
  }
}

export async function generateMetadata({
  params: { locale },
}: {
  params: { locale: string };
}) {
  const t = await getTranslations({ locale, namespace: 'trending' });
  return {
    title: t('metaTitle'),
    description: t('metaDescription'),
    alternates: {
      languages: {
        en: '/trending',
        ru: '/ru/trending',
        tr: '/tr/trending',
      },
    },
  };
}

export default async function TrendingPage({
  params: { locale },
}: {
  params: { locale: string };
}) {
  setRequestLocale(locale);
  const t = await getTranslations('trending');
  const tCard = await getTranslations('card');

  const sales = getSales();
  const skins = getSkins();

  let rows: {
    skin: Skin;
    slug: string;
    v24: number;
    v7: number;
    trend: number | null;
  }[] = [];

  if (sales) {
    const slugMap = buildSlugMap(skins);
    const idToSlug = new Map<string, string>();
    for (const [sl, s] of slugMap) idToSlug.set(s.id, sl);
    const byName = new Map(skins.map((s) => [s.name, s]));

    rows = Object.entries(sales.items)
      .map(([name, [v24, v7, trend]]) => {
        const skin = byName.get(name);
        if (!skin) return null;
        return {
          skin,
          slug: idToSlug.get(skin.id) ?? '',
          v24,
          v7,
          trend,
        };
      })
      .filter((r): r is NonNullable<typeof r> => r !== null)
      .sort((a, b) => b.v7 - a.v7)
      .slice(0, 30);
  }

  const updatedDate = sales
    ? new Date(sales.updated_at).toLocaleDateString(locale, {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      })
    : null;

  return (
    <main className="min-h-screen max-w-5xl mx-auto px-4 py-8">
      <Link
        href="/"
        className="text-sm text-gray-400 hover:text-orange-400 transition-colors"
      >
        ← LoadoutLab
      </Link>

      <div className="bg-gradient-to-r from-orange-500/10 to-red-500/5 border border-orange-500/30 rounded-xl p-6 mt-4 mb-8">
        <h1 className="text-3xl font-bold">{t('title')}</h1>
        <p className="text-sm text-gray-400 mt-2 max-w-2xl">{t('intro')}</p>
        {updatedDate && (
          <p className="text-[11px] text-gray-600 mt-2">
            {t('updated', { date: updatedDate })}
          </p>
        )}
      </div>

      {rows.length === 0 ? (
        <div className="bg-[var(--bg-secondary,#131820)] border border-gray-800 rounded-xl p-10 text-center text-gray-400 text-sm">
          {t('empty')}
        </div>
      ) : (
        <div className="bg-[var(--bg-secondary,#131820)] border border-gray-800 rounded-xl overflow-hidden">
          {/* Başlık satırı */}
          <div className="hidden sm:grid grid-cols-[2rem_1fr_6rem_6rem_5rem_4rem] gap-3 px-4 py-2.5 text-[10px] font-semibold uppercase tracking-wider text-gray-600 border-b border-gray-800">
            <span>#</span>
            <span>{t('colItem')}</span>
            <span className="text-right">{t('colSales7d')}</span>
            <span className="text-right">{t('colSales24h')}</span>
            <span className="text-right">{t('colTrend')}</span>
            <span className="text-right">{t('colPrice')}</span>
          </div>
          {rows.map((r, i) => {
            const rarityColor = RARITY_COLORS[r.skin.rarity] || 'text-gray-400';
            return (
              <div
                key={r.skin.id}
                className={`grid grid-cols-[2rem_1fr_5rem] sm:grid-cols-[2rem_1fr_6rem_6rem_5rem_4rem] gap-3 items-center px-4 py-2.5 ${
                  i > 0 ? 'border-t border-gray-800/60' : ''
                } hover:bg-white/[0.02] transition-colors`}
              >
                <span className="text-xs text-gray-600 tabular-nums">
                  {i + 1}
                </span>
                <Link
                  href={`/skin/${r.slug}`}
                  className="flex items-center gap-3 min-w-0 group"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={r.skin.image}
                    alt={r.skin.name}
                    className="w-12 h-9 object-contain bg-black/40 rounded flex-shrink-0"
                    loading="lazy"
                  />
                  <span className="min-w-0">
                    <span className="block text-xs font-medium truncate group-hover:text-orange-400 transition-colors">
                      {r.skin.name}
                    </span>
                    <span className={`block text-[10px] ${rarityColor}`}>
                      {r.skin.rarity}
                    </span>
                  </span>
                </Link>
                <span className="hidden sm:block text-right text-xs text-gray-300 tabular-nums">
                  {r.v7.toLocaleString(locale)}
                </span>
                <span className="hidden sm:block text-right text-xs text-gray-500 tabular-nums">
                  {r.v24.toLocaleString(locale)}
                </span>
                <span
                  className={`hidden sm:block text-right text-xs font-medium tabular-nums ${
                    r.trend === null
                      ? 'text-gray-600'
                      : r.trend >= 0
                        ? 'text-emerald-400'
                        : 'text-red-400'
                  }`}
                >
                  {r.trend === null
                    ? '—'
                    : `${r.trend >= 0 ? '▲' : '▼'} ${Math.abs(r.trend)}%`}
                </span>
                <span className="text-right">
                  <a
                    href={affiliateUrl(r.skin.entry_url)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs font-bold text-orange-500 hover:text-orange-400 tabular-nums"
                    title={tCard('buy')}
                  >
                    {r.skin.entry_price.toFixed(0)}€
                  </a>
                </span>
              </div>
            );
          })}
        </div>
      )}
    </main>
  );
}
