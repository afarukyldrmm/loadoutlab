import fs from 'fs';
import path from 'path';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { Skin } from '@/lib/loadout';
import { Link, routing } from '@/i18n/routing';
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
      <header className="border-b border-gray-800 bg-black/30 backdrop-blur sticky top-0 z-20">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">
              <span className="text-orange-500">Loadout</span>Lab
            </h1>
            <p className="text-xs text-gray-500 mt-0.5">
              {t('header.tagline')}
            </p>
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

      <footer className="border-t border-gray-800 mt-16 py-8 px-4 text-center text-xs text-gray-500">
        <p>{t('footer.line1')}</p>
        <p className="mt-2">{t('footer.line2')}</p>
      </footer>
    </main>
  );
}
