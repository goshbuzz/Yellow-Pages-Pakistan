// WhatsApp action button — used everywhere a business can be contacted.
//
// Behaviour:
//  • Mobile number  -> opens the real wa.me chat for THAT business in one tap
//                      (never the generic "pick a contact" share sheet).
//  • Landline / UAN -> no broken wa.me page. The tap copies the number and says
//                      why WhatsApp is unavailable, so nobody loses the contact.
//
// The business object only needs { phone, whatsapp }. `whatsapp` is the directory's
// "confirmed on WhatsApp" flag; capability is decided from the number itself.

import { Phone, Copy } from 'lucide-react';
import { waInfo } from '../lib/whatsapp';
import { copyToClipboard } from '../lib/export';
import { useToast } from './ui';

// Official WhatsApp glyph (lucide has no brand icons).
export function WhatsAppGlyph({ size = 15, className = '' }) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} fill="currentColor" aria-hidden="true" className={className}>
      <path d="M17.47 14.38c-.3-.15-1.75-.86-2.02-.96-.27-.1-.47-.15-.67.15-.2.3-.77.96-.94 1.16-.17.2-.35.22-.64.07-.3-.15-1.25-.46-2.39-1.47-.88-.79-1.48-1.76-1.65-2.06-.17-.3-.02-.46.13-.61.14-.14.3-.35.45-.52.15-.17.2-.3.3-.5.1-.2.05-.37-.02-.52-.08-.15-.67-1.6-.92-2.19-.24-.58-.49-.5-.67-.51h-.57c-.2 0-.52.07-.79.37-.27.3-1.04 1.01-1.04 2.46 0 1.45 1.06 2.86 1.21 3.06.15.2 2.08 3.18 5.04 4.46.71.3 1.26.49 1.69.62.71.23 1.36.2 1.87.12.57-.09 1.75-.72 2-1.41.25-.69.25-1.28.17-1.41-.07-.13-.27-.2-.57-.35z" />
      <path d="M12.04 2C6.58 2 2.13 6.45 2.13 11.91c0 1.75.46 3.46 1.32 4.96L2 22l5.25-1.38c1.45.79 3.08 1.21 4.79 1.21 5.46 0 9.91-4.45 9.91-9.91S17.5 2 12.04 2zm0 18.13c-1.55 0-3.07-.42-4.4-1.2l-.32-.19-3.12.82.83-3.04-.2-.33a8.16 8.16 0 0 1-1.25-4.36c0-4.54 3.7-8.23 8.24-8.23 4.54 0 8.23 3.69 8.23 8.23 0 4.54-3.69 8.3-8.24 8.3z" />
    </svg>
  );
}

const VARIANT = {
  // card: full-width-ish pill next to Call / Map
  card: 'h-9 px-3.5 rounded-xl text-[13px] gap-1.5',
  // pill: full button on the business detail page
  pill: 'h-11 rounded-2xl text-[14px] gap-2',
  // icon: compact round button (lead workspace rows)
  icon: 'w-8 h-8 rounded-full text-[13px]',
  ghost: 'h-9 px-3 rounded-xl text-[12.5px] gap-1.5',
};

export function WhatsAppButton({
  b,
  variant = 'card',
  label = true,
  size,
  onOpen,
  className = '',
  title,
}) {
  const toast = useToast();
  const info = waInfo(b);
  const ver = VARIANT[variant] || VARIANT.card;
  const glyphSize = size ?? (variant === 'icon' ? 13 : variant === 'pill' ? 17 : 14);
  const iconOnly = variant === 'icon' || !label;

  const onCopy = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    const ok = await copyToClipboard(b?.phone || '');
    toast(ok ? `No WhatsApp on this line — ${b.phone} copied` : 'No WhatsApp on this line', ok ? '☎️' : '☎️');
  };

  // Landline / UAN: keep the affordance, but never open a dead wa.me page.
  if (info.state === 'landline') {
    return (
      <button
        type="button"
        onClick={onCopy}
        title={title || `Landline ${b?.phone || ''} — WhatsApp not available here. Tap to copy the number.`}
        aria-label={`Copy landline number for ${b?.name || 'business'}`}
        className={`tap shrink-0 flex items-center justify-center font-extrabold bg-stone-100 text-stone-500 border border-stone-300 hover:bg-stone-200 ${ver} ${className}`}
      >
        {iconOnly ? <Phone size={glyphSize} /> : <><Phone size={glyphSize} /> {variant === 'pill' ? 'Copy number' : 'Landline'}</>}
      </button>
    );
  }

  const href = info.href;

  return (
    <a
      href={href}
      target="_blank"
      rel="noreferrer"
      onClick={(e) => { e.stopPropagation(); onOpen?.(info); }}
      title={title || `Chat with ${b?.name || 'this business'} on WhatsApp (${info.display})`}
      aria-label={`WhatsApp ${b?.name || 'this business'} on ${info.display}`}
      className={`tap shrink-0 flex items-center justify-center font-extrabold bg-emerald-500 hover:bg-emerald-600 text-white ${ver} ${className}`}
    >
      <WhatsAppGlyph size={glyphSize} />
      {!iconOnly && (variant === 'pill' ? <span className="truncate">WhatsApp</span> : <span>WhatsApp</span>)}
    </a>
  );
}

/** Small, honest status label: is this really a WhatsApp line? */
export function WhatsAppStatus({ b, className = '' }) {
  const info = waInfo(b);
  if (info.state === 'landline') {
    return (
      <span className={`inline-flex items-center gap-1 text-[10.5px] font-bold text-stone-400 ${className}`}>
        <Phone size={10} /> Landline only
      </span>
    );
  }
  if (info.state === 'confirmed') {
    return (
      <span className={`inline-flex items-center gap-1 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-full px-1.5 py-[1px] text-[10px] font-extrabold ${className}`}>
        <WhatsAppGlyph size={10} /> ON WHATSAPP
      </span>
    );
  }
  return (
    <span className={`inline-flex items-center gap-1 text-[10.5px] font-bold text-stone-400 ${className}`}>
      <Copy size={10} /> Unverified mobile
    </span>
  );
}
