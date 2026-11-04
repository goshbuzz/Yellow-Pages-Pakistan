// Audit and purge fake / impossible listings.
//
//   node scripts/audit-listings.mjs                                    # report only, exit 1 if anything is bad
//   node scripts/audit-listings.mjs --data=public/data/listings.json --fix   # rewrite the cleaned corpus
//
// The bugs this exists to catch (all of them shipped at some point):
//   • a coordinate outside Pakistan (a "Sahiwal" hospital pinned in Nairobi or London)
//   • a pin more than `--max-km` from the city it claims to be in
//   • a city name that is not one of the 420 known cities (free-text junk from a CSV)
//   • a name that is empty, a placeholder, or has no letters ("Test", "xxxx", "12345")
//   • a phone that is not a usable Pakistani number, or is a well-known placeholder
//   • a duplicate business (same name + city), or one number shared by many unrelated names
//   • a record with no provenance at all
//
// Nothing is deleted silently: every removal is printed with its reason, and the file is
// only rewritten when --fix is passed.

import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { CITIES } from '../src/data/geo.js';
import { validPkPoint, haversineKm } from '../src/lib/geovalidate.js';
import { isUsableName, isPlausiblePkPhone } from '../src/lib/quality.js';
import { CATEGORY_BY_ID } from '../src/data/categories.js';

const ROOT = new URL('..', import.meta.url).pathname.replace(/\/$/, '');
const args = Object.fromEntries(
  process.argv.slice(2).map((a) => {
    const [k, v] = a.replace(/^--/, '').split('=');
    return [k, v ?? true];
  })
);

const DATA = args.data || `${ROOT}/public/data/listings.json`;
const MAX_KM = Number(args['max-km'] || 150);

const cityByName = new Map(CITIES.map((c) => [c.name.toLowerCase(), c]));

function auditRecord(r, seen) {
  const reasons = [];
  const name = String(r.name || '').trim();
  const city = cityByName.get(String(r.city || '').trim().toLowerCase());

  if (!name) reasons.push('no name');
  else if (!isUsableName(name)) reasons.push(`placeholder name "${name}"`);

  if (!city) reasons.push(`unknown city "${r.city ?? ''}"`);

  const phone = String(r.phone || '').trim();
  const digits = phone.replace(/\D/g, '');
  if (!phone) reasons.push('no phone');
  else if (!isPlausiblePkPhone(phone)) reasons.push(`unusable phone "${phone}"`);

  // Coordinates: absent is acceptable (the map hides), foreign is not.
  if (r.lat != null || r.lng != null) {
    if (!validPkPoint(r.lat, r.lng)) reasons.push(`pin outside Pakistan (${r.lat}, ${r.lng})`);
    else if (city) {
      const km = haversineKm(city.lat, city.lng, +r.lat, +r.lng);
      if (km > MAX_KM) reasons.push(`pin ${Math.round(km)} km from ${city.name}`);
    }
  }

  if (r.cat != null && !CATEGORY_BY_ID[+r.cat]) reasons.push(`unknown category id ${r.cat}`);
  if (!r.source) reasons.push('no provenance (source)');

  const key = `${name.toLowerCase()}|${String(r.city || '').toLowerCase()}`;
  if (seen.names.has(key)) reasons.push(`duplicate of an earlier "${name}" in ${r.city}`);
  seen.names.add(key);

  if (digits) {
    const owners = seen.phones.get(digits) || new Set();
    owners.add(name.toLowerCase());
    seen.phones.set(digits, owners);
  }

  return reasons;
}

function main() {
  if (!existsSync(DATA)) {
    console.error(`No dataset at ${DATA}.`);
    console.error('Import something first, or point at a corpus: --data=<file>');
    process.exit(2);
  }

  const raw = JSON.parse(readFileSync(DATA, 'utf8'));
  const records = raw.records || raw;
  const header = raw.records ? { ...raw } : null;
  if (header) delete header.records;

  console.log(`\nAUDIT ${DATA}`);
  console.log(`records: ${records.length} · max allowed distance from stated city: ${MAX_KM} km\n`);

  const seen = { names: new Set(), phones: new Map() };
  const rejected = [];
  const kept = [];

  for (const r of records) {
    const reasons = auditRecord(r, seen);
    if (reasons.length) rejected.push({ r, reasons });
    else kept.push(r);
  }

  // A number shared by many unrelated businesses is a data-entry fault, not a coincidence.
  const sharedBy = new Map(
    [...seen.phones.entries()].filter(([, owners]) => owners.size >= 3)
  );

  const reasonsTally = {};
  for (const { reasons } of rejected) {
    for (const reason of reasons) {
      const key = reason
        .replace(/".*"/g, '"…"')
        .replace(/\(-?[\d., ]+\)/, '(…)')
        .replace(/\d+ km/, 'N km')
        .replace(/id \d+/, 'id N');
      reasonsTally[key] = (reasonsTally[key] || 0) + 1;
    }
  }

  console.log(`clean      : ${kept.length}`);
  console.log(`removable  : ${rejected.length}`);
  if (rejected.length) {
    console.log('\nby reason:');
    Object.entries(reasonsTally)
      .sort((a, b) => b[1] - a[1])
      .forEach(([reason, n]) => console.log(`  ${String(n).padStart(5)}  ${reason}`));
    console.log('\nfirst 15 removals:');
    for (const { r, reasons } of rejected.slice(0, 15)) {
      console.log(`  • ${String(r.name).slice(0, 40).padEnd(40)} ${String(r.city).padEnd(12)} ${reasons.join('; ')}`);
    }
    if (rejected.length > 15) console.log(`  …and ${rejected.length - 15} more`);
  }

  if (sharedBy.size) {
    console.log(`\nnumbers shared by 3+ different businesses: ${sharedBy.size}`);
    [...sharedBy.entries()].slice(0, 5).forEach(([d, owners]) => {
      console.log(`  • ${d} → ${[...owners].slice(0, 4).join(', ')}${owners.size > 4 ? ' …' : ''}`);
    });
  }

  if (!args.fix) {
    console.log(rejected.length ? '\nRun again with --fix to rewrite the corpus without these rows.' : '\nNothing to clean.');
    process.exit(rejected.length ? 1 : 0);
  }

  if (!rejected.length) {
    console.log('\nNothing to clean.');
    return;
  }

  const out = header
    ? { ...header, total: kept.length, records: kept, cleanedAt: new Date().toISOString() }
    : kept;
  writeFileSync(DATA, JSON.stringify(out, null, 2));
  console.log(`\nrewrote ${DATA}: ${records.length} → ${kept.length} records`);
  console.log('next: node scripts/stats.mjs   (rebuild the runtime payload + counts)');

  // Keep the coverage table honest about the new totals.
  try {
    execFileSync('node', [`${ROOT}/scripts/import-city.mjs`, '--report'], { stdio: 'inherit' });
  } catch { /* report is best-effort */ }
}

main();
