// Merge Apollo-enriched head-office numbers (data/apollo-enrichment.json) into the dataset.
//
//   node scripts/apply-apollo.mjs [--data=public/data/listings.json] [--dry-run]
//
// Rules (same honesty bar as the importers):
//  • Match by website domain only — never by name.
//  • A number must pass isPlausiblePkPhone().
//  • Empty phone  -> fill `phone`.
//  • Different phone -> store as `phone2` (shown as "Head office"); the original stays primary.
//  • Same digits as the existing phone -> nothing to add.
//  • Apollo numbers are landlines/UANs, so they never set `whatsapp`.

import { readFileSync, writeFileSync } from 'node:fs';
import { isPlausiblePkPhone } from '../src/lib/quality.js';

const args = Object.fromEntries(process.argv.slice(2).map((a) => {
  const [k, ...r] = a.replace(/^--/, '').split('=');
  return [k, r.join('=') || true];
}));
const DATA = args.data || 'public/data/listings.json';
const DRY = !!args['dry-run'];

const host = (u) => String(u || '').toLowerCase().replace(/^https?:\/\//, '').replace(/^www\./, '').split(/[/\s,]/)[0];
const norm = (p) => {
  let d = String(p || '').replace(/\D/g, '');
  if (d.startsWith('0092')) d = d.slice(4);
  else if (d.startsWith('92') && d.length > 11) d = d.slice(2);
  return d.replace(/^0/, '');
};

const apollo = JSON.parse(readFileSync('data/apollo-enrichment.json', 'utf8'));
const byDomain = new Map(apollo.records.map((r) => [r.domain, r.phone]));
const file = JSON.parse(readFileSync(DATA, 'utf8'));

const c = { matched: 0, filled: 0, phone2: 0, same: 0, rejected: 0 };
for (const r of file.records) {
  const num = byDomain.get(host(r.website));
  if (!num) continue;
  c.matched++;
  if (!isPlausiblePkPhone(num)) { c.rejected++; continue; }
  if (!r.phone) { r.phone = num; r.phoneSource = 'apollo'; c.filled++; }
  else if (norm(r.phone) === norm(num)) { c.same++; delete r.phone2; }
  else { r.phone2 = num; r.phone2Source = 'apollo'; c.phone2++; }
}
console.log('  Apollo merge:', c);
if (!DRY) {
  if (!file.attribution.includes('Apollo.io')) file.attribution += ' + Apollo.io organization enrichment (head-office phone lines)';
  writeFileSync(DATA, JSON.stringify(file, null, args.pretty ? 2 : 0));
  console.log('  wrote', DATA);
}
