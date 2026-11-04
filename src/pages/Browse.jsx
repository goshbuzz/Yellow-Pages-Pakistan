// Browse — search results with city / category / sort filters, URL-driven.
//
// Three things this page had to fix:
//  1. You could not *type* a city name — only pick one from a 420-item modal. The filter
//     panel now has a city combobox that matches as you type (and still opens the full
//     province-grouped picker for browsing).
//  2. The filter panel is collapsible on a phone, so results are not pushed two screens
//     down by chrome the user cannot collapse.
//  3. The user's own custom listings appear here too, marked as theirs.

import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useSearchParams, useNavigate } from 'react-router-dom';
import {
  Search, SlidersHorizontal, MapPin, LayoutGrid, ChevronDown, X, Plus, RotateCcw,
} from 'lucide-react';
import { searchBusinesses } from '../lib/dataset';
import { CATEGORIES, CATEGORY_BY_ID, slug as catSlug } from '../data/categories';
import { CITIES, slugify as citySlug } from '../data/geo';
import LandingInfo from '../components/LandingInfo';
import { CompanyCard } from '../components/CompanyCard';
import { SkeletonList, EmptyState, Chip, PageHeader } from '../components/ui';
import { STATS, CITY_COVERAGE } from '../data/stats.generated';
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
    a: 'Type the city name into the City box in the filter panel — it matches as you type, e.g. "sahi", "faisal", "karachi". You can also tap "All cities" to browse the full province-grouped list of 420 cities and towns, or include the city in the main search box.',
  },
  {
    q: 'How can I contact a listed company directly?',
    a: 'Tap Call to dial their landline or mobile (03xx) number immediately. Mobile listings also have a WhatsApp button that opens a direct chat with that number, pre-filled with a short opener; landline listings show Copy number instead, because a landline cannot receive WhatsApp.',
  },
  {
    q: 'How do I add a business the directory does not have yet?',
    a: 'Use "My listings" to add it yourself — it appears in your own searches, lead lists and CSV exports instantly, and stays on your device. If you own the business, use the free public listing form instead so everyone can find it.',
  },
  {
    q: 'How do I save businesses from search results into my Lead Workspace?',
    a: 'Tap the bookmark icon on any result card. Saved businesses move to your Lead Workspace where you can track pipeline stages, draft a pitch and export to CSV.',
  },
];

/** Cities that actually have listings float to the top of the city suggestions. */
const CITY_HITS = [...CITIES].sort(
  (a, b) => (STATS.byCity[b.name] || 0) - (STATS.byCity[a.name] || 0) || a.name.localeCompare(b.name)
);

export default function Browse({ preset = null }) {
  const navigate = useNavigate();
  const [params, setParams] = useSearchParams();
  const q = params.get('q') || '';
  // `preset` is set on the clean landing routes (/category/:slug, /city/:slug)
  const cat = preset?.cat != null ? String(preset.cat) : (params.get('cat') || null);
  const city = preset?.city ?? (params.get('city') || null);
  const sort = params.get('sort') || 'relevance';
  const page = +(params.get('page') || 1);

  const [input, setInput] = useState(q);
  useEffect(() => setInput(q), [q]);

  const [results, setResults] = useState(null);
  const [cityPickerOpen, setCityPickerOpen] = useState(false);
  const [showSorts, setShowSorts] = useState(false);
  const [filtersOpen, setFiltersOpen] = useState(false);

  // ── City combobox: type to filter, no modal required ──────────────────────
  const [cityQuery, setCityQuery] = useState(city || '');
  const [cityOpen, setCityOpen] = useState(false);
  const cityBoxRef = useRef(null);
  useEffect(() => setCityQuery(city || ''), [city]);
  useEffect(() => {
    const onDoc = (e) => { if (cityBoxRef.current && !cityBoxRef.current.contains(e.target)) setCityOpen(false); };
    document.addEventListener('mousedown', onDoc);
    document.addEventListener('touchstart', onDoc);
    return () => { document.removeEventListener('mousedown', onDoc); document.removeEventListener('touchstart', onDoc); };
  }, []);

  const cityMatches = useMemo(() => {
    const t = cityQuery.trim().toLowerCase();
    if (!t) return CITY_HITS.slice(0, 8);
    return CITY_HITS.filter((c) => c.name.toLowerCase().includes(t)).slice(0, 8);
  }, [cityQuery]);

  const applyCity = (name) => {
    setCityQuery(name || '');
    setCityOpen(false);
    setParam('city', name);
  };

  const setParam = (k, v, resetPage = true) => {
    const next = new URLSearchParams(params);
    if (v == null || v === '') next.delete(k);
    else next.set(k, v);
    if (resetPage) next.delete('page');
    // Changing category/city on a landing page leaves it for the general search page.
    if (preset && (k === 'cat' || k === 'city')) {
      if (preset.cat != null && k !== 'cat') next.set('cat', String(preset.cat));
      if (preset.city != null && k !== 'city') next.set('city', preset.city);
      navigate(`/browse?${next.toString()}`);
      return;
    }
    setParams(next);
  };

  const activeCat = cat ? CATEGORY_BY_ID[+cat] : null;

  // Typing a city into the main box is a common move ("karachi"). If the term *is* a city
  // and no city filter is applied, offer one tap to turn it into a proper filter.
  const cityHint = useMemo(() => {
    const t = q.trim().toLowerCase();
    if (!t || city || t.length < 3) return null;
    return CITIES.find((c) => c.name.toLowerCase() === t) || null;
  }, [q, city]);
  const filterCount = [city, cat, sort !== 'relevance' ? sort : null].filter(Boolean).length;

  useEffect(() => {
    let alive = true;
    setResults(null);
    searchBusinesses({ q, cat, city, sort, page, perPage: 12 }).then((r) => {
      if (alive) setResults(r);
    });
    return () => { alive = false; };
  }, [q, cat, city, sort, page]);

  const totalPages = results?.pages || 1;

  const pageTitle = useMemo(() => {
    if (preset && !q) return preset.page.title;
    if (q && city) return `"${q}" in ${city}, Pakistan — Business Directory`;
    if (q) return `"${q}" Businesses in Pakistan — Directory Search`;
    if (activeCat && city) return `${activeCat.name} in ${city}, Pakistan`;
    if (activeCat) return `${activeCat.name} in Pakistan — Business Directory`;
    if (city) return `Business Directory ${city}, Pakistan`;
    return 'Browse & Search Pakistani Businesses';
  }, [q, city, activeCat, preset]);

  const pageDesc = useMemo(() => {
    if (preset && !q) return preset.page.description;
    return `Search businesses in ${city || 'Pakistan'}. View phone numbers, WhatsApp availability, addresses, and Google Maps directions. Free online directory.`;
  }, [city, preset, q]);

  const canonicalPath = preset
    ? preset.page.path
    : activeCat && !city && !q ? `/category/${catSlug(activeCat.name)}`
    : city && !activeCat && !q ? `/city/${citySlug(city)}`
    : '/browse';

  const schema = preset ? preset.page.schema : makeFaqSchema(BROWSE_FAQS);
  const coveredCount = CITY_COVERAGE.length;

  return (
    <div className="page-stack pb-10">
      <SeoHead title={pageTitle} description={pageDesc} canonicalPath={canonicalPath} schema={schema} />

      <PageHeader
        title={preset ? preset.page.h1 : activeCat ? `${activeCat.emoji} ${activeCat.name}` : city ? `Businesses in ${city}` : 'Search directory'}
        subtitle={
          STATS.total > 0
            ? `${STATS.total.toLocaleString()} listings across ${coveredCount} cit${coveredCount === 1 ? 'y' : 'ies'}. Tap a card for directions and one-tap WhatsApp.`
            : 'Every listing here is sourced or owner-submitted — nothing is invented to fill space.'
        }
      />

      {/* ── Search + filter panel ─────────────────────────────────────────── */}
      <div className="stack-md">
        <div className="flex items-center gap-2 bg-white rounded-2xl px-3.5 min-h-[3rem] border border-stone-300 shadow-card">
          <Search size={17} className="text-stone-400 shrink-0" />
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && setParam('q', input)}
            placeholder="Business name or category…"
            aria-label="Search businesses"
            className="flex-1 min-w-0 bg-transparent outline-none text-[15px] font-bold text-ink placeholder:font-semibold placeholder:text-stone-400"
          />
          {input !== q && (
            <button onClick={() => setParam('q', input)} className="tap shrink-0 bg-ink text-brand font-black text-[12px] rounded-xl px-3 py-1.5">
              Go
            </button>
          )}
          {q && input === q && (
            <button onClick={() => { setInput(''); setParam('q', null); }} aria-label="Clear search" className="tap tap-sm shrink-0 w-7 h-7 rounded-full bg-stone-100 text-stone-500 flex items-center justify-center">
              <X size={13} />
            </button>
          )}
        </div>

        {/* Filter summary row — always visible, one line */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setFiltersOpen((o) => !o)}
            aria-expanded={filtersOpen}
            className={`tap inline-flex items-center gap-1.5 rounded-full border px-3.5 min-h-[2.5rem] text-[12.5px] font-extrabold ${filterCount ? 'bg-ink text-brand border-ink' : 'bg-white border-stone-300 text-ink-soft'}`}
          >
            <SlidersHorizontal size={13} /> Filters
            {filterCount > 0 && (
              <span className="bg-brand text-ink rounded-full min-w-[16px] h-4 px-1 text-[10px] font-black flex items-center justify-center">{filterCount}</span>
            )}
            <ChevronDown size={13} className={`transition-transform ${filtersOpen ? 'rotate-180' : ''}`} />
          </button>
          {filterCount > 0 && (
            <button
              onClick={() => { navigate(preset ? preset.page.path : '/browse'); setCityQuery(''); }}
              className="tap inline-flex items-center gap-1 text-[12px] font-extrabold text-stone-500 px-1"
            >
              <RotateCcw size={12} /> Reset
            </button>
          )}
          <span className="ml-auto text-[12px] font-extrabold text-stone-500 shrink-0">
            {results ? `${results.total.toLocaleString()} found${city ? ` in ${city}` : ''}` : 'Searching…'}
          </span>
        </div>

        {cityHint && (
          <button
            onClick={() => { setInput(''); applyCity(cityHint.name); setParam('q', null); }}
            className="tap flex items-center gap-2 rounded-2xl border border-brand/50 bg-brand-soft px-3.5 py-2.5 text-left"
          >
            <MapPin size={14} className="text-brand-deeper shrink-0" />
            <span className="text-[12.5px] font-bold text-ink-soft min-w-0">
              Searching everything for “{q}”. Filter to <b>{cityHint.name}</b> instead?
            </span>
          </button>
        )}

        {/* Applied filters as removable pills */}
        {(city || activeCat) && (
          <div className="flex gap-2 flex-wrap">
            {city && (
              <Chip active onClick={() => applyCity(null)}>
                <MapPin size={12} /> {city} <X size={12} className="ml-0.5" />
              </Chip>
            )}
            {activeCat && (
              <Chip active onClick={() => setParam('cat', null)}>
                {activeCat.emoji} {activeCat.name} <X size={12} className="ml-0.5" />
              </Chip>
            )}
          </div>
        )}

        {/* The panel */}
        {filtersOpen && (
          <div className="card card-pad stack-md animate-pop-in">
            {/* City — typeable combobox */}
            <div ref={cityBoxRef} className="relative">
              <label className="field-label" htmlFor="browse-city">
                <MapPin size={12} className="inline -mt-0.5 mr-1" /> City
              </label>
              <div className="flex gap-2">
                <div className="relative flex-1 min-w-0">
                  <input
                    id="browse-city"
                    className="field"
                    value={cityQuery}
                    onChange={(e) => { setCityQuery(e.target.value); setCityOpen(true); }}
                    onFocus={() => setCityOpen(true)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') { e.preventDefault(); applyCity(cityMatches[0]?.name || cityQuery.trim() || null); }
                      if (e.key === 'Escape') setCityOpen(false);
                    }}
                    placeholder="Type a city, e.g. Sahiwal"
                    autoComplete="off"
                    role="combobox"
                    aria-expanded={cityOpen}
                    aria-controls="browse-city-list"
                  />
                  {cityQuery && (
                    <button
                      type="button"
                      onClick={() => applyCity(null)}
                      aria-label="Clear city"
                      className="tap-sm absolute right-2.5 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-stone-100 text-stone-500 flex items-center justify-center"
                    >
                      <X size={12} />
                    </button>
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => { setCityOpen(false); setCityPickerOpen(true); }}
                  className="btn-secondary shrink-0"
                >
                  All cities
                </button>
              </div>

              {cityOpen && (
                <div id="browse-city-list" role="listbox" className="absolute z-30 left-0 right-0 mt-2 bg-white rounded-2xl border border-stone-200 shadow-pop overflow-hidden max-h-72 overflow-y-auto">
                  <button
                    type="button"
                    onClick={() => applyCity(null)}
                    className={`w-full text-left px-3.5 py-2.5 text-[13px] font-extrabold ${!city ? 'bg-brand-soft text-ink' : 'text-ink-soft'}`}
                  >
                    All Pakistan
                  </button>
                  {cityMatches.map((c) => {
                    const n = STATS.byCity[c.name] || 0;
                    return (
                      <button
                        key={c.name}
                        type="button"
                        onClick={() => applyCity(c.name)}
                        className={`w-full text-left px-3.5 py-2.5 flex items-center justify-between gap-2 border-t border-stone-100 ${city === c.name ? 'bg-brand-soft' : 'hover:bg-stone-50'}`}
                      >
                        <span className="min-w-0 truncate text-[13px] font-extrabold text-ink">{c.name}</span>
                        <span className="shrink-0 text-[10.5px] font-extrabold text-stone-400">
                          {n ? `${n.toLocaleString()} listings` : c.province}
                        </span>
                      </button>
                    );
                  })}
                  {cityMatches.length === 0 && (
                    <p className="px-3.5 py-4 text-[12.5px] font-semibold text-stone-500">
                      No city matches “{cityQuery}”. Tap <b>All cities</b> to browse all 420.
                    </p>
                  )}
                </div>
              )}
            </div>

            {/* Category */}
            <div>
              <label className="field-label" htmlFor="browse-cat">
                <LayoutGrid size={12} className="inline -mt-0.5 mr-1" /> Category
              </label>
              <select
                id="browse-cat"
                className="field"
                value={cat || ''}
                onChange={(e) => setParam('cat', e.target.value || null)}
              >
                <option value="">All categories</option>
                {CATEGORIES.map((c) => (
                  <option key={c.id} value={c.id}>{c.emoji} {c.name}</option>
                ))}
              </select>
            </div>

            {/* Sort */}
            <div>
              <span className="field-label">Sort by</span>
              <div className="flex gap-2 flex-wrap">
                {SORTS.map((s) => (
                  <Chip key={s.id} active={sort === s.id} onClick={() => setParam('sort', s.id === 'relevance' ? null : s.id)}>
                    {s.label}
                  </Chip>
                ))}
              </div>
            </div>

            <button onClick={() => setFiltersOpen(false)} className="btn-primary">
              Show {results ? results.total.toLocaleString() : ''} results
            </button>
          </div>
        )}

        {/* Compact sort row stays outside the panel for one-tap use */}
        {!filtersOpen && (
          <div className="flex gap-2 overflow-x-auto no-scrollbar pb-0.5">
            {SORTS.map((s) => (
              <Chip key={s.id} active={sort === s.id} onClick={() => setParam('sort', s.id === 'relevance' ? null : s.id)}>
                {s.label}
              </Chip>
            ))}
          </div>
        )}
      </div>

      {/* ── Results ───────────────────────────────────────────────────────── */}
      <div className="stack-md">
        {results && totalPages > 1 && (
          <p className="text-[12px] font-extrabold text-stone-400 text-center">
            Page {page} of {totalPages}
          </p>
        )}

        {!results ? (
          <SkeletonList n={5} />
        ) : results.rows.length === 0 ? (
          STATS.total === 0 ? (
            <EmptyState
              emoji="📭"
              title="No listings imported yet"
              hint="This directory ships empty by design — every listing is a real, sourced business. Add your own, or list a business publicly."
              action={
                <div className="mt-4 flex flex-col sm:flex-row gap-2 w-full max-w-xs">
                  <Link to="/my-listings" className="btn-primary flex-1"><Plus size={15} /> Add my own</Link>
                  <Link to="/add" className="btn-secondary flex-1 justify-center">List publicly</Link>
                </div>
              }
            />
          ) : results.cityUnknown ? (
            <EmptyState
              emoji="🗺️"
              title={`We have no city called “${city}”`}
              hint="Check the spelling, or pick from the 420 Pakistani cities in the city filter. Listings outside Pakistan are never shown."
              action={
                <button onClick={() => applyCity(null)} className="btn-secondary mt-4 w-full max-w-xs justify-center">
                  Browse all of Pakistan
                </button>
              }
            />
          ) : (
            <EmptyState
              emoji="🕵️"
              title={q ? 'No businesses found' : `No listings in ${city || 'this area'} yet`}
              hint={
                city && !q
                  ? `Nothing is listed in ${city} yet — this directory ships only real, sourced businesses, so cities fill up one import at a time. Try All cities, or add one you know.`
                  : `Nothing matches ${q ? `“${q}”` : 'these filters'}${city ? ` in ${city}` : ''}. Try a shorter word, or widen the city filter.`
              }
              action={
                <div className="mt-4 flex flex-col sm:flex-row gap-2 w-full max-w-xs">
                  <button onClick={() => navigate(preset ? preset.page.path : '/browse')} className="btn-secondary flex-1 justify-center">Clear filters</button>
                  <Link to="/my-listings" className="btn-primary flex-1"><Plus size={15} /> Add it myself</Link>
                </div>
              }
            />
          )
        ) : (
          <div className="stack-sm">
            {results.rows.map((b, i) => (
              <CompanyCard key={`${b.bizId || b.id || b.name}-${i}`} b={b} />
            ))}
          </div>
        )}

        {results && totalPages > 1 && (
          <div className="flex items-center justify-center gap-1.5 pt-2">
            <button
              disabled={page <= 1}
              onClick={() => setParam('page', String(page - 1), false)}
              className={`tap px-3.5 min-h-[2.5rem] rounded-xl text-[13px] font-extrabold border ${page <= 1 ? 'bg-stone-100 text-stone-300 border-stone-200' : 'bg-white border-stone-300 text-ink'}`}
            >
              ← Prev
            </button>
            {page > 2 && <span className="text-stone-400 font-bold">…</span>}
            {Array.from({ length: Math.min(3, totalPages) }, (_, i) => {
              const start = Math.max(1, Math.min(page - 1, totalPages - 2));
              const p = start + i;
              return (
                <button
                  key={p}
                  onClick={() => setParam('page', String(p), false)}
                  className={`tap w-10 h-10 rounded-xl text-[13px] font-extrabold border ${p === page ? 'bg-ink text-brand border-ink' : 'bg-white border-stone-300 text-ink'}`}
                >
                  {p}
                </button>
              );
            })}
            {totalPages - page > 2 && <span className="text-stone-400 font-bold">…</span>}
            <button
              disabled={page >= totalPages}
              onClick={() => setParam('page', String(page + 1), false)}
              className={`tap px-3.5 min-h-[2.5rem] rounded-xl text-[13px] font-extrabold border ${page >= totalPages ? 'bg-stone-100 text-stone-300 border-stone-200' : 'bg-white border-stone-300 text-ink'}`}
            >
              Next →
            </button>
          </div>
        )}
      </div>

      <CityPicker
        open={cityPickerOpen}
        value={city}
        onSelect={(c) => { applyCity(c); setCityPickerOpen(false); }}
        onClose={() => setCityPickerOpen(false)}
      />

      {preset && <LandingInfo data={preset.page} />}

      {!preset && (
        <PageFaq
          title="Search & directory FAQ"
          subtitle="How to find businesses and how the filters work."
          faqs={BROWSE_FAQS}
        />
      )}
    </div>
  );
}
