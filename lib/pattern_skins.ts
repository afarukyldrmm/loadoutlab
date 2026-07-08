// v10: Pattern (desen) skin tanımları
//
// CS2'de bazı skinler için "dominant renk" kavramı yetersiz:
//  - Doppler / Gamma Doppler: phase'e göre renk değişir (P1=mor, P2=mavi, P3=pembe, P4=turkuaz)
//  - Fade / Marble Fade: gradient — pembe + mor + turuncu birlikte
//  - Case Hardened: ahşap + mavi vurgu + altın metalik desen
//  - Hyper Beast: çoklu renkli "canavar" çizimi
//  - Tiger Tooth, Crimson Web, Slaughter, Lore, Damascus Steel vs.
//
// Çözüm: Bu skinleri hem dominant rengiyle renk filtresine sok
// (manuel override veya AI etiketi ne diyorsa), hem de pattern tipi tag'i ekle.
// Böylece kullanıcı "Doppler ailesi" sekmesinden de seçebilir,
// "mavi" filtresinde Doppler Sapphire da görebilir.

export type PatternType =
  | 'doppler'
  | 'gamma-doppler'
  | 'fade'
  | 'marble-fade'
  | 'case-hardened'
  | 'tiger-tooth'
  | 'crimson-web'
  | 'slaughter'
  | 'lore'
  | 'damascus-steel'
  | 'autotronic'
  | 'freehand'
  | 'bright-water'
  | 'safari-mesh'
  | 'rust-coat'
  | 'forest-ddpat'
  | 'urban-masked'
  | 'blue-steel'
  | 'stained'
  | 'night'
  | 'boreal-forest'
  | 'scorched';

export const PATTERN_LABELS: Record<PatternType, string> = {
  'doppler': 'Doppler',
  'gamma-doppler': 'Gamma Doppler',
  'fade': 'Fade',
  'marble-fade': 'Marble Fade',
  'case-hardened': 'Case Hardened',
  'tiger-tooth': 'Tiger Tooth',
  'crimson-web': 'Crimson Web',
  'slaughter': 'Slaughter',
  'lore': 'Lore',
  'damascus-steel': 'Damascus Steel',
  'autotronic': 'Autotronic',
  'freehand': 'Freehand',
  'bright-water': 'Bright Water',
  'safari-mesh': 'Safari Mesh',
  'rust-coat': 'Rust Coat',
  'forest-ddpat': 'Forest DDPAT',
  'urban-masked': 'Urban Masked',
  'blue-steel': 'Blue Steel',
  'stained': 'Stained',
  'night': 'Night',
  'boreal-forest': 'Boreal Forest',
  'scorched': 'Scorched',
};

/**
 * v11: Pattern ailelerinin BİLİNEN sabit renkleri (ilk renk = dominant).
 *
 * AI görsel analizi pattern skinlerde tutarsız (aynı pattern farklı bıçaklarda
 * farklı ilk renk alıyor). Oyun içi pattern görselleri sabittir, o yüzden
 * kural bazlı renk ataması AI'dan daha güvenilir.
 *
 * Öncelik sırası (getEffectiveTags): manuel override > PATTERN_COLOR_DEFAULTS > AI.
 * Yani AK-47 Case Hardened gibi istisnalar manuel override'da kalabilir.
 */
export const PATTERN_COLOR_DEFAULTS: Record<PatternType, string[]> = {
  'doppler': ['purple', 'blue', 'pink'],       // P1-P4 mor/mavi ağırlıklı
  'gamma-doppler': ['green', 'blue'],           // zümrüt yeşili fazlar
  'fade': ['pink', 'purple', 'yellow'],         // pembe→mor→sarı gradient
  'marble-fade': ['red', 'blue', 'yellow'],     // fire & ice
  'case-hardened': ['blue', 'gold'],            // mavi vurgu + altın metalik
  'tiger-tooth': ['gold', 'yellow'],
  'crimson-web': ['red', 'black'],
  'slaughter': ['red'],
  'lore': ['green', 'gold'],
  'damascus-steel': ['gray', 'black'],
  'autotronic': ['red', 'gray', 'black'],
  'freehand': ['blue', 'white'],
  'bright-water': ['blue', 'green'],
  'safari-mesh': ['brown', 'green'],
  'rust-coat': ['brown', 'orange'],
  'forest-ddpat': ['green', 'brown'],
  'urban-masked': ['gray', 'black'],
  'blue-steel': ['blue', 'gray'],
  'stained': ['gray', 'brown'],
  'night': ['black', 'blue'],
  'boreal-forest': ['green', 'brown'],
  'scorched': ['brown', 'gray', 'black'],
};

/**
 * Skin adından pattern tipini tespit eder.
 * Adda pattern kelimesi geçiyorsa o pattern tipini döner.
 * Sıralama önemli: "Gamma Doppler" "Doppler"'dan önce, "Marble Fade" "Fade"'den önce.
 */
export function detectPattern(skinName: string): PatternType | null {
  const lower = skinName.toLowerCase();

  // En spesifik ifadeler önce
  if (lower.includes('gamma doppler')) return 'gamma-doppler';
  if (lower.includes('marble fade')) return 'marble-fade';
  if (lower.includes('damascus steel')) return 'damascus-steel';
  if (lower.includes('bright water')) return 'bright-water';
  if (lower.includes('safari mesh')) return 'safari-mesh';
  if (lower.includes('rust coat')) return 'rust-coat';
  if (lower.includes('forest ddpat')) return 'forest-ddpat';
  if (lower.includes('urban masked')) return 'urban-masked';
  if (lower.includes('blue steel')) return 'blue-steel';
  if (lower.includes('boreal forest')) return 'boreal-forest';
  if (lower.includes('crimson web')) return 'crimson-web';
  if (lower.includes('tiger tooth')) return 'tiger-tooth';

  // Genel pattern kelimeleri
  if (lower.includes('doppler')) return 'doppler';
  if (lower.includes('fade')) return 'fade';
  if (lower.includes('case hardened')) return 'case-hardened';
  if (lower.includes('slaughter')) return 'slaughter';
  if (lower.includes('lore')) return 'lore';
  if (lower.includes('autotronic')) return 'autotronic';
  if (lower.includes('freehand')) return 'freehand';
  if (lower.includes('| stained')) return 'stained';
  if (lower.endsWith('| night')) return 'night';
  if (lower.includes('scorched')) return 'scorched';

  return null;
}

/**
 * Pattern tipindeki skinleri listeler (UI'da "Pattern" kategorisi için).
 */
export function filterByPattern<T extends { name: string }>(
  skins: T[],
  pattern: PatternType
): T[] {
  return skins.filter((s) => detectPattern(s.name) === pattern);
}

/**
 * Skin pattern mi (renk filtresinde özel davranır mı)?
 */
export function isPatternSkin(skinName: string): boolean {
  return detectPattern(skinName) !== null;
}
