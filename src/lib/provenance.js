// Provenance & verification — who told us this record exists, and how far can we trust it?
//
// A directory that mixes hand-checked corporate records with invented sample rows is
// only dangerous when the UI/CSV refuses to tell them apart. Every listing therefore
// carries a `source`, and every trust claim in the product is derived from it here.

export const SOURCE = {
  OWNER: 'owner',       // business owner submitted it (and re-confirmed the number)
  OFFICIAL: 'official', // from an official registry / public list (SECP, PSX, gazette…)
  DATASET: 'dataset',   // licensed or open dataset (Overture/OSM/portal) with a phone attribute
  SEED: 'seed',         // hand-curated real flagship companies shipped with the app
  CUSTOM: 'custom',     // added by this user, for personal use on their own device
  SAMPLE: 'sample',     // generated filler — NOT a real business, shown to demo the product
};

export const SOURCE_LABEL = {
  [SOURCE.OWNER]: 'Owner verified',
  [SOURCE.OFFICIAL]: 'Official registry',
  [SOURCE.DATASET]: 'Dataset',
  [SOURCE.SEED]: 'Directory verified',
  [SOURCE.CUSTOM]: 'My own listing',
  [SOURCE.SAMPLE]: 'Sample data',
};

/** Sources whose phone numbers we may present as belonging to a real, reachable business. */
// Custom rows are real to their author (they typed the business in themselves), so they get
// working call/WhatsApp actions — but they are labelled "My own listing" everywhere, and
// they are never presented as directory-verified.
const TRUSTED = new Set([SOURCE.OWNER, SOURCE.OFFICIAL, SOURCE.SEED, SOURCE.DATASET, SOURCE.CUSTOM]);

/**
 * Resolve provenance, failing *closed*: anything we cannot positively attribute is treated as
 * untrusted, because the cost of dialling a stranger is higher than the cost of an extra
 * warning label. Old saved leads predate the `source` field, so infer from shape: curated ids
 * start with "c". `SOURCE.SAMPLE` is retained only to recognise stale browser data from
 * pre-2026-11 installs — nothing in the app produces it any more.
 */
export function sourceOf(b = {}) {
  if (b.source) return b.source;
  if (b.verified) return SOURCE.SEED;
  if (typeof b.bizId === 'string' && b.bizId.startsWith('c')) return SOURCE.SEED;
  return SOURCE.SAMPLE;
}

/** Is this record a real business we can vouch for at all? */
export function isReal(b) {
  return TRUSTED.has(sourceOf(b));
}

/** Strongest badge we are allowed to show. Sample rows never earn one. */
export function trustBadge(b) {
  const src = sourceOf(b);
  if (src === SOURCE.OWNER) return { level: 'owner', label: 'Owner verified' };
  if (src === SOURCE.OFFICIAL) return { level: 'official', label: 'Official registry' };
  if (src === SOURCE.SEED) return { level: 'directory', label: 'Directory verified' };
  if (src === SOURCE.DATASET) return { level: 'dataset', label: 'Listed in dataset' };
  if (src === SOURCE.CUSTOM) return { level: 'custom', label: 'My own listing' };
  return null;
}

/**
 * Export-safe provenance columns. Deliberately explicit so an agency importing the CSV
 * into a CRM can filter out anything that is not a confirmed real business.
 */
export function provenanceFields(b = {}) {
  const src = sourceOf(b);
  return {
    source: SOURCE_LABEL[src] || 'Unknown',
    trust: isReal(b) ? (src === SOURCE.OWNER || src === SOURCE.OFFICIAL ? 'verified' : 'listed') : 'unverified',
  };
}

/** Copy-ready one-liner for the app so the distinction is never hidden. */
export function provenanceNote(b = {}) {
  const src = sourceOf(b);
  if (src === SOURCE.SAMPLE) return 'Sample record — not a real business. Replace with imported or owner-submitted data before contacting.';
  if (src === SOURCE.DATASET) return 'Contact details come from a public dataset and have not been re-confirmed by the business.';
  if (src === SOURCE.CUSTOM) return 'You added this listing yourself. It is stored on this device only — other people cannot see it.';
  return '';
}
