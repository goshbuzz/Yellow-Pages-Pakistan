// Coverage — which cities actually have listings, and how contactable those listings are.
//
// This page exists because "we cover 420 cities" is only true in the sense that the app knows
// where they are. A directory that shows a city with zero listings, or pretends every city is
// equally covered, is the exact dishonesty this project removed. So the real per-city numbers
// are shown: total listings, how many are on WhatsApp-capable numbers, and when they were
// imported.

import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { MapPinned, Search, Check, MessageCircle, Clock } from 'lucide-react';
import { CITIES } from '../data/geo';
import { CITY_COVERAGE } from '../data/stats.generated';
import { useLiveCounts } from '../lib/dataset';
import { EmptyState } from '../components/ui';
import SeoHead from '../components/SeoHead';
import PageFaq, { makeFaqSchema } from '../components/PageFaq';

const COVERAGE_FAQS = [
  {
    q: 'Why do only some cities have listings?',
    a: 'Because every listing is either imported from a licensed dataset or submitted by the business itself — nothing is invented to fill space. Cities are filled one at a time, newest imports first, and this page shows exactly which ones are live.',
  },
  {
    q: 'What does "WhatsApp-capable" mean here?',
    a: 'The number is a mobile (03xx), so a WhatsApp button can open a real chat. It does not mean the business has confirmed the number — only an owner verification does that, and it is shown separately.',
  },
  {
    q: 'My city has no listings. How do I get it covered?',
    a: 'List your business — it takes about two minutes, it is free, and it is the fastest way to put your city on the map. Owner-submitted listings are the highest-trust records in the directory.',
  },
  {
    q: 'Where does the contact data come from?',
    a: 'From datasets whose licences permit storage and reuse (Overture Maps, Foursquare Open Source Places) and from business owners. Google Maps content is not used: its terms prohibit extracting or warehousing it for a directory like this.',
  },
];

export default function Coverage() {
  const [q, setQ] = useState('');
  const [only, setOnly] = useState('all'); // all | covered | empty
  const counts = useLiveCounts();

  const coverageMap = useMemo(
    () => Object.fromEntries(CITY_COVERAGE.map((c) => [c.name, c])),
    []
  );

  const rows = useMemo(() => {
    const enriched = CITIES.map((c) => {
      const cov = coverageMap[c.name];
      return {
        name: c.name,
        province: c.province,
        total: counts.byCity[c.name] || 0,
        whatsappCapable: counts.byCityWa[c.name] || 0,
        ownerVerified: cov?.ownerVerified || 0,
        lastImportAt: cov?.lastImportAt || null,
      };
    }).sort((a, b) => b.total - a.total || a.name.localeCompare(b.name));

    return enriched.filter((r) => {
      if (only === 'covered' && r.total === 0) return false;
      if (only === 'empty' && r.total > 0) return false;
      if (q && !r.name.toLowerCase().includes(q.toLowerCase())) return false;
      return true;
    });
  }, [q, only, coverageMap, counts]);

  const schema = makeFaqSchema(COVERAGE_FAQS);
  const citiesCovered = Object.keys(counts.byCity).length;
  const citiesTotal = CITIES.length;
  const pct = citiesTotal ? Math.round((citiesCovered / citiesTotal) * 100) : 0;
  const waPct = counts.total ? Math.round((counts.whatsappCapable / counts.total) * 100) : 0;

  return (
    <div className="animate-slide-up pb-8 space-y-4">
      <SeoHead
        title="Coverage Map — Which Pakistani Cities Have Listings | Yellow Pages PK"
        description="Live per-city coverage: how many real listings each Pakistani city has, how many are WhatsApp-capable, and when they were imported. No invented listings."
        canonicalPath="/coverage"
        schema={schema}
      />

      <div>
        <h1 className="font-black text-2xl text-ink flex items-center gap-2">
          <MapPinned size={22} className="text-brand-deeper" /> Coverage
        </h1>
        <p className="text-[13px] font-semibold text-stone-500 mt-0.5">
          Real numbers per city — nothing padded, nothing invented.
        </p>
      </div>

      <div className="grid grid-cols-3 gap-2.5">
        {[
          { v: citiesCovered, l: `of ${citiesTotal} cities`, hint: `${pct}%` },
          { v: counts.total, l: 'listings', hint: null },
          { v: counts.whatsappCapable, l: 'WhatsApp-capable', hint: counts.total ? `${waPct}%` : null },
        ].map((s) => (
          <div key={s.l} className="bg-white/90 rounded-2xl border border-stone-200/80 py-3 text-center shadow-card">
            <p className="text-xl font-black text-ink">{s.v.toLocaleString()}</p>
            <p className="text-[10px] font-extrabold tracking-wider text-stone-400 uppercase">{s.l}</p>
            {s.hint && <p className="text-[10px] font-bold text-brand-deeper">{s.hint}</p>}
          </div>
        ))}
      </div>

      <div className="flex items-center gap-2 bg-white rounded-2xl px-3.5 h-11 border border-stone-300 shadow-card">
        <Search size={16} className="text-stone-400" />
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Find a city…"
          className="flex-1 bg-transparent outline-none text-[14px] font-bold text-ink placeholder:font-semibold placeholder:text-stone-400"
        />
      </div>

      <div className="flex gap-2">
        {[
          { id: 'all', label: `All ${CITIES.length}` },
          { id: 'covered', label: `With listings (${citiesCovered})` },
          { id: 'empty', label: `Awaiting (${citiesTotal - citiesCovered})` },
        ].map((f) => (
          <button
            key={f.id}
            onClick={() => setOnly(f.id)}
            className={`tap shrink-0 rounded-full px-3 py-1.5 text-[11.5px] font-extrabold border ${only === f.id ? 'bg-ink text-brand border-ink' : 'bg-white/80 border-stone-300 text-ink-soft'}`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {rows.length === 0 ? (
        <EmptyState emoji="🔍" title="No cities match" hint="Try a shorter name or clear the filters." />
      ) : (
        <div className="grid gap-2 lg:grid-cols-2">
          {rows.slice(0, 120).map((r) => (
            <Link
              key={r.name}
              to={r.total > 0 ? `/browse?city=${encodeURIComponent(r.name)}` : '/add'}
              className="tap flex items-center justify-between gap-3 bg-white/90 rounded-2xl border border-stone-200/80 px-3.5 py-2.5 shadow-card"
            >
              <div className="min-w-0">
                <p className="font-extrabold text-ink text-[14px] truncate flex items-center gap-1.5">
                  {r.name}
                  {r.ownerVerified > 0 && <Check size={12} className="text-emerald-600" aria-label="has owner-verified listings" />}
                </p>
                <p className="text-[10.5px] font-bold text-stone-400 truncate">
                  {r.province}
                  {r.lastImportAt ? ` · updated ${r.lastImportAt.slice(0, 10)}` : ''}
                </p>
              </div>
              {r.total > 0 ? (
                <div className="text-right shrink-0">
                  <p className="font-black text-ink text-[14px]">{r.total.toLocaleString()}</p>
                  <p className="text-[10px] font-extrabold text-emerald-700 flex items-center gap-1 justify-end">
                    <MessageCircle size={9} /> {r.whatsappCapable.toLocaleString()}
                  </p>
                </div>
              ) : (
                <span className="shrink-0 text-[10.5px] font-extrabold text-brand-deeper bg-brand-soft border border-brand/40 rounded-full px-2 py-0.5 flex items-center gap-1">
                  <Clock size={9} /> list yours
                </span>
              )}
            </Link>
          ))}
          {rows.length > 120 && (
            <p className="text-center text-[11.5px] font-bold text-stone-400 py-2">
              Showing 120 of {rows.length.toLocaleString()} cities — use search to narrow down.
            </p>
          )}
        </div>
      )}

      <div className="mt-8 pt-4">
        <PageFaq title="Coverage FAQ" subtitle="How the directory fills and how to get your city listed." faqs={COVERAGE_FAQS} />
      </div>
    </div>
  );
}
