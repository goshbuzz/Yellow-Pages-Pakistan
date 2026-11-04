// Link/URL helpers shared by the UI.
//
// The listing fabricator that used to live here (`derive(row)`, which invented names-adjacent
// detail and, critically, phone numbers from a seed) has been removed: the directory no longer
// ships generated listings, so nothing may synthesise a business record at runtime.

export function googleMapsUrl(d) {
  return `https://www.google.com/maps/search/?api=1&query=${d.lat},${d.lng}`;
}

export function googleMapsEmbedUrl(d) {
  return `https://maps.google.com/maps?q=${d.lat},${d.lng}&z=15&output=embed`;
}

export function telHref(phone) {
  if (!phone) return 'tel:';
  const digits = String(phone).replace(/[^\d+*#]/g, '');
  if (digits.startsWith('+92')) return `tel:${digits}`;
  if (digits.startsWith('92') && digits.length > 10) return `tel:+${digits}`;
  return `tel:+92${digits.replace(/^0/, '')}`;
}

// Re-exported from lib/whatsapp.js so every wa.me link goes through the same
// mobile-number validation (landlines/UANs have no WhatsApp).
export { waHref } from './whatsapp.js';
