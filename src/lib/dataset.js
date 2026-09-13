// Dataset client — talks to the data worker; merges curated flagship profiles.

import { useEffect, useState } from 'react';
import { CURATED } from '../data/curated.js';
import { CITIES } from '../data/geo.js';
import { CATEGORY_BY_ID } from '../data/categories.js';
import { derive } from './derive.js';

let worker = null;
let readyResolvers = [];
let seq = 0;
const pending = new Map();

export const datasetState = { ready: false, total: 0 };

function ensureWorker() {
  if (worker) return worker;
  worker = new Worker(new URL('./dataWorker.js', import.meta.url), { type: 'module' });
  worker.onmessage = (e) => {
    const { type, id } = e.data;
    if (type === 'ready') {
      datasetState.ready = true;
      datasetState.total = e.data.total;
      readyResolvers.forEach((r) => r());
      readyResolvers = [];
      return;
    }
    if (type === 'error') {
      datasetState.error = e.data.message;
      readyResolvers.forEach((r) => r());
      readyResolvers = [];
      return;
    }
    const cb = pending.get(id);
    if (cb) { pending.delete(id); cb(e.data); }
  };
  worker.postMessage({ type: 'load' });
  return worker;
}

export function useDataset() {
  const [state, setState] = useState({ ready: datasetState.ready, total: datasetState.total, error: datasetState.error });
  useEffect(() => {
    if (datasetState.ready || datasetState.error) { setState({ ...datasetState }); return; }
    ensureWorker();
    const resolver = () => setState({ ...datasetState });
    readyResolvers.push(resolver);
    return () => { readyResolvers = readyResolvers.filter((r) => r !== resolver); };
  }, []);
  return state;
}

function ask(payload) {
  return new Promise((resolve) => {
    ensureWorker();
    const id = ++seq;
    pending.set(id, resolve);
    worker.postMessage({ id, ...payload });
  });
}

// Search/filter generated listings + merge curated matches on top.
export async function searchBusinesses({ q = '', cat = null, city = null, sort = 'relevance', page = 1, perPage = 12, verified = false }) {
  // Curated matches (flagship, verified) — shown first
  const ql = q.toLowerCase().trim();
  const curatedMatches = CURATED
    .filter((c) => (!cat || CATEGORY_BY_ID[cat]?.name === catNameOf(c)) && (!city || c.city === city) &&
      (!ql || c.name.toLowerCase().includes(ql) || catNameOf(c).toLowerCase().includes(ql) || c.city.toLowerCase().includes(ql)))
    .map((c) => ({ ...c, id: 'c' + CURATED.indexOf(c), bizId: 'c' + CURATED.indexOf(c), cat: CATEGORY_BY_ID[c.cat], verified: true, __i: -1 }));

  // "Flagship verified" mode — curated profiles only, no generated listings.
  if (verified) {
    let rows = curatedMatches;
    if (sort === 'rating') rows = [...rows].sort((a, b) => (b.rating - a.rating) || (b.reviews - a.reviews));
    else if (sort === 'reviews') rows = [...rows].sort((a, b) => b.reviews - a.reviews);
    else if (sort === 'name') rows = [...rows].sort((a, b) => a.name.localeCompare(b.name));
    return { total: rows.length, page, rows: rows.slice((page - 1) * perPage, page * perPage), pages: Math.max(1, Math.ceil(rows.length / perPage)) };
  }

  const res = await ask({ type: 'query', q, cat, city, sort, page, perPage: perPage + 4 });
  const generated = res.rows.map((r) => ({ __i: r[7], ...derive(r) }));

  let merged;
  if (page === 1) merged = [...curatedMatches, ...generated];
  else merged = generated;
  return { total: res.total + curatedMatches.length, page: res.page, rows: merged.slice(0, perPage), pages: Math.max(1, Math.ceil((res.total + curatedMatches.length) / perPage)) };
}

function catNameOf(c) { return CATEGORY_BY_ID[c.cat]?.name || ''; }

export async function getGeneratedRow(idx) {
  const res = await ask({ type: 'row', idx });
  return res.row;
}

export async function suggest(q) {
  if (!q || q.trim().length < 2) return [];
  const res = await ask({ type: 'suggest', q });
  return res.suggestions || [];
}

// Detail by id: "g123" (generated row index) or "c12" (curated index)
export async function getBusiness(id) {
  if (id[0] === 'c') {
    const c = CURATED[+id.slice(1)];
    if (!c) return null;
    return { ...c, cat: CATEGORY_BY_ID[c.cat], verified: true, __i: -1, id };
  }
  const row = await getGeneratedRow(+id.slice(1));
  if (!row) return null;
  return { ...derive(row), __i: row[7], id };
}

export function businessId(b) {
  if (b.__i === -1 || b.__i === undefined) return b.id || 'c0';
  return 'g' + b.__i;
}

export function nearestCity(lat, lng) {
  let best = null, bestD = Infinity;
  for (const c of CITIES) {
    const d = (c.lat - lat) ** 2 + (c.lng - lng) ** 2;
    if (d < bestD) { bestD = d; best = c; }
  }
  return best;
}
