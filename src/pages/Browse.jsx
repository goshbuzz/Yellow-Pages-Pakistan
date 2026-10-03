// Browse — search results with category / city / sort filters, URL-driven.

import { useEffect, useMemo, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Search, SlidersHorizontal, MapPin, LayoutGrid } from 'lucide-react';
import { searchBusinesses } from '../lib/dataset';
import { CATEGORIES, CATEGORY_BY_ID } from '../data/categories';
import { CompanyCard } from '../components/CompanyCard';
import { SkeletonList, EmptyState, Chip } from '../components/ui';
import { CityPicker } from '../components/CityPicker';
import SeoHead from '../components/SeoHead';
import PageFaq, { makeFaqSchema } from '../components/PageFaq';

const SORTS = [
  { id: 'relevance', label: 'Best match' },
  { id: 'rating', label: 'Top rated' },
  { id: 'reviews', label: 'Most reviewed' },
  { id: 'name', label: 'A–Z' },
];

const BROWSE_FAQS = [
  {
    q: 'How do I search for businesses in a specific Pakistani city?',
    a: 'Tap the city filter chip at the top of the search page or use the search bar with your city name (e.g. "textile mills Faisalabad"). You can also select from the 420-city picker.',
  },
  {
    q: 'How can I contact a listed company directly?',
    a: 'Tap the Call button to dial their landline or mobile (03xx) number immediately, or tap WhatsApp to initiate a direct chat with their sales or customer support line.',
  },
  {
    q: 'How do I save businesses from search results into my Lead Workspace?',
    a: 'Open any business listing card and click "Save to Leads". The business will be bookmarked in your Lead Workspace (/leads) where you can track pipeline stages and export to CSV.',
  },
  {
    q: 'What should I do if a phone number or address is outdated?',
    a: 'Click into the profile and tap "Suggest edit" or visit /add to submit updated contact information. Our directory team reviews corrections within 48 hours.',
  },
];

export default function Browse() {
  const navigate = useNavigate();
  const [params, setParams] = useSearchParams();
  const q = params.get('q') || '';
  const cat = params.get('cat') || null;
  const city = params.get('city') || null;
  const sort = params.get('sort') || 'relevance';
  const page = +(params.get('page') || 1);

  const [input, setInput] = useState(q);
  useEffect(() => setInput(q), [q]);

  const [results, setResults] = useState(null);
  const [cityPickerOpen, setCityPickerOpen] = useState(false);
  const [showSorts, setShowSorts] = useState(false);

  const setParam = (k, v, resetPage = true) => {
    const next = new URLSearchParams(params);
    if (v == null || v === '') next.delete(k);
    else next.set(k, v);
    if (resetPage) next.delete('page');
    setParams(next);
  };

  const activeCat = cat ? CATEGORY_BY_ID[+cat] : null;

  useEffect(() => {
    let alive = true;
    setResults(null);
    searchBusinesses({ q, cat, city, sort, page, perPage: 12 }).then((r) => {
      if (alive) setResults(r);
    });
    return () => { alive = false; };
  }, [q, cat, city, sort, page]);

  const totalPages = results?.pages || 1;

  // Dynamic SEO title & description
  const pageTitle = useMemo(() => {
    if (q && city) return `"${q}" in ${city}, Pakistan — Business Directory`;
    if (q) return `"${q}" Businesses in Pakistan — Directory Search`;
    if (activeCat && city) return `${activeCat.name} in ${city}, Pakistan`;
    if (activeCat) return `${activeCat.name} in Pakistan — Verified Directory`;
    if (city) return `Business Directory ${city}, Pakistan — 200,000+ Listings`;
    return 'Browse & Search 200,000+ Pakistani Businesses';
  }, [q, city, activeCat]);

  const pageDesc = useMemo(() => {
    return `Search and contact verified businesses in ${city || 'Pakistan'}. View direct phone numbers, WhatsApp, addresses, and Google Maps directions. Free online directory.`;
  }, [city]);

  const schema = makeFaqSchema(BROWSE_FAQS);

  return (
    <div className="animate-slide-up pb-8 space-y-4">
      <SeoHead
        title={pageTitle}
        description={pageDesc}
        canonicalPath="/browse"
        schema={schema}
      />

      {/* Main Page Heading (Semantic H1) */}
      <div>
        <h1 className="text-xl sm:text-2xl font-black text-ink">
          {activeCat ? `${activeCat.emoji} ${activeCat.name}` : city ? `Businesses in ${city}` : 'Search Pakistan Directory'}
        </h1>
        <p className="text-xs sm:text-sm font-semibold text-stone-500 mt-0.5">
          Find verified phone numbers, WhatsApp, and locations across 420 cities.
        </p>
      </div>

      {/* Search bar */}
      <div className="flex items-center gap-2 bg-white rounded-2xl px-3.5 h-12 border border-stone-300 shadow-card">
        <Search size={17} className="text-stone-400" />
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && setParam('q', input)}
          placeholder="Search businesses…"
          className="flex-1 bg-transparent outline-none text-[15px] font-bold text-ink placeholder:font-semibold placeholder:text-stone-400"
        />
        {input && input !== q && (
          <button onClick={() => setParam('q', input)} className="tap bg-ink text-brand font-black text-[12px] rounded-xl px-3 py-1.5">Go</button>
        )}
      </div>

      {/* Filters */}
      <div className="flex gap-2 overflow-x-auto no-scrollbar pb-0.5">
        <Chip active={!!city} onClick={() => setCityPickerOpen(true)}>
          <MapPin size={12} /> {city || 'All Pakistan'}
        </Chip>
        <Chip active={!!cat} onClick={() => !cat && navigate('/categories')}>
          <LayoutGrid size={12} />
          {activeCat ? `${activeCat.emoji} ${activeCat.name}` : 'All categories'}
          {activeCat && (
            <button onClick={(e) => { e.stopPropagation(); setParam('cat', null); }} className="ml-1 font-black">×</button>
          )}
        </Chip>
        <Chip active={showSorts} onClick={() => setShowSorts((s) => !s)}>
          <SlidersHorizontal size={12} /> {SORTS.find((s) => s.id === sort)?.label}
        </Chip>
      </div>

      {showSorts && (
        <div className="flex gap-2 overflow-x-auto no-scrollbar animate-pop-in">
          {SORTS.map((s) => (
            <Chip key={s.id} active={sort === s.id} onClick={() => { setParam('sort', s.id === 'relevance' ? null : s.id); setShowSorts(false); }}>
              {s.label}
            </Chip>
          ))}
        </div>
      )}

      {/* Results Meta */}
      <div className="flex items-baseline justify-between pt-1">
        <p className="text-[12.5px] font-extrabold text-stone-500">
          {results ? <>{results.total.toLocaleString()} results{city ? ` in ${city}` : ''}</> : 'Searching…'}
        </p>
        {results && totalPages > 1 && <p className="text-[12px] font-bold text-stone-400">Page {page}/{totalPages}</p>}
      </div>

      {!results ? (
        <SkeletonList n={6} />
      ) : results.rows.length === 0 ? (
        <EmptyState emoji="🕵️" title="No businesses found" hint={`Nothing matches “${q}”. Try a shorter word or different city.`} />
      ) : (
        <div className="space-y-3">
          {results.rows.map((b) => <CompanyCard key={(b.bizId || (b.__i >= 0 ? 'g' + b.__i : b.name)) + b.name} b={b} />)}
        </div>
      )}

      {/* Pagination */}
      {results && totalPages > 1 && (
        <div className="flex items-center justify-center gap-1.5 mt-5">
          <button disabled={page <= 1} onClick={() => setParam('page', String(page - 1), false)}
            className={`tap px-3.5 py-2 rounded-xl text-[13px] font-extrabold border ${page <= 1 ? 'bg-stone-100 text-stone-300 border-stone-200' : 'bg-white border-stone-300 text-ink'}`}>← Prev</button>
          {page > 2 && <span className="text-stone-400 font-bold">…</span>}
          {Array.from({ length: Math.min(3, totalPages) }, (_, i) => {
            const start = Math.max(1, Math.min(page - 1, totalPages - 2));
            const p = start + i;
            return (
              <button key={p} onClick={() => setParam('page', String(p), false)}
                className={`tap w-9 h-9 rounded-xl text-[13px] font-extrabold border ${p === page ? 'bg-ink text-brand border-ink' : 'bg-white border-stone-300 text-ink'}`}>{p}</button>
            );
          })}
          {totalPages - page > 2 && <span className="text-stone-400 font-bold">…</span>}
          <button disabled={page >= totalPages} onClick={() => setParam('page', String(page + 1), false)}
            className={`tap px-3.5 py-2 rounded-xl text-[13px] font-extrabold border ${page >= totalPages ? 'bg-stone-100 text-stone-300 border-stone-200' : 'bg-white border-stone-300 text-ink'}`}>Next →</button>
        </div>
      )}

      <CityPicker open={cityPickerOpen} value={city}
        onSelect={(c) => { setParam('city', c); setCityPickerOpen(false); }}
        onClose={() => setCityPickerOpen(false)} />

      {/* Page-Specific FAQ Block */}
      <div className="mt-8 pt-4">
        <PageFaq
          title="Search & Directory FAQ"
          subtitle="How to find businesses and navigate search results in Pakistan."
          faqs={BROWSE_FAQS}
        />
      </div>
    </div>
  );
}
