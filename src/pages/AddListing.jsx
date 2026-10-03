// Get Listed — free business listing (USP #2: two-sided marketplace).
// Free forever, 48h verification copy, local store + optional Formspree forward.

import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Sparkles, Trash2, Rocket, Eye, PhoneCall, BadgeCheck } from 'lucide-react';
import { CATEGORIES } from '../data/categories';
import { CITIES } from '../data/geo';
import { useToast } from '../components/ui';
import SeoHead from '../components/SeoHead';
import PageFaq, { makeFaqSchema } from '../components/PageFaq';

const LS_KEY = 'ypk.submissions.v1';
const FORMSPREE = import.meta.env.VITE_FORMSPREE_ID || '';

const ADD_FAQS = [
  {
    q: 'Is listing a business really 100% free?',
    a: 'Yes, basic listings on Yellow Pages Pakistan are free forever. There are no registration fees, monthly subscription costs, or commissions on inquiries.',
  },
  {
    q: 'How long does the 48-hour verification take?',
    a: 'Our directory editorial team reviews submissions within 48 business hours to verify the contact number and category authenticity before attaching a verified badge.',
  },
  {
    q: 'What information do I need to prepare before listing?',
    a: 'You only need your business name, primary industry category, city/area, and an active phone or WhatsApp number. Email, website, and operating hours are optional.',
  },
  {
    q: 'Can I edit or update my phone number later?',
    a: 'Yes. You can manage submissions from this device or re-submit updated details anytime to request an update to your public profile.',
  },
];

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

    try {
      const next = [...submissions, entry];
      localStorage.setItem(LS_KEY, JSON.stringify(next));
    } catch { /* ignore quota */ }

    setSending(false);
    setDone(true);
    setTick((t) => t + 1);
    toast('Listing submitted for review! 🎉', '🎉');
  };

  const inputCls = 'w-full bg-white/90 border border-stone-300 rounded-xl px-3.5 py-2.5 text-[14px] font-bold text-ink placeholder:font-semibold placeholder:text-stone-400 outline-none focus:border-brand shadow-sm';
  const schema = makeFaqSchema(ADD_FAQS);

  return (
    <div className="animate-slide-up pb-8 space-y-4">
      <SeoHead
        title="List Your Business in Pakistan for Free (48-Hr Verification) | Yellow Pages PK"
        description="Submit your Pakistani company to Pakistan's premier business directory. Free forever listing with verified badge, direct phone, WhatsApp link, and Google Maps pin."
        canonicalPath="/add"
        schema={schema}
      />

      <div className="rounded-[28px] bg-gradient-to-br from-brand to-amber-400 p-5 shadow-pop text-ink relative overflow-hidden">
        <div className="absolute -right-6 -bottom-8 text-[110px] opacity-15 rotate-12">🏪</div>
        <h1 className="font-black text-2xl leading-tight">List your business — <br />free forever 📋</h1>
        <p className="text-[13px] font-bold text-ink/80 mt-1">Get discovered by buyers, freelancers & agencies across Pakistan.</p>
        <div className="flex gap-4 mt-3 text-[12px] font-extrabold text-ink/90">
          <span className="flex items-center gap-1"><Eye size={13} /> Thousands daily</span>
          <span className="flex items-center gap-1"><PhoneCall size={13} /> Direct calls & WA</span>
          <span className="flex items-center gap-1"><BadgeCheck size={13} /> 48h verified</span>
        </div>
      </div>

      {done && (
        <div className="rounded-2xl bg-emerald-50 border border-emerald-300 p-4 text-emerald-950 text-[13px] font-bold animate-pop-in">
          <p className="font-black text-[15px] text-emerald-900 flex items-center gap-1.5">🎉 Listing submitted!</p>
          <p className="mt-1">Our review team will verify your phone number within 48 hours. Your free listing will appear with a verified badge, call/WhatsApp buttons and map pin.</p>
          <button onClick={() => { setForm(empty); setDone(false); }} className="mt-2 text-emerald-800 underline font-black">Submit another business</button>
        </div>
      )}

      {/* Form */}
      <form onSubmit={submit} className="bg-white/95 rounded-[24px] border border-stone-200/80 shadow-card p-5 space-y-3">
        <h2 className="font-black text-ink text-base">Business details</h2>
        <input className={inputCls} placeholder="Business name * (e.g. Al-Madina Medical Store)" value={form.name} onChange={(e) => set('name', e.target.value)} required />
        <div className="grid grid-cols-2 gap-3">
          <select className={inputCls} value={form.cat} onChange={(e) => set('cat', e.target.value)} required>
            <option value="">Category *</option>
            {CATEGORIES.map((c) => <option key={c.id} value={c.id}>{c.emoji} {c.name}</option>)}
          </select>
          <select className={inputCls} value={form.city} onChange={(e) => set('city', e.target.value)} required>
            <option value="">City *</option>
            {CITIES.map((c) => <option key={c.name} value={c.name}>{c.name}</option>)}
          </select>
        </div>
        <input className={inputCls} placeholder="Area / Colony / Market (e.g. Saddar, Gulberg, F-7)" value={form.area} onChange={(e) => set('area', e.target.value)} />
        <input className={inputCls} placeholder="Phone number * (03xx-xxxxxxx)" value={form.phone} onChange={(e) => set('phone', e.target.value)} inputMode="tel" required />
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

      {/* Boost teaser */}
      <div className="rounded-[24px] bg-ink text-cream p-5 shadow-pop relative overflow-hidden">
        <div className="absolute -right-4 -top-6 text-[80px] opacity-10 rotate-12">🚀</div>
        <h2 className="font-black text-lg flex items-center gap-2"><Rocket size={17} className="text-brand" /> Want more calls? (coming soon)</h2>
        <p className="text-[12.5px] font-semibold text-stone-300 mt-1 leading-relaxed">
          <b className="text-brand">Boosted listings</b> will appear at the top of your category & city — with a featured badge and analytics. Join the waitlist by submitting your listing today; boosters get first access.
        </p>
      </div>

      {/* My listings */}
      {submissions.length > 0 && (
        <div>
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

      <div className="mt-8 pt-4">
        <PageFaq
          title="Free Listing FAQ"
          subtitle="Everything you need to know about registering your business."
          faqs={ADD_FAQS}
        />
      </div>
    </div>
  );
}
