// CSV / TSV export for lead lists.

function escapeCsv(v) {
  if (v == null) return '';
  const s = String(v);
  return /[",\n]/.test(s) ? `"${s.replaceAll('"', '""')}"` : s;
}

export function leadsToCsv(leads) {
  const head = ['Name', 'Category', 'City', 'Province', 'Address', 'Phone', 'WhatsApp', 'Email', 'Website', 'Google Maps', 'Rating', 'Reviews', 'Status', 'Note', 'Added'];
  const rows = leads.map((l) => [
    l.name, l.cat, l.city, l.province, l.address, l.phone,
    l.whatsapp ? `https://wa.me/92${(l.phone || '').replace(/^0/, '').replace(/-/g, '')}` : '',
    l.email, l.website ? `https://${l.website}` : '',
    `https://www.google.com/maps/search/?api=1&query=${l.lat},${l.lng}`,
    l.rating, l.reviews, l.status, l.note,
    new Date(l.addedAt).toISOString().slice(0, 10),
  ]);
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
