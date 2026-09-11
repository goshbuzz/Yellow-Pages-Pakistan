// Shared UI primitives: toast system, chips, stars, monograms, empty states, skeletons, count-up.

import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { Check, Star } from 'lucide-react';

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

// ── Chips / pills ───────────────────────────────────────────────────────────
export function Chip({ active, children, onClick, color, className = '' }) {
  return (
    <button
      onClick={onClick}
      className={`tap shrink-0 inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-[13px] font-bold transition-colors ${className}
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

// ── Verified badge ──────────────────────────────────────────────────────────
export function VerifiedBadge() {
  return (
    <span className="inline-flex items-center gap-0.5 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-full px-1.5 py-[1px] text-[10px] font-extrabold" title="Flagship verified profile">
      <Check size={10} strokeWidth={3.5} /> VERIFIED
    </span>
  );
}

// ── Empty state ─────────────────────────────────────────────────────────────
export function EmptyState({ emoji = '🔎', title, hint, action }) {
  return (
    <div className="flex flex-col items-center justify-center text-center py-14 px-6 animate-pop-in">
      <div className="text-5xl mb-3 animate-float">{emoji}</div>
      <p className="font-extrabold text-ink text-lg">{title}</p>
      {hint && <p className="text-stone-500 text-sm mt-1 max-w-xs">{hint}</p>}
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
