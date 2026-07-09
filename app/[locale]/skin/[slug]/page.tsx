import fs from 'fs';
import path from 'path';
import { notFound } from 'next/navigation';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import {
  Skin,
  affiliateUrl,
  findLookalikes,
  getEffectiveTags,
  skinsInFamily,
  RARITY_COLORS,
  WEAR_ORDER,
  WEAR_SHORT,
} from '@/lib/loadout';
import { buildSlugMap, skinSlug } from '@/lib/skin_slugs';
import { Link } from '@/i18n/routing';

export const dynamicParams = false;

const COLOR_HEX: Record<string, string> = {
  red: '#ef4444',
  blue: '#3b82f6',
  green: '#22c55e',
  gold: '#eab308',
  purple: '#a855f7',
  pink: '#ec4899',
  orange: '#f97316',
  yellow: '#facc15',
  brown: '#92400e',
  gray: '#9ca3af',
  black: '#1f2937',
  white: '#f3f4f6',
};

// Build sırasında ~5700 sayfa render edilir — JSON ve slug haritası
// modül seviyesinde önbelleklenir, aksi halde build süresi patlar.
let skinsCache: Skin[] | null = null;
let slugMapCache: Map<string, Skin> | null = null;

function getSkins(): Skin[] {
  if (!skinsCache) {
    const filePath = path.join(
      process.cwd(),
      'public',
      'data',
      'skins_popular.json'
    );
    skinsCache = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
  }
  return skinsCache!;
}

function getSlugMap(): Map<string, Skin> {
  if (!slugMapCache) slugMapCache = buildSlugMap(getSkins());
  return slugMapCache;
}

let idToSlugCache: Map<string, string> | null = null;
function getIdToSlug(): Map<string, string> {
  if (!idToSlugCache) {
    idToSlugCache = new Map();
    for (const [sl, s] of getSlugMap()) idToSlugCache.set(s.id, sl);
  }
  return idToSlugCache;
}

export function generateStaticParams() {
  return Array.from(getSlugMap().keys()).map((slug) => ({ slug }));
}

export async function generateMetadata({
  params: { locale, slug },
}: {
  params: { locale: string; slug: string };
}) {
  const skin = getSlugMap().get(slug);
  if (!skin) return {};
  const t = await getTranslations({ locale, namespace: 'skinPage' });
  const prices = skin.wears.map((w) => w.min_price).filter((p) => p > 0);
  const min = Math.min(...prices).toFixed(2);
  const max = Math.max(...prices).toFixed(2);
  return {
    title: t('metaTitle', { name: skin.name }),
    description: t('metaDescription', { name: skin.name, min, max }),
    alternates: {
      languages: {
        en: `/skin/${slug}`,
        ru: `/ru/skin/${slug}`,
        tr: `/tr/skin/${slug}`,
      },
    },
  };
}

export default async function SkinPage({
  params: { locale, slug },
}: {
  params: { locale: string; slug: string };
}) {
  setRequestLocale(locale);
  const skins = getSkins();
  const slugMap = getSlugMap();
  const skin = slugMap.get(slug);
  if (!skin) notFound();

  // id → slug (link üretimi için ters harita — önbellekli)
  const idToSlug = getIdToSlug();

  const t = await getTranslations('skinPage');
  const tc = await getTranslations('colors');
  const tCard = await getTranslations('card');

  const rarityColor = RARITY_COLORS[skin.rarity] || 'text-gray-400';
  const colorTags = getEffectiveTags(skin).filter((c) => c in COLOR_HEX);
  const lookalikes = findLookalikes(skins, skin, { maxResults: 6 });

  // Aynı desen ailesinin diğer silahları (Redline → tüm Redline'lar)
  const finish = skin.name.includes('|')
    ? skin.name.split('|')[1].trim()
    : null;
  const family = finish
    ? skinsInFamily(skins, finish)
        .filter((s) => s.id !== skin.id)
        .slice(0, 8)
    : [];

  const wearOrder = new Map<string, number>(WEAR_ORDER.map((w, i) => [w, i]));
  const wears = [...skin.wears]
    .filter((w) => w.min_price > 0)
    .sort((a, b) => (wearOrder.get(a.wear) ?? 9) - (wearOrder.get(b.wear) ?? 9));

  const firstColor = colorTags[0];
  const builderHref = firstColor
    ? `/?w=${encodeURIComponent(skin.weapon)}&c=${firstColor}`
    : `/?w=${encodeURIComponent(skin.weapon)}`;

  return (
    <main className="min-h-screen max-w-5xl mx-auto px-4 py-8">
      <Link
        href="/"
        className="text-sm text-gray-400 hover:text-orange-400 transition-colors"
      >
        {t('backHome')}
      </Link>

      {/* Üst blok: görsel + kimlik */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4 mb-8">
        <div className="relative bg-gradient-to-br from-gray-900 via-[#131820] to-black border border-gray-800 rounded-2xl aspect-[4/3] flex items-center justify-center overflow-hidden">
          {firstColor && (
            <div
              className="absolute inset-0 opacity-[0.07]"
              style={{
                background: `radial-gradient(circle at 50% 40%, ${COLOR_HEX[firstColor]}, transparent 70%)`,
              }}
            />
          )}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={skin.image}
            alt={skin.name}
            className="w-full h-full object-contain p-8 relative"
          />
        </div>
        <div className="flex flex-col justify-center">
          <div className="text-[11px] font-semibold uppercase tracking-wider text-gray-500">
            {skin.weapon}
          </div>
          <h1 className="text-3xl font-bold mt-1 leading-tight">
            {skin.name}
          </h1>
          <div className={`text-sm font-medium mt-2 ${rarityColor}`}>
            {skin.rarity}
          </div>
          {colorTags.length > 0 && (
            <div className="flex items-center gap-1.5 mt-4">
              <span className="text-[11px] text-gray-500 mr-1">
                {t('palette')}
              </span>
              {colorTags.map((c) => (
                <span
                  key={c}
                  title={tc(c)}
                  className="w-5 h-5 rounded-full border border-white/15"
                  style={{ background: COLOR_HEX[c] }}
                />
              ))}
            </div>
          )}
          <div className="mt-6 flex items-baseline gap-2">
            <span className="text-3xl font-bold text-orange-500">
              {skin.entry_price.toFixed(2)}€
            </span>
            <span className="text-xs text-gray-500">
              {t('fromWear', { wear: skin.entry_wear })}
            </span>
          </div>
          <div className="flex gap-2 mt-5">
            <a
              href={affiliateUrl(skin.entry_url)}
              target="_blank"
              rel="noopener noreferrer"
              className="bg-orange-500 hover:bg-orange-600 text-white text-sm font-medium px-5 py-2.5 rounded-lg transition-colors"
            >
              {t('buyNow')}
            </a>
            <a
              href={builderHref}
              className="bg-[var(--bg-tertiary,#1c232e)] hover:bg-gray-700 text-gray-200 text-sm font-medium px-5 py-2.5 rounded-lg transition-colors"
            >
              {t('buildWith')}
            </a>
          </div>
        </div>
      </div>

      {/* Wear fiyat tablosu */}
      <section className="mb-10">
        <h2 className="text-[11px] font-semibold uppercase tracking-wider text-gray-500 mb-3">
          {t('pricesHeading')}
        </h2>
        <div className="bg-[var(--bg-secondary,#131820)] border border-gray-800 rounded-xl overflow-hidden">
          {wears.map((w, i) => (
            <div
              key={w.wear}
              className={`flex items-center justify-between px-4 py-3 ${
                i > 0 ? 'border-t border-gray-800' : ''
              }`}
            >
              <div className="flex items-center gap-3">
                <span className="text-xs font-bold text-gray-300 w-8">
                  {WEAR_SHORT[w.wear]}
                </span>
                <span className="text-sm text-gray-400">{w.wear}</span>
              </div>
              <div className="flex items-center gap-5">
                <span className="text-[11px] text-gray-600 hidden sm:inline">
                  {t('inStock', { count: w.quantity })}
                </span>
                <span className="text-sm font-bold text-orange-500 tabular-nums">
                  {w.min_price.toFixed(2)}€
                </span>
                <a
                  href={affiliateUrl(w.url)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-gray-400 hover:text-orange-400 transition-colors"
                >
                  {tCard('buy')}
                </a>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Ucuz benzerleri */}
      {lookalikes.length > 0 && (
        <section className="mb-10">
          <h2 className="text-[11px] font-semibold uppercase tracking-wider text-gray-500 mb-3">
            {t('lookalikesHeading')}
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {lookalikes.map(({ skin: alt, similarity, savingsPct }) => {
              const altSlug = idToSlug.get(alt.id) ?? skinSlug(alt.name);
              return (
                <Link
                  key={alt.id}
                  href={`/skin/${altSlug}`}
                  className="bg-[var(--bg-secondary,#131820)] border border-gray-800 hover:border-emerald-500/40 rounded-xl p-3 transition-colors"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={alt.image}
                    alt={alt.name}
                    className="w-full aspect-[4/3] object-contain bg-black/40 rounded-lg mb-2"
                    loading="lazy"
                  />
                  <div className="text-xs font-medium leading-tight truncate">
                    {alt.name}
                  </div>
                  <div className="text-[10px] text-emerald-400 mt-0.5">
                    {tCard('similarity', { pct: similarity })} · -{savingsPct}%
                  </div>
                  <div className="text-sm font-bold text-orange-500 mt-0.5">
                    {alt.entry_price.toFixed(2)}€
                  </div>
                </Link>
              );
            })}
          </div>
        </section>
      )}

      {/* Aynı desenin diğer silahları */}
      {family.length > 0 && finish && (
        <section className="mb-10">
          <h2 className="text-[11px] font-semibold uppercase tracking-wider text-gray-500 mb-3">
            {t('familyHeading', { finish })}
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {family.map((s) => {
              const sSlug = idToSlug.get(s.id) ?? skinSlug(s.name);
              return (
                <Link
                  key={s.id}
                  href={`/skin/${sSlug}`}
                  className="bg-[var(--bg-secondary,#131820)] border border-gray-800 hover:border-orange-500/40 rounded-xl p-3 transition-colors"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={s.image}
                    alt={s.name}
                    className="w-full aspect-[4/3] object-contain bg-black/40 rounded-lg mb-2"
                    loading="lazy"
                  />
                  <div className="text-[11px] text-gray-400 truncate">
                    {s.weapon}
                  </div>
                  <div className="text-sm font-bold text-orange-500">
                    {s.entry_price.toFixed(2)}€
                  </div>
                </Link>
              );
            })}
          </div>
        </section>
      )}
    </main>
  );
}
