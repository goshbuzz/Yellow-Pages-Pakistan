// WhatsApp outreach queue — turns a lead list into one-by-one WhatsApp conversations.
//
// Pakistan's SME sales happen in chat, so a CSV export alone leaks leads: agencies
// open WhatsApp Web and copy numbers by hand. This walks the list of *contactable*
// leads, keeps the personalized draft from the pitch drafter, and opens each real
// wa.me chat with the message pre-filled — one lead at a time, with progress and
// an optional automatic status update so the pipeline and the export stay clean.

import { useMemo, useState } from 'react';
import { X, SkipForward, Copy, ChevronRight, Check, Wand2, MessageSquareWarning } from 'lucide-react';
import { waInfo, waDisplayNumber } from '../lib/whatsapp';
import { draftPitch } from '../lib/pitch';
import { copyToClipboard } from '../lib/export';
import { updateLead, getPrefs } from '../lib/leads';
import { useToast } from './ui';
import { WhatsAppGlyph } from './WhatsAppButton';

// Leads store the category as a name string; saved business objects may carry the
// whole category record. Normalise once so nothing renders an object.
const catLabel = (cat) => (cat && typeof cat === 'object' ? cat.name : cat) || 'Business';

export function WhatsAppQueue({ leads, onClose, onChanged }) {
  const toast = useToast();
  const prefs = getPrefs();
  const [onlyConfirmed, setOnlyConfirmed] = useState(false);
  const [markContacted, setMarkContacted] = useState(true);
  const [idx, setIdx] = useState(0);
  const [textOverride, setTextOverride] = useState({});

  const queue = useMemo(() => {
    const capable = leads
      .map((l) => ({ lead: l, info: waInfo(l) }))
      .filter((x) => x.info.state !== 'landline');
    return onlyConfirmed ? capable.filter((x) => x.info.confirmed) : capable;
  }, [leads, onlyConfirmed]);

  const skipped = leads.length - queue.length;
  const current = queue[Math.min(idx, queue.length - 1)];
  const done = idx >= queue.length;

  const draftFor = (lead) => {
    const { body } = draftPitch(
      { name: lead.name, cat: catLabel(lead.cat), city: lead.city, area: '', rating: lead.rating },
      prefs.pitchService || 'web',
      prefs.pitchTone || 'friendly',
      prefs.pitchSender || ''
    );
    // A WhatsApp opener is not an email: drop the signature block and keep it short.
    return body.split('\n\n').filter((p) => !/^(best|kind regards|sincerely|cheers|shukriya)/i.test(p.trim())).join('\n\n');
  };

  const messageFor = (lead) => textOverride[lead.bizId] ?? draftFor(lead);

  const openCurrent = () => {
    if (!current) return;
    const { lead, info } = current;
    const text = messageFor(lead);
    const href = `${info.href.split('?')[0]}?text=${encodeURIComponent(text)}`;
    window.open(href, '_blank', 'noopener');
    if (markContacted && lead.status === 'new') {
      updateLead(lead.bizId, { status: 'contacted' });
      onChanged?.();
      toast(`Opened chat · ${lead.name} marked Contacted`, '💬');
    } else {
      toast(`Opened WhatsApp chat with ${lead.name}`, '💬');
    }
    setIdx((i) => i + 1);
  };

  const copyCurrent = async () => {
    if (!current) return;
    const ok = await copyToClipboard(messageFor(current.lead));
    toast(ok ? 'Message copied' : 'Copy failed', ok ? '📋' : '⚠️');
  };

  return (
    <div className="fixed inset-0 z-[96] flex items-end sm:items-center justify-center" role="dialog" aria-label="WhatsApp outreach queue">
      <div className="absolute inset-0 bg-ink/50 backdrop-blur-[2px]" onClick={onClose} />
      <div className="relative w-full max-w-lg bg-cream rounded-t-[28px] sm:rounded-[28px] max-h-[92dvh] overflow-y-auto p-5 animate-slide-up shadow-pop no-scrollbar">
        <button onClick={onClose} aria-label="Close" className="tap absolute right-4 top-4 w-8 h-8 rounded-full bg-stone-200/80 flex items-center justify-center z-10">
          <X size={16} />
        </button>

        <h3 className="font-black text-lg text-ink flex items-center gap-2">
          <WhatsAppGlyph size={18} className="text-emerald-600" /> WhatsApp outreach
        </h3>
        <p className="text-[12.5px] font-semibold text-stone-500 mt-0.5 mb-3">
          One tap per lead — each chat opens on that business&apos;s own number, message pre-filled.
        </p>

        <div className="flex items-center gap-2 flex-wrap mb-3">
          <label className="flex items-center gap-1.5 text-[11.5px] font-extrabold text-ink-soft bg-white/80 border border-stone-300 rounded-full px-2.5 py-1.5 cursor-pointer">
            <input type="checkbox" checked={onlyConfirmed} onChange={(e) => { setOnlyConfirmed(e.target.checked); setIdx(0); }} className="accent-emerald-600 w-3.5 h-3.5" />
            Confirmed WhatsApp only
          </label>
          <label className="flex items-center gap-1.5 text-[11.5px] font-extrabold text-ink-soft bg-white/80 border border-stone-300 rounded-full px-2.5 py-1.5 cursor-pointer">
            <input type="checkbox" checked={markContacted} onChange={(e) => setMarkContacted(e.target.checked)} className="accent-emerald-600 w-3.5 h-3.5" />
            Mark Contacted
          </label>
          <span className="text-[11px] font-bold text-stone-400 ml-auto">{queue.length} contactable{skipped > 0 ? ` · ${skipped} landline skipped` : ''}</span>
        </div>

        {queue.length === 0 ? (
          <div className="text-center py-8">
            <div className="text-4xl mb-2">📵</div>
            <p className="font-extrabold text-ink">No WhatsApp-capable numbers in this list</p>
            <p className="text-[12.5px] font-semibold text-stone-500 mt-1">
              These leads only have landline numbers — use Call from the list instead.
            </p>
          </div>
        ) : done ? (
          <div className="text-center py-8">
            <div className="text-4xl mb-2">✅</div>
            <p className="font-extrabold text-ink">Queue finished — {queue.length} chat{queue.length === 1 ? '' : 's'} opened</p>
            <p className="text-[12.5px] font-semibold text-stone-500 mt-1">Replies stay in WhatsApp; update statuses here as they land.</p>
            <button onClick={() => setIdx(0)} className="tap mt-3 bg-white border border-stone-300 text-ink-soft font-extrabold text-[12.5px] rounded-xl px-4 py-2">Start over</button>
          </div>
        ) : (
          <>
            <div className="flex items-center gap-2 mb-2">
              <div className="flex-1 h-1.5 rounded-full bg-stone-200 overflow-hidden">
                <div className="h-full bg-emerald-500 rounded-full transition-all" style={{ width: `${(idx / queue.length) * 100}%` }} />
              </div>
              <span className="text-[11px] font-black text-stone-500">{idx + 1}/{queue.length}</span>
            </div>

            <div className="bg-white/95 rounded-2xl border border-stone-200/80 shadow-card p-3.5">
              <p className="font-extrabold text-ink text-[15px] leading-tight">{current.lead.name}</p>
              <p className="text-[11.5px] font-bold text-stone-500 mt-0.5">
                {catLabel(current.lead.cat)} · {current.lead.city} · <span className="text-emerald-700">{waDisplayNumber(current.lead.phone)}</span>
              </p>
              {!current.info.confirmed && (
                <p className="mt-1.5 inline-flex items-center gap-1 text-[10.5px] font-bold text-amber-700 bg-brand-soft/70 border border-brand/40 rounded-full px-2 py-0.5">
                  <MessageSquareWarning size={10} /> Mobile, WhatsApp not confirmed
                </p>
              )}
            </div>

            <div className="flex items-center justify-between mt-3 mb-1">
              <p className="text-[10.5px] font-extrabold tracking-wider text-stone-400">MESSAGE</p>
              <button onClick={() => { setTextOverride((m) => { const n = { ...m }; delete n[current.lead.bizId]; return n; }); }}
                className="tap text-[11px] font-extrabold text-brand-deeper flex items-center gap-1">
                <Wand2 size={11} /> Reset draft
              </button>
            </div>
            <textarea
              rows={7}
              value={messageFor(current.lead)}
              onChange={(e) => setTextOverride((m) => ({ ...m, [current.lead.bizId]: e.target.value }))}
              className="w-full rounded-xl border border-stone-300 bg-white/80 px-3 py-2.5 text-[13px] font-medium text-ink-soft leading-relaxed outline-none focus:border-brand resize-none"
            />

            <div className="grid grid-cols-[1fr_auto_auto] gap-2 mt-3">
              <button onClick={openCurrent} className="tap h-11 rounded-2xl bg-emerald-500 hover:bg-emerald-600 text-white font-black text-[13.5px] flex items-center justify-center gap-2">
                <WhatsAppGlyph size={16} /> Open chat
              </button>
              <button onClick={copyCurrent} title="Copy message" className="tap h-11 w-11 rounded-2xl bg-white border border-stone-300 text-ink-soft flex items-center justify-center">
                <Copy size={15} />
              </button>
              <button onClick={() => setIdx((i) => i + 1)} title="Skip this lead" className="tap h-11 w-11 rounded-2xl bg-white border border-stone-300 text-ink-soft flex items-center justify-center">
                <SkipForward size={15} />
              </button>
            </div>

            <p className="text-[11px] font-semibold text-stone-400 mt-2 flex items-center gap-1">
              <Check size={11} className="text-emerald-600" /> Opens WhatsApp with the message ready — you still press Send.
            </p>
          </>
        )}

        <button onClick={onClose} className="tap mt-4 w-full h-10 rounded-2xl bg-ink text-brand font-black text-[13px] flex items-center justify-center gap-1.5">
          Back to list <ChevronRight size={14} />
        </button>
      </div>
    </div>
  );
}
