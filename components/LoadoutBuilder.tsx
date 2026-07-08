'use client';

import { useState, useMemo, useRef, useEffect } from 'react';
import {
  Skin,
  THEME_TAGS,
  RARITY_COLORS,
  WEAPONS,
  WEAPON_BY_NAME,
  WEAPON_CATEGORIES,
  MIN_WEAPON_PRICES,
  findCheaperAlternative,
  recommendLoadout,
  affiliateUrl,
  findAlternatives,
  listSkinFamilies,
  skinsInFamily,
  themeMatchingSkins,
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

// Başlangıç silahları — bıçak/eldiven ayrı toggle'larla yönetilir
const DEFAULT_GUNS = ['AK-47', 'M4A4', 'AWP', 'Desert Eagle'];

// Sadece silah kategorileri (bıçak/eldiven hariç — ayrı bölümde)
const GUN_CATEGORIES = WEAPON_CATEGORIES.filter(
  (c) => c.id !== 'knife' && c.id !== 'glove'
);
const GUN_CATEGORY_IDS = new Set(GUN_CATEGORIES.map((c) => c.id));

// Akıllı öneriler — hangi silahla birlikte sık seçilir
const WEAPON_SUGGESTIONS: Record<string, string[]> = {
  'AK-47': ['M4A4', 'M4A1-S', 'AWP', 'Desert Eagle'],
  'M4A4': ['AK-47', 'AWP', 'Desert Eagle', 'USP-S'],
  'M4A1-S': ['AK-47', 'AWP', 'USP-S', 'Desert Eagle'],
  'AWP': ['AK-47', 'Desert Eagle', 'USP-S', 'Glock-18'],
  'Desert Eagle': ['AK-47', 'M4A4', 'AWP', 'Glock-18'],
  'Glock-18': ['AK-47', 'AWP', 'Desert Eagle', 'MAC-10'],
  'USP-S': ['M4A1-S', 'M4A4', 'AWP', 'Desert Eagle'],
};

const COLOR_CHIPS = THEME_TAGS.filter((t) => t.kind === 'color');

// Renk chip'i için küçük renk noktası
const COLOR_SWATCH: Record<string, string> = {
  red: '#ef4444',
  blue: '#3b82f6',
  green: '#22c55e',
  purple: '#a855f7',
  gold: '#eab308',
  pink: '#ec4899',
  orange: '#f97316',
  yellow: '#facc15',
  brown: '#92400e',
  gray: '#9ca3af',
  black: '#1f2937',
  white: '#f3f4f6',
};

export default function LoadoutBuilder({ allSkins }: Props) {
  const [budget, setBudget] = useState(500);
  const [themeColors, setThemeColors] = useState<string[]>([]);
  const [enabledGuns, setEnabledGuns] = useState<Set<string>>(
    new Set(DEFAULT_GUNS)
  );
  const [includeKnife, setIncludeKnife] = useState(true);
  const [includeGlove, setIncludeGlove] = useState(true);
  const [knifePick, setKnifePick] = useState<Skin | null>(null);
  const [glovePick, setGlovePick] = useState<Skin | null>(null);
  const [selectedFamily, setSelectedFamily] = useState<string | null>(null);
  const [familyQuery, setFamilyQuery] = useState('');
  const [regenKey, setRegenKey] = useState(0);
  const [gunOverrides, setGunOverrides] = useState<Record<string, Skin>>({});
  const [searchQuery, setSearchQuery] = useState('');
  const [searchFocused, setSearchFocused] = useState(false);
  const [showAllWeapons, setShowAllWeapons] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setSearchFocused(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // --- Silah loadout'u (v11: kademeli renk — önce tam eşleşme, yoksa yakın ton) ---
  const loadout = useMemo(() => {
    return recommendLoadout(allSkins, {
      budget,
      themeColors,
      themeStyles: [],
      strictColor: 'auto',
      respectThemeStrictly: true,
      enabledWeapons: Array.from(enabledGuns),
      variationSeed: regenKey,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [budget, themeColors, enabledGuns, regenKey, allSkins]);

  const unmatchedSet = useMemo(
    () => new Set(loadout.unmatchedWeapons ?? []),
    [loadout.unmatchedWeapons]
  );

  const relaxedSet = useMemo(
    () => new Set(loadout.relaxedWeapons ?? []),
    [loadout.relaxedWeapons]
  );

  const gunItems = useMemo(() => {
    const merged: Record<string, Skin> = { ...loadout.items };
    for (const [weaponName, skin] of Object.entries(gunOverrides)) {
      if (skin && enabledGuns.has(weaponName)) merged[weaponName] = skin;
    }
    return merged;
  }, [loadout, gunOverrides, enabledGuns]);

  // --- Bıçak & eldiven galerileri (tüm modeller, renk filtreli) ---
  const knifeOptions = useMemo(
    () => themeMatchingSkins(allSkins, 'knife', themeColors),
    [allSkins, themeColors]
  );
  const gloveOptions = useMemo(
    () => themeMatchingSkins(allSkins, 'glove', themeColors),
    [allSkins, themeColors]
  );
  const effectiveKnife = useMemo(() => {
    if (knifePick && knifeOptions.some((s) => s.id === knifePick.id))
      return knifePick;
    return knifeOptions[0];
  }, [knifePick, knifeOptions]);
  const effectiveGlove = useMemo(() => {
    if (glovePick && gloveOptions.some((s) => s.id === glovePick.id))
      return glovePick;
    return gloveOptions[0];
  }, [glovePick, gloveOptions]);

  // --- Fiyatlar ---
  const gunTotal = useMemo(
    () =>
      Object.values(gunItems).reduce(
        (sum, s) => sum + (s?.entry_price ?? 0),
        0
      ),
    [gunItems]
  );
  const knifeCost =
    includeKnife && effectiveKnife ? effectiveKnife.entry_price : 0;
  const gloveCost =
    includeGlove && effectiveGlove ? effectiveGlove.entry_price : 0;
  const totalPrice = gunTotal + knifeCost + gloveCost;
  const remainder = budget - totalPrice;

  // --- Koleksiyonlar (aileler) ---
  const families = useMemo(() => listSkinFamilies(allSkins, 4), [allSkins]);
  const filteredFamilies = useMemo(() => {
    const q = familyQuery.toLowerCase().trim();
    return q
      ? families.filter((f) => f.family.toLowerCase().includes(q))
      : families;
  }, [families, familyQuery]);
  const familySkins = useMemo(
    () => (selectedFamily ? skinsInFamily(allSkins, selectedFamily) : []),
    [allSkins, selectedFamily]
  );

  const activeGunList = useMemo(
    () =>
      Array.from(enabledGuns).sort(
        (a, b) =>
          (WEAPON_BY_NAME[b]?.weight ?? 0) - (WEAPON_BY_NAME[a]?.weight ?? 0)
      ),
    [enabledGuns]
  );

  const searchResults = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    return WEAPONS.filter((w) => {
      if (!GUN_CATEGORY_IDS.has(w.category)) return false;
      if (enabledGuns.has(w.name)) return false;
      if (!q) return true;
      return w.name.toLowerCase().includes(q);
    }).slice(0, 8);
  }, [searchQuery, enabledGuns]);

  const smartSuggestions = useMemo(() => {
    const suggestions = new Set<string>();
    for (const w of enabledGuns) {
      for (const rec of WEAPON_SUGGESTIONS[w] || []) {
        if (!enabledGuns.has(rec)) suggestions.add(rec);
      }
    }
    return Array.from(suggestions).slice(0, 4);
  }, [enabledGuns]);

  const hasColorFilter = themeColors.length > 0;

  // --- Handlers ---
  function changeBudget(v: number) {
    setBudget(v);
    setGunOverrides({});
  }
  function toggleColor(id: string) {
    setThemeColors((cur) =>
      cur.includes(id) ? cur.filter((x) => x !== id) : [...cur, id]
    );
    setGunOverrides({});
    setKnifePick(null);
    setGlovePick(null);
  }
  function clearColors() {
    setThemeColors([]);
    setGunOverrides({});
    setKnifePick(null);
    setGlovePick(null);
  }
  function regenerate() {
    setRegenKey((k) => k + 1);
    setGunOverrides({});
  }
  function addGun(name: string) {
    setEnabledGuns((prev) => new Set([...prev, name]));
    setGunOverrides({});
    setSearchQuery('');
  }
  function removeGun(name: string) {
    setEnabledGuns((prev) => {
      const next = new Set(prev);
      next.delete(name);
      return next;
    });
    setGunOverrides({});
  }
  function toggleGun(name: string) {
    setEnabledGuns((prev) => {
      const next = new Set(prev);
      if (next.has(name)) next.delete(name);
      else next.add(name);
      return next;
    });
    setGunOverrides({});
  }
  function swapGun(weaponName: string, newSkin: Skin) {
    setGunOverrides((o) => ({ ...o, [weaponName]: newSkin }));
  }
  function increaseBudgetFor(weaponName: string) {
    const minPrice = MIN_WEAPON_PRICES[weaponName] ?? 0;
    const weight = WEAPON_BY_NAME[weaponName]?.weight ?? 0.1;
    const totalWeight = Array.from(enabledGuns).reduce(
      (sum, w) => sum + (WEAPON_BY_NAME[w]?.weight ?? 0),
      0
    );
    const requiredBudget = Math.ceil((minPrice * 1.2 * totalWeight) / weight);
    setBudget(Math.max(budget, requiredBudget));
    setGunOverrides({});
  }
  function replaceWithCheaper(weaponName: string) {
    const alternative = findCheaperAlternative(weaponName);
    if (!alternative) return;
    setEnabledGuns((prev) => {
      const next = new Set(prev);
      next.delete(weaponName);
      next.add(alternative);
      return next;
    });
    setGunOverrides({});
  }

  // ====== KOLEKSİYON MODU ======
  if (selectedFamily) {
    return (
      <FamilyShowcase
        family={selectedFamily}
        skins={familySkins}
        onBack={() => setSelectedFamily(null)}
      />
    );
  }

  const nothingSelected =
    activeGunList.length === 0 && !includeKnife && !includeGlove;

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* ====== TERCİHLER ====== */}
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

        {/* SİLAHLAR */}
        <div className="mb-6">
          <div className="flex items-baseline justify-between mb-2">
            <label className="text-sm text-gray-400">Silahlar</label>
            <span className="text-xs text-gray-600">
              {enabledGuns.size} silah seçili
            </span>
          </div>

          <div ref={searchRef} className="relative">
            <div
              className={`bg-[var(--bg-tertiary)] border rounded-lg p-2 transition-colors min-h-[44px] flex flex-wrap gap-1.5 items-center ${
                searchFocused ? 'border-orange-500/50' : 'border-gray-700'
              }`}
              onClick={() => {
                setSearchFocused(true);
                const input = searchRef.current?.querySelector('input');
                input?.focus();
              }}
            >
              {activeGunList.map((weaponName) => {
                const def = WEAPON_BY_NAME[weaponName];
                return (
                  <span
                    key={weaponName}
                    className="inline-flex items-center gap-1 bg-orange-500 text-white text-xs font-medium px-2 py-1 rounded"
                  >
                    {weaponName}
                    {def?.team !== 'shared' && (
                      <span className="opacity-60">({def.team})</span>
                    )}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        removeGun(weaponName);
                      }}
                      className="opacity-70 hover:opacity-100 ml-0.5"
                      aria-label={`${weaponName} kaldır`}
                    >
                      ×
                    </button>
                  </span>
                );
              })}
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onFocus={() => setSearchFocused(true)}
                placeholder={
                  activeGunList.length === 0 ? 'Silah ara...' : 'Silah ekle...'
                }
                className="bg-transparent border-none text-gray-200 text-sm flex-1 min-w-[120px] outline-none px-1 py-1"
              />
            </div>

            {searchFocused && searchResults.length > 0 && (
              <div className="absolute left-0 right-0 top-full mt-1 bg-[var(--bg-tertiary)] border border-gray-700 rounded-lg shadow-xl z-10 max-h-72 overflow-y-auto">
                {searchResults.map((w) => (
                  <button
                    key={w.name}
                    onClick={() => addGun(w.name)}
                    className="w-full text-left px-3 py-2 hover:bg-orange-500/10 transition-colors flex items-center justify-between"
                  >
                    <span className="text-sm text-gray-200">
                      {w.name}
                      {w.team !== 'shared' && (
                        <span className="text-gray-500 ml-1">({w.team})</span>
                      )}
                    </span>
                    <span className="text-xs text-gray-500 capitalize">
                      {WEAPON_CATEGORIES.find((c) => c.id === w.category)?.label}
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {smartSuggestions.length > 0 && (
            <div className="flex items-center gap-2 flex-wrap mt-2">
              <span className="text-xs text-gray-500">Önerilen:</span>
              {smartSuggestions.map((w) => (
                <button
                  key={w}
                  onClick={() => addGun(w)}
                  className="px-2 py-0.5 bg-[var(--bg-tertiary)] hover:bg-orange-500/10 text-gray-400 hover:text-orange-400 text-xs rounded border border-gray-700 hover:border-orange-500/50 transition-colors"
                >
                  + {w}
                </button>
              ))}
            </div>
          )}

          {/* Bıçak / Eldiven toggle'ları */}
          <div className="flex gap-2 flex-wrap mt-3">
            <button
              onClick={() => setIncludeKnife((v) => !v)}
              className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors flex items-center gap-1.5 ${
                includeKnife
                  ? 'bg-orange-500 text-white'
                  : 'bg-[var(--bg-tertiary)] text-gray-400 hover:text-white'
              }`}
            >
              <span>🔪</span>
              <span>Bıçak {includeKnife ? 'dahil' : 'ekle'}</span>
            </button>
            <button
              onClick={() => setIncludeGlove((v) => !v)}
              className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors flex items-center gap-1.5 ${
                includeGlove
                  ? 'bg-orange-500 text-white'
                  : 'bg-[var(--bg-tertiary)] text-gray-400 hover:text-white'
              }`}
            >
              <span>🧤</span>
              <span>Eldiven {includeGlove ? 'dahil' : 'ekle'}</span>
            </button>
          </div>

          <button
            onClick={() => setShowAllWeapons((v) => !v)}
            className="text-xs text-gray-500 hover:text-orange-400 transition-colors mt-3"
          >
            {showAllWeapons
              ? '↑ Tüm silah listesini gizle'
              : '↓ Tüm silahları detaylı seç'}
          </button>

          {showAllWeapons && (
            <div className="mt-3 bg-[var(--bg-tertiary)] rounded-md p-4 space-y-4">
              {GUN_CATEGORIES.map((cat) => {
                const catWeapons = WEAPONS.filter(
                  (w) => w.category === cat.id
                );
                const selectedInCat = catWeapons.filter((w) =>
                  enabledGuns.has(w.name)
                ).length;
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
                            setEnabledGuns((prev) => {
                              const next = new Set(prev);
                              catWeapons.forEach((w) => next.add(w.name));
                              return next;
                            });
                            setGunOverrides({});
                          }}
                          className="text-[10px] text-gray-500 hover:text-orange-400"
                        >
                          Hepsi
                        </button>
                        <span className="text-[10px] text-gray-700">·</span>
                        <button
                          onClick={() => {
                            setEnabledGuns((prev) => {
                              const next = new Set(prev);
                              catWeapons.forEach((w) => next.delete(w.name));
                              return next;
                            });
                            setGunOverrides({});
                          }}
                          className="text-[10px] text-gray-500 hover:text-orange-400"
                        >
                          Hiçbiri
                        </button>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-x-3 gap-y-1">
                      {catWeapons.map((w) => (
                        <label
                          key={w.name}
                          className="flex items-center gap-2 py-1 cursor-pointer"
                        >
                          <input
                            type="checkbox"
                            checked={enabledGuns.has(w.name)}
                            onChange={() => toggleGun(w.name)}
                            className="w-3.5 h-3.5 accent-orange-500 flex-shrink-0"
                          />
                          <span
                            className={`text-xs truncate ${
                              enabledGuns.has(w.name)
                                ? 'text-gray-200'
                                : 'text-gray-500'
                            }`}
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

        {/* RENK FİLTRESİ — çoklu seçim, her zaman sıkı eşleşme */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-2">
            <label className="text-sm text-gray-400">
              Renk (opsiyonel){' '}
              {hasColorFilter && (
                <span className="text-orange-400 ml-1">
                  {themeColors.length} seçili
                </span>
              )}
            </label>
            {hasColorFilter && (
              <button
                onClick={clearColors}
                className="text-xs text-gray-500 hover:text-orange-400 transition-colors"
              >
                Temizle
              </button>
            )}
          </div>
          <div className="flex gap-2 flex-wrap">
            {COLOR_CHIPS.map((t) => {
              const selected = themeColors.includes(t.id);
              return (
                <button
                  key={t.id}
                  onClick={() => toggleColor(t.id)}
                  className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors flex items-center gap-1.5 ${
                    selected
                      ? 'bg-orange-500 text-white'
                      : 'bg-[var(--bg-tertiary)] text-gray-400 hover:text-white'
                  }`}
                >
                  <span
                    className="w-3 h-3 rounded-full border border-black/30 flex-shrink-0"
                    style={{ background: COLOR_SWATCH[t.id] ?? '#888' }}
                  />
                  {t.label}
                </button>
              );
            })}
          </div>
          <p className="text-[11px] text-gray-600 mt-2">
            Renk, skinin baskın (dominant) rengine göre eşleşir. Uygun skin
            yoksa o silah boş kalır — yanlış renk önerilmez.
          </p>
        </div>

        {/* KOLEKSİYONLAR — aile (desen) seçimi */}
        <div>
          <label className="text-sm text-gray-400 mb-2 block">
            Koleksiyonlar (opsiyonel)
          </label>
          <input
            type="text"
            value={familyQuery}
            onChange={(e) => setFamilyQuery(e.target.value)}
            placeholder="Koleksiyon ara — Printstream, Doppler, Fade..."
            className="w-full bg-[var(--bg-tertiary)] border border-gray-700 rounded-lg px-3 py-2 text-sm text-gray-200 outline-none focus:border-orange-500/50 mb-2"
          />
          <div className="flex gap-2 flex-wrap max-h-36 overflow-y-auto p-0.5">
            {filteredFamilies.map((f) => (
              <button
                key={f.family}
                onClick={() => setSelectedFamily(f.family)}
                title={`${f.weaponCount} silah · en ucuz ${f.minPrice.toFixed(
                  0
                )}€`}
                className="px-3 py-1.5 rounded-md text-xs font-medium bg-[var(--bg-tertiary)] text-gray-300 hover:bg-amber-600 hover:text-white transition-colors flex items-center gap-1.5"
              >
                {f.family}
                <span className="opacity-60 text-[10px]">
                  {f.weaponCount}
                </span>
              </button>
            ))}
            {filteredFamilies.length === 0 && (
              <span className="text-xs text-gray-600 py-2">
                Eşleşen koleksiyon yok.
              </span>
            )}
          </div>
          <p className="text-[11px] text-gray-600 mt-1.5">
            Bir koleksiyon seçince o desenin tüm silah versiyonları (bütçe ve
            filtre bağımsız) gösterilir.
          </p>
        </div>

        <div className="flex justify-end mt-4">
          <button
            onClick={regenerate}
            className="px-4 py-1.5 bg-[var(--bg-tertiary)] hover:bg-gray-700 text-white text-sm font-medium rounded-md transition-colors"
          >
            ↻ Yeniden öner
          </button>
        </div>
      </div>

      {/* ====== TOPLAM ====== */}
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

      {/* Renk yüzünden boş kalan silahlar */}
      {unmatchedSet.size > 0 && (
        <div className="bg-amber-900/20 border border-amber-600/50 rounded-xl p-4 mb-6">
          <div className="text-amber-300 font-semibold text-sm">
            🎨 {unmatchedSet.size} silah için seçtiğin renkte uygun skin yok
          </div>
          <div className="text-xs text-amber-200/80 mt-1">
            Yanlış renk önermek yerine o silahlar boş bırakıldı. Bütçeyi artır,
            başka renk ekle veya o silahları çıkar.
          </div>
        </div>
      )}

      {nothingSelected ? (
        <div className="bg-[var(--bg-secondary)] border border-gray-800 rounded-xl p-8 text-center text-gray-400">
          En az bir silah, bıçak veya eldiven seç.
        </div>
      ) : (
        <>
          {/* SİLAHLAR */}
          {activeGunList.length > 0 && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 fade-in">
              {activeGunList.map((weaponName) => {
                const skin = gunItems[weaponName];
                const isThemeUnmatched =
                  unmatchedSet.has(weaponName) && !skin;
                return (
                  <GunCard
                    key={weaponName}
                    weaponName={weaponName}
                    skin={skin}
                    allSkins={allSkins}
                    themeColors={themeColors}
                    isThemeUnmatched={isThemeUnmatched}
                    isRelaxedMatch={
                      relaxedSet.has(weaponName) && !gunOverrides[weaponName]
                    }
                    isOverridden={!!gunOverrides[weaponName]}
                    onSwap={(s) => swapGun(weaponName, s)}
                    onIncreaseBudget={() => increaseBudgetFor(weaponName)}
                    onReplaceCheaper={() => replaceWithCheaper(weaponName)}
                    onRemove={() => removeGun(weaponName)}
                    onClearColors={clearColors}
                  />
                );
              })}
            </div>
          )}

          {/* BIÇAK & ELDİVEN */}
          {(includeKnife || includeGlove) && (
            <div className="mt-6 space-y-4">
              {includeKnife && (
                <SlotGallery
                  title="Bıçak"
                  icon="🔪"
                  options={knifeOptions}
                  selected={effectiveKnife}
                  hasColorFilter={hasColorFilter}
                  onPick={(s) => setKnifePick(s)}
                  onRemove={() => setIncludeKnife(false)}
                />
              )}
              {includeGlove && (
                <SlotGallery
                  title="Eldiven"
                  icon="🧤"
                  options={gloveOptions}
                  selected={effectiveGlove}
                  hasColorFilter={hasColorFilter}
                  onPick={(s) => setGlovePick(s)}
                  onRemove={() => setIncludeGlove(false)}
                />
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}

// ============================================================
// SİLAH KARTI
// ============================================================

interface GunCardProps {
  weaponName: string;
  skin?: Skin;
  allSkins: Skin[];
  themeColors: string[];
  isThemeUnmatched: boolean;
  /** v11: tam renk bulunamadı, yakın tonla dolduruldu */
  isRelaxedMatch: boolean;
  isOverridden: boolean;
  onSwap: (s: Skin) => void;
  onIncreaseBudget: () => void;
  onReplaceCheaper: () => void;
  onRemove: () => void;
  onClearColors: () => void;
}

function GunCard({
  weaponName,
  skin,
  allSkins,
  themeColors,
  isThemeUnmatched,
  isRelaxedMatch,
  isOverridden,
  onSwap,
  onIncreaseBudget,
  onReplaceCheaper,
  onRemove,
  onClearColors,
}: GunCardProps) {
  const [showAlts, setShowAlts] = useState(false);

  const alternatives = useMemo(() => {
    if (!skin || !showAlts) return [];
    return findAlternatives(allSkins, skin, {
      themeColors,
      themeStyles: [],
      strictColor: 'auto',
      maxResults: 8,
    });
  }, [allSkins, skin, themeColors, showAlts]);

  // Renk yüzünden boş slot
  if (!skin && isThemeUnmatched) {
    return (
      <div className="bg-[var(--bg-secondary)] border border-amber-500/40 rounded-xl p-4 flex flex-col min-h-[260px]">
        <div className="text-[10px] uppercase tracking-wider text-gray-500 mb-3">
          {weaponName}
        </div>
        <div className="flex-1 flex flex-col items-center justify-center text-center py-4 px-2">
          <div className="text-3xl mb-2">🎨</div>
          <div className="text-sm font-semibold text-amber-300 mb-1">
            Bu renkte uygun {weaponName} yok
          </div>
          <div className="text-xs text-gray-400">
            Seçtiğin renk bu silah için eşleşmedi.
          </div>
        </div>
        <div className="flex flex-col gap-1.5 mt-3">
          <button
            onClick={onClearColors}
            className="w-full bg-amber-600 hover:bg-amber-500 text-white text-xs font-medium py-2 rounded-md transition-colors"
          >
            Renk filtresini kaldır
          </button>
          <button
            onClick={onRemove}
            className="w-full bg-transparent hover:text-red-400 text-gray-500 text-[11px] py-1 transition-colors"
          >
            Loadout&apos;tan çıkar
          </button>
        </div>
      </div>
    );
  }

  // Bütçe yetmiyor
  if (!skin) {
    const minPrice = MIN_WEAPON_PRICES[weaponName] ?? 0;
    const cheaperAlt = findCheaperAlternative(weaponName);
    return (
      <div className="bg-[var(--bg-secondary)] border border-orange-500/40 rounded-xl p-4 flex flex-col min-h-[260px]">
        <div className="text-[10px] uppercase tracking-wider text-gray-500 mb-3">
          {weaponName}
        </div>
        <div className="flex-1 flex flex-col items-center justify-center text-center py-4 px-2">
          <div className="text-3xl mb-2">⚠️</div>
          <div className="text-sm font-semibold text-gray-200 mb-1">
            Bütçe yetmiyor
          </div>
          <div className="text-xs text-gray-400">
            En ucuz {weaponName}{' '}
            <span className="text-orange-500 font-semibold">
              {minPrice.toFixed(0)}€
            </span>
          </div>
        </div>
        <div className="flex flex-col gap-1.5 mt-3">
          <button
            onClick={onIncreaseBudget}
            className="w-full bg-orange-500 hover:bg-orange-600 text-white text-xs font-medium py-2 rounded-md transition-colors"
          >
            Bütçeye sığdır
          </button>
          {cheaperAlt && (
            <button
              onClick={onReplaceCheaper}
              className="w-full bg-transparent hover:bg-[var(--bg-tertiary)] text-gray-300 hover:text-white text-xs py-2 rounded-md border border-gray-700 hover:border-gray-600 transition-colors"
            >
              Daha ucuz: {cheaperAlt}
            </button>
          )}
          <button
            onClick={onRemove}
            className="w-full bg-transparent hover:text-red-400 text-gray-500 text-[11px] py-1 transition-colors"
          >
            Loadout&apos;tan çıkar
          </button>
        </div>
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
        <div className="flex items-center gap-1.5">
          {isOverridden && (
            <div className="text-[9px] text-orange-400 bg-orange-500/10 px-1.5 py-0.5 rounded font-medium">
              ELLE SEÇİLDİ
            </div>
          )}
          {isRelaxedMatch && !isOverridden && (
            <div
              className="text-[9px] text-sky-300 bg-sky-500/10 px-1.5 py-0.5 rounded font-medium"
              title="Bu renkte tam eşleşme yok — yakın tonlu bir skin seçildi"
            >
              YAKIN TON
            </div>
          )}
          <button
            onClick={onRemove}
            className="text-gray-600 hover:text-red-400 text-sm leading-none"
            aria-label={`${weaponName} kaldır`}
          >
            ×
          </button>
        </div>
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
                <div className="text-[11px] font-medium truncate">
                  {alt.name}
                </div>
                <div className="text-[10px] text-gray-500">
                  {alt.entry_wear}
                </div>
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

// ============================================================
// BIÇAK / ELDİVEN GALERİSİ
// ============================================================

interface SlotGalleryProps {
  title: string;
  icon: string;
  options: Skin[];
  selected?: Skin;
  hasColorFilter: boolean;
  onPick: (s: Skin) => void;
  onRemove: () => void;
}

function SlotGallery({
  title,
  icon,
  options,
  selected,
  hasColorFilter,
  onPick,
  onRemove,
}: SlotGalleryProps) {
  const [modelFilter, setModelFilter] = useState<string | null>(null);

  // Mevcut seçeneklerdeki modeller (skin sayısına göre sıralı)
  const models = useMemo(() => {
    const m = new Map<string, number>();
    for (const s of options) m.set(s.weapon, (m.get(s.weapon) ?? 0) + 1);
    return Array.from(m.entries()).sort((a, b) => b[1] - a[1]);
  }, [options]);

  const shown = useMemo(() => {
    const list = modelFilter
      ? options.filter((s) => s.weapon === modelFilter)
      : options;
    return list.slice(0, 80);
  }, [options, modelFilter]);

  const rarityColor = selected
    ? RARITY_COLORS[selected.rarity] || 'text-gray-400'
    : 'text-gray-400';

  return (
    <div className="bg-[var(--bg-secondary)] border border-gray-800 rounded-xl p-4">
      <div className="flex items-center justify-between mb-3">
        <div className="text-sm font-semibold flex items-center gap-2">
          <span>{icon}</span>
          <span>{title}</span>
          <span className="text-xs text-gray-600 font-normal">
            {options.length} seçenek
          </span>
        </div>
        <button
          onClick={onRemove}
          className="text-gray-600 hover:text-red-400 text-xs"
        >
          Çıkar
        </button>
      </div>

      {options.length === 0 ? (
        <div className="text-center text-sm text-gray-400 py-8">
          {hasColorFilter
            ? `Seçtiğin renkte ${title.toLowerCase()} bulunamadı. Renk filtresini değiştir.`
            : `${title} bulunamadı.`}
        </div>
      ) : (
        <div className="flex flex-col md:flex-row gap-4">
          {/* Seçili önizleme */}
          {selected && (
            <div className="md:w-56 flex-shrink-0">
              <div className="relative bg-gradient-to-br from-gray-900 to-black rounded-lg overflow-hidden aspect-[4/3] flex items-center justify-center mb-2">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={selected.image}
                  alt={selected.name}
                  className="w-full h-full object-contain p-2"
                />
              </div>
              <div className={`text-[11px] font-medium ${rarityColor}`}>
                {selected.rarity}
              </div>
              <div className="text-sm font-semibold leading-tight">
                {selected.name}
              </div>
              <div className="text-[10px] text-gray-500 mb-1">
                {selected.entry_wear}
              </div>
              <div className="flex items-baseline justify-between">
                <span className="text-lg font-bold text-orange-500">
                  {selected.entry_price.toFixed(2)}€
                </span>
                <a
                  href={affiliateUrl(selected.entry_url)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-gray-400 hover:text-orange-400 transition-colors"
                >
                  Satın al →
                </a>
              </div>
            </div>
          )}

          {/* Galeri */}
          <div className="flex-1 min-w-0">
            {/* Model filtresi */}
            <div className="flex gap-1.5 flex-wrap mb-2">
              <button
                onClick={() => setModelFilter(null)}
                className={`px-2 py-1 rounded text-[11px] font-medium transition-colors ${
                  modelFilter === null
                    ? 'bg-orange-500 text-white'
                    : 'bg-[var(--bg-tertiary)] text-gray-400 hover:text-white'
                }`}
              >
                Tümü
              </button>
              {models.map(([model, count]) => (
                <button
                  key={model}
                  onClick={() =>
                    setModelFilter((cur) => (cur === model ? null : model))
                  }
                  className={`px-2 py-1 rounded text-[11px] font-medium transition-colors ${
                    modelFilter === model
                      ? 'bg-orange-500 text-white'
                      : 'bg-[var(--bg-tertiary)] text-gray-400 hover:text-white'
                  }`}
                >
                  {model}{' '}
                  <span className="opacity-60">{count}</span>
                </button>
              ))}
            </div>

            {/* Kaydırmalı küçük görseller */}
            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-2 max-h-72 overflow-y-auto p-0.5">
              {shown.map((s) => {
                const isSel = selected?.id === s.id;
                return (
                  <button
                    key={s.id}
                    onClick={() => onPick(s)}
                    title={`${s.name} — ${s.entry_price.toFixed(2)}€`}
                    className={`rounded-lg border p-1.5 text-left transition-colors ${
                      isSel
                        ? 'border-orange-500 bg-orange-500/10'
                        : 'border-gray-800 hover:border-orange-500/50 bg-[var(--bg-tertiary)]'
                    }`}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={s.image}
                      alt={s.name}
                      className="w-full aspect-[4/3] object-contain bg-black rounded mb-1"
                      loading="lazy"
                    />
                    <div className="text-[10px] text-gray-300 truncate leading-tight">
                      {s.weapon}
                    </div>
                    <div className="text-[10px] text-gray-500 truncate leading-tight">
                      {s.name.includes('|')
                        ? s.name.split('|')[1].trim()
                        : s.name}
                    </div>
                    <div className="text-[11px] font-bold text-orange-500">
                      {s.entry_price.toFixed(2)}€
                    </div>
                  </button>
                );
              })}
            </div>
            {options.length > shown.length && (
              <div className="text-[11px] text-gray-600 mt-1.5">
                {shown.length} / {options.length} gösteriliyor — daraltmak için
                model seç.
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// ============================================================
// KOLEKSİYON SHOWCASE
// ============================================================

interface FamilyShowcaseProps {
  family: string;
  skins: Skin[];
  onBack: () => void;
}

function FamilyShowcase({ family, skins, onBack }: FamilyShowcaseProps) {
  const minPrice = skins.length
    ? Math.min(...skins.map((s) => s.entry_price))
    : 0;
  const totalAll = skins.reduce((sum, s) => sum + s.entry_price, 0);

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <button
        onClick={onBack}
        className="text-sm text-gray-400 hover:text-orange-400 transition-colors mb-4"
      >
        ← Loadout&apos;a dön
      </button>

      <div className="bg-gradient-to-r from-amber-500/10 to-amber-600/5 border border-amber-500/30 rounded-xl p-5 mb-6">
        <div className="text-xs text-amber-400/80 uppercase tracking-wider">
          Koleksiyon
        </div>
        <div className="text-3xl font-bold mt-1">{family}</div>
        <div className="text-sm text-gray-400 mt-1">
          {skins.length} silah versiyonu · en ucuz{' '}
          <span className="text-orange-500 font-semibold">
            {minPrice.toFixed(2)}€
          </span>{' '}
          · tümü{' '}
          <span className="text-gray-300 font-semibold">
            {totalAll.toFixed(0)}€
          </span>
        </div>
        <div className="text-[11px] text-gray-600 mt-2">
          Bu desenin tüm silahları — bütçe ve renk filtrelerinden bağımsız.
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 fade-in">
        {skins.map((s) => {
          const rarityColor = RARITY_COLORS[s.rarity] || 'text-gray-400';
          return (
            <div
              key={s.id}
              className="skin-card bg-[var(--bg-secondary)] border border-gray-800 rounded-xl p-4 hover:border-amber-500/50 flex flex-col"
            >
              <div className="text-[10px] uppercase tracking-wider text-gray-500 mb-2">
                {s.weapon}
              </div>
              <div className="relative bg-gradient-to-br from-gray-900 to-black rounded-lg overflow-hidden mb-3 aspect-[4/3] flex items-center justify-center">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={s.image}
                  alt={s.name}
                  className="w-full h-full object-contain p-2"
                  loading="lazy"
                />
              </div>
              <div className="flex-1">
                <div className={`text-xs font-medium mb-1 ${rarityColor}`}>
                  {s.rarity}
                </div>
                <div className="text-sm font-semibold leading-tight mb-2 line-clamp-2 min-h-[2.5rem]">
                  {s.name}
                </div>
                <div className="text-[10px] text-gray-500 mb-3">
                  {s.entry_wear}
                </div>
              </div>
              <div className="flex items-baseline justify-between border-t border-gray-800 pt-3">
                <div>
                  <div className="text-lg font-bold text-orange-500">
                    {s.entry_price.toFixed(2)}€
                  </div>
                  <div className="text-[10px] text-gray-600">Skinport</div>
                </div>
                <a
                  href={affiliateUrl(s.entry_url)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-gray-400 hover:text-orange-400 transition-colors"
                >
                  Satın al →
                </a>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
