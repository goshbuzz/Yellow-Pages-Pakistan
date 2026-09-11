// Data worker: loads the listing corpus once (through the guarded serverless
// endpoint in production, or the local dev file), indexes it in typed arrays,
// and answers queries (search / filter / sort / page) off the main thread.

import { CATEGORIES, CATEGORY_BY_ID } from '../data/categories.js';
import { CITIES } from '../data/geo.js';
import { mulberry32 } from '../lib/rng.js';

const DATA_URL = import.meta.env.VITE_DATA_URL || '/data/directory.txt';

let names, lnames, cats, cityIdxs, areas, streets, bldgs, seeds, ratings, reviews, total = 0;
let cityLower, catLower;

async function load() {
  // App-internal marker header; the production endpoint rejects requests without it
  const res = await fetch(DATA_URL, { headers: { 'x-ypk-app': '1' } });
  if (!res.ok) throw new Error(`dataset load failed: ${res.status}`);
  const text = await res.text();
  const nl = text.indexOf('\n');
  const header = JSON.parse(text.slice(0, nl));
  total = header.total;

  const lines = text.slice(nl + 1).split('\n');
  const n = lines.length;
  names = new Array(n);
  lnames = new Array(n);
  cats = new Uint16Array(n);
  cityIdxs = new Uint16Array(n);
  areas = new Uint8Array(n);
  streets = new Uint8Array(n);
  bldgs = new Array(n);
  seeds = new Uint32Array(n);
  ratings = new Float32Array(n);
  reviews = new Uint16Array(n);

  for (let i = 0; i < n; i++) {
    const line = lines[i];
    if (!line) continue;
    const p1 = line.indexOf('|'), p2 = line.indexOf('|', p1 + 1), p3 = line.indexOf('|', p2 + 1),
      p4 = line.indexOf('|', p3 + 1), p5 = line.indexOf('|', p4 + 1), p6 = line.indexOf('|', p5 + 1);
    names[i] = line.slice(0, p1);
    lnames[i] = names[i].toLowerCase();
    cats[i] = +line.slice(p1 + 1, p2);
    cityIdxs[i] = +line.slice(p2 + 1, p3);
    areas[i] = +line.slice(p3 + 1, p4);
    streets[i] = +line.slice(p4 + 1, p5);
    bldgs[i] = line.slice(p5 + 1, p6);
    const seed = +line.slice(p6 + 1);
    seeds[i] = seed;
    // cheap pre-derive of rating/reviews for sorting (same math as derive.js)
    const r = mulberry32(seed);
    r(); r(); // skip contact draws
    ratings[i] = +(3.3 + r() * 1.6).toFixed(1);
    reviews[i] = Math.floor(3 + r() * 1098);
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
  const rows = slice.map((i) => [names[i], cats[i], cityIdxs[i], areas[i], streets[i], bldgs[i], seeds[i], i]);
  return { total: t, pages, page, rows };
}

function getRow(idx) {
  if (idx < 0 || idx >= total) return null;
  return [names[idx], cats[idx], cityIdxs[idx], areas[idx], streets[idx], bldgs[idx], seeds[idx], idx];
}

self.onmessage = async (e) => {
  const { id, type } = e.data;
  if (type === 'load') {
    try {
      await load();
      self.postMessage({ type: 'ready', total });
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
