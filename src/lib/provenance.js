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
  SAMPLE: 'sample',     // generated filler — NOT a real business, shown to demo the product
};

export const SOURCE_LABEL = {
  [SOURCE.OWNER]: 'Owner verified',
  [SOURCE.OFFICIAL]: 'Official registry',
  [SOURCE.DATASET]: 'Dataset',
  [SOURCE.SEED]: 'Directory verified',
  [SOURCE.SAMPLE]: 'Sample data',
};

/** Sources whose phone numbers we may present as belonging to a real, reachable business. */
const TRUSTED = new Set([SOURCE.OWNER, SOURCE.OFFICIAL, SOURCE.SEED, SOURCE.DATASET]);

/**
 * Resolve provenance, failing *closed*: anything we cannot positively attribute is treated
 * as sample data, because the cost of dialling a stranger is higher than the cost of an
 * extra "sample" label. Old saved leads predate the `source` field, so infer from shape:
 * curated ids start with "c", generated rows always carry an `__i` index.
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
  return '';
}
