// Pitch drafter modal — generates a personalized outreach draft for a business.
// The signature feature for freelancers & marketing agencies.

import { useEffect, useMemo, useState } from 'react';
import { X, Copy, Send, Download, Wand2 } from 'lucide-react';
import { draftPitch, pitchMailto, SERVICE_TYPES, TONES } from '../lib/pitch';
import { copyToClipboard, downloadFile } from '../lib/export';
import { useToast } from './ui';
import { getPrefs, setPref } from '../lib/leads';

export function PitchModal({ business, onClose }) {
  const toast = useToast();
  const [service, setService] = useState(getPrefs().pitchService || 'web');
  const [tone, setTone] = useState(getPrefs().pitchTone || 'friendly');
  const [sender, setSender] = useState(getPrefs().pitchSender || 'Ahmed (Freelancer)');
  const [nonce, setNonce] = useState(0);

  const { subject, body } = useMemo(
    () => draftPitch(business, service + (nonce ? `#${nonce}` : ''), tone, sender),
    [business, service, tone, sender, nonce]
  );

  const [bodyText, setBodyText] = useState(body);
  const [subjectText, setSubjectText] = useState(subject);
  useMemo(() => { setBodyText(body); setSubjectText(subject); }, [body, subject]);

  const save = (k, v) => { setPref(k, v); };
  const doCopy = async (text, label) => {
    if (await copyToClipboard(text)) toast(`${label} copied!`, '📋');
    else toast('Copy failed — select & copy manually', '⚠️');
  };

  return (
    <div className="fixed inset-0 z-[96] flex items-end sm:items-center justify-center" role="dialog" aria-label="Draft pitch">
      <div className="absolute inset-0 bg-ink/50 backdrop-blur-[2px]" onClick={onClose} />
      <div className="relative w-full max-w-lg bg-cream rounded-t-[28px] sm:rounded-[28px] max-h-[92dvh] overflow-y-auto p-5 animate-slide-up shadow-pop no-scrollbar">
        <button onClick={onClose} aria-label="Close" className="tap absolute right-4 top-4 w-8 h-8 rounded-full bg-stone-200/80 flex items-center justify-center z-10">
          <X size={16} />
        </button>

        <h3 className="font-black text-lg text-ink flex items-center gap-2">
          <Wand2 size={18} className="text-brand-deeper" /> Pitch drafter
          <span className="text-[12px] font-bold text-stone-400 truncate">· {business.name}</span>
        </h3>
        <p className="text-[12.5px] font-semibold text-stone-500 mt-0.5 mb-3">Auto-personalized for this business. Edit freely, then copy or send.</p>

        <div className="grid grid-cols-3 gap-2 mb-2">
          {SERVICE_TYPES.map((s) => (
            <button key={s.id} onClick={() => { setService(s.id); save('pitchService', s.id); }}
              className={`tap rounded-2xl border p-2 text-[11px] font-extrabold leading-tight text-center ${service === s.id ? 'bg-ink text-brand border-ink' : 'bg-white/80 border-stone-300 text-ink-soft'}`}>
              <div className="text-lg">{s.emoji}</div>{s.label}
            </button>
          ))}
        </div>
        <div className="flex gap-2 mb-3">
          {TONES.map((t) => (
            <button key={t.id} onClick={() => { setTone(t.id); save('pitchTone', t.id); }}
              className={`tap flex-1 rounded-xl border py-1.5 text-[12px] font-extrabold ${tone === t.id ? 'bg-brand border-brand text-ink' : 'bg-white/80 border-stone-300 text-ink-soft'}`}>
              {t.emoji} {t.label}
            </button>
          ))}
          <button onClick={() => setNonce((n) => n + 1)} title="Regenerate variant"
            className="tap rounded-xl bg-white/80 border border-stone-300 px-3 text-[12px] font-extrabold text-ink-soft">🔄</button>
        </div>

        <input
          value={sender}
          onChange={(e) => { setSender(e.target.value); save('pitchSender', e.target.value); }}
          placeholder="Your name / agency"
          className="w-full mb-3 rounded-xl border border-stone-300 bg-white/80 px-3 py-2 text-[13px] font-bold text-ink outline-none focus:border-brand"
        />

        <p className="text-[10.5px] font-extrabold tracking-wider text-stone-400 mb-1">SUBJECT</p>
        <input value={subjectText} onChange={(e) => setSubjectText(e.target.value)}
          className="w-full mb-3 rounded-xl border border-stone-300 bg-white/80 px-3 py-2 text-[13px] font-bold text-ink outline-none focus:border-brand" />

        <p className="text-[10.5px] font-extrabold tracking-wider text-stone-400 mb-1">MESSAGE</p>
        <textarea value={bodyText} onChange={(e) => setBodyText(e.target.value)} rows={9}
          className="w-full rounded-xl border border-stone-300 bg-white/80 px-3 py-2.5 text-[13px] font-medium text-ink-soft leading-relaxed outline-none focus:border-brand resize-none" />

        <div className="grid grid-cols-3 gap-2 mt-3">
          <button onClick={() => doCopy(`${subjectText}\n\n${bodyText}`, 'Pitch')}
            className="tap bg-ink text-brand rounded-2xl py-3 text-[13px] font-extrabold flex items-center justify-center gap-1.5">
            <Copy size={15} /> Copy
          </button>
          {business.email ? (
            <a href={pitchMailto(business.email, subjectText, bodyText)}
              className="tap bg-brand text-ink rounded-2xl py-3 text-[13px] font-extrabold flex items-center justify-center gap-1.5">
              <Send size={15} /> Email
            </a>
          ) : (
            <button disabled className="bg-stone-200 text-stone-400 rounded-2xl py-3 text-[13px] font-extrabold flex items-center justify-center gap-1.5 cursor-not-allowed">
              <Send size={15} /> No email
            </button>
          )}
          <button onClick={() => { downloadFile(`pitch-${business.name.replace(/\W+/g, '-').toLowerCase()}.txt`, `Subject: ${subjectText}\n\n${bodyText}`, 'text/plain'); toast('Draft downloaded', '📥'); }}
            className="tap bg-white border border-stone-300 text-ink-soft rounded-2xl py-3 text-[13px] font-extrabold flex items-center justify-center gap-1.5">
            <Download size={15} /> .txt
          </button>
        </div>
        {business.whatsapp && (
          <a href={`https://wa.me/?text=${encodeURIComponent(`${subjectText}\n\n${bodyText}`)}`} target="_blank" rel="noreferrer"
            className="tap mt-2 w-full bg-emerald-500 text-white rounded-2xl py-3 text-[13px] font-extrabold flex items-center justify-center gap-1.5">
            Send via WhatsApp
          </a>
        )}
      </div>
    </div>
  );
}
