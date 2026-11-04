// Data worker: loads the REAL listing corpus once (through the guarded serverless
// endpoint in production, or the file produced by `npm run stats`), indexes it, and
// answers queries (search / filter / sort / page) off the main thread.
//
// There is no generated fallback: if no dataset is configured the worker reports
// total = 0 and the app shows an honest empty state.

import { CATEGORIES, CATEGORY_BY_ID } from '../data/categories.js';
import { CITIES } from '../data/geo.js';
import { validPkPoint } from './geovalidate.js';
import { runQuery, buildIndex } from './searchCore.js';

// Guarded endpoint first (production); the dev file is the automatic fallback
// (local dev/preview). A VITE_DATA_URL override wins over both.

let names, lnames, cats, cityIdxs, areas, ratings, reviews, seeds, total = 0;
let phones2, ids, phones, whatsapps, sources, emails, websites, lats, lngs, hoursArr, addresses, provinces;
let header = null;
let cityLower, catLower;
let index = null;
// Live counts over the imported corpus — surfaced to the UI so category cards,
// stat tiles and city lists never disagree with what a search actually returns.
let byCat = {}, byCity = {}, byCityWa = {};

async function load() {
  const candidates = import.meta.env.VITE_DATA_URL
    ? [import.meta.env.VITE_DATA_URL, '/data/listings.txt']
    : ['/api/directory', '/data/listings.txt'];
  let text = null, lastErr = null;
  for (const url of candidates) {
    try {
      // App-internal marker header; the guarded endpoint rejects requests without it
      // `cache: 'no-cache'` forces revalidation: a cleaned corpus must not be served from
      // a heuristic HTTP cache for the rest of the session.
      const res = await fetch(url, { headers: { 'x-ypk-app': '1' }, cache: 'no-cache' });
      if (!res.ok) throw new Error(`status ${res.status}`);
      const t = await res.text();
      // Guard against SPA-fallback HTML (e.g. local preview) being mistaken for data
      if (!t.startsWith('{"v"')) throw new Error('unexpected payload');
      text = t;
      break;
    } catch (e) {
      lastErr = e;
    }
  }
  if (text == null) throw new Error(`dataset load failed: ${lastErr}`);
  const nl = text.indexOf('\n');
  header = JSON.parse(text.slice(0, nl));
  total = header.total || 0;
  byCat = {}; byCity = {}; byCityWa = {};
  if (!total) {
    cityLower = CITIES.map((c) => c.name.toLowerCase());
    return;
  }

  const lines = text.slice(nl + 1).split('\n');
  const n = lines.length;
  names = new Array(n); lnames = new Array(n);
  cats = new Uint16Array(n); cityIdxs = new Uint16Array(n);
  areas = new Array(n);
  seeds = new Uint32Array(n); ratings = new Float32Array(n); reviews = new Uint16Array(n);
  ids = new Array(n); phones2 = new Array(n); phones = new Array(n); whatsapps = new Uint8Array(n);
  sources = new Array(n); emails = new Array(n); websites = new Array(n);
  lats = new Float64Array(n); lngs = new Float64Array(n);
  hoursArr = new Array(n); addresses = new Array(n); provinces = new Array(n);

  for (let i = 0; i < n; i++) {
    const line = lines[i];
    if (!line) { total = i; break; }
    // name|catId|cityIdx|areaIdx|streetIdx|area|seed|id|phone|wa|source|email|website|lat|lng|rating|reviews|hours|area|address|province
    const f = line.split('|');
    names[i] = f[0];
    lnames[i] = f[0].toLowerCase();
    cats[i] = +f[1] || 0;
    cityIdxs[i] = +f[2] || 0;
    areas[i] = f[5] || '';
    seeds[i] = +f[6] || i + 1;
    ids[i] = f[7] || 'g' + i;
    phones[i] = f[8] || '';
    whatsapps[i] = f[9] === '1' ? 1 : 0;
    sources[i] = f[10] || 'dataset';
    emails[i] = f[11] || '';
    websites[i] = f[12] || '';
    lats[i] = +f[13] || 0;
    lngs[i] = +f[14] || 0;
    ratings[i] = +f[15] || 0;
    reviews[i] = +f[16] || 0;
    hoursArr[i] = f[17] || '';
    addresses[i] = f[19] || '';
    provinces[i] = f[20] || '';
    phones2[i] = f[21] || '';
  }
  cityLower = CITIES.map((c) => c.name.toLowerCase());
  catLower = {};
  for (const c of CATEGORIES) catLower[c.id] = c.name.toLowerCase();
  // Count the corpus as it was parsed: per category, per city, and how many of the
  // city's numbers are WhatsApp-capable (mobile 03xx lines).
  for (let i = 0; i < n; i++) {
    if (!names[i]) continue;
    const catId = cats[i];
    byCat[catId] = (byCat[catId] || 0) + 1;
    const cityName = CITIES[cityIdxs[i]]?.name;
    if (cityName) {
      byCity[cityName] = (byCity[cityName] || 0) + 1;
      if (whatsapps[i]) byCityWa[cityName] = (byCityWa[cityName] || 0) + 1;
    }
  }
  index = null; // rebuilt on the next query from the freshly loaded arrays
  lines.length = 0;
}

function query(q, cat, city, sort, page, perPage) {
  if (!index) {
    index = buildIndex({
      names, cats, cityIdxs, reviews, ratings,
      cityNames: CITIES.map((c) => c.name),
      catNames: catLower,
    });
  }
  // The filter/ranking rules live in searchCore.js so they can be tested directly.
  return runQuery(index, { q, cat, city, sort, page, perPage }, recordAt);
}

// A full record — nothing is derived here, so what the UI shows is what was imported.
// The one correction applied is a safety one: a coordinate outside Pakistan is reported as
// "no location" (null), because a map pin in Kenya is worse than no map pin at all.
function recordAt(i) {
  const located = validPkPoint(lats[i], lngs[i]);
  return {
    __i: i,
    bizId: ids[i],
    name: names[i],
    catId: cats[i],
    city: CITIES[cityIdxs[i]]?.name || '',
    province: provinces[i] || CITIES[cityIdxs[i]]?.province || '',
    area: areas[i],
    address: addresses[i],
    phone: phones[i],
    phone2: phones2[i] || null,
    whatsapp: whatsapps[i] === 1,
    source: sources[i],
    email: emails[i] || null,
    website: websites[i] || null,
    lat: located ? lats[i] : null,
    lng: located ? lngs[i] : null,
    hasLocation: located,
    rating: ratings[i] || null,
    reviews: reviews[i] || null,
    hours: hoursArr[i] || null,
  };
}

function getRow(idx) {
  if (idx < 0 || idx >= total) return null;
  return recordAt(idx);
}

self.onmessage = async (e) => {
  const { id, type } = e.data;
  if (type === 'load') {
    try {
      await load();
      self.postMessage({
        type: 'ready', total,
        whatsappCapable: header?.whatsappCapable ?? 0,
        ownerVerified: header?.ownerVerified ?? 0,
        byCat, byCity, byCityWa,
      });
    } catch (err) {
      self.postMessage({ type: 'error', message: String(err) });
    }
    return;
  }
  if (type === 'query') {
    const { q, cat, city, sort, page, perPage } = e.data;
    self.postMessage({ id, ...query(q, cat, city, sort, page, perPage) });
    return;
  }
  if (type === 'row') {
    self.postMessage({ id, row: getRow(e.data.idx) });
    return;
  }
  if (type === 'suggest') {
    const q = (e.data.q || '').toLowerCase().trim();
    const out = [];
    if (q.length >= 2) {
      for (let i = 0; i < total && out.length < 8; i += 3) {
        if (lnames[i].includes(q)) out.push(names[i]);
      }
    }
    self.postMessage({ id, suggestions: out });
  }
};
