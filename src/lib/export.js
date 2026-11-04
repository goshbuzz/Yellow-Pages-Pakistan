// CSV / TSV export for lead lists.

import { waHref, waNumber } from './whatsapp.js';
import { provenanceFields } from './provenance.js';
import { validPkPoint } from './geovalidate.js';

function escapeCsv(v) {
  if (v == null) return '';
  const s = String(v);
  return /[",\n]/.test(s) ? `"${s.replaceAll('"', '""')}"` : s;
}

export function leadsToCsv(leads) {
  // "WhatsApp" is a yes/no flag a human can filter on; "WhatsApp Link" is only ever
  // filled with a working direct-chat URL (mobile numbers), so imported lists stay
  // clean instead of carrying dead links for landlines.
  const head = ['Name', 'Category', 'City', 'Province', 'Address', 'Phone', 'Phone 2 (head office)', 'WhatsApp', 'WhatsApp Number', 'WhatsApp Link', 'Email', 'Website', 'Google Maps', 'Rating', 'Reviews', 'Status', 'Note', 'Added', 'Source', 'Trust'];
  const rows = leads.map((l) => {
    const number = waNumber(l.phone);
    const link = number ? waHref(l.phone) : '';
    return [
      l.name, l.cat, l.city, l.province, l.address, l.phone, l.phone2,
      number ? (l.whatsapp ? 'Yes' : 'Unverified') : 'No',
      number ? `+${number}` : '',
      link,
      l.email, l.website ? `https://${l.website}` : '',
      validPkPoint(l.lat, l.lng) ? `https://www.google.com/maps/search/?api=1&query=${l.lat},${l.lng}` : '',
      l.rating, l.reviews, l.status, l.note,
      new Date(l.addedAt).toISOString().slice(0, 10),
      provenanceFields(l).source,
      provenanceFields(l).trust,
    ];
  });
  return [head, ...rows].map((r) => r.map(escapeCsv).join(',')).join('\n');
}

export function downloadFile(filename, content, mime = 'text/csv;charset=utf-8') {
  const blob = new Blob(['\uFEFF' + content], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 2000);
}

export async function copyToClipboard(text) {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    return false;
  }
}
