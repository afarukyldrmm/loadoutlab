'use client';

import { useState, useMemo } from 'react';
import {
  Skin,
  THEME_TAGS,
  RARITY_COLORS,
  WEAPONS,
  WEAPON_BY_NAME,
  WEAPON_CATEGORIES,
  LOADOUT_PRESETS,
  recommendLoadout,
  affiliateUrl,
  findAlternatives,
} from '@/lib/loadout';

interface Props {
  allSkins: Skin[];
}

const BUDGET_PRESETS = [
  { label: '50€', value: 50 },
  { label: '150€', value: 150 },
  { label: '500€', value: 500 },
  { label: '1.500€', value: 1500 },
  { label: '5.000€', value: 5000 },
];

const DEFAULT_WEAPONS = LOADOUT_PRESETS.find((p) => p.id === 'classic')!.weapons;

export default function LoadoutBuilder({ allSkins }: Props) {
  const [budget, setBudget] = useState(500);
  const [themeTag, setThemeTag] = useState<string | undefined>(undefined);
  const [enabledWeapons, setEnabledWeapons] = useState<Set<string>>(
    new Set(DEFAULT_WEAPONS)
  );
  const [regenKey, setRegenKey] = useState(0);
  const [overrides, setOverrides] = useState<Record<string, Skin>>({});
  const [weaponPanelOpen, setWeaponPanelOpen] = useState(false);

  const loadout = useMemo(() => {
    return recommendLoadout(allSkins, {
      budget,
      themeTag,
      enabledWeapons: Array.from(enabledWeapons),
      variationSeed: regenKey,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [budget, themeTag, enabledWeapons, regenKey, allSkins]);

  const finalItems = useMemo(() => {
    const merged: Record<string, Skin> = { ...loadout.items };
    for (const [weaponName, skin] of Object.entries(overrides)) {
      if (skin && enabledWeapons.has(weaponName)) merged[weaponName] = skin;
    }
    return merged;
  }, [loadout, overrides, enabledWeapons]);

  const totalPrice = useMemo(() => {
    return Object.values(finalItems).reduce(
      (sum, s) => sum + (s?.entry_price ?? 0),
      0
    );
  }, [finalItems]);

  // Aktif silahları sırala — bütçe ağırlığına göre
  const activeWeaponList = useMemo(() => {
    return Array.from(enabledWeapons).sort(
      (a, b) => (WEAPON_BY_NAME[b]?.weight ?? 0) - (WEAPON_BY_NAME[a]?.weight ?? 0)
    );
  }, [enabledWeapons]);

  const remainder = budget - totalPrice;

  function changeBudget(newBudget: number) {
    setBudget(newBudget);
    setOverrides({});
  }

  function changeTheme(tag: string | undefined) {
    setThemeTag(tag);
    setOverrides({});
  }

  function regenerate() {
    setRegenKey((k) => k + 1);
    setOverrides({});
  }

  function toggleWeapon(weaponName: string) {
    setEnabledWeapons((prev) => {
      const next = new Set(prev);
      if (next.has(weaponName)) next.delete(weaponName);
      else next.add(weaponName);
      return next;
    });
    setOverrides({});
  }

  function applyPreset(weapons: string[]) {
    setEnabledWeapons(new Set(weapons));
    setOverrides({});
  }

  function swapSkin(weaponName: string, newSkin: Skin) {
    setOverrides((o) => ({ ...o, [weaponName]: newSkin }));
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="bg-[var(--bg-secondary)] border border-gray-800 rounded-xl p-6 mb-6">
        <h2 className="text-lg font-semibold mb-4">Tercihlerini Ayarla</h2>

        {/* Bütçe */}
        <div className="mb-6">
          <div className="flex items-baseline justify-between mb-2">
            <label className="text-sm text-gray-400">Toplam Bütçe</label>
            <span className="text-2xl font-bold text-orange-500">
              {budget.toLocaleString('tr-TR')}€
            </span>
          </div>
          <input
            type="range"
            min={20}
            max={10000}
            step={10}
            value={budget}
            onChange={(e) => changeBudget(Number(e.target.value))}
            className="w-full"
          />
          <div className="flex gap-2 mt-3 flex-wrap">
            {BUDGET_PRESETS.map((p) => (
              <button
                key={p.value}
                onClick={() => changeBudget(p.value)}
                className={`px-3 py-1 rounded-md text-xs font-medium transition-colors ${
                  budget === p.value
                    ? 'bg-orange-500 text-white'
                    : 'bg-[var(--bg-tertiary)] text-gray-400 hover:text-white'
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>

        {/* SİLAH SEÇİMİ */}
        <div className="mb-6">
          <div className="flex items-baseline justify-between mb-2">
            <label className="text-sm text-gray-400">Silahlar</label>
            <span className="text-xs text-gray-600">
              {enabledWeapons.size} silah seçili
            </span>
          </div>

          <div className="flex gap-2 flex-wrap mb-3">
            {LOADOUT_PRESETS.map((p) => {
              const isMatch =
                p.weapons.length === enabledWeapons.size &&
                p.weapons.every((w) => enabledWeapons.has(w));
              return (
                <button
                  key={p.id}
                  onClick={() => applyPreset(p.weapons)}
                  className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                    isMatch
                      ? 'bg-orange-500 text-white'
                      : 'bg-[var(--bg-tertiary)] text-gray-400 hover:text-white'
                  }`}
                >
                  {p.label}
                </button>
              );
            })}
          </div>

          <button
            onClick={() => setWeaponPanelOpen((v) => !v)}
            className="text-xs text-gray-400 hover:text-orange-400 transition-colors flex items-center gap-1 mb-3"
          >
            {weaponPanelOpen ? '▾' : '▸'} Silah listesini {weaponPanelOpen ? 'gizle' : 'göster'} (detaylı seçim)
          </button>

          {weaponPanelOpen && (
            <div className="bg-[var(--bg-tertiary)] rounded-md p-4 space-y-4">
              {WEAPON_CATEGORIES.map((cat) => {
                const catWeapons = WEAPONS.filter((w) => w.category === cat.id);
                const selectedInCat = catWeapons.filter((w) => enabledWeapons.has(w.name)).length;
                return (
                  <div key={cat.id}>
                    <div className="flex items-center justify-between mb-2">
                      <div className="text-[10px] text-gray-500 uppercase tracking-wider">
                        {cat.label}{' '}
                        <span className="text-gray-600">
                          ({selectedInCat}/{catWeapons.length})
                        </span>
                      </div>
                      <div className="flex gap-1">
                        <button
                          onClick={() => {
                            setEnabledWeapons((prev) => {
                              const next = new Set(prev);
                              catWeapons.forEach((w) => next.add(w.name));
                              return next;
                            });
                            setOverrides({});
                          }}
                          className="text-[10px] text-gray-500 hover:text-orange-400 transition-colors"
                        >
                          Hepsi
                        </button>
                        <span className="text-[10px] text-gray-700">·</span>
                        <button
                          onClick={() => {
                            setEnabledWeapons((prev) => {
                              const next = new Set(prev);
                              catWeapons.forEach((w) => next.delete(w.name));
                              return next;
                            });
                            setOverrides({});
                          }}
                          className="text-[10px] text-gray-500 hover:text-orange-400 transition-colors"
                        >
                          Hiçbiri
                        </button>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-x-3 gap-y-1">
                      {catWeapons.map((w) => (
                        <label
                          key={w.name}
                          className="flex items-center gap-2 py-1 cursor-pointer group"
                        >
                          <input
                            type="checkbox"
                            checked={enabledWeapons.has(w.name)}
                            onChange={() => toggleWeapon(w.name)}
                            className="w-3.5 h-3.5 accent-orange-500 flex-shrink-0"
                          />
                          <span
                            className={`text-xs ${
                              enabledWeapons.has(w.name)
                                ? 'text-gray-200'
                                : 'text-gray-500'
                            } group-hover:text-white transition-colors truncate`}
                          >
                            {w.name}
                            {w.team !== 'shared' && (
                              <span className="text-gray-600 ml-1">
                                ({w.team})
                              </span>
                            )}
                          </span>
                        </label>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Renk + stil filtreleri */}
        <div className="mb-6">
          <label className="text-sm text-gray-400 mb-2 block">Renk (opsiyonel)</label>
          <div className="flex gap-2 flex-wrap mb-3">
            <button
              onClick={() => changeTheme(undefined)}
              className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                !themeTag
                  ? 'bg-orange-500 text-white'
                  : 'bg-[var(--bg-tertiary)] text-gray-400 hover:text-white'
              }`}
            >
              Hepsi
            </button>
            {THEME_TAGS.filter((t) => t.kind === 'color').map((t) => (
              <button
                key={t.id}
                onClick={() => changeTheme(themeTag === t.id ? undefined : t.id)}
                className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                  themeTag === t.id
                    ? 'bg-orange-500 text-white'
                    : 'bg-[var(--bg-tertiary)] text-gray-400 hover:text-white'
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>
          <label className="text-sm text-gray-400 mb-2 block">Stil (opsiyonel)</label>
          <div className="flex gap-2 flex-wrap">
            {THEME_TAGS.filter((t) => t.kind === 'style').map((t) => (
              <button
                key={t.id}
                onClick={() => changeTheme(themeTag === t.id ? undefined : t.id)}
                className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                  themeTag === t.id
                    ? 'bg-orange-500 text-white'
                    : 'bg-[var(--bg-tertiary)] text-gray-400 hover:text-white'
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>

        <div className="flex justify-end">
          <button
            onClick={regenerate}
            className="px-4 py-1.5 bg-[var(--bg-tertiary)] hover:bg-gray-700 text-white text-sm font-medium rounded-md transition-colors"
          >
            ↻ Yeniden öner
          </button>
        </div>
      </div>

      <div className="bg-gradient-to-r from-orange-500/10 to-orange-600/5 border border-orange-500/30 rounded-xl p-5 mb-6 flex items-center justify-between flex-wrap gap-4">
        <div>
          <div className="text-xs text-gray-400 uppercase tracking-wider">
            Toplam Tahmini
          </div>
          <div className="text-3xl font-bold mt-1">
            {totalPrice.toFixed(2)}€
            <span className="text-sm text-gray-500 font-normal ml-2">
              / {budget}€ bütçe
            </span>
          </div>
        </div>
        <div className="text-right">
          <div className="text-xs text-gray-400 uppercase tracking-wider">
            Kalan
          </div>
          <div
            className={`text-2xl font-bold mt-1 ${
              remainder >= 0 ? 'text-green-400' : 'text-red-400'
            }`}
          >
            {remainder >= 0 ? '+' : ''}
            {remainder.toFixed(2)}€
          </div>
        </div>
      </div>

      {activeWeaponList.length === 0 ? (
        <div className="bg-[var(--bg-secondary)] border border-gray-800 rounded-xl p-8 text-center text-gray-400">
          En az bir silah seç. Yukarıdan silah listesini açıp seçim yapabilirsin.
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 fade-in">
          {activeWeaponList.map((weaponName) => {
            const skin = finalItems[weaponName];
            return (
              <WeaponCard
                key={weaponName}
                weaponName={weaponName}
                skin={skin}
                allSkins={allSkins}
                themeTag={themeTag}
                onSwap={(newSkin) => swapSkin(weaponName, newSkin)}
                isOverridden={!!overrides[weaponName]}
              />
            );
          })}
        </div>
      )}
    </div>
  );
}

interface WeaponCardProps {
  weaponName: string;
  skin?: Skin;
  allSkins: Skin[];
  themeTag?: string;
  onSwap: (newSkin: Skin) => void;
  isOverridden: boolean;
}

function WeaponCard({
  weaponName,
  skin,
  allSkins,
  themeTag,
  onSwap,
  isOverridden,
}: WeaponCardProps) {
  const [showAlts, setShowAlts] = useState(false);

  const alternatives = useMemo(() => {
    if (!skin || !showAlts) return [];
    return findAlternatives(allSkins, skin, { themeTag, maxResults: 8 });
  }, [allSkins, skin, themeTag, showAlts]);

  if (!skin) {
    return (
      <div className="bg-[var(--bg-secondary)] border border-dashed border-gray-700 rounded-xl p-4 flex flex-col items-center justify-center text-gray-500 min-h-[260px]">
        <div className="text-xs uppercase tracking-wider mb-1">{weaponName}</div>
        <div className="text-sm">Uygun skin yok</div>
      </div>
    );
  }

  const rarityColor = RARITY_COLORS[skin.rarity] || 'text-gray-400';

  return (
    <div className="skin-card bg-[var(--bg-secondary)] border border-gray-800 rounded-xl p-4 hover:border-orange-500/50 flex flex-col">
      <div className="flex items-center justify-between mb-2">
        <div className="text-[10px] uppercase tracking-wider text-gray-500">
          {weaponName}
        </div>
        {isOverridden && (
          <div className="text-[9px] text-orange-400 bg-orange-500/10 px-1.5 py-0.5 rounded font-medium">
            ELLE DEĞİŞ
          </div>
        )}
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
        <div className={`text-xs font-medium mb-1 ${rarityColor}`}>{skin.rarity}</div>
        <div className="text-sm font-semibold leading-tight mb-2 line-clamp-2 min-h-[2.5rem]">
          {skin.name}
        </div>
        <div className="text-[10px] text-gray-500 mb-3">{skin.entry_wear}</div>
      </div>

      <div className="flex items-baseline justify-between border-t border-gray-800 pt-3 mb-2">
        <div>
          <div className="text-lg font-bold text-orange-500">
            {skin.entry_price.toFixed(2)}€
          </div>
          <div className="text-[10px] text-gray-600">Skinport</div>
        </div>
        <a
          href={affiliateUrl(skin.entry_url)}
          target="_blank"
          rel="noopener noreferrer"
          className="text-xs text-gray-400 hover:text-orange-400 transition-colors"
        >
          Satın al →
        </a>
      </div>

      <button
        onClick={() => setShowAlts((v) => !v)}
        className="text-xs text-gray-500 hover:text-orange-400 transition-colors w-full text-center mt-1 py-1"
      >
        {showAlts ? '↑ Alternatifleri gizle' : '↔ Diğer seçenekler'}
      </button>

      {showAlts && alternatives.length > 0 && (
        <div className="mt-2 space-y-1 max-h-64 overflow-y-auto">
          {alternatives.map((alt) => (
            <button
              key={alt.id}
              onClick={() => {
                onSwap(alt);
                setShowAlts(false);
              }}
              className="w-full flex items-center gap-2 p-2 hover:bg-[var(--bg-tertiary)] rounded-md transition-colors text-left"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={alt.image}
                alt={alt.name}
                className="w-10 h-10 object-contain bg-black rounded flex-shrink-0"
                loading="lazy"
              />
              <div className="flex-1 min-w-0">
                <div className="text-[11px] font-medium truncate">{alt.name}</div>
                <div className="text-[10px] text-gray-500">{alt.entry_wear}</div>
              </div>
              <div className="text-xs font-bold text-orange-500 flex-shrink-0">
                {alt.entry_price.toFixed(2)}€
              </div>
            </button>
          ))}
        </div>
      )}

      {showAlts && alternatives.length === 0 && (
        <div className="text-xs text-gray-600 mt-2 text-center py-3">
          Alternatif bulunamadı
        </div>
      )}
    </div>
  );
}
