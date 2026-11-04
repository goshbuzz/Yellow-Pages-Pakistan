// Data worker: loads the REAL listing corpus once (through the guarded serverless
// endpoint in production, or the file produced by `npm run stats`), indexes it, and
// answers queries (search / filter / sort / page) off the main thread.
//
// There is no generated fallback: if no dataset is configured the worker reports
// total = 0 and the app shows an honest empty state.

import { CATEGORIES, CATEGORY_BY_ID } from '../data/categories.js';
import { CITIES } from '../data/geo.js';

// Guarded endpoint first (production); the dev file is the automatic fallback
// (local dev/preview). A VITE_DATA_URL override wins over both.

let names, lnames, cats, cityIdxs, areas, ratings, reviews, seeds, total = 0;
let ids, phones, whatsapps, sources, emails, websites, lats, lngs, hoursArr, addresses, provinces;
let header = null;
let cityLower, catLower;

async function load() {
  const candidates = import.meta.env.VITE_DATA_URL
    ? [import.meta.env.VITE_DATA_URL, '/data/listings.txt']
    : ['/api/directory', '/data/listings.txt'];
  let text = null, lastErr = null;
  for (const url of candidates) {
    try {
      // App-internal marker header; the guarded endpoint rejects requests without it
      const res = await fetch(url, { headers: { 'x-ypk-app': '1' } });
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
  const header = JSON.parse(text.slice(0, nl));
  total = header.total || 0;
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
  ids = new Array(n); phones = new Array(n); whatsapps = new Uint8Array(n);
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
  }
  cityLower = CITIES.map((c) => c.name.toLowerCase());
  catLower = {};
  for (const c of CATEGORIES) catLower[c.id] = c.name.toLowerCase();
  lines.length = 0;
}

function query(q, cat, city, sort, page, perPage) {
  const tokens = (q || '').toLowerCase().split(/\s+/).filter(Boolean);
  const cityFilter = city ? CITIES.findIndex((c) => c.name === city) : -1;
  const catFilter = cat ? +cat : -1;

  const matches = [];
  for (let i = 0; i < total; i++) {
    if (catFilter >= 0 && cats[i] !== catFilter) continue;
    if (cityFilter >= 0 && cityIdxs[i] !== cityFilter) continue;
    if (tokens.length) {
      const hay = lnames[i] + ' ' + catLower[cats[i]] + ' ' + cityLower[cityIdxs[i]];
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
    // exact prefix matches first, then substring position
    const first = tokens[0];
    matches.sort((a, b) => {
      const ai = lnames[a].indexOf(first), bi = lnames[b].indexOf(first);
      if (ai !== bi) return ai - bi;
      return reviews[b] - reviews[a];
    });
  }

  const t = matches.length;
  const pages = Math.max(1, Math.ceil(t / perPage));
  const slice = matches.slice((page - 1) * perPage, page * perPage);
  const rows = slice.map(recordAt);
  return { total: t, pages, page, rows };
}

// A full record — nothing is derived here, so what the UI shows is what was imported.
function recordAt(i) {
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
    whatsapp: whatsapps[i] === 1,
    source: sources[i],
    email: emails[i] || null,
    website: websites[i] || null,
    lat: lats[i],
    lng: lngs[i],
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
      self.postMessage({ type: 'ready', total, whatsappCapable: header?.whatsappCapable ?? 0, ownerVerified: header?.ownerVerified ?? 0 });
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
