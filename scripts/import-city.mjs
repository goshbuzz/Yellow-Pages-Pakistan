// Per-city import — fills the directory one city at a time, from sources we are licensed
// to store, and reports exactly what each city ended up with (listings · phones · WhatsApp).
//
// WHY NOT GOOGLE: Google Maps Platform ToS §3.2.3 forbids exporting, extracting or scraping
// Google Maps Content, forbids caching it beyond 30 days (place IDs excepted), and forbids
// using it to build a substitute directory — which is precisely what this app is. So this
// script does not touch Google. It uses datasets whose licences allow storage and reuse:
//
//   --source=fsq        Foursquare OS Places  · Apache-2.0 · has `tel`, `email`, `website`,
//                       `date_closed` (so closed businesses are dropped, not published)
//   --source=overture   Overture Maps places  · CDLA Permissive 2.0 · has `phones`
//   --source=csv        anything you own or licensed (registry, association, vendor export)
//
// Examples
//   node scripts/import-city.mjs --city=Karachi --source=fsq
//   node scripts/import-city.mjs --city=Sahiwal --source=fsq --radius=15
//   node scripts/import-city.mjs --all --source=fsq --min-city-pop=1000000
//   node scripts/import-city.mjs --city=Karachi --source=fsq --from=/tmp/karachi.parquet
//   node scripts/import-city.mjs --report
//
// Every record is checked before it is accepted: it must have a real name, a usable phone
// number, a location inside the city's radius, and must not duplicate an existing listing or
// recycle another business's number.

import { execFileSync } from 'node:child_process';
import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'node:fs';
import { dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { CITIES } from '../src/data/geo.js';
import { CATEGORIES } from '../src/data/categories.js';
import { waNumber } from '../src/lib/whatsapp.js';
import { hashStr } from '../src/lib/rng.js';

const ROOT = dirname(dirname(fileURLToPath(import.meta.url)));
const LISTINGS = `${ROOT}/public/data/listings.json`;
const COVERAGE = `${ROOT}/public/data/coverage.json`;

const args = Object.fromEntries(
  process.argv.slice(2).map((a) => {
    const [k, ...rest] = a.replace(/^--/, '').split('=');
    return [k, rest.join('=') || true];
  })
);

const FSQ_RELEASE = args.release || '2026-09-15';
const OVERTURE_RELEASE = args.release || '2026-10-21.0';
const RADIUS_KM = Number(args.radius || 12);
const MAX_PER_CITY = Number(args.limit || 5000);
const MIN_POP = Number(args['min-city-pop'] || 0);

const log = (m) => console.log(m);
const warn = (m) => console.warn('  ! ' + m);

// ── City resolution ─────────────────────────────────────────────────────────

function resolveCity(name) {
  const q = String(name).toLowerCase().trim();
  const exact = CITIES.find((c) => c.name.toLowerCase() === q);
  if (exact) return exact;
  const partial = CITIES.filter((c) => c.name.toLowerCase().includes(q));
  if (partial.length === 1) return partial[0];
  if (partial.length > 1) {
    throw new Error(`"${name}" matches ${partial.length} cities: ${partial.slice(0, 8).map((c) => c.name).join(', ')}…`);
  }
  throw new Error(`unknown city "${name}". Try one of: Karachi, Lahore, Islamabad, Faisalabad, Sahiwal…`);
}

/** Bounding box around a city centre, in degrees (1° lat ≈ 111 km). */
function bboxFor(city, radiusKm) {
  const dLat = radiusKm / 111;
  const dLng = radiusKm / (111 * Math.cos((city.lat * Math.PI) / 180));
  return {
    xmin: +(city.lng - dLng).toFixed(6),
    ymin: +(city.lat - dLat).toFixed(6),
    xmax: +(city.lng + dLng).toFixed(6),
    ymax: +(city.lat + dLat).toFixed(6),
  };
}

function haversineKm(lat1, lng1, lat2, lng2) {
  const R = 6371, toRad = (d) => (d * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1), dLng = toRad(lng2 - lng1);
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(a));
}

// ── Category mapping ────────────────────────────────────────────────────────

function guessCategory(...hints) {
  const hay = hints.filter(Boolean).join(' ').toLowerCase();
  if (!hay) return CATEGORIES[0];
  let best = null, bestScore = 0;
  for (const c of CATEGORIES) {
    const words = c.name.toLowerCase().split(/[^a-z]+/).filter((w) => w.length > 3);
    let score = 0;
    for (const w of words) if (hay.includes(w)) score += w.length;
    if (score > bestScore) { bestScore = score; best = c; }
  }
  return best || CATEGORIES[0];
}

// ── Source fetching ─────────────────────────────────────────────────────────

function duckdbJson(sql, label) {
  // duckdb prints JSON on stdout; -json keeps it machine readable.
  const out = execFileSync('duckdb', ['-json', '-c', sql], { encoding: 'utf8', maxBuffer: 1024 * 1024 * 512 });
  try {
    return JSON.parse(out || '[]');
  } catch {
    throw new Error(`could not parse duckdb output for ${label}`);
  }
}

function fetchFsq(city, box) {
  const src = args.from || `s3://fsq-os-places-us-east-1/release/dt=${FSQ_RELEASE}/places/parquet/places-*.snappy.parquet`;
  const sql = `
    INSTALL httpfs; LOAD httpfs;
    SELECT fsq_place_id AS id, name, latitude AS lat, longitude AS lng,
           address, locality, region, tel AS phone, website, email,
           fsq_category_labels AS categories, date_closed, date_refreshed
    FROM read_parquet('${src}')
    WHERE latitude BETWEEN ${box.ymin} AND ${box.ymax}
      AND longitude BETWEEN ${box.xmin} AND ${box.xmax}
      AND tel IS NOT NULL
      AND date_closed IS NULL
    LIMIT ${MAX_PER_CITY * 3};`;
  return duckdbJson(sql, 'foursquare').map((r) => ({
    id: `fsq:${r.id}`,
    name: r.name,
    phone: r.phone,
    website: r.website,
    email: r.email,
    lat: r.lat,
    lng: r.lng,
    address: r.address,
    area: r.locality,
    categoryHints: Array.isArray(r.categories) ? r.categories.join(' ') : '',
    attribution: 'Foursquare Open Source Places — Apache-2.0',
    capturedAt: r.date_refreshed || new Date().toISOString().slice(0, 10),
  }));
}

function fetchOverture(city, box) {
  const src = args.from || `s3://overturemaps-us-west-2/release/${OVERTURE_RELEASE}/theme=places/*/*`;
  const sql = `
    INSTALL spatial; LOAD spatial;
    INSTALL httpfs; LOAD httpfs;
    SET s3_region='us-west-2';
    SELECT id, names.primary AS name, ST_Y(geometry) AS lat, ST_X(geometry) AS lng,
           addresses[1].freeform AS address, addresses[1].locality AS locality,
           phones, websites, emails, basic_category AS category, taxonomy
    FROM read_parquet('${src}')
    WHERE bbox.xmin BETWEEN ${box.xmin} AND ${box.xmax}
      AND bbox.ymin BETWEEN ${box.ymin} AND ${box.ymax}
      AND phones IS NOT NULL
    LIMIT ${MAX_PER_CITY * 3};`;
  return duckdbJson(sql, 'overture').map((r) => ({
    id: `overture:${r.id}`,
    name: r.name,
    phone: Array.isArray(r.phones) ? (r.phones[0]?.value || r.phones[0]) : null,
    website: Array.isArray(r.websites) ? (r.websites[0]?.value || r.websites[0]) : null,
    email: Array.isArray(r.emails) ? (r.emails[0]?.value || r.emails[0]) : null,
    lat: r.lat,
    lng: r.lng,
    address: r.address,
    area: r.locality,
    categoryHints: r.category || '',
    attribution: 'Overture Maps Foundation — CDLA Permissive 2.0',
    capturedAt: new Date().toISOString().slice(0, 10),
  }));
}

/** A file you downloaded or were licensed: .parquet via duckdb, .csv/.json parsed here. */
function fetchLocal(file) {
  if (!file) throw new Error('--from is required for --source=file');
  if (/\.parquet$/i.test(file)) {
    const rows = duckdbJson(`SELECT * FROM read_parquet('${file}') LIMIT ${MAX_PER_CITY * 3};`, 'parquet');
    return rows.map((r, i) => ({
      id: r.fsq_place_id ? `fsq:${r.fsq_place_id}` : r.id ? `file:${r.id}` : `file:${hashStr(file + i)}`,
      name: r.name,
      phone: r.tel || r.phone || r.telephone,
      website: r.website,
      email: r.email,
      lat: r.latitude ?? r.lat,
      lng: r.longitude ?? r.lng ?? r.lon,
      address: r.address,
      area: r.locality || r.area,
      categoryHints: Array.isArray(r.fsq_category_labels) ? r.fsq_category_labels.join(' ') : r.category || '',
      attribution: args.attribution || 'local file',
      capturedAt: new Date().toISOString().slice(0, 10),
    }));
  }
  const text = readFileSync(file, 'utf8');
  const rows = file.endsWith('.json') ? JSON.parse(text) : parseCsv(text).slice(1).map((r, i, all) => {
    const head = parseCsv(text)[0];
    const o = {};
    head.forEach((h, j) => { o[h.trim().toLowerCase()] = r[j]; });
    return o;
  });
  return rows.map((r, i) => ({
    id: r.id ? `file:${r.id}` : `file:${hashStr(file + i)}`,
    name: r.name || r['business name'],
    phone: r.tel || r.phone || r.telephone || r.mobile,
    website: r.website,
    email: r.email,
    lat: +(r.latitude ?? r.lat),
    lng: +(r.longitude ?? r.lng ?? r.lon),
    address: r.address,
    area: r.locality || r.area,
    categoryHints: r.category || '',
    attribution: args.attribution || 'local file',
    capturedAt: new Date().toISOString().slice(0, 10),
  }));
}

function parseCsv(text) {
  const rows = []; let row = [], f = '', q = false;
  text = text.replace(/^\uFEFF/, '');
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (q) {
      if (ch === '"' && text[i + 1] === '"') { f += '"'; i++; }
      else if (ch === '"') q = false;
      else f += ch;
    } else if (ch === '"') q = true;
    else if (ch === ',') { row.push(f); f = ''; }
    else if (ch === '\n') { row.push(f); rows.push(row); row = []; f = ''; }
    else if (ch !== '\r') f += ch;
  }
  if (f || row.length) { row.push(f); rows.push(row); }
  return rows.filter((r) => r.some((c) => c.trim() !== ''));
}

// ── Validation & merge ──────────────────────────────────────────────────────

const normName = (s) => String(s || '').toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
const normPhone = (p) => String(p || '').replace(/\D/g, '').slice(-10);

function loadListings() {
  if (!existsSync(LISTINGS)) return { records: [] };
  return JSON.parse(readFileSync(LISTINGS, 'utf8'));
}

function loadCoverage() {
  if (!existsSync(COVERAGE)) return { cities: {} };
  return JSON.parse(readFileSync(COVERAGE, 'utf8'));
}

/**
 * Accept or reject one raw record. Returns { record } or { skip: reason }.
 * Every rejection is counted so the run reports why a city came up short.
 */
function validate(raw, city, existing, seenPhones, radiusKm) {
  const name = String(raw.name || '').trim();
  if (!name || name.length < 2) return { skip: 'no name' };
  if (!raw.phone) return { skip: 'no phone' };

  const mobile = waNumber(raw.phone);
  const digits = normPhone(raw.phone);
  // A phone must be a plausible PK number: mobile (3xxxxxxxxx) or landline (0xx…).
  if (!mobile && !/^[1-9]\d{8,10}$/.test(digits)) return { skip: 'unusable phone' };

  const lat = Number(raw.lat), lng = Number(raw.lng);
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return { skip: 'no location' };
  const dist = haversineKm(city.lat, city.lng, lat, lng);
  if (dist > radiusKm) return { skip: 'outside city radius' };

  const key = `${normName(name)}|${city.name.toLowerCase()}`;
  if (existing.nameKeys.has(key)) return { skip: 'duplicate name in city' };

  // Never hand a real business's number to a different business in the same city.
  if (digits && existing.phones.get(digits) && existing.phones.get(digits) !== normName(name)) {
    return { skip: 'number already used by another business' };
  }

  const cat = guessCategory(raw.categoryHints, name, city.name);
  return {
    record: {
      id: raw.id,
      name,
      cat: cat.id,
      city: city.name,
      province: city.province,
      area: raw.area || city.name,
      address: raw.address || `${city.name}, ${city.province}`,
      phone: String(raw.phone).trim(),
      // WhatsApp is only ever claimed for a mobile number; presence itself stays unverified.
      whatsapp: false,
      whatsappCapable: !!mobile,
      email: raw.email || null,
      website: raw.website || null,
      lat: +lat.toFixed(6),
      lng: +lng.toFixed(6),
      source: 'dataset',
      sourceRef: raw.id,
      attribution: raw.attribution || null,
      capturedAt: raw.capturedAt || null,
      importedAt: new Date().toISOString(),
    },
  };
}

function indexExisting(records) {
  const nameKeys = new Set();
  const phones = new Map();
  for (const r of records) {
    nameKeys.add(`${normName(r.name)}|${String(r.city).toLowerCase()}`);
    const d = normPhone(r.phone);
    if (d && !phones.has(d)) phones.set(d, normName(r.name));
  }
  return { nameKeys, phones };
}

// ── Report ──────────────────────────────────────────────────────────────────

function report() {
  const { records } = loadListings();
  const coverage = loadCoverage();
  const byCity = new Map();
  for (const r of records) {
    const c = byCity.get(r.city) || { total: 0, mobile: 0, landline: 0, owner: 0, located: 0 };
    c.total++;
    if (waNumber(r.phone)) c.mobile++;
    else if (r.phone) c.landline++;
    if (r.ownerVerified) c.owner++;
    if (Number.isFinite(r.lat) && r.lat !== 0) c.located++;
    byCity.set(r.city, c);
  }

  const rows = [...byCity.entries()].sort((a, b) => b[1].total - a[1].total);
  const covered = rows.length;
  const empty = CITIES.length - covered;

  log(`\nCITY COVERAGE — ${records.length.toLocaleString()} listings across ${covered} of ${CITIES.length} cities`);
  log(`${'city'.padEnd(18)} ${'listings'.padStart(9)} ${'located'.padStart(8)} ${'mobile'.padStart(7)} ${'WA %'.padStart(6)} ${'owner'.padStart(6)}  last import`);
  log('-'.repeat(78));
  for (const [city, c] of rows.slice(0, Number(args.top || 40))) {
    const pct = c.total ? ((c.mobile / c.total) * 100).toFixed(0) + '%' : '—';
    const last = coverage.cities[city]?.lastImportAt?.slice(0, 10) || '—';
    log(`${city.padEnd(18)} ${String(c.total).padStart(9)} ${String(c.located).padStart(8)} ${String(c.mobile).padStart(7)} ${pct.padStart(6)} ${String(c.owner).padStart(6)}  ${last}`);
  }
  if (rows.length > Number(args.top || 40)) log(`… ${rows.length - Number(args.top || 40)} more cities`);

  const withMobile = records.filter((r) => waNumber(r.phone)).length;
  const located = records.filter((r) => Number.isFinite(r.lat) && r.lat !== 0).length;
  log('-'.repeat(78));
  log(`total ${records.length.toLocaleString()} · with map location ${located.toLocaleString()} · WhatsApp-capable ${withMobile.toLocaleString()} (${records.length ? ((withMobile / records.length) * 100).toFixed(1) : 0}%) · owner verified ${records.filter((r) => r.ownerVerified).length}`);
  log(`${empty} cities still have no listings — run: node scripts/import-city.mjs --city="<name>" --source=fsq\n`);

  if (args.json) writeFileSync(args.json, JSON.stringify({ generatedAt: new Date().toISOString(), cities: Object.fromEntries(rows), emptyCities: empty }, null, 2));
  return 0;
}

// ── Main ────────────────────────────────────────────────────────────────────

if (args.report) {
  process.exit(report());
}

const SOURCE = args.source || 'fsq';
const targets = args.all
  ? CITIES.filter((c) => (c.population || 0) >= MIN_POP).sort((a, b) => (b.population || 0) - (a.population || 0))
  : [resolveCity(args.city)];

if (!args.all && !args.city) {
  console.error('usage: node scripts/import-city.mjs --city=Karachi --source=fsq|overture|csv');
  console.error('       node scripts/import-city.mjs --all --source=fsq --min-city-pop=1000000');
  console.error('       node scripts/import-city.mjs --report');
  process.exit(2);
}

const data = loadListings();
const coverage = loadCoverage();
const before = data.records.length;
const summary = [];

for (const city of targets) {
  const box = bboxFor(city, RADIUS_KM);
  let raw = [];
  try {
    if (args.from || SOURCE === 'file') raw = fetchLocal(args.from);
    else if (SOURCE === 'fsq') raw = fetchFsq(city, box);
    else if (SOURCE === 'overture') raw = fetchOverture(city, box);
    else throw new Error(`unknown --source=${SOURCE}`);
  } catch (e) {
    warn(`${city.name}: ${e.message}`);
    summary.push({ city: city.name, added: 0, error: e.message });
    continue;
  }

  const existing = indexExisting(data.records);
  const skips = {};
  let added = 0;

  for (const r of raw) {
    const res = validate(r, city, existing, null, RADIUS_KM);
    if (res.skip) { skips[res.skip] = (skips[res.skip] || 0) + 1; continue; }
    if (added >= MAX_PER_CITY) { skips['per-city limit'] = (skips['per-city limit'] || 0) + 1; continue; }
    // keep the in-memory index current so later rows in this batch cannot duplicate
    existing.nameKeys.add(`${normName(res.record.name)}|${city.name.toLowerCase()}`);
    const d = normPhone(res.record.phone);
    if (d) existing.phones.set(d, normName(res.record.name));
    data.records.push(res.record);
    added++;
  }

  const withPhone = raw.length;
  const mobile = data.records.filter((r) => r.city === city.name && waNumber(r.phone)).length;
  coverage.cities[city.name] = {
    lastImportAt: new Date().toISOString(),
    source: SOURCE,
    fetched: withPhone,
    added,
    total: data.records.filter((r) => r.city === city.name).length,
    whatsappCapable: mobile,
    attribution: raw[0]?.attribution || null,
  };

  const skipTxt = Object.entries(skips).map(([k, v]) => `${v} ${k}`).join(' · ') || 'none';
  log(`${city.name.padEnd(16)} fetched ${String(raw.length).padStart(5)} → added ${String(added).padStart(5)} · city total ${coverage.cities[city.name].total} · WA-capable ${mobile} · rejected: ${skipTxt}`);
  summary.push({ city: city.name, added, total: coverage.cities[city.name].total });
}

mkdirSync(dirname(LISTINGS), { recursive: true });
writeFileSync(LISTINGS, JSON.stringify({ ...data, updatedAt: new Date().toISOString() }, null, 0));
writeFileSync(COVERAGE, JSON.stringify({ ...coverage, updatedAt: new Date().toISOString() }, null, 2));

log(`\nlistings: ${before.toLocaleString()} → ${data.records.length.toLocaleString()} (+${data.records.length - before})`);
log('next: node scripts/stats.mjs   (rebuild the runtime payload + counts)');
