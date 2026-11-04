// Shared UI primitives: toast system, chips, stars, monograms, empty states, skeletons, count-up.

import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { Check, Star, User } from 'lucide-react';

// ── Toast ───────────────────────────────────────────────────────────────────
const ToastCtx = createContext(() => {});
export const useToast = () => useContext(ToastCtx);

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);
  const idRef = useRef(0);
  const show = useCallback((message, emoji = '✅') => {
    const id = ++idRef.current;
    setToasts((t) => [...t.slice(-2), { id, message, emoji }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 2600);
  }, []);
  return (
    <ToastCtx.Provider value={show}>
      {children}
      <div className="fixed left-1/2 bottom-[6.4rem] z-[90] flex flex-col items-center gap-2 pointer-events-none" style={{ transform: 'translateX(-50%)' }}>
        {toasts.map((t) => (
          <div key={t.id} className="animate-toast-in max-w-[88vw] bg-ink text-cream text-sm font-semibold px-4 py-2.5 rounded-2xl shadow-pop flex items-center gap-2">
            <span>{t.emoji}</span> <span className="truncate">{t.message}</span>
          </div>
        ))}
      </div>
    </ToastCtx.Provider>
  );
}

// ── Page header ─────────────────────────────────────────────────────────────
// One heading style for every screen: title, one-line explanation, optional actions.
// Centralised so pages cannot drift into five different heading sizes again.
export function PageHeader({ icon: Icon, title, subtitle, actions, emoji, children }) {
  return (
    <header className="flex flex-col gap-3">
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
        <div className="min-w-0">
          <h1 className="font-black text-[22px] leading-tight text-ink flex items-center gap-2">
            {Icon && <Icon size={21} className="text-brand-deeper shrink-0" />}
            {emoji && <span aria-hidden="true">{emoji}</span>}
            <span className="truncate">{title}</span>
          </h1>
          {subtitle && <p className="text-[13px] font-semibold text-stone-500 mt-1.5 leading-snug">{subtitle}</p>}
        </div>
        {actions && <div className="flex gap-2 shrink-0 flex-wrap">{actions}</div>}
      </div>
      {children}
    </header>
  );
}

// ── Section wrapper ─────────────────────────────────────────────────────────
export function Section({ title, subtitle, action, children, className = '' }) {
  return (
    <section className={`flex flex-col gap-3 ${className}`}>
      {(title || action) && (
        <div className="flex items-end justify-between gap-3">
          <div className="min-w-0">
            {title && <h2 className="font-black text-[16px] text-ink leading-tight">{title}</h2>}
            {subtitle && <p className="text-[12px] font-semibold text-stone-500 mt-0.5">{subtitle}</p>}
          </div>
          {action}
        </div>
      )}
      {children}
    </section>
  );
}

// ── Stat tile ───────────────────────────────────────────────────────────────
export function StatTile({ value, label, hint, tone = 'neutral' }) {
  const tones = {
    neutral: 'bg-white border-stone-200/90 text-ink',
    brand: 'bg-brand-soft border-brand/40 text-ink',
    good: 'bg-emerald-50 border-emerald-200 text-emerald-900',
  };
  return (
    <div className={`rounded-2xl border py-3 px-2 text-center shadow-card ${tones[tone] || tones.neutral}`}>
      <p className="text-[19px] font-black leading-none">{typeof value === 'number' ? value.toLocaleString() : value}</p>
      <p className="text-[10px] font-extrabold tracking-wider text-stone-500 uppercase mt-1.5 leading-tight">{label}</p>
      {hint && <p className="text-[10px] font-bold text-stone-400 mt-0.5">{hint}</p>}
    </div>
  );
}

// ── Chips / pills ───────────────────────────────────────────────────────────
export function Chip({ active, children, onClick, color, className = '' }) {
  return (
    <button
      onClick={onClick}
      className={`tap shrink-0 inline-flex items-center gap-1.5 rounded-full border px-3.5 min-h-[2.25rem] text-[12.5px] font-extrabold transition-colors ${className}
        ${active ? 'bg-ink text-brand border-ink shadow-sm' : 'bg-white/70 text-ink-soft border-stone-300/70 hover:border-ink/40'}`}
    >
      {children}
    </button>
  );
}

// ── Rating stars ────────────────────────────────────────────────────────────
export function Stars({ rating, reviews, size = 13 }) {
  return (
    <span className="inline-flex items-center gap-1 text-[12px] font-bold">
      <Star size={size} className="fill-brand text-brand" style={{ color: '#F5B301' }} />
      <span>{rating?.toFixed?.(1) ?? rating}</span>
      {reviews != null && <span className="text-stone-400 font-semibold">({reviews})</span>}
    </span>
  );
}

// ── Category monogram avatar ────────────────────────────────────────────────
export function Monogram({ name, color = '#78716C', size = 46, emoji }) {
  const letters = name.split(/\s+/).filter((w) => /^[A-Za-z]/.test(w)).slice(0, 2).map((w) => w[0]).join('').toUpperCase() || '★';
  return (
    <span
      className="shrink-0 inline-flex items-center justify-center rounded-2xl font-black text-white shadow-inner"
      style={{ width: size, height: size, background: `linear-gradient(135deg, ${color}, ${color}CC)`, fontSize: size * 0.34 }}
    >
      {emoji ? <span style={{ fontSize: size * 0.44 }}>{emoji}</span> : letters}
    </span>
  );
}

// ── Provenance badge ────────────────────────────────────────────────────────
// A "verified" pill must mean somebody actually vouched for this record, so it is
// driven by provenance rather than a boolean flag any row could set.
export function VerifiedBadge() {
  return (
    <span className="inline-flex items-center gap-0.5 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-full px-1.5 py-[1px] text-[10px] font-extrabold" title="Flagship verified profile">
      <Check size={10} strokeWidth={3.5} /> VERIFIED
    </span>
  );
}

// A user's own listing is real to them but never "verified" by the directory.
export function CustomBadge() {
  return (
    <span className="inline-flex items-center gap-0.5 bg-sky-50 text-sky-700 border border-sky-200 rounded-full px-1.5 py-[1px] text-[10px] font-extrabold" title="You added this listing on this device">
      <User size={10} strokeWidth={3.5} /> MINE
    </span>
  );
}

// ── Empty state ─────────────────────────────────────────────────────────────
export function EmptyState({ emoji = '🔎', title, hint, action }) {
  return (
    <div className="flex flex-col items-center justify-center text-center py-12 px-5 bg-white/70 border border-dashed border-stone-300 rounded-3xl animate-pop-in">
      <div className="text-[40px] mb-3 animate-float leading-none">{emoji}</div>
      <p className="font-black text-ink text-[16px]">{title}</p>
      {hint && <p className="text-stone-500 text-[13px] font-semibold mt-1.5 max-w-[19rem] leading-relaxed">{hint}</p>}
      {action}
    </div>
  );
}

// ── Skeleton list ───────────────────────────────────────────────────────────
export function SkeletonList({ n = 6 }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: n }).map((_, i) => (
        <div key={i} className="flex gap-3 bg-white/80 rounded-2xl p-3.5 border border-stone-200/70">
          <div className="skeleton w-[46px] h-[46px] rounded-2xl" />
          <div className="flex-1 space-y-2 pt-1">
            <div className="skeleton h-3.5 w-2/3 rounded-full" />
            <div className="skeleton h-3 w-1/3 rounded-full" />
          </div>
          <div className="skeleton w-8 h-8 rounded-full" />
        </div>
      ))}
    </div>
  );
}

// ── Animated count-up ───────────────────────────────────────────────────────
export function CountUp({ to, duration = 1200, suffix = '', format = true }) {
  const [val, setVal] = useState(0);
  useEffect(() => {
    let raf;
    const t0 = performance.now();
    const tick = (t) => {
      const p = Math.min(1, (t - t0) / duration);
      setVal(Math.round(to * (1 - Math.pow(1 - p, 3))));
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [to, duration]);
  return <>{(format ? val.toLocaleString() : val) + suffix}</>;
}
