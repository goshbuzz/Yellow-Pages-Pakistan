// Record quality — the checks that keep junk out of the directory.
//
// Every rule here exists because a real listing violated it:
//   • "Test", "xxxx", "12345" as a business name (placeholder rows pasted from a template)
//   • 0300-0000000 and 1234567890 as phone numbers
//   • a city of "Atlantis" silently becoming Karachi because unknown names fell back to
//     the first city in the list
//   • every unclassifiable business filed under "Textile Mills & Fabrics", because the
//     category guesser ended in `|| CATEGORIES[0]`
//
// These are shared by the importers, the custom-listing form and scripts/audit-listings.mjs,
// so a record refused on the way in is also refused when an existing corpus is audited.

const PLACEHOLDER_NAMES = /^(test|tests|testing|sample|demo|dummy|example|foo|bar|baz|xxx+|asdf+|qwerty|business|company|shop|store|hospital|clinic|n\/a|na|null|undefined|none|todo|tbd)$/i;
const PLACEHOLDER_PHONES = new Set([
  '0000000000', '00000000000',
  '1111111111', '11111111111',
  '1234567890', '12345678901',
  '9999999999', '99999999999',
  '1231231231',
  '03000000000', '03001234567', '03123456789', '03211234567',
]);

// Words that appear in dozens of category names (and in business names) and therefore prove
// nothing on their own. Without this, "Al-Madina Kiryana Store" matched
// "Clothing & Fashion Stores" on the word "store".
const GENERIC_WORDS = new Set([
  'services', 'service', 'general', 'other', 'trading', 'traders', 'company', 'group',
  'store', 'stores', 'shop', 'shops', 'centre', 'center', 'house', 'works', 'mart',
  'plaza', 'enterprise', 'enterprises', 'supply', 'supplies', 'dealers', 'dealer',
  // "agency" is a suffix, not a trade: without this, "Travel Agency" was filed under
  // HR & Recruitment Agencies because both names share the word.
  'agency', 'agencies', 'outlet', 'point',
]);

// Everyday Pakistani business words mapped onto the *word the taxonomy uses*. Only
// unambiguous, common terms belong here — this is a hint, never a silent re-categorisation.
const SYNONYMS = {
  kirana: 'grocery', karyana: 'grocery', kiryana: 'grocery', kariana: 'grocery',
  superstore: 'supermarket',
  // "Medical Store" is a pharmacy in Pakistan, but "Medicare Centre" is a clinic — they must
  // not share a stem, or every Medicare-something became a pharmacy.
  medicalstore: 'pharmacies', medical: 'pharmacies', 'medical-store': 'pharmacies',
  dispensary: 'pharmacies', pharmacy: 'pharmacies', chemist: 'pharmacies',
  medicare: 'hospitals',
  dhaba: 'restaurants', cafe: 'restaurants',
  madrasa: 'schools', madrassa: 'schools', academy: 'schools', tuition: 'academies',
  tailor: 'tailoring', darzi: 'tailoring',
  workshop: 'automobile', mechanic: 'automobile', puncture: 'automobile',
  hospital: 'hospitals', clinic: 'hospitals', maternity: 'hospitals',
  builder: 'builders', developer: 'builders', estate: 'real',
};

/** How many actual letters are in this string? Digits and punctuation do not count. */
export function letterCount(s) {
  return (String(s ?? '').match(/[A-Za-z\u0600-\u06FF]/g) || []).length;
}

/**
 * Is this a business name we are willing to publish?
 * Requires at least two letters (so "12345", "xx" and "" fail) and rejects the placeholder
 * words people leave in templates.
 */
export function isUsableName(name) {
  const n = String(name ?? '').trim();
  if (n.length < 2) return false;
  if (letterCount(n) < 2) return false;
  if (PLACEHOLDER_NAMES.test(n)) return false;
  // A single repeated character ("aaaa", "....") is filler, not a business.
  if (/^(.)\1+$/.test(n.replace(/\s+/g, ''))) return false;
  return true;
}

/** Known junk numbers plus the impossible cases. */
export function isPlaceholderPhone(phone) {
  const digits = String(phone ?? '').replace(/\D/g, '');
  if (!digits) return true;
  if (PLACEHOLDER_PHONES.has(digits)) return true;
  // All zeros / all ones / one digit repeated.
  if (/^(\d)\1+$/.test(digits)) return true;
  return false;
}

/**
 * Is this a number somebody could actually dial in Pakistan?
 *
 * Accepts mobiles (03xx-xxxxxxx), landlines with a city code (021-, 042-, 040-, 051-…) and
 * UANs (0xx-111-xxx-xxx), in local or international form. Rejects vanity letters
 * ("051-111-OGDCL-1"), too-short strings, and placeholders.
 *
 * The trunk 0 must be stripped before testing — `040-9200377` is a normal 10-digit number,
 * and a naive "must start with 1-9" test rejects every real Pakistani landline.
 */
export function isPlausiblePkPhone(phone) {
  const raw = String(phone ?? '').trim();
  if (!raw) return false;
  if (/[a-z]/i.test(raw)) return false;
  if (isPlaceholderPhone(raw)) return false;

  let d = raw.replace(/\D/g, '');
  if (d.startsWith('0092')) d = d.slice(4);
  else if (d.startsWith('92') && d.length > 11) d = d.slice(2);
  if (d.startsWith('0')) d = d.slice(1);

  // Mobiles are exactly 3 + 9 digits; landlines/UANs are 9–11 digits after the trunk 0.
  if (/^3\d{9}$/.test(d)) return true;
  return d.length >= 9 && d.length <= 11 && /^[1-9]/.test(d);
}

/** Levenshtein similarity in 0..1 (1 = identical). */
export function similarity(a, b) {
  const x = String(a || '').toLowerCase(), y = String(b || '').toLowerCase();
  if (!x || !y) return 0;
  if (x === y) return 1;
  const m = x.length, n = y.length;
  let prev = Array.from({ length: n + 1 }, (_, j) => j);
  for (let i = 1; i <= m; i++) {
    const cur = [i];
    for (let j = 1; j <= n; j++) {
      cur[j] = Math.min(prev[j] + 1, cur[j - 1] + 1, prev[j - 1] + (x[i - 1] === y[j - 1] ? 0 : 1));
    }
    prev = cur;
  }
  return 1 - prev[n] / Math.max(m, n);
}

/** Crude stem: the first four letters, which survives centre/center and medical/medicare. */
function stem(word) {
  return word.length >= 4 ? word.slice(0, 4) : word;
}

/**
 * Map free-text industry text onto one of the 130 categories.
 * Returns **null** when nothing scores — the caller drops the row. It used to fall back to
 * `CATEGORIES[0]`, which is "Textile Mills & Fabrics", so every unclassifiable business (a
 * hospital, a bakery, a law firm) was quietly published as a textile mill.
 */
export function matchCategoryByWords(categories, ...hints) {
  const hay = hints.filter(Boolean).join(' ').toLowerCase();
  if (!hay) return null;
  const rawWords = hay.split(/[^a-z]+/).filter((w) => w.length >= 3);
  // Apply the synonym map word by word ("kirana store" → "grocery store").
  const expanded = rawWords.flatMap((w) => (SYNONYMS[w] ? [w, ...SYNONYMS[w].split(' ')] : [w]));
  const hayStems = new Set(expanded.filter((w) => w.length >= 4 && !GENERIC_WORDS.has(w)).map(stem));

  // Rank candidates on three things, in this order:
  //   1. a near-exact head match (Pharmacy → Pharmacies) beats a longer stem match
  //      (Pharmaceuticals & Medicine), because the user's word clearly named that category;
  //   2. otherwise the stronger word evidence wins;
  //   3. then the closer text, then the more specific (shorter) head.
  const scoreOf = (c) => {
    const words = c.name.toLowerCase().split(/[^a-z]+/).filter((w) => w.length >= 4 && !GENERIC_WORDS.has(w));
    let words_score = 0;
    for (const w of words) if (hayStems.has(stem(w))) words_score += w.length;
    const head = words[0] || c.name.toLowerCase();
    return { words_score, head, sim: similarity(head, hay), headLen: head.length };
  };

  let best = null, bestScore = 0;
  for (const c of categories) {
    const cand = scoreOf(c);
    if (!cand.words_score) continue;
    if (!best) { best = c; bestScore = cand; continue; }
    // 0.68 acknowledges plurals: "pharmacies" vs "pharmacy" scores exactly 0.70.
    const nearNow = cand.sim >= 0.68, nearBest = bestScore.sim >= 0.68;
    let better;
    if (nearNow !== nearBest) better = nearNow;
    else if (cand.words_score !== bestScore.words_score) better = cand.words_score > bestScore.words_score;
    else if (cand.sim !== bestScore.sim) better = cand.sim > bestScore.sim;
    else better = cand.headLen < bestScore.headLen;
    if (better) { best = c; bestScore = cand; }
  }
  // One weak shared word is not evidence; two stems or one long word is.
  return bestScore && bestScore.words_score >= 6 ? best : null;
}

/**
 * Resolve a free-text city to one of the 420 known cities.
 * Returns null instead of guessing — "Atlantis" must not become Karachi.
 */
export function resolveCity(input, cities) {
  const raw = String(input ?? '').trim().toLowerCase();
  if (!raw) return null;
  const exact = cities.find((c) => c.name.toLowerCase() === raw);
  if (exact) return exact;
  // "sahiwal," / "Sahiwal " / "Sahiwal (Punjab)" — strip trailing punctuation/parenthetical.
  const cleaned = raw.replace(/\(.*?\)/g, '').replace(/[.,;]+$/g, '').trim();
  const second = cities.find((c) => c.name.toLowerCase() === cleaned);
  if (second) return second;
  return null;
}
