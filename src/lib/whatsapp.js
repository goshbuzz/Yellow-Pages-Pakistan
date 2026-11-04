// WhatsApp helpers — the single place that decides whether a listing's number can
// start a *direct* WhatsApp chat, and how that wa.me link is built.
//
// Why this file exists: in Pakistan most SME sales happen in WhatsApp, not email.
// A wa.me link with a landline, a UAN (111-xxx-xxx) or a malformed number does not
// "fail loudly" — WhatsApp just opens an error page, or worse, silently drops the
// lead. So capability is derived from the *number itself* (03xx mobile only), and
// every surface (cards, detail, lead workspace, CSV export) uses this one function.

// Mobile numbers in Pakistan: 0300–0349 (10 digits after the trunk 0 / 92 country code).
const PK_MOBILE = /^3\d{9}$/;

/**
 * Normalise any Pakistani phone string to WhatsApp's international digits.
 * Accepts "0300-1234567", "0300 1234567", "+92 300 1234567", "0092 300 1234567",
 * "923001234567" and "3001234567". Returns null for anything that cannot be a
 * WhatsApp mobile (landlines, UANs, short codes, values containing letters).
 */
export function waNumber(phone) {
  if (phone == null) return null;
  const raw = String(phone).trim();
  // Letters mean a vanity/UAN number ("051-111-OGDCL-1") — never WhatsApp-capable.
  if (/[a-z]/i.test(raw)) return null;

  let d = raw.replace(/\D/g, '');
  if (!d) return null;
  if (d.startsWith('0092')) d = d.slice(4);
  else if (d.startsWith('92') && d.length > 11) d = d.slice(2);
  if (d.startsWith('0')) d = d.slice(1);

  return PK_MOBILE.test(d) ? `92${d}` : null;
}

/** True when this listing can open a direct WhatsApp chat. */
export function isWaCapable(phone) {
  return waNumber(phone) !== null;
}

/** wa.me deep link for a direct chat, optionally with a prefilled message. */
export function waHref(phone, { text } = {}) {
  const n = waNumber(phone);
  if (!n) return null;
  return `https://wa.me/${n}${text ? `?text=${encodeURIComponent(text)}` : ''}`;
}

/** Share sheet link (pick a contact, no pre-filled recipient). */
export function waShareHref(text) {
  return `https://wa.me/?text=${encodeURIComponent(text || '')}`;
}

/** Readable international form: 0300-1234567 -> +92 300 1234567 */
export function waDisplayNumber(phone) {
  const n = waNumber(phone);
  if (!n) return null;
  return `+${n.slice(0, 2)} ${n.slice(2, 5)} ${n.slice(5)}`;
}

/**
 * Short opener used to pre-fill the chat box. Kept to one line: the sender still
 * taps send, but they never have to explain where they found the business.
 */
export function waGreeting({ name, cat, city } = {}) {
  const catName = typeof cat === 'object' && cat ? cat.name : cat;
  const bits = [`Assalam-o-Alaikum! I found ${name || 'your business'} on Yellow Pages Pakistan`];
  if (catName) bits.push(`and wanted to ask about ${String(catName).toLowerCase()}`);
  if (city) bits.push(`in ${city}`);
  return `${bits.join(' ')} — is now a good time to chat?`;
}

/**
 * Everything a UI surface needs to render the WhatsApp action honestly.
 *   state: 'confirmed'  — number is a mobile AND the listing says it is on WhatsApp
 *          'mobile'     — number is a mobile, WhatsApp presence unverified
 *          'landline'   — cannot start a WhatsApp chat (landline / UAN / bad number)
 */
export function waInfo(b, { greet = true } = {}) {
  const phone = b?.phone;
  const display = waDisplayNumber(phone);
  if (!display) {
    return { state: 'landline', href: null, display: null, confirmed: false, number: null };
  }
  const text = greet ? waGreeting(b) : '';
  return {
    state: b?.whatsapp ? 'confirmed' : 'mobile',
    confirmed: !!b?.whatsapp,
    href: waHref(phone, { text }),
    display,
    number: waNumber(phone),
  };
}
