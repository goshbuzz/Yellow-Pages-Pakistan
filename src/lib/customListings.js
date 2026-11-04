// Custom listings — businesses a user adds to *their own* directory.
//
// Two different things are easy to confuse, so they are separated here:
//
//   • "Add your business" (`/add`) is a *submission*: it goes to the review queue and is
//     not visible to anyone until an editor approves it.
//   • A custom listing (`/listings/new`) is *yours immediately*: it appears in your Browse
//     results, your Nearby list, your Lead Workspace and your CSV exports, on this device.
//
// That distinction matters for honesty. A custom listing is marked `source: 'custom'`
// everywhere it appears, so an exported CSV never claims a self-entered contact was
// imported or verified by the directory. Writes are validated through exactly the same
// rules as imported rows: a real name, a callable number, a real city, coordinates.
//
// Everything is stored in localStorage on the device — no account, no upload, no quota.

import { waNumber } from './whatsapp.js';
import { CITIES } from '../data/geo.js';
import { CATEGORIES, CATEGORY_BY_ID } from '../data/categories.js';
import { hashStr } from './rng.js';

const LS_CUSTOM = 'ypk.custom.v1';

/** Longest allowed field, so a paste accident cannot bloat storage. */
const LIMIT = {
  name: 90,
  phone: 24,
  area: 60,
  address: 160,
  hours: 80,
  desc: 600,
  email: 120,
  website: 160,
};

const clean = (v, max) => String(v ?? '').replace(/\s+/g, ' ').trim().slice(0, max);

function read() {
  try {
    const v = JSON.parse(localStorage.getItem(LS_CUSTOM));
    return Array.isArray(v) ? v : [];
  } catch {
    return [];
  }
}

function write(list) {
  try {
    localStorage.setItem(LS_CUSTOM, JSON.stringify(list));
    return true;
  } catch {
    return false; // quota / private mode — the caller surfaces this, never a silent loss
  }
}

/** Every custom listing, newest first. */
export function getCustomListings() {
  return read();
}

export function getCustomListing(id) {
  return read().find((r) => r.id === id) || null;
}

export function isCustomId(id) {
  return typeof id === 'string' && id.startsWith('u');
}

/**
 * Validate a draft the same way the importer validates a dataset row.
 * Returns `{ ok, errors, record }` — errors is a field→message map for inline display,
 * so the form can point at the offending input instead of failing silently.
 */
export function validateCustomListing(draft, { existing = read(), editingId = null } = {}) {
  const errors = {};
  const name = clean(draft.name, LIMIT.name);
  const phone = clean(draft.phone, LIMIT.phone);
  const city = CITIES.some((c) => c.name === draft.city) ? draft.city : '';
  const catId = CATEGORY_BY_ID[+draft.cat] ? +draft.cat : null;

  if (name.length < 2) errors.name = 'Enter the business name (at least 2 letters).';
  if (!phone) errors.phone = 'A phone number is required — every listing must be callable.';
  else if (phone.replace(/\D/g, '').length < 9) errors.phone = 'That number looks too short.';
  if (!city) errors.city = 'Pick the city this business is in.';
  if (!catId) errors.cat = 'Pick a category.';

  const digits = phone.replace(/\D/g, '');
  if (digits) {
    const clash = existing.find(
      (r) => r.id !== editingId && r.phone && r.phone.replace(/\D/g, '') === digits
    );
    if (clash) errors.phone = `This number is already used by “${clash.name}” in your listings.`;
  }

  const dup = existing.find(
    (r) => r.id !== editingId && r.name.trim().toLowerCase() === name.toLowerCase() && r.city === city
  );
  if (dup && name && city) errors.name = `“${name}” already exists in ${city} in your listings.`;

  // Optional coordinates: both or neither, and must be inside Pakistan's envelope.
  const hasLat = draft.lat != null && draft.lat !== '';
  const hasLng = draft.lng != null && draft.lng !== '';
  let lat = null, lng = null;
  if (hasLat || hasLng) {
    const la = Number(draft.lat), ln = Number(draft.lng);
    const inPK = Number.isFinite(la) && Number.isFinite(ln) && la > 23 && la < 38 && ln > 60 && ln < 78;
    if (!inPK) errors.location = 'Coordinates must both be filled and inside Pakistan (lat 24–37, lng 61–77).';
    else { lat = +la.toFixed(6); lng = +ln.toFixed(6); }
  }

  const ok = Object.keys(errors).length === 0;
  if (!ok) return { ok, errors, record: null };

  const cat = CATEGORY_BY_ID[catId];
  // A custom listing is only WhatsApp-capable on a mobile number, exactly like imported
  // rows — and the "on WhatsApp" claim is the user's own, so it stays separate from that.
  const mobile = !!waNumber(phone);
  const record = {
    id: editingId || `u${hashStr(`${name.toLowerCase()}|${city.toLowerCase()}|${Date.now()}`).toString(36)}`,
    name,
    catId,
    catName: cat.name,
    catEmoji: cat.emoji,
    city,
    area: clean(draft.area, LIMIT.area) || city,
    address: clean(draft.address, LIMIT.address) || `${clean(draft.area, LIMIT.area) || city}, ${city}`,
    phone,
    whatsapp: !!draft.whatsapp && mobile,
    whatsappCapable: mobile,
    email: clean(draft.email, LIMIT.email) || null,
    website: clean(draft.website, LIMIT.website) || null,
    hours: clean(draft.hours, LIMIT.hours) || null,
    desc: clean(draft.desc, LIMIT.desc) || null,
    lat,
    lng,
    rating: null,
    reviews: null,
    source: 'custom',
    sourceRef: 'custom:this-device',
    createdAt: draft.createdAt || Date.now(),
    updatedAt: Date.now(),
  };
  return { ok, errors, record };
}

/** Create or update. Returns `{ ok, record, errors }`; never throws. */
export function saveCustomListing(draft, { editingId = null } = {}) {
  const existing = read();
  const v = validateCustomListing(draft, { existing, editingId });
  if (!v.ok) return { ok: false, record: null, errors: v.errors };

  const next = editingId
    ? existing.map((r) => (r.id === editingId ? { ...v.record, createdAt: r.createdAt } : r))
    : [v.record, ...existing];

  if (!write(next)) {
    return { ok: false, record: null, errors: { _: 'Device storage is full or blocked — could not save.' }, quota: true };
  }
  return { ok: true, record: v.record, errors: {} };
}

export function deleteCustomListing(id) {
  const list = read();
  const next = list.filter((r) => r.id !== id);
  write(next);
  return next.length !== list.length;
}

/**
 * Map an imported category string onto one of the 130 categories.
 * Exact match first, then prefix, then a unique substring — so "Pharmacy" finds
 * "Pharmacies & Medical Stores" without guessing between near-duplicates.
 */
export function matchCategory(input) {
  const norm = (x) => String(x || '').toLowerCase().replace(/[^a-z0-9]/g, '');
  const wanted = norm(input);
  if (!wanted) return null;
  if (/^\d+$/.test(wanted) && CATEGORY_BY_ID[+wanted]) return CATEGORY_BY_ID[+wanted];
  const exact = CATEGORIES.find((c) => norm(c.name) === wanted);
  if (exact) return exact;
  const prefixed = CATEGORIES.filter((c) => norm(c.name).startsWith(wanted));
  if (prefixed.length === 1) return prefixed[0];
  const contained = CATEGORIES.filter((c) => norm(c.name).includes(wanted));
  if (contained.length === 1) return contained[0];

  // Fuzzy fallback: "Pharmacy" should reach "Pharmacies & Medical Stores" even though two
  // categories share the prefix. Score the term against the whole name and each word.
  let best = null, bestScore = 0.62;
  for (const c of CATEGORIES) {
    const words = c.name.toLowerCase().split(/[^a-z0-9]+/).filter(Boolean);
    for (const w of [norm(c.name), ...words]) {
      const score = similarity(wanted, w);
      if (score > bestScore) { bestScore = score; best = c; }
    }
  }
  return best;
}

/** Normalised Levenshtein similarity, 1 = identical. */
function similarity(a, b) {
  if (!a || !b) return 0;
  if (a === b) return 1;
  const m = a.length, n = b.length;
  let prev = Array.from({ length: n + 1 }, (_, j) => j);
  for (let i = 1; i <= m; i++) {
    const cur = [i];
    for (let j = 1; j <= n; j++) {
      cur[j] = Math.min(prev[j] + 1, cur[j - 1] + 1, prev[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
    }
    prev = cur;
  }
  return 1 - prev[n] / Math.max(m, n);
}

/** Suggest categories as the user types in the import/new-listing form. */
export function suggestCategories(term, limit = 6) {
  const t = String(term || '').toLowerCase().trim();
  if (!t) return [];
  return CATEGORIES.filter((c) => c.name.toLowerCase().includes(t)).slice(0, limit);
}

/** Shape a custom record like a search result row, so every existing component accepts it. */
export function asResultRow(r) {
  return {
    ...r,
    bizId: r.id,
    cat: CATEGORY_BY_ID[r.catId],
    province: CITIES.find((c) => c.name === r.city)?.province || '',
    verified: false,
    __i: -1,
    isCustom: true,
  };
}

/** Import helper: turn rows from a CSV/JSON file into validated drafts. */
export function parseCustomImport(text) {
  const trimmed = String(text || '').trim();
  if (!trimmed) return { rows: [], error: 'The file is empty.' };

  const pick = (o, keys) => {
    for (const k of keys) {
      const hit = Object.keys(o).find((x) => x.toLowerCase().replace(/[^a-z]/g, '') === k);
      if (hit && String(o[hit] ?? '').trim()) return String(o[hit]).trim();
    }
    return '';
  };

  const toDraft = (o) => ({
    name: pick(o, ['name', 'businessname', 'company', 'companyname', 'business']),
    phone: pick(o, ['phone', 'tel', 'telephone', 'mobile', 'number', 'phonenumber', 'contact']),
    city: pick(o, ['city', 'town', 'location']),
    // Resolved below: the category name is matched against the 130-category list.
  cat: '',
    catName: pick(o, ['category', 'cat', 'industry', 'sector', 'type']),
    area: pick(o, ['area', 'neighbourhood', 'neighborhood', 'locality', 'market']),
    address: pick(o, ['address', 'street', 'fulladdress']),
    email: pick(o, ['email', 'mail']),
    website: pick(o, ['website', 'url', 'site']),
    hours: pick(o, ['hours', 'openinghours', 'timing', 'timings']),
    lat: pick(o, ['lat', 'latitude']),
    lng: pick(o, ['lng', 'lon', 'long', 'longitude']),
  });

  let raw = [];
  try {
    if (trimmed.startsWith('[') || trimmed.startsWith('{')) {
      const parsed = JSON.parse(trimmed);
      raw = Array.isArray(parsed) ? parsed : parsed.listings || parsed.rows || [];
    } else {
      const lines = trimmed.split(/\r?\n/).filter((l) => l.trim());
      const splitRow = (line) => {
        const out = [];
        let cur = '', inQ = false;
        for (let i = 0; i < line.length; i++) {
          const ch = line[i];
          if (ch === '"') {
            if (inQ && line[i + 1] === '"') { cur += '"'; i++; } else inQ = !inQ;
          } else if (ch === ',' && !inQ) { out.push(cur); cur = ''; } else cur += ch;
        }
        out.push(cur);
        return out;
      };
      const head = splitRow(lines[0]).map((h) => h.trim());
      raw = lines.slice(1).map((line) => {
        const cells = splitRow(line);
        return Object.fromEntries(head.map((h, i) => [h, cells[i] ?? '']));
      });
    }
  } catch {
    return { rows: [], error: 'Could not read that file — expected CSV with a header row, or a JSON array.' };
  }

  if (!raw.length) return { rows: [], error: 'No rows found in that file.' };

  const rows = raw.map((o) => {
    const d = toDraft(o);
    // Match "Textile Wholesaler", "textile-wholesaler" or "129" against the 130 categories.
    const cat = matchCategory(d.catName) || matchCategory(d.name);
    d.cat = cat ? cat.id : '';
    const city = CITIES.find((c) => c.name.toLowerCase() === d.city.toLowerCase());
    d.city = city?.name || d.city;
    return d;
  });

  return { rows, error: null };
}

/**
 * Merge custom listings into a page of search results.
 * Result `total` is adjusted too, so "N results" on Browse stays truthful.
 */
export function mergeCustomResults(results, customRows) {
  const mine = customRows.map(asResultRow);
  return {
    ...results,
    rows: [...mine, ...results.rows],
    total: results.total + mine.length,
  };
}

/** Counts for the dashboard: how many custom listings there are. */
export function customCount() {
  return read().length;
}
