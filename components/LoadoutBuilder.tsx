'use client';

import { useState, useMemo, useRef, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/routing';
import { skinSlug } from '@/lib/skin_slugs';
import {
  Skin,
  THEME_TAGS,
  RARITY_COLORS,
  WEAPONS,
  WEAPON_BY_NAME,
  WEAPON_CATEGORIES,
  WEAR_ORDER,
  WEAR_SHORT,
  applyWearFilter,
  MIN_WEAPON_PRICES,
  findCheaperAlternative,
  recommendLoadout,
  affiliateUrl,
  findAlternatives,
  findLookalikes,
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

// v15: URL paylaşım linki için kısa wear kodu → tam ad
const WEAR_FROM_SHORT: Record<string, string> = Object.fromEntries(
  Object.entries(WEAR_SHORT).map(([full, short]) => [short, full])
);

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
  const t = useTranslations();
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
  // v12 UI: gelişmiş ayarlar katlaması + wear (kalite) filtresi
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [wearFilter, setWearFilter] = useState<string[]>([]);
  // v12: true → sadece tam renk eşleşmesi (yakın ton önerilmez, slot boş kalabilir)
  const [exactColorsOnly, setExactColorsOnly] = useState(false);

  // Wear filtresi uygulanmış skin havuzu — tüm öneri/galeri/alternatifler bunu kullanır
  const skinPool = useMemo(
    () => applyWearFilter(allSkins, wearFilter),
    [allSkins, wearFilter]
  );

  // v15: paylaşım linki — kopyalandı geri bildirimi
  const [copied, setCopied] = useState(false);

  // v15: sayfa açılışında URL'deki seçimleri yükle (paylaşılan link desteği)
  useEffect(() => {
    const p = new URLSearchParams(window.location.search);
    const b = Number(p.get('b'));
    if (b >= 20 && b <= 10000) setBudget(b);
    const c = p.get('c');
    if (c) {
      const colors = c
        .split(',')
        .filter((x) => COLOR_CHIPS.some((chip) => chip.id === x));
      if (colors.length) setThemeColors(colors);
    }
    const w = p.get('w');
    if (w) {
      const guns = w.split(',').filter((n) => n in WEAPON_BY_NAME);
      if (guns.length) setEnabledGuns(new Set(guns));
    }
    if (p.get('k') === '0') setIncludeKnife(false);
    if (p.get('g') === '0') setIncludeGlove(false);
    const q = p.get('q');
    if (q) {
      const wears = q
        .split(',')
        .map((s) => WEAR_FROM_SHORT[s])
        .filter(Boolean);
      if (wears.length) setWearFilter(wears);
    }
    if (p.get('x') === '1') setExactColorsOnly(true);
    const s = Number(p.get('s'));
    if (Number.isInteger(s) && s > 0) setRegenKey(s);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // v15: seçimleri URL'e yaz — adres çubuğu her an paylaşılabilir
  useEffect(() => {
    const p = new URLSearchParams();
    if (budget !== 500) p.set('b', String(budget));
    if (themeColors.length) p.set('c', themeColors.join(','));
    const gunsNow = Array.from(enabledGuns).sort().join(',');
    const gunsDefault = [...DEFAULT_GUNS].sort().join(',');
    if (gunsNow !== gunsDefault) p.set('w', gunsNow);
    if (!includeKnife) p.set('k', '0');
    if (!includeGlove) p.set('g', '0');
    if (wearFilter.length)
      p.set('q', wearFilter.map((w) => WEAR_SHORT[w]).join(','));
    if (exactColorsOnly) p.set('x', '1');
    if (regenKey > 0) p.set('s', String(regenKey));
    const qs = p.toString();
    window.history.replaceState(
      null,
      '',
      qs ? `${window.location.pathname}?${qs}` : window.location.pathname
    );
  }, [
    budget,
    themeColors,
    enabledGuns,
    includeKnife,
    includeGlove,
    wearFilter,
    exactColorsOnly,
    regenKey,
  ]);

  async function copyShareLink() {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // clipboard izni yoksa sessizce geç
    }
  }
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

  // --- Bıçak & eldiven galerileri (tüm modeller, renk filtreli) ---
  const knifeOptions = useMemo(
    () =>
      themeMatchingSkins(
        skinPool,
        'knife',
        themeColors,
        exactColorsOnly ? true : 'auto'
      ),
    [skinPool, themeColors, exactColorsOnly]
  );
  const gloveOptions = useMemo(
    () =>
      themeMatchingSkins(
        skinPool,
        'glove',
        themeColors,
        exactColorsOnly ? true : 'auto'
      ),
    [skinPool, themeColors, exactColorsOnly]
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

  // --- Silah loadout'u (v11: kademeli renk — önce tam eşleşme, yoksa yakın ton) ---
  // v15 fix: bıçak/eldiven maliyeti silah bütçesinden DÜŞÜLÜR — toplam artık
  // bütçeyi aşmaz. (Eskiden silahlar tüm bütçeyi kullanıp bıçak üstüne biniyordu.)
  const reservedCost =
    (includeKnife && effectiveKnife ? effectiveKnife.entry_price : 0) +
    (includeGlove && effectiveGlove ? effectiveGlove.entry_price : 0);
  const gunBudget = Math.max(0, budget - reservedCost);

  const loadout = useMemo(() => {
    return recommendLoadout(skinPool, {
      budget: gunBudget,
      themeColors,
      themeStyles: [],
      strictColor: exactColorsOnly ? true : 'auto',
      respectThemeStrictly: true,
      enabledWeapons: Array.from(enabledGuns),
      variationSeed: regenKey,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [gunBudget, themeColors, enabledGuns, regenKey, skinPool, exactColorsOnly]);

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
  // v12: wear (kalite) filtresi — FN/MW/FT/WW/BS çoklu seçim
  function toggleWear(wear: string) {
    setWearFilter((cur) =>
      cur.includes(wear) ? cur.filter((w) => w !== wear) : [...cur, wear]
    );
    setGunOverrides({});
    setKnifePick(null);
    setGlovePick(null);
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
        <h2 className="text-lg font-semibold mb-4">{t('prefs.title')}</h2>

        {/* Bütçe */}
        <div className="mb-6">
          <div className="flex items-baseline justify-between mb-2">
            <label className="text-[11px] font-semibold uppercase tracking-wider text-gray-500">
              {t('prefs.budget')}
            </label>
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
            <label className="text-[11px] font-semibold uppercase tracking-wider text-gray-500">
              {t('prefs.weapons')}
            </label>
            <span className="text-xs text-gray-600">
              {t('prefs.weaponsSelected', { count: enabledGuns.size })}
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
                      aria-label={t('card.remove', { weapon: weaponName })}
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
                  activeGunList.length === 0
                    ? t('prefs.searchPlaceholder')
                    : t('prefs.addPlaceholder')
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
                      {t(`categories.${w.category}`)}
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {smartSuggestions.length > 0 && (
            <div className="flex items-center gap-2 flex-wrap mt-2">
              <span className="text-xs text-gray-500">
                {t('prefs.suggested')}
              </span>
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
              className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                includeKnife
                  ? 'bg-orange-500 text-white'
                  : 'bg-[var(--bg-tertiary)] text-gray-400 hover:text-white'
              }`}
            >
              {includeKnife ? t('prefs.knifeIncluded') : t('prefs.knifeAdd')}
            </button>
            <button
              onClick={() => setIncludeGlove((v) => !v)}
              className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                includeGlove
                  ? 'bg-orange-500 text-white'
                  : 'bg-[var(--bg-tertiary)] text-gray-400 hover:text-white'
              }`}
            >
              {includeGlove ? t('prefs.gloveIncluded') : t('prefs.gloveAdd')}
            </button>
          </div>

          <button
            onClick={() => setShowAllWeapons((v) => !v)}
            className="text-xs text-gray-500 hover:text-orange-400 transition-colors mt-3"
          >
            {showAllWeapons
              ? t('prefs.hideAllWeapons')
              : t('prefs.showAllWeapons')}
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
                        {t(`categories.${cat.id}`)}{' '}
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
                          {t('prefs.selectAll')}
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
                          {t('prefs.selectNone')}
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

        {/* KALİTE (WEAR/FLOAT) FİLTRESİ — v12 */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-2">
            <label className="text-[11px] font-semibold uppercase tracking-wider text-gray-500">
              {t('prefs.wearLabel')}{' '}
              {wearFilter.length > 0 && (
                <span className="text-orange-400 ml-1">
                  {wearFilter.map((w) => WEAR_SHORT[w]).join(', ')}
                </span>
              )}
            </label>
            {wearFilter.length > 0 && (
              <button
                onClick={() => {
                  setWearFilter([]);
                  setGunOverrides({});
                }}
                className="text-xs text-gray-500 hover:text-orange-400 transition-colors"
              >
                {t('prefs.clear')}
              </button>
            )}
          </div>
          <div className="flex gap-2 flex-wrap">
            {WEAR_ORDER.map((wear) => {
              const selected = wearFilter.includes(wear);
              return (
                <button
                  key={wear}
                  onClick={() => toggleWear(wear)}
                  title={wear}
                  className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                    selected
                      ? 'bg-orange-500 text-white'
                      : 'bg-[var(--bg-tertiary)] text-gray-400 hover:text-white'
                  }`}
                >
                  {WEAR_SHORT[wear]}
                  <span className="opacity-60 ml-1 hidden sm:inline">
                    {wear}
                  </span>
                </button>
              );
            })}
          </div>
          <p className="text-[11px] text-gray-600 mt-2">
            {t('prefs.wearHint')}
          </p>
        </div>

        {/* RENK FİLTRESİ — çoklu seçim, kademeli eşleşme */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-2">
            <label className="text-[11px] font-semibold uppercase tracking-wider text-gray-500">
              {t('prefs.colorLabel')}{' '}
              {hasColorFilter && (
                <span className="text-orange-400 ml-1">
                  {t('prefs.selectedCount', { count: themeColors.length })}
                </span>
              )}
            </label>
            {hasColorFilter && (
              <button
                onClick={clearColors}
                className="text-xs text-gray-500 hover:text-orange-400 transition-colors"
              >
                {t('prefs.clear')}
              </button>
            )}
          </div>
          <div className="flex gap-2 flex-wrap">
            {COLOR_CHIPS.map((c) => {
              const selected = themeColors.includes(c.id);
              return (
                <button
                  key={c.id}
                  onClick={() => toggleColor(c.id)}
                  title={t('prefs.colorTooltip')}
                  className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors flex items-center gap-1.5 ${
                    selected
                      ? 'bg-orange-500 text-white'
                      : 'bg-[var(--bg-tertiary)] text-gray-400 hover:text-white'
                  }`}
                >
                  <span
                    className="w-3 h-3 rounded-full border border-black/30 flex-shrink-0"
                    style={{ background: COLOR_SWATCH[c.id] ?? '#888' }}
                  />
                  {t(`colors.${c.id}`)}
                </button>
              );
            })}
          </div>
          {hasColorFilter && (
            <label className="flex items-center gap-2 mt-3 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={exactColorsOnly}
                onChange={() => {
                  setExactColorsOnly((v) => !v);
                  setGunOverrides({});
                  setKnifePick(null);
                  setGlovePick(null);
                }}
                className="w-3.5 h-3.5 accent-orange-500"
              />
              <span className="text-xs text-gray-400">
                {t('prefs.exactOnly')}
                <span className="text-gray-600 ml-1.5">
                  {t('prefs.exactOnlyHint')}
                </span>
              </span>
            </label>
          )}
        </div>

        {/* GELİŞMİŞ AYARLAR — katlanır bölüm (v12) */}
        <button
          onClick={() => setShowAdvanced((v) => !v)}
          className="text-xs text-gray-500 hover:text-orange-400 transition-colors flex items-center gap-1.5"
        >
          <span>
            {t('prefs.collectionsToggle')} {showAdvanced ? '▲' : '▼'}
          </span>
        </button>

        {showAdvanced && (
        <div className="mt-4">
        {/* KOLEKSİYONLAR — aile (desen) seçimi */}
        <div>
          <label className="text-sm text-gray-400 mb-2 block">
            {t('prefs.collectionsLabel')}
          </label>
          <input
            type="text"
            value={familyQuery}
            onChange={(e) => setFamilyQuery(e.target.value)}
            placeholder={t('prefs.collectionsPlaceholder')}
            className="w-full bg-[var(--bg-tertiary)] border border-gray-700 rounded-lg px-3 py-2 text-sm text-gray-200 outline-none focus:border-orange-500/50 mb-2"
          />
          <div className="flex gap-2 flex-wrap max-h-36 overflow-y-auto p-0.5">
            {filteredFamilies.map((f) => (
              <button
                key={f.family}
                onClick={() => setSelectedFamily(f.family)}
                title={t('prefs.collectionTitle', {
                  count: f.weaponCount,
                  price: f.minPrice.toFixed(0),
                })}
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
                {t('prefs.collectionsEmpty')}
              </span>
            )}
          </div>
          <p className="text-[11px] text-gray-600 mt-1.5">
            {t('prefs.collectionsHint')}
          </p>
        </div>
        </div>
        )}

        <div className="flex justify-end gap-2 mt-4">
          <button
            onClick={copyShareLink}
            className={`px-4 py-1.5 text-sm font-medium rounded-md transition-colors ${
              copied
                ? 'bg-green-600 text-white'
                : 'bg-[var(--bg-tertiary)] hover:bg-gray-700 text-white'
            }`}
          >
            {copied ? t('prefs.copied') : t('prefs.copyLink')}
          </button>
          <button
            onClick={regenerate}
            className="px-4 py-1.5 bg-[var(--bg-tertiary)] hover:bg-gray-700 text-white text-sm font-medium rounded-md transition-colors"
          >
            {t('prefs.regenerate')}
          </button>
        </div>
      </div>

      {/* ====== TOPLAM ====== */}
      <div className="bg-gradient-to-r from-orange-500/10 to-orange-600/5 border border-orange-500/30 rounded-xl p-5 mb-6 flex items-center justify-between flex-wrap gap-4">
        <div>
          <div className="text-xs text-gray-400 uppercase tracking-wider">
            {t('total.label')}
          </div>
          <div className="text-3xl font-bold mt-1">
            {totalPrice.toFixed(2)}€
            <span className="text-sm text-gray-500 font-normal ml-2">
              {t('total.ofBudget', { budget })}
            </span>
          </div>
        </div>
        <div className="text-right">
          <div className="text-xs text-gray-400 uppercase tracking-wider">
            {t('total.remaining')}
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
            {t('warnings.unmatched', { count: unmatchedSet.size })}
          </div>
          <div className="text-xs text-amber-200/80 mt-1">
            {t('warnings.unmatchedHint')}
          </div>
        </div>
      )}

      {nothingSelected ? (
        <div className="bg-[var(--bg-secondary)] border border-gray-800 rounded-xl p-8 text-center text-gray-400">
          {t('warnings.nothingSelected')}
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
                    allSkins={skinPool}
                    themeColors={themeColors}
                    exactColorsOnly={exactColorsOnly}
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
                  title={t('gallery.knife')}
                  icon=""
                  options={knifeOptions}
                  selected={effectiveKnife}
                  hasColorFilter={hasColorFilter}
                  onPick={(s) => setKnifePick(s)}
                  onRemove={() => setIncludeKnife(false)}
                />
              )}
              {includeGlove && (
                <SlotGallery
                  title={t('gallery.glove')}
                  icon=""
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
// WEAR SEÇİCİ (v16) — karttan kalite değiştirme
// ============================================================

/**
 * Skinin satışta olan wear seçeneklerini fiyatlarıyla çip olarak gösterir.
 * Tıklanınca skinin entry_price / entry_wear / entry_url alanları o wear'e
 * göre güncellenmiş bir kopyası onPick'e verilir — mevcut override/pick
 * mekanizmaları sayesinde toplam fiyat ve satın alma linki otomatik güncellenir.
 */
function WearPicker({
  skin,
  onPick,
}: {
  skin: Skin;
  onPick: (s: Skin) => void;
}) {
  const order = new Map<string, number>(WEAR_ORDER.map((w, i) => [w, i]));
  const avail = skin.wears
    .filter((w) => w.min_price > 0)
    .sort((a, b) => (order.get(a.wear) ?? 9) - (order.get(b.wear) ?? 9));

  // Tek seçenek varsa çip göstermeye gerek yok
  if (avail.length <= 1) {
    return (
      <div className="text-[10px] text-gray-500 mb-3">{skin.entry_wear}</div>
    );
  }

  return (
    <div className="flex gap-1 flex-wrap mb-3">
      {avail.map((w) => {
        const active = w.wear === skin.entry_wear;
        return (
          <button
            key={w.wear}
            title={w.wear}
            onClick={() =>
              !active &&
              onPick({
                ...skin,
                entry_price: w.min_price,
                entry_wear: w.wear,
                entry_url: w.url,
              })
            }
            className={`px-1.5 py-0.5 rounded text-[10px] font-medium transition-colors border ${
              active
                ? 'bg-orange-500/20 text-orange-300 border-orange-500/50'
                : 'bg-[var(--bg-tertiary)] text-gray-400 hover:text-white border-transparent'
            }`}
          >
            {WEAR_SHORT[w.wear]}{' '}
            <span className="opacity-70">
              {w.min_price >= 100
                ? w.min_price.toFixed(0)
                : w.min_price.toFixed(2)}
              €
            </span>
          </button>
        );
      })}
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
  /** v12: true → alternatiflerde de sadece tam renk eşleşmesi */
  exactColorsOnly: boolean;
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
  exactColorsOnly,
  isThemeUnmatched,
  isRelaxedMatch,
  isOverridden,
  onSwap,
  onIncreaseBudget,
  onReplaceCheaper,
  onRemove,
  onClearColors,
}: GunCardProps) {
  const t = useTranslations('card');
  const [showAlts, setShowAlts] = useState(false);
  const [showLookalikes, setShowLookalikes] = useState(false);

  const alternatives = useMemo(() => {
    if (!skin || !showAlts) return [];
    return findAlternatives(allSkins, skin, {
      themeColors,
      themeStyles: [],
      strictColor: exactColorsOnly ? true : 'auto',
      maxResults: 8,
    });
  }, [allSkins, skin, themeColors, exactColorsOnly, showAlts]);

  // v17: Ucuz Benzeri — görsel ikiz ama çok daha ucuz
  const lookalikes = useMemo(() => {
    if (!skin || !showLookalikes) return [];
    return findLookalikes(allSkins, skin);
  }, [allSkins, skin, showLookalikes]);

  // Renk yüzünden boş slot
  if (!skin && isThemeUnmatched) {
    return (
      <div className="bg-[var(--bg-secondary)] border border-amber-500/40 rounded-xl p-4 flex flex-col min-h-[260px]">
        <div className="text-[10px] uppercase tracking-wider text-gray-500 mb-3">
          {weaponName}
        </div>
        <div className="flex-1 flex flex-col items-center justify-center text-center py-4 px-2">
          <div className="text-sm font-semibold text-amber-300 mb-1">
            {t('noColorTitle', { weapon: weaponName })}
          </div>
          <div className="text-xs text-gray-400">{t('noColorHint')}</div>
        </div>
        <div className="flex flex-col gap-1.5 mt-3">
          <button
            onClick={onClearColors}
            className="w-full bg-amber-600 hover:bg-amber-500 text-white text-xs font-medium py-2 rounded-md transition-colors"
          >
            {t('clearColorFilter')}
          </button>
          <button
            onClick={onRemove}
            className="w-full bg-transparent hover:text-red-400 text-gray-500 text-[11px] py-1 transition-colors"
          >
            {t('removeFromLoadout')}
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
          <div className="text-sm font-semibold text-gray-200 mb-1">
            {t('budgetShort')}
          </div>
          <div className="text-xs text-gray-400">
            {t('cheapest', { weapon: weaponName })}{' '}
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
            {t('fitBudget')}
          </button>
          {cheaperAlt && (
            <button
              onClick={onReplaceCheaper}
              className="w-full bg-transparent hover:bg-[var(--bg-tertiary)] text-gray-300 hover:text-white text-xs py-2 rounded-md border border-gray-700 hover:border-gray-600 transition-colors"
            >
              {t('cheaper', { name: cheaperAlt })}
            </button>
          )}
          <button
            onClick={onRemove}
            className="w-full bg-transparent hover:text-red-400 text-gray-500 text-[11px] py-1 transition-colors"
          >
            {t('removeFromLoadout')}
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
              {t('manual')}
            </div>
          )}
          {isRelaxedMatch && !isOverridden && (
            <div
              className="text-[9px] text-sky-300 bg-sky-500/10 px-1.5 py-0.5 rounded font-medium"
              title={t('nearToneTitle')}
            >
              {t('nearTone')}
            </div>
          )}
          <button
            onClick={onRemove}
            className="text-gray-600 hover:text-red-400 text-sm leading-none"
            aria-label={t('remove', { weapon: weaponName })}
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
        <Link
          href={`/skin/${skinSlug(skin.name)}`}
          className="block text-sm font-semibold leading-tight mb-2 line-clamp-2 min-h-[2.5rem] hover:text-orange-400 transition-colors"
        >
          {skin.name}
        </Link>
        <WearPicker skin={skin} onPick={onSwap} />
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
          {t('buy')}
        </a>
      </div>

      <div className="flex gap-1 mt-1">
        <button
          onClick={() => {
            setShowAlts((v) => !v);
            setShowLookalikes(false);
          }}
          className="flex-1 text-xs text-gray-500 hover:text-orange-400 transition-colors text-center py-1"
        >
          {showAlts ? t('hideAlts') : t('showAlts')}
        </button>
        <button
          onClick={() => {
            setShowLookalikes((v) => !v);
            setShowAlts(false);
          }}
          className={`flex-1 text-xs transition-colors text-center py-1 ${
            showLookalikes
              ? 'text-emerald-300'
              : 'text-emerald-500/80 hover:text-emerald-300'
          }`}
        >
          {showLookalikes ? t('hideLookalikes') : t('lookalikes')}
        </button>
      </div>

      {showLookalikes && lookalikes.length > 0 && (
        <div className="mt-2 space-y-1 max-h-64 overflow-y-auto">
          {lookalikes.map(({ skin: alt, similarity, savingsPct }) => (
            <button
              key={alt.id}
              onClick={() => {
                onSwap(alt);
                setShowLookalikes(false);
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
                <div className="text-[10px] text-emerald-400">
                  {t('similarity', { pct: similarity })} · -{savingsPct}%
                </div>
              </div>
              <div className="text-xs font-bold text-orange-500 flex-shrink-0">
                {alt.entry_price.toFixed(2)}€
              </div>
            </button>
          ))}
        </div>
      )}

      {showLookalikes && lookalikes.length === 0 && (
        <div className="text-xs text-gray-600 mt-2 text-center py-3">
          {t('noLookalikes')}
        </div>
      )}

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
          {t('noAlts')}
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
  const t = useTranslations();
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
          {icon && <span>{icon}</span>}
          <span>{title}</span>
          <span className="text-xs text-gray-600 font-normal">
            {t('gallery.options', { count: options.length })}
          </span>
        </div>
        <button
          onClick={onRemove}
          className="text-gray-600 hover:text-red-400 text-xs"
        >
          {t('gallery.remove')}
        </button>
      </div>

      {options.length === 0 ? (
        <div className="text-center text-sm text-gray-400 py-8">
          {hasColorFilter
            ? t('gallery.emptyColor', { title })
            : t('gallery.empty', { title })}
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
              <div className="text-sm font-semibold leading-tight mb-1">
                {selected.name}
              </div>
              <WearPicker skin={selected} onPick={onPick} />
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
                  {t('card.buy')}
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
                {t('gallery.all')}
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
                {t('gallery.showing', {
                  shown: shown.length,
                  total: options.length,
                })}
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
  const t = useTranslations();
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
        {t('family.back')}
      </button>

      <div className="bg-gradient-to-r from-amber-500/10 to-amber-600/5 border border-amber-500/30 rounded-xl p-5 mb-6">
        <div className="text-xs text-amber-400/80 uppercase tracking-wider">
          {t('family.label')}
        </div>
        <div className="text-3xl font-bold mt-1">{family}</div>
        <div className="text-sm text-gray-400 mt-1">
          {t.rich('family.stats', {
            count: skins.length,
            min: minPrice.toFixed(2),
            total: totalAll.toFixed(0),
            orange: (chunks) => (
              <span className="text-orange-500 font-semibold">{chunks}</span>
            ),
            gray: (chunks) => (
              <span className="text-gray-300 font-semibold">{chunks}</span>
            ),
          })}
        </div>
        <div className="text-[11px] text-gray-600 mt-2">
          {t('family.hint')}
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
                  {t('card.buy')}
                </a>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
