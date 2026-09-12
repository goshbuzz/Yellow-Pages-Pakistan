// Home — playful landing: search, live stats, popular categories, featured
// verified businesses, outreach USP, city shortcuts, install card.

import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Search, TrendingUp, ChevronRight, Download, Wand2, MapPin } from 'lucide-react';
import { CATEGORIES, CATEGORY_GROUPS, CATEGORY_BY_ID } from '../data/categories';
import { CITIES } from '../data/geo';
import { CURATED } from '../data/curated';
import { STATS } from '../data/stats.generated';
import { CountUp, useToast } from '../components/ui';
import { CompanyCard } from '../components/CompanyCard';
import { suggest } from '../lib/dataset';
import { useInstallPrompt } from '../components/InstallSheet';

const TRENDING = ['Web developers Karachi', 'Restaurants Lahore', 'Textile mills Faisalabad', 'Digital marketing Islamabad', 'Banks', 'Schools Lahore', 'Hospitals Karachi'];

export default function Home() {
  const navigate = useNavigate();
  const toast = useToast();
  const { openSheet, isInstalled } = useInstallPrompt();
  const [q, setQ] = useState('');
  const [sugs, setSugs] = useState([]);
  const [focused, setFocused] = useState(false);
  const boxRef = useRef(null);

  useEffect(() => {
    let alive = true;
    const t = setTimeout(async () => {
      const s = q.trim().length >= 2 ? await suggest(q) : [];
      if (alive) setSugs(s);
    }, 180);
    return () => { alive = false; clearTimeout(t); };
  }, [q]);

  const popularCats = useMemo(() => [...CATEGORIES].sort((a, b) => (STATS.byCat[b.id] || 0) - (STATS.byCat[a.id] || 0)).slice(0, 12), []);
  const featured = useMemo(() => CURATED.slice(0, 5).map((c) => ({
    ...c, cat: CATEGORY_BY_ID[c.cat], id: 'c' + CURATED.indexOf(c), bizId: 'c' + CURATED.indexOf(c),
  })), []);
  const topCities = useMemo(() => [...CITIES].sort((a, b) => (STATS.byCity[b.name] || 0) - (STATS.byCity[a.name] || 0)).slice(0, 8), []);

  const go = (term) => navigate(`/browse?q=${encodeURIComponent(term)}`);

  return (
    <div className="space-y-7 animate-slide-up">
      {/* Hero */}
      <section className="relative overflow-hidden rounded-[28px] bg-ink text-cream p-6 pt-7 shadow-pop">
        <div className="absolute -top-10 -right-10 w-44 h-44 rounded-full bg-brand/20 blur-2xl" />
        <div className="absolute -bottom-14 -left-14 w-52 h-52 rounded-full bg-brand/10 blur-2xl" />
        <div className="absolute top-5 right-6 text-3xl animate-float">📖</div>
        <h1 className="text-[26px] leading-[1.15] font-black tracking-tight">
          Pakistan&apos;s business book,<br />
          <span className="text-brand">now in your pocket.</span> 🐝
        </h1>
        <p className="text-[13.5px] font-semibold text-stone-300 mt-2">
          Search <b className="text-cream"><CountUp to={STATS.total} />+</b> businesses in <b className="text-cream">{CITIES.length}</b> cities — call, WhatsApp or pitch in one tap.
        </p>

        {/* Search */}
        <div className="relative mt-4" ref={boxRef}>
          <div className="flex items-center gap-2 bg-cream rounded-2xl px-4 h-12 shadow-pop">
            <Search size={18} className="text-stone-400 shrink-0" />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              onFocus={() => setFocused(true)}
              onBlur={() => setTimeout(() => setFocused(false), 150)}
              onKeyDown={(e) => e.key === 'Enter' && q.trim() && go(q)}
              placeholder="Biryani, banks, web designers…"
              className="flex-1 bg-transparent outline-none text-[15px] font-bold text-ink placeholder:text-stone-400 placeholder:font-semibold"
              aria-label="Search businesses"
            />
            <button onClick={() => q.trim() && go(q)} className="tap bg-ink text-brand font-black text-[13px] rounded-xl px-4 py-2 h-9">
              Search
            </button>
          </div>
          {focused && sugs.length > 0 && (
            <div className="absolute z-30 inset-x-0 top-[54px] bg-cream rounded-2xl shadow-pop border border-stone-200 overflow-hidden animate-pop-in">
              {sugs.map((s) => (
                <button key={s} onMouseDown={() => go(s)} className="w-full text-left px-4 py-2.5 text-[13.5px] font-bold text-ink-soft hover:bg-brand-soft/60 flex items-center gap-2">
                  <Search size={13} className="text-stone-400" /> {s}
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="flex gap-2 mt-3 overflow-x-auto no-scrollbar -mx-1 px-1">
          <span className="shrink-0 text-[11px] font-black text-stone-400 py-1.5 flex items-center gap-1"><TrendingUp size={12} /> TRENDING</span>
          {TRENDING.map((t) => (
            <button key={t} onClick={() => go(t)} className="tap shrink-0 text-[11.5px] font-bold bg-white/10 hover:bg-brand/25 text-stone-200 rounded-full px-3 py-1.5">
              {t}
            </button>
          ))}
        </div>
      </section>

      {/* Stats strip */}
      <section className="grid grid-cols-3 gap-2.5">
        {[
          { v: STATS.total + 100, l: 'Listings', suffix: '+' },
          { v: CATEGORIES.length, l: 'Categories', suffix: '' },
          { v: CITIES.length, l: 'Cities', suffix: '' },
        ].map((s) => (
          <div key={s.l} className="bg-white/90 rounded-2xl border border-stone-200/80 py-3 text-center shadow-card">
            <p className="text-xl font-black text-ink"><CountUp to={s.v} suffix={s.suffix} /></p>
            <p className="text-[10.5px] font-extrabold tracking-wider text-stone-400">{s.l.toUpperCase()}</p>
          </div>
        ))}
      </section>

      {/* Popular categories */}
      <section>
        <div className="flex items-center justify-between mb-2.5">
          <h2 className="font-black text-ink text-lg">Popular categories 🔥</h2>
          <Link to="/categories" className="text-[12.5px] font-extrabold text-brand-deeper flex items-center">See all {CATEGORIES.length} <ChevronRight size={14} /></Link>
        </div>
        <div className="grid grid-cols-2 gap-2.5">
          {popularCats.map((c) => (
            <Link key={c.id} to={`/browse?cat=${c.id}`}
              className="tap flex items-center gap-2.5 bg-white/90 rounded-2xl border border-stone-200/80 p-2.5 shadow-card">
              <span className="w-10 h-10 rounded-xl flex items-center justify-center text-lg shrink-0" style={{ background: c.color + '1A' }}>{c.emoji}</span>
              <span className="min-w-0">
                <span className="block text-[12.5px] font-extrabold text-ink truncate">{c.name}</span>
                <span className="block text-[10.5px] font-bold text-stone-400">{(STATS.byCat[c.id] || 0).toLocaleString()} listings</span>
              </span>
            </Link>
          ))}
        </div>
      </section>

      {/* Outreach USP — freelancers & agencies */}
      <section className="rounded-[28px] bg-gradient-to-br from-brand to-amber-400 p-5 shadow-pop text-ink relative overflow-hidden">
        <div className="absolute -right-6 -top-8 text-[100px] opacity-15 rotate-12">🎯</div>
        <h2 className="font-black text-xl leading-tight">Freelancer? Agency? <br />This directory works for you. 💼</h2>
        <ul className="mt-3 space-y-1.5 text-[13px] font-bold">
          <li className="flex gap-2"><span>🔖</span> Save businesses into lead lists</li>
          <li className="flex gap-2"><span>📤</span> Export any list to CSV for your CRM</li>
          <li className="flex gap-2"><span>✍️</span> Auto-draft personalized pitches per business</li>
          <li className="flex gap-2"><span>📞</span> Call / WhatsApp leads straight from the list</li>
        </ul>
        <Link to="/leads" className="tap mt-4 inline-flex items-center gap-2 bg-ink text-brand font-black text-[13.5px] rounded-2xl px-5 py-3">
          <Wand2 size={15} /> Open Lead Workspace
        </Link>
      </section>

      {/* Business owner USP — free listing */}
      <section className="rounded-[28px] bg-ink text-cream p-5 shadow-pop relative overflow-hidden">
        <div className="absolute -right-6 -bottom-8 text-[100px] opacity-10 rotate-12">🏪</div>
        <h2 className="font-black text-xl leading-tight">Own a business? <br />Get listed — <span className="text-brand">free, forever.</span> 📋</h2>
        <p className="text-[13px] font-semibold text-stone-300 mt-2 leading-relaxed">
          Your customers are searching here — and so are freelancers & agencies who want to work with you.
          A listing takes 2 minutes: name, category, city, phone. Verified in 48 hours.
        </p>
        <ul className="mt-3 space-y-1.5 text-[13px] font-bold">
          <li className="flex gap-2"><span>👀</span> Get discovered by thousands of daily browsers</li>
          <li className="flex gap-2"><span>📞</span> One-tap call & WhatsApp buttons on your profile</li>
          <li className="flex gap-2"><span>🗺️</span> Your own map pin — customers find your door</li>
          <li className="flex gap-2"><span>✅</span> Verified badge after free review</li>
        </ul>
        <Link to="/add" className="tap mt-4 inline-flex items-center gap-2 bg-brand text-ink font-black text-[13.5px] rounded-2xl px-5 py-3">
          <Download size={15} /> List my business — free
        </Link>
      </section>

      {/* Featured verified */}
      <section>
        <div className="flex items-center justify-between mb-2.5">
          <h2 className="font-black text-ink text-lg">Flagship verified ⭐</h2>
          <Link to="/browse?verified=1" className="text-[12.5px] font-extrabold text-brand-deeper flex items-center">More <ChevronRight size={14} /></Link>
        </div>
        <div className="space-y-3">
          {featured.map((b) => <CompanyCard key={b.name} b={b} dense />)}
        </div>
      </section>

      {/* Cities */}
      <section>
        <h2 className="font-black text-ink text-lg mb-2.5">Explore by city 🗺️</h2>
        <div className="flex flex-wrap gap-2">
          {topCities.map((c) => (
            <Link key={c.name} to={`/browse?city=${encodeURIComponent(c.name)}`}
              className="tap bg-white/90 border border-stone-200/80 rounded-full px-3.5 py-2 text-[12.5px] font-extrabold text-ink-soft shadow-card flex items-center gap-1.5">
              <MapPin size={12} className="text-brand-deeper" /> {c.name}
              <span className="text-stone-400 font-bold">· {(STATS.byCity[c.name] || 0).toLocaleString()}</span>
            </Link>
          ))}
        </div>
      </section>

      {/* Install card */}
      {!isInstalled && (
        <section className="rounded-[28px] bg-ink text-cream p-5 shadow-pop flex items-center gap-4">
          <div className="text-4xl animate-float">📲</div>
          <div className="flex-1">
            <h3 className="font-black text-[16px]">Get the app — free</h3>
            <p className="text-[12px] font-semibold text-stone-300">Offline search, one-tap calls, your leads everywhere.</p>
          </div>
          <button onClick={openSheet} className="tap bg-brand text-ink font-black text-[13px] rounded-2xl px-4 py-2.5 flex items-center gap-1.5">
            <Download size={15} /> Install
          </button>
        </section>
      )}
    </div>
  );
}
