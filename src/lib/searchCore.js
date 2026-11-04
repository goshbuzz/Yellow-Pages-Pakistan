// Search core — the filter + ranking logic, with no dependency on a Worker.
//
// It lives outside dataWorker.js so it can be unit-tested against a synthetic index. Three
// bugs hid in here and were only caught by writing the tests:
//
//   1. The city filter matched the name case-sensitively, and an unknown name silently
//      became "no filter" — so `city=sahiwal` (lower case) returned *every* city's rows.
//   2. An unknown city produced the same behaviour: "Atlantis" returned the whole country.
//   3. Relevance only looked at the first term's position, so a row whose category matched
//      ("Hospitals & Medical Centers") could outrank one whose *name* actually matched.
//
// The rules now: a city filter always filters (zero rows if unknown); every search token
// must match; ranking prefers name matches over category/city matches.

/** Normalise a city name for comparison: trim + lower case. */
export function normaliseCity(city) {
  return String(city || '').trim().toLowerCase();
}

/**
 * Index the corpus once. Arrays are positional (index = row number) which keeps a
 * 100k-row corpus cheap to hold in a worker.
 */
export function buildIndex({ names = [], cats = [], cityIdxs = [], reviews = [], ratings = [], cityNames = [], catNames = {} }) {
  return {
    names,
    lnames: names.map((n) => String(n).toLowerCase()),
    cats,
    cityIdxs,
    reviews,
    ratings,
    total: names.length,
    cityLower: cityNames.map((n) => String(n).toLowerCase()),
    catLower: catNames,
  };
}

/**
 * @param index    from buildIndex()
 * @param params   { q, cat, city, sort, page, perPage }
 * @param recordAt (i) => full record
 */
export function runQuery(index, { q = '', cat = null, city = null, sort = 'relevance', page = 1, perPage = 12 } = {}, recordAt) {
  const { lnames, names, cats, cityIdxs, reviews, ratings, total, cityLower, catLower } = index;
  const tokens = String(q || '').toLowerCase().split(/\s+/).filter(Boolean);

  // City: forgiving about typing, strict about matching.
  const cityQuery = normaliseCity(city);
  let cityFilter = -1;
  if (cityQuery) {
    cityFilter = cityLower.indexOf(cityQuery);
    if (cityFilter < 0) {
      // Unknown city → no results. Returning everything would present other cities' rows as
      // if they were in the city the user asked for (the reported "Sahiwal" bug).
      return { total: 0, pages: 1, page, rows: [], cityUnknown: true };
    }
  }
  const catFilter = cat != null && cat !== '' ? +cat : -1;

  const matches = [];
  for (let i = 0; i < total; i++) {
    if (catFilter >= 0 && cats[i] !== catFilter) continue;
    if (cityFilter >= 0 && cityIdxs[i] !== cityFilter) continue;
    if (tokens.length) {
      const hay = `${lnames[i]} ${catLower[cats[i]] || ''} ${cityLower[cityIdxs[i]] || ''}`;
      let ok = true;
      for (const t of tokens) {
        if (!hay.includes(t)) { ok = false; break; }
      }
      if (!ok) continue;
    }
    matches.push(i);
  }

  if (sort === 'rating') matches.sort((a, b) => ratings[b] - ratings[a] || reviews[b] - reviews[a]);
  else if (sort === 'reviews') matches.sort((a, b) => reviews[b] - reviews[a]);
  else if (sort === 'name') matches.sort((a, b) => names[a].localeCompare(names[b]));
  else if (sort === 'relevance' && tokens.length) {
    const first = tokens[0];
    const scored = matches.map((i) => {
      const name = lnames[i];
      const allInName = tokens.every((t) => name.includes(t));
      const startsWith = name.startsWith(first) ? 2 : 0;
      const pos = name.indexOf(first);
      // Names that contain every term win; then prefix hits; then earlier hits.
      const score = (allInName ? 100 : 0) + startsWith - (pos < 0 ? 50 : Math.min(pos, 40));
      return { i, score };
    });
    scored.sort((a, b) => b.score - a.score || reviews[b.i] - reviews[a.i] || names[a.i].localeCompare(names[b.i]));
    matches.length = 0;
    for (const s of scored) matches.push(s.i);
  }

  const t = matches.length;
  const pages = Math.max(1, Math.ceil(t / perPage));
  const slice = matches.slice((page - 1) * perPage, page * perPage);
  return { total: t, pages, page, rows: recordAt ? slice.map(recordAt) : slice };
}
