// Claim-a-listing modal — the owner proves the number is live on WhatsApp.
//
// Flow (two taps, no OTP infrastructure, no SMS costs):
//   1. Owner taps "Verify on WhatsApp" → opens wa.me to *their own* number with a code.
//   2. They send it and paste the code back here → we verify the signature and store the
//      claim locally. The listing becomes "Owner verified"; a claim that cannot be proven
//      leaves the listing exactly as unverified as it was.

import { useMemo, useState } from 'react';
import { X, Check, ShieldCheck, Copy, AlertTriangle } from 'lucide-react';
import { claimHref, claimToken, verifyClaim, saveClaim, getClaim } from '../lib/verify';
import { waNumber, waDisplayNumber } from '../lib/whatsapp';
import { copyToClipboard } from '../lib/export';
import { useToast } from './ui';
import { WhatsAppGlyph } from './WhatsAppButton';

export function ClaimListing({ business, listingId, onClose, onClaimed }) {
  const toast = useToast();
  const mobile = waNumber(business?.phone);
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const existing = getClaim(listingId);

  const expected = useMemo(() => (mobile ? claimToken(listingId, mobile) : null), [listingId, mobile]);
  const href = mobile ? claimHref({ listingId, number: mobile, businessName: business?.name }) : null;

  const submit = () => {
    const res = verifyClaim(listingId, mobile, code.trim());
    if (!res.ok) {
      setError(res.reason === 'malformed' ? 'That does not look like a verification code.' : 'That code does not match this listing and number.');
      return;
    }
    setError('');
    saveClaim(listingId, {
      number: mobile,
      display: waDisplayNumber(business.phone),
      verifiedAt: res.verifiedAt,
      method: 'whatsapp-inbound',
    });
    toast(`“${business.name}” is now owner verified`, '✅');
    onClaimed?.();
    onClose?.();
  };

  return (
    <div className="fixed inset-0 z-[96] flex items-end sm:items-center justify-center" role="dialog" aria-label="Claim this listing">
      <div className="absolute inset-0 bg-ink/50 backdrop-blur-[2px]" onClick={onClose} />
      <div className="relative w-full max-w-lg bg-cream rounded-t-[28px] sm:rounded-[28px] max-h-[92dvh] overflow-y-auto p-5 animate-slide-up shadow-pop no-scrollbar">
        <button onClick={onClose} aria-label="Close" className="tap absolute right-4 top-4 w-8 h-8 rounded-full bg-stone-200/80 flex items-center justify-center z-10">
          <X size={16} />
        </button>

        <h3 className="font-black text-lg text-ink flex items-center gap-2">
          <ShieldCheck size={18} className="text-emerald-600" /> Is this your business?
        </h3>
        <p className="text-[12.5px] font-semibold text-stone-500 mt-0.5 mb-3">
          Verify the number on WhatsApp and your profile gets the Owner verified badge — it ranks
          higher and shows a live chat button instead of a guessed one.
        </p>

        <div className="bg-white/95 rounded-2xl border border-stone-200/80 shadow-card p-3.5">
          <p className="font-extrabold text-ink text-[15px] leading-tight">{business?.name}</p>
          <p className="text-[11.5px] font-bold text-stone-500 mt-0.5">
            {business?.city} · {mobile ? waDisplayNumber(business.phone) : business?.phone}
          </p>
        </div>

        {!mobile && (
          <div className="mt-3 rounded-2xl bg-amber-50 border border-amber-300 px-3.5 py-2.5">
            <p className="text-[12.5px] font-extrabold text-amber-900 flex items-center gap-1.5">
              <AlertTriangle size={13} /> This is a landline number
            </p>
            <p className="text-[11.5px] font-semibold text-amber-800 mt-0.5">
              A landline cannot receive WhatsApp, so it cannot be verified here. Update the listing to a
              mobile number (03xx) from “List your business”, then claim it.
            </p>
          </div>
        )}

        {mobile && (
          <>
            <ol className="mt-4 space-y-2.5">
              <li className="flex gap-2.5">
                <span className="shrink-0 w-5 h-5 rounded-full bg-ink text-brand text-[11px] font-black flex items-center justify-center">1</span>
                <div className="min-w-0">
                  <p className="text-[13px] font-extrabold text-ink">Message us from this WhatsApp number</p>
                  <p className="text-[11.5px] font-semibold text-stone-500">The message is already written — it carries your verification code.</p>
                </div>
              </li>
              <li className="flex gap-2.5">
                <span className="shrink-0 w-5 h-5 rounded-full bg-ink text-brand text-[11px] font-black flex items-center justify-center">2</span>
                <div className="min-w-0">
                  <p className="text-[13px] font-extrabold text-ink">Paste the code back here</p>
                  <p className="text-[11.5px] font-semibold text-stone-500">We check the signature and mark the listing verified.</p>
                </div>
              </li>
            </ol>

            <a
              href={href}
              target="_blank"
              rel="noreferrer"
              className="tap mt-3 h-12 w-full rounded-2xl bg-emerald-500 hover:bg-emerald-600 text-white font-black text-[14px] flex items-center justify-center gap-2"
            >
              <WhatsAppGlyph size={17} /> Verify on WhatsApp
            </a>

            {expected && (
              <button
                onClick={async () => {
                  const ok = await copyToClipboard(expected);
                  toast(ok ? 'Code copied' : 'Copy failed', ok ? '📋' : '⚠️');
                }}
                className="tap mt-2 w-full h-9 rounded-xl bg-white border border-stone-300 text-ink-soft font-extrabold text-[12px] flex items-center justify-center gap-1.5"
              >
                <Copy size={13} /> Copy my code ({expected})
              </button>
            )}

            <p className="text-[10.5px] font-extrabold tracking-wider text-stone-400 mt-4 mb-1">VERIFICATION CODE</p>
            <input
              value={code}
              onChange={(e) => { setCode(e.target.value); setError(''); }}
              onKeyDown={(e) => e.key === 'Enter' && submit()}
              placeholder="Paste the code from your message"
              className="w-full rounded-xl border border-stone-300 bg-white/80 px-3 py-2.5 text-[13px] font-bold text-ink outline-none focus:border-brand"
            />
            {error && (
              <p className="mt-1.5 text-[11.5px] font-extrabold text-red-600 flex items-center gap-1">
                <AlertTriangle size={11} /> {error}
              </p>
            )}
            <button
              onClick={submit}
              disabled={!code.trim()}
              className={`tap mt-3 w-full h-11 rounded-2xl font-black text-[13.5px] flex items-center justify-center gap-1.5 ${code.trim() ? 'bg-ink text-brand' : 'bg-stone-200 text-stone-400 cursor-not-allowed'}`}
            >
              <Check size={15} /> Confirm verification
            </button>
            <p className="text-[11px] font-semibold text-stone-400 mt-2">
              No SMS, no OTP, no charge. Verification stays valid for 30 days and is re-confirmed by
              messaging again.
            </p>
          </>
        )}

        {existing?.fresh && (
          <p className="mt-3 text-[11.5px] font-bold text-emerald-700 flex items-center gap-1">
            <Check size={12} /> You verified this listing on {new Date(existing.verifiedAt).toLocaleDateString()}.
          </p>
        )}
      </div>
    </div>
  );
}
