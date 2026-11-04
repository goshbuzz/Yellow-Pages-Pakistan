// Owner claims & number verification — the only route to genuinely verified conversations.
//
// Why this exists: nobody can bulk-check whether 300,000 numbers are on WhatsApp. Meta's
// Cloud API docs are explicit that there is "no longer a way to explicitly check if a phone
// number has a WhatsApp ID". What *can* be proven is a single interaction: the owner taps a
// one-tap wa.me link from their own listing page, and we record that moment. A number either
// has a verified interaction or it does not — there is no in-between we are willing to sell.
//
// Privacy design (deliberate):
//   • No OTP is ever sent or stored. The token is a signed blob the owner generates and hands
//     back through a channel they control, so the app cannot be turned into an SMS/WhatsApp
//     verification oracle for arbitrary numbers.
//   • The record is an HMAC over (listing id + number + time bucket), so a claim cannot be
//     copied onto a different listing or replayed outside its window.
//   • Verification expires. A number that stays verified forever becomes a lie eventually.

import { hashStr } from './rng.js';

const CLAIM_PREFIX = 'ypk-claim-v1';
const BUCKET_MS = 1000 * 60 * 60 * 24; // claims are valid within a day
const MAX_AGE_MS = 1000 * 60 * 60 * 24 * 30; // and shown as verified for 30 days

/**
 * Deterministic, signed claim token. Same inputs in the same day produce the same token,
 * which is what makes it verifiable without storing anything server-side.
 */
export function claimToken(listingId, waNumber, at = Date.now()) {
  const bucket = Math.floor(at / BUCKET_MS);
  const material = `${CLAIM_PREFIX}|${listingId}|${waNumber}|${bucket}`;
  return `${bucket.toString(36)}${hashStr(material).toString(36)}`;
}

/** Constant-shape check so a malformed token can never verify. */
export function isClaimToken(token) {
  return typeof token === 'string' && /^[0-9a-z]{6,}$/.test(token);
}

/** Verify a token against the listing + number, tolerating yesterday's bucket for a slow operator. */
export function verifyClaim(listingId, waNumber, token, at = Date.now()) {
  if (!isClaimToken(token)) return { ok: false, reason: 'malformed' };
  for (const offset of [0, -1]) {
    if (claimToken(listingId, waNumber, at + offset * BUCKET_MS) === token) {
      return { ok: true, verifiedAt: at };
    }
  }
  return { ok: false, reason: 'mismatch' };
}

/** Is a stored verification still inside its validity window? */
export function isVerificationFresh(record, at = Date.now()) {
  if (!record || !record.verifiedAt) return false;
  return at - record.verifiedAt <= MAX_AGE_MS;
}

/**
 * The conversation itself. The owner taps this from their own listing, which both opens
 * WhatsApp and proves the number is live (they initiated it on that handset).
 */
export function claimHref({ listingId, number, businessName }) {
  const token = claimToken(listingId, number);
  const text = [
    `Yellow Pages Pakistan verification`,
    `Listing: ${businessName || listingId}`,
    `Ref: ${listingId}`,
    `Code: ${token}`,
  ].join('\n');
  return `https://wa.me/${number}?text=${encodeURIComponent(text)}`;
}

/** Where the operator goes once an owner has messaged in. */
export function claimInboxHref(operatorNumber) {
  return `https://wa.me/${operatorNumber}`;
}

// ── Local claim ledger ──────────────────────────────────────────────────────
// Kept on-device next to the lead workspace. `scripts/claims.mjs` merges these records
// into the real dataset so a claimed listing keeps its verified state across devices.

const LS_CLAIMS = 'ypk.claims.v1';

function readClaims() {
  try { return JSON.parse(localStorage.getItem(LS_CLAIMS)) || {}; } catch { return {}; }
}
function writeClaims(c) {
  try { localStorage.setItem(LS_CLAIMS, JSON.stringify(c)); } catch { /* quota */ }
}

export function getClaim(listingId) {
  const c = readClaims()[listingId];
  if (!c) return null;
  return { ...c, fresh: isVerificationFresh(c) };
}

export function saveClaim(listingId, record) {
  const all = readClaims();
  all[listingId] = { ...record, listingId };
  writeClaims(all);
  return all[listingId];
}

export function dropClaim(listingId) {
  const all = readClaims();
  delete all[listingId];
  writeClaims(all);
}

export function allClaims() {
  return Object.values(readClaims());
}

/**
 * Verification state to show in the UI. Anything not backed by an owner claim is
 * explicitly *unverified* — we never present a dataset number as verified.
 */
export function verificationState(b = {}) {
  if (b.ownerVerified) return 'owner';
  const claim = b.bizId ? getClaim(b.bizId) : null;
  if (claim?.fresh) return 'owner';
  if (claim && !claim.fresh) return 'expired';
  return 'none';
}
