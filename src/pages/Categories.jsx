// Categories hub — all 130 categories grouped, with live listing counts.

import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Search } from 'lucide-react';
import { CATEGORIES, CATEGORY_GROUPS } from '../data/categories';
import { STATS } from '../data/stats.generated';
import { CatIcon } from '../components/icons';

export default function Categories() {
  const [q, setQ] = useState('');
  const groups = useMemo(() => {
    const ql = q.trim().toLowerCase();
    return CATEGORY_GROUPS.map((g) => ({
      ...g,
      cats: CATEGORIES.filter((c) => c.group === g.id && (!ql || c.name.toLowerCase().includes(ql))),
    })).filter((g) => g.cats.length);
  }, [q]);

  return (
    <div className="animate-slide-up">
      <h1 className="font-black text-2xl text-ink">Browse categories 🗂️</h1>
      <p className="text-[13px] font-semibold text-stone-500 mt-0.5 mb-3">{CATEGORIES.length} categories · 200,000+ listings</p>

      <div className="flex items-center gap-2 bg-white rounded-2xl px-3.5 h-11 border border-stone-300 mb-4 sticky top-16 z-20 shadow-card">
        <Search size={16} className="text-stone-400" />
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Find a category…"
          className="flex-1 bg-transparent outline-none text-[14px] font-bold text-ink placeholder:font-semibold placeholder:text-stone-400" />
      </div>

      <div className="space-y-6">
        {groups.map((g) => (
          <section key={g.id}>
            <h2 className="font-black text-ink text-[16px] mb-2">{g.emoji} {g.label}</h2>
            <div className="grid grid-cols-2 gap-2">
              {g.cats.map((c) => (
                <Link key={c.id} to={`/browse?cat=${c.id}`}
                  className="tap flex flex-col gap-1 bg-white/90 rounded-2xl border border-stone-200/80 p-3 shadow-card relative overflow-hidden">
                  <span className="absolute right-2 top-2 text-lg">{c.emoji}</span>
                  <span className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: c.color + '1A', color: c.color }}>
                    <CatIcon icon={c.icon} size={17} />
                  </span>
                  <span className="text-[12.5px] font-extrabold text-ink leading-tight mt-0.5 pr-6">{c.name}</span>
                  <span className="text-[10.5px] font-bold text-stone-400">{(STATS.byCat[c.id] || 0).toLocaleString()} listings</span>
                </Link>
              ))}
            </div>
          </section>
        ))}
        {!groups.length && <p className="text-center font-bold text-stone-400 py-10">No category matches “{q}” 😅</p>}
      </div>
    </div>
  );
}
