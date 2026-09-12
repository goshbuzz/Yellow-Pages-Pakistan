// Get Listed — free business listing (USP #2: two-sided marketplace).
// Free forever, 48h verification copy, local store + optional Formspree forward.

import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Sparkles, Trash2, Rocket, Eye, PhoneCall, BadgeCheck } from 'lucide-react';
import { CATEGORIES } from '../data/categories';
import { CITIES } from '../data/geo';
import { useToast } from '../components/ui';

const LS_KEY = 'ypk.submissions.v1';
const FORMSPREE = import.meta.env.VITE_FORMSPREE_ID || '';

export default function AddListing() {
  const toast = useToast();
  const empty = { name: '', cat: '', city: '', area: '', phone: '', whatsapp: false, email: '', website: '', address: '', hours: '', desc: '' };
  const [form, setForm] = useState(empty);
  const [done, setDone] = useState(false);
  const [tick, setTick] = useState(0);
  const [sending, setSending] = useState(false);

  const submissions = useMemo(() => {
    try { return JSON.parse(localStorage.getItem(LS_KEY)) || []; } catch { return []; }
  }, [tick]);

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));
  const valid = form.name.trim().length >= 3 && form.cat && form.city && form.phone.trim().length >= 7;

  const submit = async (e) => {
    e.preventDefault();
    if (!valid || sending) return;
    setSending(true);
    const entry = { ...form, catName: CATEGORIES.find((c) => String(c.id) === String(form.cat))?.name || '', id: 's' + Date.now().toString(36), at: Date.now(), status: 'pending' };

    // Forward to the site owner if a Formspree endpoint is configured
    if (FORMSPREE) {
      try {
        await fetch(`https://formspree.io/f/${FORMSPREE}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
          body: JSON.stringify({ _subject: `New listing: ${entry.name} (${entry.catName}, ${entry.city})`, ...entry }),
        });
      } catch { /* offline — local copy still saved below */ }
    }

    const list = [...submissions, entry];
    try { localStorage.setItem(LS_KEY, JSON.stringify(list)); } catch { /* ignore */ }
    setSending(false);
    setDone(true);
    setTick((t) => t + 1);
    toast('Listing submitted for review! 🎉', '📋');
  };

  if (done) {
    return (
      <div className="animate-pop-in text-center py-10">
        <div className="text-6xl mb-4 animate-float">🎉</div>
        <h1 className="font-black text-2xl text-ink">You're on the list!</h1>
        <p className="text-[14px] font-semibold text-stone-500 mt-2 max-w-sm mx-auto">
          <b className="text-ink">{form.name}</b> has been submitted for verification.
          Our team reviews new listings within 48 hours — then it goes live to everyone browsing the directory.
        </p>
        <div className="flex gap-2 justify-center mt-5 flex-wrap">
          <Link to="/browse" className="tap bg-ink text-brand font-black text-[13.5px] rounded-2xl px-5 py-3">Browse directory</Link>
          <button onClick={() => { setDone(false); setForm(empty); }}
            className="tap bg-white border border-stone-300 text-ink-soft font-black text-[13.5px] rounded-2xl px-5 py-3">Add another business</button>
        </div>
      </div>
    );
  }

  const inputCls = 'w-full rounded-xl border border-stone-300 bg-white/90 px-3 py-2.5 text-[14px] font-bold text-ink outline-none focus:border-brand';

  return (
    <div className="animate-slide-up">
      {/* Hero — business-owner pitch */}
      <div className="rounded-[28px] bg-gradient-to-br from-brand to-amber-400 p-5 shadow-pop text-ink mb-4">
        <h1 className="font-black text-2xl leading-tight">List your business — free. Forever. 📋</h1>
        <p className="text-[13px] font-bold mt-1.5">
          Get discovered by customers <b>and</b> by freelancers & agencies actively looking for businesses to work with.
        </p>
      </div>

      {/* Why list — benefits */}
      <div className="grid grid-cols-3 gap-2 mb-5">
        {[
          { icon: <Eye size={17} />, t: 'Get discovered', d: 'by 200,000+ listings browsers' },
          { icon: <PhoneCall size={17} />, t: 'Get calls', d: 'one-tap call & WhatsApp buttons' },
          { icon: <BadgeCheck size={17} />, t: 'Get verified', d: 'trusted badge after review' },
        ].map((b) => (
          <div key={b.t} className="bg-white/90 rounded-2xl border border-stone-200/80 p-3 text-center shadow-card">
            <span className="inline-flex w-9 h-9 rounded-full bg-brand-soft text-brand-deeper items-center justify-center mb-1.5">{b.icon}</span>
            <p className="text-[12px] font-extrabold text-ink leading-tight">{b.t}</p>
            <p className="text-[10px] font-bold text-stone-400 leading-tight mt-0.5">{b.d}</p>
          </div>
        ))}
      </div>

      <form onSubmit={submit} className="space-y-3">
        <input className={inputCls} placeholder="Business name *" value={form.name} onChange={(e) => set('name', e.target.value)} />
        <div className="grid grid-cols-2 gap-3">
          <select className={inputCls} value={form.cat} onChange={(e) => set('cat', e.target.value)}>
            <option value="">Category *</option>
            {CATEGORIES.map((c) => <option key={c.id} value={c.id}>{c.emoji} {c.name}</option>)}
          </select>
          <select className={inputCls} value={form.city} onChange={(e) => set('city', e.target.value)}>
            <option value="">City *</option>
            {CITIES.map((c) => <option key={c.name} value={c.name}>{c.name}</option>)}
          </select>
        </div>
        <input className={inputCls} placeholder="Area / neighbourhood" value={form.area} onChange={(e) => set('area', e.target.value)} />
        <input className={inputCls} placeholder="Phone number * (03xx-xxxxxxx)" value={form.phone} onChange={(e) => set('phone', e.target.value)} inputMode="tel" />
        <label className="flex items-center gap-2.5 bg-white/90 border border-stone-300 rounded-xl px-3 py-2.5 cursor-pointer">
          <input type="checkbox" checked={form.whatsapp} onChange={(e) => set('whatsapp', e.target.checked)} className="accent-[#F5B301] w-4 h-4" />
          <span className="text-[13.5px] font-bold text-ink-soft">This number is on WhatsApp</span>
        </label>
        <div className="grid grid-cols-2 gap-3">
          <input className={inputCls} placeholder="Email (optional)" value={form.email} onChange={(e) => set('email', e.target.value)} inputMode="email" />
          <input className={inputCls} placeholder="Website (optional)" value={form.website} onChange={(e) => set('website', e.target.value)} />
        </div>
        <input className={inputCls} placeholder="Full address" value={form.address} onChange={(e) => set('address', e.target.value)} />
        <input className={inputCls} placeholder="Business hours (e.g. Mon–Sat, 9 AM – 7 PM)" value={form.hours} onChange={(e) => set('hours', e.target.value)} />
        <textarea className={inputCls + ' resize-none'} rows={3} placeholder="What does your business do? (1–2 lines)" value={form.desc} onChange={(e) => set('desc', e.target.value)} />
        <button type="submit" disabled={!valid || sending}
          className={`tap w-full rounded-2xl py-3.5 font-black text-[15px] flex items-center justify-center gap-2 ${valid && !sending ? 'bg-ink text-brand shadow-pop' : 'bg-stone-200 text-stone-400 cursor-not-allowed'}`}>
          <Sparkles size={17} /> {sending ? 'Submitting…' : 'Submit for free review'}
        </button>
        <p className="text-[11px] font-semibold text-stone-400 text-center">
          Free forever — no card, no fees. Verified badge after manual review (48h).
        </p>
      </form>

      {/* Boost teaser — monetization hook */}
      <div className="mt-6 rounded-[24px] bg-ink text-cream p-5 shadow-pop relative overflow-hidden">
        <div className="absolute -right-4 -top-6 text-[80px] opacity-10 rotate-12">🚀</div>
        <h2 className="font-black text-lg flex items-center gap-2"><Rocket size={17} className="text-brand" /> Want more calls? (coming soon)</h2>
        <p className="text-[12.5px] font-semibold text-stone-300 mt-1 leading-relaxed">
          <b className="text-brand">Boosted listings</b> will appear at the top of your category & city — with a featured badge and analytics. Join the waitlist by submitting your listing today; boosters get first access.
        </p>
      </div>

      {/* My listings */}
      {submissions.length > 0 && (
        <div className="mt-6">
          <h2 className="font-black text-ink text-[15px] mb-2">My listings ({submissions.length})</h2>
          <div className="space-y-2">
            {submissions.slice().reverse().map((s) => (
              <div key={s.id} className="flex items-center justify-between bg-white/90 rounded-2xl border border-stone-200/80 px-3.5 py-2.5 shadow-card gap-2">
                <div className="min-w-0">
                  <p className="text-[13px] font-extrabold text-ink truncate">{s.name}</p>
                  <p className="text-[10.5px] font-bold text-stone-400 truncate">{s.catName || 'Listing'} · {s.city}</p>
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                  <span className="text-[10px] font-black text-amber-700 bg-brand-soft border border-brand/40 rounded-full px-2 py-0.5 flex items-center gap-1"><BadgeCheck size={10} /> PENDING</span>
                  <button onClick={() => {
                    const list = submissions.filter((x) => x.id !== s.id);
                    try { localStorage.setItem(LS_KEY, JSON.stringify(list)); } catch { /* ignore */ }
                    setTick((t) => t + 1);
                    toast('Listing removed', '🗑️');
                  }} aria-label="Delete listing" className="tap w-8 h-8 rounded-full bg-stone-100 text-stone-500 flex items-center justify-center">
                    <Trash2 size={13} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
