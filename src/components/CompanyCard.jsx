// Business card — used across Home / Browse / Nearby / detail (similar).

import { Link } from 'react-router-dom';
import { useReducer } from 'react';
import { Phone, MapPin, Bookmark, BookmarkCheck } from 'lucide-react';
import { Monogram, Stars, VerifiedBadge, CustomBadge, useToast } from './ui';
import { businessId } from '../lib/dataset';
import { telHref, googleMapsUrl } from '../lib/derive';
import { WhatsAppButton } from './WhatsAppButton';
import { findLead, addLead, removeLead } from '../lib/leads';
import { isReal } from '../lib/provenance';

export function CompanyCard({ b, dense = false }) {
  const toast = useToast();
  const [, force] = useReducer((x) => x + 1, 0);
  const id = b.bizId || businessId(b);
  const mapHref = googleMapsUrl(b);
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
            {(b.isCustom || b.source === 'custom') && <CustomBadge />}
          </div>
          <p className="text-[12px] font-bold text-stone-500 mt-0.5 truncate">
            <span>{b.cat?.emoji}</span> {b.cat?.name} · <MapPin size={10} className="inline -mt-0.5" /> {b.area || b.city}
          </p>
          {!isReal(b) && (
            <span className="inline-block mt-1 bg-stone-100 text-stone-500 border border-dashed border-stone-300 rounded-full px-1.5 py-[1px] text-[10px] font-extrabold">
              🧪 SAMPLE — NOT A REAL BUSINESS
            </span>
          )}
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

      <div className="flex gap-2 mt-3.5">
        {b.phone ? (
          <>
            <a href={telHref(b.phone)} onClick={(e) => e.stopPropagation()}
              className="tap flex-1 h-9 rounded-xl bg-ink text-brand text-[13px] font-extrabold flex items-center justify-center gap-1.5">
              <Phone size={14} /> Call
            </a>
            {/* Every listing with a number gets a WhatsApp action: chat for mobiles, copy for landlines. */}
            <WhatsAppButton b={b} variant="card" />
          </>
        ) : (
          /* Registry rows can be listed before a number is known — say so, don't fake a button. */
          <span className="tap flex-1 h-9 rounded-xl border border-dashed border-stone-300 text-stone-500 text-[12.5px] font-bold flex items-center justify-center gap-1.5">
            <Phone size={13} /> No phone on record
          </span>
        )}
        {/* No pin means no Map button: a wrong-country pin is worse than none. */}
        {mapHref && (
          <a href={mapHref} target="_blank" rel="noreferrer" onClick={(e) => e.stopPropagation()}
            className="tap h-9 px-3.5 rounded-xl bg-brand-soft text-brand-deeper border border-brand/40 text-[13px] font-extrabold flex items-center justify-center gap-1.5">
            <MapPin size={14} /> Map
          </a>
        )}
      </div>
    </Link>
  );
}
