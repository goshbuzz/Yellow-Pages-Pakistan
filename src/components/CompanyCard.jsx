// Business card — used across Home / Browse / Nearby / detail (similar).

import { Link } from 'react-router-dom';
import { useReducer } from 'react';
import { Phone, MessageCircle, MapPin, Bookmark, BookmarkCheck } from 'lucide-react';
import { Monogram, Stars, VerifiedBadge, useToast } from './ui';
import { businessId } from '../lib/dataset';
import { telHref, waHref } from '../lib/derive';
import { findLead, addLead, removeLead } from '../lib/leads';

export function CompanyCard({ b, dense = false }) {
  const toast = useToast();
  const [, force] = useReducer((x) => x + 1, 0);
  const id = b.bizId || businessId(b);
  const saved = !!findLead(id);

  const toggleSave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (findLead(id)) {
      removeLead(id);
      toast('Removed from leads', '🗑️');
    } else {
      addLead({ ...b, bizId: id });
      toast(`Saved “${b.name}” to leads`, '🔖');
    }
    force();
  };

  return (
    <Link
      to={`/b/${id}`}
      className="tap group block bg-white/90 hover:bg-white rounded-2xl border border-stone-200/80 shadow-card p-3.5 relative overflow-hidden"
    >
      <span className="absolute left-0 top-0 bottom-0 w-1" style={{ background: b.cat?.color || '#F5B301' }} />
      <div className="flex gap-3">
        <Monogram name={b.name} color={b.cat?.color} emoji={b.cat?.emoji} size={dense ? 40 : 46} />
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5 flex-wrap">
            <h3 className="font-extrabold text-ink text-[15px] leading-tight truncate max-w-[85%]">{b.name}</h3>
            {b.verified && <VerifiedBadge />}
          </div>
          <p className="text-[12px] font-bold text-stone-500 mt-0.5 truncate">
            <span>{b.cat?.emoji}</span> {b.cat?.name} · <MapPin size={10} className="inline -mt-0.5" /> {b.area || b.city}
          </p>
          {!dense && (
            <div className="flex items-center gap-2.5 mt-1">
              <Stars rating={b.rating} reviews={b.reviews} />
              {b.est && <span className="text-[11px] font-semibold text-stone-400">since {b.est}</span>}
            </div>
          )}
        </div>
        <button
          onClick={toggleSave}
          aria-label="Save to leads"
          className={`tap self-start w-9 h-9 rounded-full flex items-center justify-center border ${saved ? 'bg-brand border-brand text-ink' : 'bg-white border-stone-300 text-stone-500'}`}
        >
          {saved ? <BookmarkCheck size={16} /> : <Bookmark size={16} />}
        </button>
      </div>

      <div className="flex gap-2 mt-3">
        <a href={telHref(b.phone)} onClick={(e) => e.stopPropagation()}
          className="tap flex-1 h-9 rounded-xl bg-ink text-brand text-[13px] font-extrabold flex items-center justify-center gap-1.5">
          <Phone size={14} /> Call
        </a>
        {b.whatsapp && (
          <a href={waHref(b.phone)} target="_blank" rel="noreferrer" onClick={(e) => e.stopPropagation()}
            className="tap h-9 px-3.5 rounded-xl bg-emerald-500 text-white text-[13px] font-extrabold flex items-center justify-center gap-1.5">
            <MessageCircle size={14} /> WhatsApp
          </a>
        )}
        <a href={`https://www.google.com/maps/search/?api=1&query=${b.lat},${b.lng}`} target="_blank" rel="noreferrer" onClick={(e) => e.stopPropagation()}
          className="tap h-9 px-3.5 rounded-xl bg-brand-soft text-brand-deeper border border-brand/40 text-[13px] font-extrabold flex items-center justify-center gap-1.5">
          <MapPin size={14} /> Map
        </a>
      </div>
    </Link>
  );
}
