import fs from 'fs';
import path from 'path';
import { notFound } from 'next/navigation';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { Skin, affiliateUrl, RARITY_COLORS } from '@/lib/loadout';
import {
  allSeoSlugs,
  parseSeoSlug,
  buildSeoLoadout,
  SEO_COLORS,
  SEO_BUDGETS,
} from '@/lib/seo_pages';
import { Link } from '@/i18n/routing';

export const dynamicParams = false;

export function generateStaticParams() {
  return allSeoSlugs().map((slug) => ({ slug }));
}

function getSkins(): Skin[] {
  const filePath = path.join(
    process.cwd(),
    'public',
    'data',
    'skins_popular.json'
  );
  return JSON.parse(fs.readFileSync(filePath, 'utf-8'));
}

export async function generateMetadata({
  params: { locale, slug },
}: {
  params: { locale: string; slug: string };
}) {
  const parsed = parseSeoSlug(slug);
  if (!parsed) return {};
  const t = await getTranslations({ locale, namespace: 'seo' });
  const tc = await getTranslations({ locale, namespace: 'colors' });
  const color = tc(parsed.color);
  return {
    title: t('title', { color, budget: parsed.budget }),
    description: t('metaDescription', { color, budget: parsed.budget }),
    alternates: {
      languages: {
        en: `/loadout/${slug}`,
        ru: `/ru/loadout/${slug}`,
        tr: `/tr/loadout/${slug}`,
      },
    },
  };
}

export default async function SeoLoadoutPage({
  params: { locale, slug },
}: {
  params: { locale: string; slug: string };
}) {
  const parsed = parseSeoSlug(slug);
  if (!parsed) notFound();
  setRequestLocale(locale);

  const t = await getTranslations('seo');
  const tc = await getTranslations('colors');
  const tg = await getTranslations('gallery');
  const tCard = await getTranslations('card');

  const { color, budget } = parsed;
  const colorName = tc(color);
  const skins = getSkins();
  const { items, total } = buildSeoLoadout(skins, color, budget);

  const builderHref = `/?b=${budget}&c=${color}`;

  return (
    <main className="min-h-screen max-w-7xl mx-auto px-4 py-8">
      <Link
        href="/"
        className="text-sm text-gray-400 hover:text-orange-400 transition-colors"
      >
        {t('backHome')}
      </Link>

      <div className="bg-gradient-to-r from-orange-500/10 to-orange-600/5 border border-orange-500/30 rounded-xl p-6 mt-4 mb-8">
        <h1 className="text-3xl font-bold">
          {t('title', { color: colorName, budget })}
        </h1>
        <p className="text-sm text-gray-400 mt-2 max-w-2xl">
          {t('intro', { color: colorName, budget })}
        </p>
        <div className="mt-3 text-lg">
          <span className="text-gray-400">{t('total')}: </span>
          <span className="text-orange-500 font-bold">
            {total.toFixed(2)}€
          </span>
          <span className="text-gray-500 text-sm"> / {budget}€</span>
        </div>
        <a
          href={builderHref}
          className="inline-block mt-4 bg-orange-500 hover:bg-orange-600 text-white text-sm font-medium px-4 py-2 rounded-md transition-colors"
        >
          {t('openBuilder')}
        </a>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {items.map(({ label, skin }) => {
          const displayLabel =
            label === 'knife'
              ? tg('knife')
              : label === 'glove'
                ? tg('glove')
                : label;
          const rarityColor = RARITY_COLORS[skin.rarity] || 'text-gray-400';
          return (
            <div
              key={skin.id}
              className="bg-[var(--bg-secondary)] border border-gray-800 rounded-xl p-4 flex flex-col"
            >
              <div className="text-[10px] uppercase tracking-wider text-gray-500 mb-2">
                {displayLabel}
              </div>
              <div className="relative bg-gradient-to-br from-gray-900 to-black rounded-lg overflow-hidden mb-3 aspect-[4/3] flex items-center justify-center">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={skin.image}
                  alt={skin.name}
                  className="w-full h-full object-contain p-2"
                  loading="lazy"
                />
              </div>
              <div className="flex-1">
                <div className={`text-xs font-medium mb-1 ${rarityColor}`}>
                  {skin.rarity}
                </div>
                <div className="text-sm font-semibold leading-tight mb-1">
                  {skin.name}
                </div>
                <div className="text-[10px] text-gray-500 mb-3">
                  {skin.entry_wear}
                </div>
              </div>
              <div className="flex items-baseline justify-between border-t border-gray-800 pt-3">
                <div className="text-lg font-bold text-orange-500">
                  {skin.entry_price.toFixed(2)}€
                </div>
                <a
                  href={affiliateUrl(skin.entry_url)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-gray-400 hover:text-orange-400 transition-colors"
                >
                  {tCard('buy')}
                </a>
              </div>
            </div>
          );
        })}
      </div>

      {/* İç linkler — SEO için diğer kombinasyonlar */}
      <div className="mt-12 grid grid-cols-1 md:grid-cols-2 gap-8">
        <div>
          <h2 className="text-sm font-semibold text-gray-300 mb-3">
            {t('otherBudgets', { color: colorName })}
          </h2>
          <div className="flex gap-2 flex-wrap">
            {SEO_BUDGETS.filter((b) => b !== budget).map((b) => (
              <Link
                key={b}
                href={`/loadout/${color}-under-${b}`}
                className="px-3 py-1.5 rounded-md text-xs bg-[var(--bg-tertiary,#1f2937)] text-gray-300 hover:text-orange-400 transition-colors"
              >
                {t('title', { color: colorName, budget: b })}
              </Link>
            ))}
          </div>
        </div>
        <div>
          <h2 className="text-sm font-semibold text-gray-300 mb-3">
            {t('otherColors', { budget })}
          </h2>
          <div className="flex gap-2 flex-wrap">
            {SEO_COLORS.filter((c) => c !== color).map((c) => (
              <Link
                key={c}
                href={`/loadout/${c}-under-${budget}`}
                className="px-3 py-1.5 rounded-md text-xs bg-[var(--bg-tertiary,#1f2937)] text-gray-300 hover:text-orange-400 transition-colors"
              >
                {tc(c)}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </main>
  );
}
