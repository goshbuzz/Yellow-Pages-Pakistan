// Browse — search results with category / city / sort filters, URL-driven.

import { useEffect, useMemo, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Search, SlidersHorizontal, MapPin, LayoutGrid } from 'lucide-react';
import { searchBusinesses } from '../lib/dataset';
import { CATEGORIES, CATEGORY_BY_ID } from '../data/categories';
import { CompanyCard } from '../components/CompanyCard';
import { SkeletonList, EmptyState, Chip } from '../components/ui';
import { CityPicker } from '../components/CityPicker';

const SORTS = [
  { id: 'relevance', label: 'Best match' },
  { id: 'rating', label: 'Top rated' },
  { id: 'reviews', label: 'Most reviewed' },
  { id: 'name', label: 'A–Z' },
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

  return (
    <div className="animate-slide-up">
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
      <div className="flex gap-2 mt-3 overflow-x-auto no-scrollbar pb-0.5">
        <Chip active={!!city} onClick={() => setCityPickerOpen(true)}>
          <MapPin size={12} /> {city || 'All Pakistan'}
        </Chip>
        <Chip active={!!cat} onClick={() => !cat && (window.location.hash = '#/categories')} className={cat ? '' : ''}>
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
        <div className="flex gap-2 mt-2 overflow-x-auto no-scrollbar animate-pop-in">
          {SORTS.map((s) => (
            <Chip key={s.id} active={sort === s.id} onClick={() => { setParam('sort', s.id === 'relevance' ? null : s.id); setShowSorts(false); }}>
              {s.label}
            </Chip>
          ))}
        </div>
      )}

      {/* Results */}
      <div className="flex items-baseline justify-between mt-4 mb-2.5">
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
    </div>
  );
}
