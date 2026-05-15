import fs from 'fs';
import path from 'path';
import { Skin } from '@/lib/loadout';
import LoadoutBuilder from '@/components/LoadoutBuilder';

async function getSkins(): Promise<Skin[]> {
  const filePath = path.join(process.cwd(), 'public', 'data', 'skins_popular.json');
  const raw = fs.readFileSync(filePath, 'utf-8');
  return JSON.parse(raw);
}

export default async function HomePage() {
  const skins = await getSkins();

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
          <div className="text-xs text-gray-500">
            {skins.length} skin · canlı Skinport fiyatları
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
