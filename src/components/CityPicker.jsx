// City picker modal — searchable, grouped by province. Used in Browse & Nearby.

import { useMemo, useState } from 'react';
import { X, Search, MapPin } from 'lucide-react';
import { CITIES, PROVINCES } from '../data/geo';
import { STATS } from '../data/stats.generated';

export function CityPicker({ open, value, onSelect, onClose }) {
  const [q, setQ] = useState('');
  const groups = useMemo(() => {
    const ql = q.trim().toLowerCase();
    return PROVINCES.map((p) => ({
      province: p,
      cities: CITIES.filter((c) => c.province === p && (!ql || c.name.toLowerCase().includes(ql)))
        .sort((a, b) => (STATS.byCity[b.name] || 0) - (STATS.byCity[a.name] || 0)),
    })).filter((g) => g.cities.length);
  }, [q]);

  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[94] flex items-end sm:items-center justify-center" role="dialog" aria-label="Pick a city">
      <div className="absolute inset-0 bg-ink/50 backdrop-blur-[2px]" onClick={onClose} />
      <div className="relative w-full max-w-lg bg-cream rounded-t-[28px] sm:rounded-[28px] max-h-[86dvh] flex flex-col animate-slide-up shadow-pop">
        <div className="p-4 pb-2 shrink-0">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-black text-lg text-ink">All cities & towns 🇵🇰</h3>
            <button onClick={onClose} aria-label="Close" className="tap w-8 h-8 rounded-full bg-stone-200/80 flex items-center justify-center">
              <X size={16} />
            </button>
          </div>
          <div className="flex items-center gap-2 bg-white rounded-2xl px-3.5 h-11 border border-stone-300">
            <Search size={16} className="text-stone-400" />
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder={`Search ${CITIES.length} cities & towns…`} autoFocus
              className="flex-1 bg-transparent outline-none text-[14px] font-bold text-ink placeholder:font-semibold placeholder:text-stone-400" />
          </div>
          <button onClick={() => onSelect(null)} className={`tap mt-2 w-full rounded-xl py-2 text-[13px] font-extrabold border ${!value ? 'bg-ink text-brand border-ink' : 'bg-white/80 border-stone-300 text-ink-soft'}`}>
            All Pakistan
          </button>
        </div>
        <div className="overflow-y-auto px-4 pb-6">
          {groups.map((g) => (
            <div key={g.province} className="mb-4">
              <p className="text-[10.5px] font-black tracking-widest text-stone-400 mb-1.5">{g.province.toUpperCase()}</p>
              <div className="grid grid-cols-2 gap-1.5">
                {g.cities.map((c) => (
                  <button key={c.name} onClick={() => onSelect(c.name)}
                    className={`tap flex items-center justify-between rounded-xl px-3 py-2 text-left border ${value === c.name ? 'bg-brand border-brand text-ink' : 'bg-white/80 border-stone-200 text-ink-soft hover:border-brand/50'}`}>
                    <span className="text-[12.5px] font-extrabold truncate flex items-center gap-1">
                      <MapPin size={11} className="shrink-0 opacity-60" />{c.name}
                    </span>
                    <span className="text-[10px] font-bold text-stone-400 shrink-0 ml-1">{((STATS.byCity[c.name] || 0) / 1000).toFixed(1)}k</span>
                  </button>
                ))}
              </div>
            </div>
          ))}
          {!groups.length && <p className="text-center font-bold text-stone-400 py-8">No city matches “{q}” 🤔</p>}
        </div>
      </div>
    </div>
  );
}
