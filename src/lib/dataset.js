// Dataset client — talks to the data worker; merges curated flagship profiles.

import { useEffect, useState } from 'react';
import { CURATED } from '../data/curated.js';
import { CITIES } from '../data/geo.js';
import { CATEGORY_BY_ID } from '../data/categories.js';
import { getCustomListings, getCustomListing, asResultRow, isCustomId } from './customListings.js';
import { validPkPoint } from './geovalidate.js';

let worker = null;
let readyResolvers = [];
let seq = 0;
const pending = new Map();

export const datasetState = { ready: false, total: 0, whatsappCapable: 0, ownerVerified: 0 };

function ensureWorker() {
  if (worker) return worker;
  worker = new Worker(new URL('./dataWorker.js', import.meta.url), { type: 'module' });
  worker.onmessage = (e) => {
    const { type, id } = e.data;
    if (type === 'ready') {
      datasetState.ready = true;
      datasetState.total = e.data.total;
      datasetState.whatsappCapable = e.data.whatsappCapable || 0;
      datasetState.ownerVerified = e.data.ownerVerified || 0;
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

// Search the imported listings, then merge curated flagship profiles on top.
export async function searchBusinesses({ q = '', cat = null, city = null, sort = 'relevance', page = 1, perPage = 12 }) {
  const res = await ask({ type: 'query', q, cat, city, sort, page, perPage: perPage + 4 });
  // Worker records are complete (real imported data) — attach the category object only.
  const generated = res.rows.map((r) => ({ ...r, cat: CATEGORY_BY_ID[r.catId] }));

  // Curated matches (flagship, verified) — shown first
  const ql = q.toLowerCase().trim();
  const cityLc = String(city || '').trim().toLowerCase();
  const curatedMatches = CURATED
    .map((c, idx) => ({ c, idx }))
    .filter(({ c }) => (!cat || CATEGORY_BY_ID[cat]?.name === catNameOf(c))
      && (!cityLc || c.city.toLowerCase() === cityLc)
      && (!ql || c.name.toLowerCase().includes(ql) || catNameOf(c).toLowerCase().includes(ql) || c.city.toLowerCase().includes(ql)))
    .map(({ c, idx }) => normalizeCurated(c, `c${idx}`));

  // The user's own custom listings are theirs to find: they match the same query text
  // and the same category/city filters, and are listed before anything imported.
  const customMatches = page === 1 ? matchCustom(q, cat, city) : [];

  let merged;
  if (page === 1) merged = [...customMatches, ...curatedMatches, ...generated];
  else merged = generated;
  const extra = (page === 1 ? curatedMatches.length + customMatches.length : 0);
  return {
    total: res.total + extra,
    page: res.page,
    rows: merged.slice(0, perPage),
    pages: Math.max(1, Math.ceil((res.total + extra) / perPage)),
  };
}

function catNameOf(c) { return CATEGORY_BY_ID[c.cat]?.name || ''; }

/** Filter the device's own custom listings with the same rules the worker uses. */
function matchCustom(q, cat, city) {
  const tokens = String(q || '').toLowerCase().split(/\s+/).filter(Boolean);
  const cityLc = String(city || '').trim().toLowerCase();
  return getCustomListings()
    .filter((r) => {
      if (cat != null && String(r.catId) !== String(cat)) return false;
      if (cityLc && r.city.toLowerCase() !== cityLc) return false;
      if (!tokens.length) return true;
      const hay = `${r.name} ${r.catName} ${r.city} ${r.area}`.toLowerCase();
      return tokens.every((t) => hay.includes(t));
    })
    .map(asResultRow);
}

/**
 * Curated rows carry no address/province/hours, so fill only what the city data proves.
 * Coordinates are passed through only when they are really in Pakistan: a pin that opens
 * in the wrong country is worse than no pin, so the map action is hidden instead.
 */
function normalizeCurated(c, id) {
  const cityRec = CITIES.find((x) => x.name === c.city);
  const located = validPkPoint(c.lat, c.lng);
  return {
    ...c,
    lat: located ? c.lat : null,
    lng: located ? c.lng : null,
    hasLocation: located,
    id,
    cat: CATEGORY_BY_ID[c.cat],
    province: c.province || cityRec?.province || '',
    address: c.address || [c.bldg, c.street, c.area, c.city].filter(Boolean).join(', '),
    hours: c.hours || null,
    verified: true,
    source: 'seed',
    __i: -1,
  };
}

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
  // A custom listing lives on this device, so it resolves without touching the worker.
  if (isCustomId(id)) {
    const r = getCustomListing(id);
    if (!r) return null;
    return { ...asResultRow(r), id };
  }
  if (id[0] === 'c') {
    const c = CURATED[+id.slice(1)];
    if (!c) return null;
    return normalizeCurated(c, id);
  }
  const row = await getGeneratedRow(+id.slice(1));
  if (!row) return null;
  return { ...row, cat: CATEGORY_BY_ID[row.catId], id };
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
