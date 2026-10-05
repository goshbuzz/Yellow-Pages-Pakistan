// Categories hub — all 130 categories grouped, with live listing counts.

import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Search } from 'lucide-react';
import { CATEGORIES, CATEGORY_GROUPS, slug as catSlug } from '../data/categories';
import { STATS } from '../data/stats.generated';
import { CatIcon } from '../components/icons';
import SeoHead from '../components/SeoHead';
import PageFaq, { makeFaqSchema } from '../components/PageFaq';

const CATEGORY_FAQS = [
  {
    q: 'How many business categories are included in the Pakistan directory?',
    a: 'There are 130 comprehensive industry categories organized into major groups including Manufacturing, Retail, IT & Software, Health & Medical, Food & Dining, and Professional Services.',
  },
  {
    q: 'Can a Pakistani business be listed under multiple categories?',
    a: 'Yes. If your company provides diverse products or services (e.g. both Textile Manufacturing and Wholesale Export), our review team can associate secondary categories with your listing upon request.',
  },
  {
    q: 'Which business categories have the highest number of listings in Pakistan?',
    a: 'Textile mills and garment manufacturers, restaurants, software houses, general order suppliers, real estate agencies, and private clinics represent the largest sectors by total listing volume.',
  },
  {
    q: 'How do I add my company if its exact category is not listed?',
    a: 'Submit your listing under the closest related sector at /add and specify your niche in the description field. Our taxonomy team regularly expands category classifications.',
  },
];

export default function Categories() {
  const [q, setQ] = useState('');
  const groups = useMemo(() => {
    const ql = q.trim().toLowerCase();
    return CATEGORY_GROUPS.map((g) => ({
      ...g,
      cats: CATEGORIES.filter((c) => c.group === g.id && (!ql || c.name.toLowerCase().includes(ql))),
    })).filter((g) => g.cats.length);
  }, [q]);

  const schema = makeFaqSchema(CATEGORY_FAQS);

  return (
    <div className="animate-slide-up pb-8 space-y-4">
      <SeoHead
        title="130 Business Categories in Pakistan — Yellow Pages PK"
        description="Explore 130 industry sectors across Pakistan: textiles, IT, healthcare, manufacturing, wholesale, food, and logistics with active listing counts."
        canonicalPath="/categories"
        schema={schema}
      />

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
                <Link key={c.id} to={`/category/${catSlug(c.name)}`}
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

      <div className="mt-8 pt-4">
        <PageFaq
          title="Categories FAQ"
          subtitle="How industry classification works in Yellow Pages Pakistan."
          faqs={CATEGORY_FAQS}
        />
      </div>
    </div>
  );
}
