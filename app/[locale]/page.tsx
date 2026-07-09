import fs from 'fs';
import path from 'path';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { Skin } from '@/lib/loadout';
import { Link, routing } from '@/i18n/routing';
import { SEO_COLORS, SEO_BUDGETS } from '@/lib/seo_pages';
import LoadoutBuilder from '@/components/LoadoutBuilder';

async function getSkins(): Promise<Skin[]> {
  const filePath = path.join(
    process.cwd(),
    'public',
    'data',
    'skins_popular.json'
  );
  const raw = fs.readFileSync(filePath, 'utf-8');
  return JSON.parse(raw);
}

// v13: fiyatların son güncelleme zamanı (update_prices.py yazar)
function getPricesUpdatedAt(locale: string): string | null {
  try {
    const raw = fs.readFileSync(
      path.join(process.cwd(), 'public', 'data', 'meta.json'),
      'utf-8'
    );
    const meta = JSON.parse(raw);
    if (!meta.prices_updated_at) return null;
    return new Date(meta.prices_updated_at).toLocaleDateString(locale, {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  } catch {
    return null;
  }
}

const LOCALE_LABELS: Record<string, string> = {
  en: 'EN',
  ru: 'RU',
  tr: 'TR',
};

// Kompakt hazır-loadout listesi için renk noktaları
const SEO_COLOR_DOTS: Record<string, string> = {
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

export default async function HomePage({
  params: { locale },
}: {
  params: { locale: string };
}) {
  setRequestLocale(locale);
  const t = await getTranslations();
  const skins = await getSkins();
  const pricesUpdatedAt = getPricesUpdatedAt(locale);

  return (
    <main className="min-h-screen">
      <header className="border-b border-white/[0.06] bg-[#0a0e14]/80 backdrop-blur-md sticky top-0 z-20">
        <div className="max-w-7xl mx-auto px-4 py-3.5 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            {/* Logo işareti — nişangâh */}
            <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-orange-500 to-orange-600 flex items-center justify-center shadow-lg shadow-orange-500/20 flex-shrink-0">
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="white"
                strokeWidth="2"
                strokeLinecap="round"
              >
                <circle cx="12" cy="12" r="6" />
                <line x1="12" y1="2" x2="12" y2="6" />
                <line x1="12" y1="18" x2="12" y2="22" />
                <line x1="2" y1="12" x2="6" y2="12" />
                <line x1="18" y1="12" x2="22" y2="12" />
              </svg>
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight leading-none">
                <span className="text-orange-500">Loadout</span>Lab
              </h1>
              <p className="text-[11px] text-gray-500 mt-1">
                {t('header.tagline')}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-xs text-gray-500 text-right hidden sm:block">
              <div>{t('header.skinCount', { count: skins.length })}</div>
              {pricesUpdatedAt && (
                <div className="text-gray-600 mt-0.5">
                  {t('header.updated', { date: pricesUpdatedAt })}
                </div>
              )}
            </div>
            <nav className="flex gap-1 text-xs" aria-label="Language">
              {routing.locales.map((l) => (
                <Link
                  key={l}
                  href="/"
                  locale={l}
                  className={`px-2 py-1 rounded transition-colors ${
                    l === locale
                      ? 'bg-orange-500 text-white font-semibold'
                      : 'text-gray-400 hover:text-white bg-[var(--bg-tertiary,#1f2937)]'
                  }`}
                >
                  {LOCALE_LABELS[l]}
                </Link>
              ))}
            </nav>
          </div>
        </div>
      </header>

      <LoadoutBuilder allSkins={skins} />

      {/* v18: SEO sayfalarına kompakt iç linkler — renk başına tek satır */}
      <section className="max-w-7xl mx-auto px-4 mt-16">
        <h2 className="text-[11px] font-semibold uppercase tracking-wider text-gray-500 mb-3">
          {t('seo.readyTitle')}
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-x-8 gap-y-1.5">
          {SEO_COLORS.map((c) => (
            <div
              key={c}
              className="flex items-center gap-2 text-[11px] text-gray-500"
            >
              <span
                className="w-2 h-2 rounded-full flex-shrink-0 border border-white/10"
                style={{ background: SEO_COLOR_DOTS[c] ?? '#888' }}
              />
              <span className="text-gray-400 w-20 flex-shrink-0">
                {t(`colors.${c}`)}
              </span>
              <span className="flex gap-2">
                {SEO_BUDGETS.map((b) => (
                  <Link
                    key={b}
                    href={`/loadout/${c}-under-${b}`}
                    className="hover:text-orange-400 transition-colors tabular-nums"
                  >
                    {b}€
                  </Link>
                ))}
              </span>
            </div>
          ))}
        </div>
      </section>

      <footer className="border-t border-gray-800 mt-16 py-8 px-4 text-center text-xs text-gray-500">
        <p>{t('footer.line1')}</p>
        <p className="mt-2">{t('footer.line2')}</p>
      </footer>
    </main>
  );
}
