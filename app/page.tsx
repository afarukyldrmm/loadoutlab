import fs from 'fs';
import path from 'path';
import { Skin } from '@/lib/loadout';
import LoadoutBuilder from '@/components/LoadoutBuilder';

async function getSkins(): Promise<Skin[]> {
  const filePath = path.join(process.cwd(), 'public', 'data', 'skins_popular.json');
  const raw = fs.readFileSync(filePath, 'utf-8');
  return JSON.parse(raw);
}

// v13: fiyatların son güncelleme zamanı (update_prices.py yazar)
function getPricesUpdatedAt(): string | null {
  try {
    const raw = fs.readFileSync(
      path.join(process.cwd(), 'public', 'data', 'meta.json'),
      'utf-8'
    );
    const meta = JSON.parse(raw);
    if (!meta.prices_updated_at) return null;
    return new Date(meta.prices_updated_at).toLocaleDateString('tr-TR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  } catch {
    return null;
  }
}

export default async function HomePage() {
  const skins = await getSkins();
  const pricesUpdatedAt = getPricesUpdatedAt();

  return (
    <main className="min-h-screen">
      <header className="border-b border-gray-800 bg-black/30 backdrop-blur sticky top-0 z-20">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">
              <span className="text-orange-500">Loadout</span>Lab
            </h1>
            <p className="text-xs text-gray-500 mt-0.5">
              CS2 için kişiselleştirilmiş skin önerileri
            </p>
          </div>
          <div className="text-xs text-gray-500 text-right">
            <div>{skins.length} skin · Skinport fiyatları</div>
            {pricesUpdatedAt && (
              <div className="text-gray-600 mt-0.5">
                Son güncelleme: {pricesUpdatedAt}
              </div>
            )}
          </div>
        </div>
      </header>

      <LoadoutBuilder allSkins={skins} />

      <footer className="border-t border-gray-800 mt-16 py-8 px-4 text-center text-xs text-gray-500">
        <p>Prototip · ByMykel CS:GO API + Skinport public data</p>
        <p className="mt-2">
          Bu site Valve Corp. ile bağlı değildir. Tüm marka ve fiyatlar ilgili sahiplerine aittir.
        </p>
      </footer>
    </main>
  );
}
