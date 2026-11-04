// Merge owner claims into a dataset.
//
// A claim is only as good as the signature behind it, so this script re-verifies every
// record instead of trusting the file. Anything that fails is reported and dropped —
// a wrong "owner verified" badge is worse than no badge.
//
//   node scripts/claims.mjs --claims=claims.json --data=public/data/imported.json
//   node scripts/claims.mjs --claims=claims.json --data=imported.json --out=merged.json --max-age-days=30
//
// Claim record shape (produced by the app, or by hand from the operator inbox):
//   { "listingId": "g123", "number": "923001234567", "token": "…", "verifiedAt": 1793800000000 }
//
// Output: the same records with `source: "owner"`, `ownerVerified: true`, `verifiedAt`.

import { readFileSync, writeFileSync } from 'node:fs';
import { verifyClaim, isClaimToken } from '../src/lib/verify.js';
import { waNumber } from '../src/lib/whatsapp.js';

const args = Object.fromEntries(
  process.argv.slice(2).map((a) => {
    const [k, ...rest] = a.replace(/^--/, '').split('=');
    return [k, rest.join('=') || true];
  })
);

const MAX_AGE_DAYS = Number(args['max-age-days'] || 30);
const now = Date.now();

if (!args.claims) {
  console.error('usage: node scripts/claims.mjs --claims=claims.json [--data=imported.json] [--out=merged.json]');
  process.exit(2);
}

const raw = JSON.parse(readFileSync(args.claims, 'utf8'));
const claims = Array.isArray(raw) ? raw : Object.values(raw?.claims || raw);

const valid = [];
const rejected = [];

for (const c of claims) {
  const listingId = c.listingId || c.id;
  const number = waNumber(c.number || c.phone);

  if (!listingId) { rejected.push({ c, why: 'no listingId' }); continue; }
  if (!number) { rejected.push({ c, why: 'not a mobile number — cannot be a WhatsApp claim' }); continue; }
  if (!isClaimToken(c.token)) { rejected.push({ c, why: 'malformed token' }); continue; }

  const age = c.verifiedAt ? now - c.verifiedAt : Infinity;
  if (!Number.isFinite(age) || age < -86400000) { rejected.push({ c, why: 'missing/invalid verifiedAt' }); continue; }
  if (age > MAX_AGE_DAYS * 86400000) { rejected.push({ c, why: `stale (${Math.round(age / 86400000)}d > ${MAX_AGE_DAYS}d)` }); continue; }

  // Re-derive the signature: a token is only valid for this listing + number + day.
  const res = verifyClaim(listingId, number, c.token, c.verifiedAt);
  if (!res.ok) { rejected.push({ c, why: `signature ${res.reason}` }); continue; }

  valid.push({ listingId, number, verifiedAt: c.verifiedAt, token: c.token });
}

console.log(`\nclaims: ${claims.length} in · ${valid.length} verified · ${rejected.length} rejected`);
for (const r of rejected.slice(0, 10)) {
  console.log(`  ! ${r.c.listingId || '(no id)'}: ${r.why}`);
}
if (rejected.length > 10) console.log(`  ! …and ${rejected.length - 10} more`);

if (!args.data) {
  if (args.out) writeFileSync(args.out, JSON.stringify({ generatedAt: new Date(now).toISOString(), claims: valid }, null, 2));
  console.log(valid.length ? `\nwrote verified claims → ${args.out || '(no --out)'}` : 'nothing to merge');
  process.exit(0);
}

const data = JSON.parse(readFileSync(args.data, 'utf8'));
const records = data.records || data;
const byId = new Map(valid.map((v) => [v.listingId, v]));
let applied = 0;

for (const rec of records) {
  const id = rec.id || rec.listingId;
  const claim = byId.get(id);
  if (!claim) continue;
  // A claim for a different number than the one on record is a conflict, not an upgrade.
  if (waNumber(rec.phone) !== claim.number) {
    console.log(`  ! ${id}: claim number differs from listing number — not applied`);
    continue;
  }
  rec.source = 'owner';
  rec.ownerVerified = true;
  rec.verifiedAt = claim.verifiedAt;
  rec.whatsapp = true;
  applied++;
}

const out = args.out || args.data;
writeFileSync(out, JSON.stringify({ ...data, records, claimsApplied: applied }, null, 0));
console.log(`\napplied ${applied} owner verifications → ${out}`);
