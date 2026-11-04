// Number hygiene — the free half of "every listing has a real, reachable number".
//
// We cannot ask Meta whether 300k numbers are on WhatsApp (the API no longer exposes that),
// but we *can* stop bad numbers entering and detect the ones that are not real:
//
//   1. Format    — must normalise to a valid PK mobile (03xx) or landline (0xx-xxxxxxx).
//   2. Claims    — a WhatsApp claim on a landline is impossible; strip it.
//   3. Fakes     — all-same-digit / sequential / obviously placeholder numbers.
//   4. Sharing   — one number used by many unrelated businesses (switchboard, typo
//                  collision, or a scraped call-centre line) is reported, not silently kept.
//   5. Staleness — records carry a capture date; old numbers are flagged for re-check.
//
//   node scripts/verify-numbers.mjs --data=public/data/imported.json            # report
//   node scripts/verify-numbers.mjs --data=... --patch --out=cleaned.json       # clean it
//   node scripts/verify-numbers.mjs --data=... --stale-days=365 --max-shared=3

import { readFileSync, writeFileSync } from 'node:fs';
import { waNumber } from '../src/lib/whatsapp.js';

const args = Object.fromEntries(
  process.argv.slice(2).map((a) => {
    const [k, ...rest] = a.replace(/^--/, '').split('=');
    return [k, rest.join('=') || true];
  })
);

const MAX_SHARED = Number(args['max-shared'] || 5);
const STALE_DAYS = Number(args['stale-days'] || 730);

if (!args.data) {
  console.error('usage: node scripts/verify-numbers.mjs --data=file.json [--patch] [--out=file.json]');
  process.exit(2);
}

const payload = JSON.parse(readFileSync(args.data, 'utf8'));
const records = payload.records || payload;

/** Landline shape after stripping formatting: 0 + area code (2–3 digits) + 6–8 digits. */
function isLandline(phone) {
  const d = String(phone || '').replace(/[^\d]/g, '').replace(/^92/, '').replace(/^0/, '');
  return /^[1-9]\d{8,10}$/.test(d);
}

/**
 * Numbers that pass a length check but are probably not real.
 * 'invalid' is safe to clear (nobody holds 0300-1111111); 'suspicious' is reported only,
 * because deleting a real business's number costs more than keeping one odd-looking row.
 */
function looksFake(phone) {
  const d = String(phone || '').replace(/\D/g, '');
  const subscriber = d.slice(-7);
  if (/^(\d)\1{6}$/.test(subscriber)) return { level: 'invalid', why: 'repeated digit' };
  if (/^0+$/.test(subscriber)) return { level: 'invalid', why: 'all zeros' };
  if ('0123456789'.includes(subscriber) || '9876543210'.includes(subscriber)) {
    return { level: 'suspicious', why: 'sequential digits' };
  }
  return null;
}

const issues = [];
const numberUse = new Map(); // normalised number -> [record]
const cleaned = [];

for (const r of records) {
  const phone = r.phone;
  const problems = [];
  const mobile = waNumber(phone);

  if (!phone) {
    problems.push('no number');
  } else if (mobile) {
    const fake = looksFake(phone);
    if (fake) problems.push(`${fake.level === 'invalid' ? 'invalid number' : 'suspicious number'}: ${fake.why}`);
    if (!numberUse.has(mobile)) numberUse.set(mobile, []);
    numberUse.get(mobile).push(r);
  } else if (isLandline(phone)) {
    // fine for calling — but it can never carry a WhatsApp claim
    if (r.whatsapp) problems.push('landline wrongly claimed as WhatsApp');
  } else {
    problems.push('unparseable number');
  }

  if (r.source === 'owner' && !r.verifiedAt) problems.push('owner claim without verification date');
  const captured = r.capturedAt || r.importedAt;
  if (captured && Date.now() - new Date(captured).getTime() > STALE_DAYS * 86400000) {
    problems.push(`stale (older than ${STALE_DAYS}d)`);
  }

  if (problems.length) issues.push({ id: r.id || r.name, name: r.name, phone, problems });
  cleaned.push({ record: r, mobile, problems });
}

// Shared numbers across *different* businesses are the strongest "not a real lead" signal.
const shared = [];
for (const [num, list] of numberUse) {
  const names = new Set(list.map((r) => (r.name || '').toLowerCase().trim()));
  if (names.size > MAX_SHARED) shared.push({ number: num, businesses: names.size, sample: list.slice(0, 3).map((r) => r.name) });
}
shared.sort((a, b) => b.businesses - a.businesses);

// ── Report ──────────────────────────────────────────────────────────────────
const total = records.length;
const withMobile = cleaned.filter((c) => c.mobile).length;
const withLandline = cleaned.filter((c) => !c.mobile && isLandline(c.record.phone)).length;
const noNumber = total - withMobile - withLandline;
const claimedWa = records.filter((r) => r.whatsapp).length;
const claimedButLandline = issues.filter((i) => i.problems.includes('landline wrongly claimed as WhatsApp')).length;

console.log(`\nnumber hygiene — ${args.data}`);
console.log(`  records             : ${total.toLocaleString()}`);
console.log(`  WhatsApp-capable    : ${withMobile.toLocaleString()} (${((withMobile / (total || 1)) * 100).toFixed(1)}%)`);
console.log(`  landline (call only): ${withLandline.toLocaleString()}`);
console.log(`  no usable number    : ${noNumber.toLocaleString()}`);
console.log(`  WhatsApp claims     : ${claimedWa.toLocaleString()}${claimedButLandline ? `  (${claimedButLandline} impossible)` : ''}`);
console.log(`  records with issues : ${issues.length.toLocaleString()}`);
console.log(`  numbers shared by >${MAX_SHARED} different businesses: ${shared.length}`);

if (shared.length) {
  console.log('\n  shared numbers (likely switchboard, typo collision or scraped call centre):');
  for (const s of shared.slice(0, 5)) console.log(`    +${s.number} → ${s.businesses} businesses e.g. ${s.sample.join(', ')}`);
}
const byProblem = {};
for (const i of issues) for (const p of i.problems) byProblem[p] = (byProblem[p] || 0) + 1;
if (Object.keys(byProblem).length) {
  console.log('\n  issue breakdown:');
  for (const [p, n] of Object.entries(byProblem).sort((a, b) => b[1] - a[1])) console.log(`    ${n.toString().padStart(6)}  ${p}`);
}

// ── Patch ───────────────────────────────────────────────────────────────────
if (args.patch) {
  let fixedWa = 0, dropped = 0;
  const out = cleaned.map(({ record, mobile, problems }) => {
    const next = { ...record };
    // A landline can never be a WhatsApp line.
    if (!mobile && next.whatsapp) { next.whatsapp = false; fixedWa++; }
    // Placeholder numbers are worse than no number: keep the listing, drop the digits.
    if (problems.includes('unparseable number') || problems.some((p) => p.startsWith('invalid number'))) {
      next.phone = null;
      next.whatsapp = false;
      next.contactable = false;
      dropped++;
    }
    return next;
  });
  const target = args.out || args.data;
  writeFileSync(target, JSON.stringify({ ...payload, records: out, hygiene: { checkedAt: new Date().toISOString(), fixedWhatsAppClaims: fixedWa, clearedFakeNumbers: dropped, sharedNumbers: shared.length } }, null, 0));
  console.log(`\npatched: ${fixedWa} WhatsApp claims cleared · ${dropped} invalid numbers cleared → ${target}`);
  console.log('  (suspicious-but-parseable numbers are reported above and left untouched)');
}
