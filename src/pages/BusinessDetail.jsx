// Business detail — full profile: map embed (real pin), call/WhatsApp,
// pitch drafter, save-to-leads, similar businesses.

import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Phone, MessageCircle, MapPin, Mail, Globe, ExternalLink, Navigation, Bookmark, BookmarkCheck, Wand2, Clock, Users, Share2 } from 'lucide-react';
import { getBusiness, searchBusinesses, businessId } from '../lib/dataset';
import { telHref, waHref, googleMapsUrl, googleMapsEmbedUrl } from '../lib/derive';
import { Monogram, Stars, VerifiedBadge, SkeletonList, EmptyState, useToast } from '../components/ui';
import { PitchModal } from '../components/PitchModal';
import { findLead, addLead, removeLead } from '../lib/leads';
import { CompanyCard } from '../components/CompanyCard';

export default function BusinessDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const toast = useToast();
  const [b, setB] = useState(undefined); // undefined=loading, null=missing
  const [similar, setSimilar] = useState([]);
  const [pitchOpen, setPitchOpen] = useState(false);
  const [savedTick, setSavedTick] = useState(0);

  useEffect(() => {
    let alive = true;
    setB(undefined);
    setSimilar([]);
    getBusiness(id).then(async (biz) => {
      if (!alive) return;
      setB(biz);
      if (biz) {
        const r = await searchBusinesses({ q: '', cat: String(biz.cat?.id ?? biz.catId ?? ''), city: biz.city, sort: 'rating', page: 1, perPage: 4 });
        if (alive) setSimilar(r.rows.filter((x) => businessId(x) !== id).slice(0, 3));
      }
    });
    return () => { alive = false; };
  }, [id]);

  const saved = useMemo(() => (b ? !!findLead(bizKey(b, id)) : false), [b, id, savedTick]);

  if (b === undefined) return <SkeletonList n={4} />;
  if (b === null) return <EmptyState emoji="🤷" title="Business not found" hint="It may have been removed." action={<Link to="/browse" className="mt-3 inline-block bg-ink text-brand font-black text-[13px] rounded-xl px-4 py-2.5">Browse businesses</Link>} />;

  const isSaved = saved;

  const shareBusiness = async () => {
    const url = `${location.origin}${location.pathname}#/b/${id}`;
    const text = `${b.name} — ${b.cat?.name} in ${b.city}\nPhone: ${b.phone}\n(via Yellow Pages Pakistan)`;
    if (navigator.share) {
      try { await navigator.share({ title: b.name, text, url }); return; } catch { /* cancelled */ }
    }
    window.open(`https://wa.me/?text=${encodeURIComponent(`${text}\n${url}`)}`, '_blank');
  };

  return (
    <div className="animate-slide-up pb-4">
      <button onClick={() => navigate(-1)} className="tap flex items-center gap-1.5 text-[13px] font-extrabold text-stone-500 mb-3 -mt-1">
        <ArrowLeft size={15} /> Back
      </button>

      {/* Header card */}
      <div className="bg-white/95 rounded-[24px] border border-stone-200/80 shadow-card p-5 relative overflow-hidden">
        <span className="absolute left-0 top-0 bottom-0 w-1.5" style={{ background: b.cat?.color || '#F5B301' }} />
        <div className="flex items-start gap-3.5">
          <Monogram name={b.name} color={b.cat?.color} emoji={b.cat?.emoji} size={64} />
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="font-black text-xl text-ink leading-tight">{b.name}</h1>
              {b.verified && <VerifiedBadge />}
            </div>
            <p className="text-[13px] font-bold text-stone-500 mt-0.5">{b.cat?.emoji} {b.cat?.name}</p>
            <div className="flex items-center gap-3 mt-1.5 flex-wrap">
              <Stars rating={b.rating} reviews={b.reviews} size={14} />
              {b.est && <span className="text-[11.5px] font-bold text-stone-400 flex items-center gap-1"><Clock size={11} /> since {b.est}</span>}
              {b.employees && <span className="text-[11.5px] font-bold text-stone-400 flex items-center gap-1"><Users size={11} /> {b.employees.toLocaleString()} staff</span>}
            </div>
          </div>
        </div>

        <p className="text-[13px] font-semibold text-stone-600 mt-3.5 leading-relaxed">{b.description}</p>

        {/* Contact rows */}
        <div className="mt-4 space-y-1.5 text-[13px] font-bold text-ink-soft">
          <p className="flex items-start gap-2"><MapPin size={15} className="mt-0.5 shrink-0 text-brand-deeper" /> {b.address}</p>
          <p className="flex items-center gap-2"><Clock size={15} className="shrink-0 text-brand-deeper" /> {b.hours}</p>
          {b.email && <p className="flex items-center gap-2"><Mail size={15} className="shrink-0 text-brand-deeper" /> <a href={`mailto:${b.email}`} className="text-sky-700 hover:underline truncate">{b.email}</a></p>}
          {b.website && <p className="flex items-center gap-2"><Globe size={15} className="shrink-0 text-brand-deeper" /> <a href={`https://${b.website}`} target="_blank" rel="noreferrer" className="text-sky-700 hover:underline">{b.website} <ExternalLink size={11} className="inline" /></a></p>}
        </div>

        {/* Actions */}
        <div className="grid grid-cols-2 gap-2 mt-4">
          <a href={telHref(b.phone)} className="tap h-11 rounded-2xl bg-ink text-brand font-black text-[14px] flex items-center justify-center gap-2">
            <Phone size={16} /> {b.phone}
          </a>
          {b.whatsapp ? (
            <a href={waHref(b.phone)} target="_blank" rel="noreferrer" className="tap h-11 rounded-2xl bg-emerald-500 text-white font-black text-[14px] flex items-center justify-center gap-2">
              <MessageCircle size={16} /> WhatsApp
            </a>
          ) : (
            <button onClick={() => { setPitchOpen(true); }} className="tap h-11 rounded-2xl bg-brand text-ink font-black text-[14px] flex items-center justify-center gap-2">
              <Wand2 size={16} /> Draft pitch
            </button>
          )}
        </div>
        <div className="grid grid-cols-3 gap-2 mt-2">
          <button onClick={(e) => {
            e.preventDefault();
            if (isSaved) { removeLead(bizKey(b, id)); setSavedTick((t) => t + 1); toast('Removed from leads', '🗑️'); }
            else { addLead({ ...b, bizId: bizKey(b, id) }); setSavedTick((t) => t + 1); toast(`Saved “${b.name}” to leads`, '🔖'); }
          }} className={`tap h-11 rounded-2xl font-black text-[13px] flex items-center justify-center gap-1.5 border ${isSaved ? 'bg-brand border-brand text-ink' : 'bg-white border-stone-300 text-ink-soft'}`}>
            {isSaved ? <BookmarkCheck size={15} /> : <Bookmark size={15} />} {isSaved ? 'Saved' : 'Save'}
          </button>
          <button onClick={shareBusiness} className="tap h-11 rounded-2xl bg-white border border-stone-300 text-ink-soft font-black text-[13px] flex items-center justify-center gap-1.5">
            <Share2 size={15} /> Share
          </button>
          <a href={googleMapsUrl(b)} target="_blank" rel="noreferrer" className="tap h-11 rounded-2xl bg-white border border-stone-300 text-ink-soft font-black text-[13px] flex items-center justify-center gap-1.5">
            <Navigation size={14} /> Directions
          </a>
        </div>
      </div>

      {/* Map — real pin */}
      <div className="mt-4 rounded-[24px] overflow-hidden border border-stone-200/80 shadow-card bg-white">
        <iframe
          title={`${b.name} on map`}
          src={googleMapsEmbedUrl(b)}
          className="w-full h-[260px] block border-0"
          loading="lazy"
          referrerPolicy="no-referrer-when-downgrade"
          allowFullScreen
        />
        <a href={googleMapsUrl(b)} target="_blank" rel="noreferrer" className="tap flex items-center justify-center gap-2 h-11 font-black text-[13px] text-brand-deeper bg-brand-soft/60 hover:bg-brand-soft">
          <MapPin size={15} /> Open in Google Maps
        </a>
      </div>

      {/* Similar */}
      {similar.length > 0 && (
        <section className="mt-6">
          <h2 className="font-black text-ink text-lg mb-2.5">Similar in {b.city} 🧭</h2>
          <div className="space-y-3">
            {similar.map((s) => <CompanyCard key={s.name + (s.__i ?? '')} b={s} dense />)}
          </div>
        </section>
      )}

      {pitchOpen && <PitchModal business={b} onClose={() => setPitchOpen(false)} />}
    </div>
  );
}

function bizKey(b, id) { return id || businessId(b); }
