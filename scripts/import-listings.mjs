// Import real businesses into the directory.
//
// The app ships with NO listings and no generator: this script is the only way records
// enter the directory.
//
//   node scripts/import-listings.mjs --source=overture --bbox=24.7,66.7,25.1,67.2 --out=public/data/real-karachi.json
//   node scripts/import-listings.mjs --source=csv --in=companies.csv --out=public/data/real-companies.json
//   node scripts/import-listings.mjs --source=csv --in=secp.csv --dry-run
//
// `--source=overture` queries the Overture Maps places dataset (CDLA Permissive 2.0,
// attribution required, free) for businesses inside a bounding box. DuckDB does the
// filtering because the global Parquet corpus is far too big to download.
//
// `--source=csv` maps an official/licensed CSV (SECP register, PSX companies, a data
// vendor export, owner submissions) onto the internal record shape. Column names are
// auto-detected; override with --map name=BusinessName,phone=Telephone,…
//
// Every emitted record carries `source` + `sourceRef` so the UI and CSV export can be
// honest about how far the data is trusted. Records without a usable phone number are
// dropped and counted, never silently invented.
//
//   --allow-missing-phone   keep registry rows (SECP/PSX registers) that have no phone
//                           on record. Off by default: a listing without a number is not
//                           a lead. Kept rows carry an empty phone, and the UI shows
//                           "No phone on record" instead of Call/WhatsApp buttons.

import { execFileSync } from 'node:child_process';
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { dirname } from 'node:path';
import { CITIES } from '../src/data/geo.js';
import { CATEGORIES } from '../src/data/categories.js';
import { waNumber } from '../src/lib/whatsapp.js';
import { hashStr } from '../src/lib/rng.js';
import { validPkPoint, cityForPoint, haversineKm } from '../src/lib/geovalidate.js';
import { isUsableName, isPlaceholderPhone, isPlausiblePkPhone, resolveCity, matchCategoryByWords } from '../src/lib/quality.js';

const args = Object.fromEntries(
  process.argv.slice(2).map((a) => {
    const [k, ...rest] = a.replace(/^--/, '').split('=');
    return [k, rest.join('=') || true];
  })
);

const OUT = args.out || 'public/data/listings.json';
const DRY = !!args['dry-run'];
const SOURCE = args.source || 'csv';
const ALLOW_MISSING_PHONE = !!args['allow-missing-phone'];

const OVERTURE_RELEASE = args.release || '2026-10-21.0';

const warn = (m) => console.warn('  ! ' + m);
const log = (m) => console.log('  ' + m);

// ── Shared helpers ──────────────────────────────────────────────────────────

/**
 * Nearest known city (the app already ships 420 real coordinates) — but only if the point
 * is actually in Pakistan and genuinely near that city. Returns null otherwise: assigning a
 * foreign point to "the closest Pakistani town" is how a Nairobi hospital once ended up
 * listed as a Sahiwal one.
 */
function nearestCity(lat, lng, maxKm = 120) {
  return cityForPoint(+lat, +lng, CITIES, maxKm);
}

/** Map a free-text industry onto one of the 130 categories (null = unclassifiable). */
function guessCategory(...hints) {
  return matchCategoryByWords(CATEGORIES, ...hints);
}

/**
 * Overture `phones` is an array of {value}. Keep the first that is a usable PK number.
 * International format (+92…) is normalised; landlines are kept (call-only) but flagged.
 */
function pickPhone(phones) {
  if (!Array.isArray(phones)) return { phone: null, whatsappCapable: false };
  for (const p of phones) {
    const raw = typeof p === 'string' ? p : p?.value;
    if (!raw) continue;
    const cleaned = String(raw).replace(/\s+/g, ' ').trim();
    if (waNumber(cleaned)) return { phone: cleaned, whatsappCapable: true };
    // Pakistani landline: +92 21 … / 042 … / 051 …
    if (/^(?:\+?92|0)\s?\(?\d{2,3}\)?[\s-]?\d{6,8}$/.test(cleaned.replace(/[()]/g, ''))) {
      return { phone: cleaned, whatsappCapable: false };
    }
  }
  return { phone: null, whatsappCapable: false };
}

// ── Source: Overture Maps places ────────────────────────────────────────────

function readOverture() {
  const bbox = args.bbox;
  if (!bbox) throw new Error('--bbox=xmin,ymin,xmax,ymax is required for --source=overture');
  const [xmin, ymin, xmax, ymax] = bbox.split(',').map(Number);
  if ([xmin, ymin, xmax, ymax].some((n) => !Number.isFinite(n))) throw new Error('bad --bbox');

  const sql = `
    INSTALL spatial; LOAD spatial;
    INSTALL httpfs; LOAD httpfs;
    SET s3_region='us-west-2';
    COPY (
      SELECT id, names.primary AS name, basic_category, taxonomy, confidence,
             phones, websites, emails, socials,
             addresses[1].freeform AS address, addresses[1].locality AS locality,
             ST_Y(geometry) AS lat, ST_X(geometry) AS lng, sources
      FROM read_parquet('s3://overturemaps-us-west-2/release/${OVERTURE_RELEASE}/theme=places/*/*')
      WHERE bbox.xmin BETWEEN ${xmin} AND ${xmax}
        AND bbox.ymin BETWEEN ${ymin} AND ${ymax}
        AND phones IS NOT NULL
    ) TO '${args.raw || '/tmp/overture-pk.parquet'}' (FORMAT PARQUET);
  `;
  log(`querying Overture ${OVERTURE_RELEASE} inside bbox ${bbox}…`);
  execFileSync('duckdb', ['-c', sql], { stdio: 'inherit' });

  const rows = JSON.parse(
    execFileSync('duckdb', ['-json', '-c', `SELECT * FROM '${args.raw || '/tmp/overture-pk.parquet'}'`], { encoding: 'utf8' })
  );
  return rows.map((r) => {
    const { phone, whatsappCapable } = pickPhone(r.phones);
    if (!phone) return null;
    // The bbox normally guarantees this, but a bad row must never become a "Sahiwal"
    // listing whose pin opens in Nairobi.
    if (!validPkPoint(r.lat, r.lng)) return null;
    const city = nearestCity(+r.lat, +r.lng);
    if (!city) return null; // >120 km from any known city: not attributable to one
    const cat = guessCategory(r.basic_category, r.name, city.name);
    if (!cat) return null; // no category evidence → drop, rather than mislabel it
    return {
      name: (r.name || '').trim(),
      cat: cat.id,
      city: city.name,
      province: city.province,
      area: r.locality || city.name,
      address: r.address || `${city.name}, ${city.province}`,
      phone,
      // Overture phones are sourced from the business, but never verified as WhatsApp.
      whatsapp: false,
      whatsappCapable,
      website: Array.isArray(r.websites) ? r.websites[0]?.value || null : null,
      email: Array.isArray(r.emails) ? r.emails[0]?.value || null : null,
      lat: +r.lat,
      lng: +r.lng,
      source: 'dataset',
      sourceRef: `overture:${r.id}`,
      attribution: 'Overture Maps Foundation — CDLA Permissive 2.0',
    };
  }).filter(Boolean);
}

// ── Source: CSV / XLSX export (SECP, PSX, vendor, owner submissions) ────────

// Tiny CSV reader: handles quoted fields, embedded commas and newlines.
function parseCsv(text) {
  const rows = [];
  let row = [], field = '', inQ = false;
  text = text.replace(/^\uFEFF/, '');
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (inQ) {
      if (ch === '"' && text[i + 1] === '"') { field += '"'; i++; }
      else if (ch === '"') inQ = false;
      else field += ch;
    } else if (ch === '"') inQ = true;
    else if (ch === ',') { row.push(field); field = ''; }
    else if (ch === '\n') { row.push(field); rows.push(row); row = []; field = ''; }
    else if (ch !== '\r') field += ch;
  }
  if (field || row.length) { row.push(field); rows.push(row); }
  return rows.filter((r) => r.some((c) => c.trim() !== ''));
}

const FIELD_ALIASES = {
  name: ['name', 'business name', 'company name', 'company', 'entity', 'title', 'name of company', 'business'],
  phone: ['phone', 'telephone', 'mobile', 'contact', 'contact no', 'phone number', 'contact number', 'tel', 'cell'],
  whatsapp: ['whatsapp', 'wa', 'whatsapp number', 'is whatsapp'],
  email: ['email', 'e-mail', 'email address'],
  website: ['website', 'url', 'web', 'site'],
  city: ['city', 'town', 'district'],
  address: ['address', 'location', 'full address'],
  category: ['category', 'industry', 'sector', 'business type', 'type', 'nature of business'],
  ntn: ['ntn', 'national tax number', 'tax number', 'registration no', 'reg no'],
  lat: ['lat', 'latitude'],
  lng: ['lng', 'lon', 'longitude'],
};

function detectColumns(header) {
  const map = {};
  const lower = header.map((h) => h.trim().toLowerCase());
  for (const [field, aliases] of Object.entries(FIELD_ALIASES)) {
    const idx = lower.findIndex((h) => aliases.includes(h));
    if (idx >= 0) map[field] = idx;
  }
  if (args.map) {
    for (const pair of String(args.map).split(',')) {
      const [field, col] = pair.split('=');
      const idx = lower.indexOf(String(col).toLowerCase());
      if (idx >= 0) map[field] = idx;
      else warn(`--map ${pair}: column "${col}" not found`);
    }
  }
  return map;
}

function readCsv() {
  if (!args.in) throw new Error('--in=file.csv is required for --source=csv');
  if (/\.xlsx?$/i.test(args.in)) {
    throw new Error('.xlsx: convert first, e.g.  duckdb -c "COPY (SELECT * FROM read_xlsx(\'file.xlsx\')) TO \'file.csv\' (HEADER)"');
  }
  const rows = parseCsv(readFileSync(args.in, 'utf8'));
  if (!rows.length) return [];
  const header = rows[0];
  const col = detectColumns(header);
  if (col.name == null) throw new Error(`no name column found in: ${header.join(' | ')}`);
  if (col.phone == null) warn(ALLOW_MISSING_PHONE
    ? 'no phone column — rows kept because --allow-missing-phone is set'
    : 'no phone column — records will be dropped (a listing without a number is not a lead)');

  return rows.slice(1).map((r) => {
    const get = (f) => (col[f] != null ? (r[col[f]] || '').trim() : '');
    const name = get('name');
    const phone = get('phone');
    // Missing phone is only acceptable for opt-in registry imports (--allow-missing-phone).
    if (!name) return null;
    if (!phone && !ALLOW_MISSING_PHONE) return null;

    // Junk in → junk out is not acceptable: a placeholder name or an impossible number is
    // dropped here, with the reason, instead of being published and audited later.
    if (!isUsableName(name)) {
      warn(`dropped "${name}": not a usable business name`);
      return null;
    }
    if (phone && isPlaceholderPhone(phone)) {
      warn(`dropped "${name}": placeholder phone "${phone}"`);
      return null;
    }
    if (phone && !isPlausiblePkPhone(phone)) {
      warn(`dropped "${name}": "${phone}" is not a dialable Pakistani number`);
      return null;
    }

    // Unknown city → skip the row. (It used to fall back to CITIES[0], which silently
    // turned every unattributable record into a Karachi business.)
    const cityName = get('city');
    const city = resolveCity(cityName, CITIES);
    if (!city) {
      warn(`dropped "${name}": unknown city "${cityName}"`);
      return null;
    }

    const cat = guessCategory(get('category'), name, city.name);
    if (!cat) {
      warn(`dropped "${name}": could not classify "${get('category') || 'no category'}" into one of the 130 categories`);
      return null;
    }
    const waFlag = /^(y|yes|true|1|whatsapp)$/i.test(get('whatsapp'));
    const capable = !!waNumber(phone);

    // Coordinates, in order of trust:
    //   1. explicit lat/lng in the file → must be inside Pakistan and near the stated city
    //   2. none                         → no pin at all (the Map button hides itself)
    // We never invent a pin. A wrong pin sends people to the wrong street — or country.
    let lat = null, lng = null;
    const rawLat = get('lat'), rawLng = get('lng');
    if (rawLat || rawLng) {
      const la = Number(rawLat), ln = Number(rawLng);
      if (!validPkPoint(la, ln)) {
        warn(`dropped "${name}": coordinates ${rawLat},${rawLng} are not in Pakistan`);
        return null;
      }
      if (haversineKm(city.lat, city.lng, la, ln) > 120) {
        warn(`dropped "${name}": pin is ${Math.round(haversineKm(city.lat, city.lng, la, ln))} km from ${city.name}`);
        return null;
      }
      lat = +la.toFixed(6);
      lng = +ln.toFixed(6);
    }
    return {
      name,
      cat: cat.id,
      city: city.name,
      province: city.province,
      area: city.name,
      address: get('address') || `${city.name}, ${city.province}`,
      phone,
      // Only claim WhatsApp when the number can actually receive it.
      whatsapp: capable && waFlag,
      whatsappCapable: capable,
      email: get('email') || null,
      website: get('website') || null,
      ntn: get('ntn') || null,
      lat,
      lng,
      source: args.as || 'dataset',
      sourceRef: get('ntn') ? `${args.as || 'registry'}:${get('ntn')}` : null,
      attribution: args.attribution || null,
    };
  }).filter(Boolean);
}

// ── Main ────────────────────────────────────────────────────────────────────

const collected = SOURCE === 'overture' ? readOverture() : readCsv();

// Stable, human-traceable id so a listing URL keeps working across re-imports.
// Prefer the registry reference; otherwise a hash of name+city (same entity, same id).
for (const r of collected) {
  if (r.id) continue;
  if (r.sourceRef) r.id = `i${hashStr(r.sourceRef).toString(36)}`;
  else r.id = `i${hashStr(`${r.name.toLowerCase()}|${r.city.toLowerCase()}`).toString(36)}`;
}

// Deduplicate on name+city, and drop rows whose number is already used by another entity
// (shared switchboards are fine to keep — flag them instead of silently deleting leads).
// --merge appends to an existing --out file (each import keeps its own attribution);
// without it the file is replaced, so accidental double-imports cannot double listings.
function dedupeKey(name, city) {
  const norm = String(name || '')
    .toLowerCase()
    .replace(/&/g, ' and ')
    .replace(/\b(pvt|private)\b\.?/g, 'private')
    .replace(/\b(ltd|limite|limited)\b\.?/g, 'limited')
    .replace(/\bco\b\.?/g, 'company')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
  return `${norm}|${String(city || '').toLowerCase().trim()}`;
}

function isGenericAddress(r) {
  const a = String(r.address || '').trim().toLowerCase();
  const c = String(r.city || '').trim().toLowerCase();
  const p = String(r.province || '').trim().toLowerCase();
  return !a || a === `${c}, pakistan` || a === `${c}, ${p}`;
}

let existing = [];
if (args.merge) {
  try { existing = JSON.parse(readFileSync(OUT, 'utf8')).records || []; } catch { existing = []; }
}
const seen = new Map(existing.map((r) => [dedupeKey(r.name, r.city), r]));
const unique = [];
let dupes = 0;
let enriched = 0;
for (const r of collected) {
  const key = dedupeKey(r.name, r.city);
  if (seen.has(key)) {
    const prev = seen.get(key);
    let updated = false;
    if (!prev.phone && r.phone) {
      prev.phone = r.phone;
      prev.whatsappCapable = r.whatsappCapable;
      prev.whatsapp = r.whatsapp;
      updated = true;
    }
    if (!isGenericAddress(r) && isGenericAddress(prev)) {
      prev.address = r.address;
      updated = true;
    }
    if (updated) enriched++;
    dupes++;
    continue;
  }
  seen.set(key, r);
  unique.push(r);
}

const withWa = unique.filter((r) => r.whatsappCapable).length;
const whatsappConfirmed = unique.filter((r) => r.whatsapp).length;

console.log(`\nimport: ${SOURCE}`);
log(`records collected   : ${collected.length}`);
log(`duplicates removed  : ${dupes}`);
if (enriched) log(`existing enriched   : ${enriched}`);
log(`kept                : ${unique.length}`);
log(`WhatsApp-capable    : ${withWa} (${((withWa / (unique.length || 1)) * 100).toFixed(1)}%)`);
log(`WhatsApp confirmed  : ${whatsappConfirmed}`);
if (SOURCE === 'overture') {
  log('WhatsApp confirmed  : 0 — Overture has no WhatsApp attribute, so none is claimed.');
}

if (DRY) {
  console.log('\n--dry-run: first 3 records\n' + JSON.stringify(unique.slice(0, 3), null, 2));
} else {
  mkdirSync(dirname(OUT), { recursive: true });
  const records = [...existing, ...unique];
  // File-level attribution lists every source that contributed records (a merged file
  // would otherwise only name the last import).
  const attributions = [...new Set(records.map((r) => r.attribution).filter(Boolean))];
  if (records.some((r) => r.phoneSource === 'apollo' || r.phone2Source === 'apollo')) {
    const apolloAttr = 'Apollo.io organization enrichment (head-office phone lines)';
    if (!attributions.includes(apolloAttr)) attributions.push(apolloAttr);
  }
  writeFileSync(OUT, JSON.stringify({
    generatedAt: new Date().toISOString(),
    source: [...new Set(records.map((r) => r.source || 'dataset'))].join(','),
    attribution: attributions.length ? attributions.join(' + ') : (SOURCE === 'overture' ? 'Overture Maps Foundation — CDLA Permissive 2.0' : args.attribution || null),
    count: records.length,
    records,
  }, null, 0), 'utf8');
  console.log(`\nwrote ${records.length} records → ${OUT}` + (existing.length ? ` (${existing.length} existing + ${unique.length} new)` : ''));
}
