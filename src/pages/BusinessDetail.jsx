// Business detail — full profile: map embed (real pin), call/WhatsApp,
// pitch drafter, save-to-leads, similar businesses, and dynamic JSON-LD schema.

import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Phone, MapPin, Mail, Globe, ExternalLink, Navigation, Bookmark, BookmarkCheck, Wand2, Clock, Users, Share2, Check, ShieldCheck } from 'lucide-react';
import { getBusiness, searchBusinesses, businessId } from '../lib/dataset';
import { telHref, googleMapsUrl, googleMapsEmbedUrl } from '../lib/derive';
import { waInfo, waShareHref } from '../lib/whatsapp';
import { isReal, provenanceNote } from '../lib/provenance';
import { Monogram, Stars, VerifiedBadge, SkeletonList, EmptyState, useToast } from '../components/ui';
import { PitchModal } from '../components/PitchModal';
import { findLead, addLead, removeLead } from '../lib/leads';
import { CompanyCard } from '../components/CompanyCard';
import SeoHead from '../components/SeoHead';
import PageFaq, { makeFaqSchema } from '../components/PageFaq';
import { WhatsAppButton, WhatsAppStatus } from '../components/WhatsAppButton';
import { ClaimListing } from '../components/ClaimListing';
import { verificationState } from '../lib/verify';

export default function BusinessDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const toast = useToast();
  const [b, setB] = useState(undefined); // undefined=loading, null=missing
  const [similar, setSimilar] = useState([]);
  const [pitchOpen, setPitchOpen] = useState(false);
  const [savedTick, setSavedTick] = useState(0);
  const [claimOpen, setClaimOpen] = useState(false);

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
  const wa = useMemo(() => waInfo(b || {}), [b]);
  const claimState = useMemo(() => (b ? verificationState({ ...b, bizId: bizKey(b, id) }) : 'none'), [b, id, savedTick, claimOpen]);
  // No pin (missing, or outside Pakistan) → no Directions button and no map embed, rather
  // than a link that opens in another country.
  const mapHref = useMemo(() => (b ? googleMapsUrl(b) : null), [b]);
  const mapEmbed = useMemo(() => (b ? googleMapsEmbedUrl(b) : null), [b]);

  if (b === undefined) return <SkeletonList n={4} />;
  if (b === null) return <EmptyState emoji="🤷" title="Business not found" hint="It may have been removed." action={<Link to="/browse" className="mt-3 inline-block bg-ink text-brand font-black text-[13px] rounded-xl px-4 py-2.5">Browse businesses</Link>} />;

  const isSaved = saved;

  const shareBusiness = async () => {
    const url = `${window.location.origin}/b/${id}`;
    const text = `${b.name} — ${b.cat?.name || 'Business'} in ${b.city}\nPhone: ${b.phone}\n(via Yellow Pages Pakistan)`;
    if (navigator.share) {
      try { await navigator.share({ title: b.name, text, url }); return; } catch { /* cancelled */ }
    }
    window.open(waShareHref(`${text}\n${url}`), '_blank');
  };

  const detailFaqs = [
    {
      q: `How do I contact ${b.name}?`,
      a: `You can reach ${b.name} directly by phone at ${b.phone}. ${wa.state === 'landline' ? 'This is a landline number, so WhatsApp is not available for it — tap Call to dial directly.' : `Tap the WhatsApp button to open a direct chat on ${wa.display} from your phone.`}`,
    },
    {
      q: `Where is ${b.name} located?`,
      a: `${b.name} is situated in ${b.city}, Pakistan at: ${b.address}. Tap "Open in Google Maps" for turn-by-turn directions.`,
    },
    {
      q: `How can I pitch or save ${b.name} as a prospective B2B client?`,
      a: `Tap "Save" to bookmark ${b.name} in your Lead Workspace (/leads). You can also tap "Draft pitch" to auto-generate a custom outreach message.`,
    },
    {
      q: `Are these business hours and phone numbers up to date?`,
      a: `Listed hours are ${b.hours || 'standard commercial hours'}. If you are the owner of ${b.name} and wish to modify any listing details, visit /add to submit updates free.`,
    },
  ];

  const schema = [
    {
      '@context': 'https://schema.org',
      '@type': 'LocalBusiness',
      name: b.name,
      telephone: b.phone,
      address: {
        '@type': 'PostalAddress',
        streetAddress: b.address,
        addressLocality: b.city,
        addressCountry: 'PK',
      },
      description: b.description,
    },
    makeFaqSchema(detailFaqs),
  ];

  return (
    <div className="animate-slide-up pb-8 space-y-4">
      <SeoHead
        title={`${b.name} in ${b.city} — Phone, WhatsApp & Address | Yellow Pages PK`}
        description={`Contact ${b.name} in ${b.city}, Pakistan. Phone: ${b.phone}, Category: ${b.cat?.name || 'Business'}, address: ${b.address}.`}
        canonicalPath={`/b/${id}`}
        schema={schema}
      />

      <button onClick={() => navigate(-1)} className="tap flex items-center gap-1.5 text-[13px] font-extrabold text-stone-500 mb-1 -mt-1">
        <ArrowLeft size={15} /> Back
      </button>

      {!isReal(b) && (
        <div className="rounded-2xl bg-amber-50 border border-amber-300 px-3.5 py-2.5">
          <p className="text-[12.5px] font-extrabold text-amber-900">🧪 Sample record</p>
          <p className="text-[11.5px] font-semibold text-amber-800 mt-0.5">{provenanceNote(b)}</p>
        </div>
      )}
      {isReal(b) && provenanceNote(b) && (
        <div className="rounded-2xl bg-stone-100 border border-stone-300 px-3.5 py-2.5">
          <p className="text-[11.5px] font-semibold text-stone-600">ℹ️ {provenanceNote(b)}</p>
        </div>
      )}

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
          <p className="flex items-center gap-2 flex-wrap">
            <Phone size={15} className="shrink-0 text-brand-deeper" /> <a href={telHref(b.phone)} className="hover:underline">{b.phone}</a>
            {wa.state !== 'landline' && <span className="inline-flex items-center gap-1 text-[11.5px] font-extrabold text-emerald-700"><Check size={11} strokeWidth={3.5} /> WhatsApp {wa.display}</span>}
          </p>
          {b.email && <p className="flex items-center gap-2"><Mail size={15} className="shrink-0 text-brand-deeper" /> <a href={`mailto:${b.email}`} className="text-sky-700 hover:underline truncate">{b.email}</a></p>}
          {b.website && <p className="flex items-center gap-2"><Globe size={15} className="shrink-0 text-brand-deeper" /> <a href={`https://${b.website}`} target="_blank" rel="noreferrer" className="text-sky-700 hover:underline">{b.website} <ExternalLink size={11} className="inline" /></a></p>}
        </div>

        {/* Actions */}
        <div className="grid grid-cols-2 gap-2 mt-4">
          <a href={telHref(b.phone)} className="tap h-11 rounded-2xl bg-ink text-brand font-black text-[14px] flex items-center justify-center gap-2">
            <Phone size={16} /> {b.phone.length > 15 ? 'Call' : b.phone}
          </a>
          <WhatsAppButton b={b} variant="pill" />
        </div>
        <div className="flex items-center justify-between gap-2 mt-2">
          <div className="flex items-center gap-2 flex-wrap">
            <WhatsAppStatus b={b} />
            {claimState === 'owner' ? (
              <span className="inline-flex items-center gap-1 bg-emerald-600 text-white rounded-full px-2 py-[1px] text-[10px] font-extrabold">
                <ShieldCheck size={10} /> OWNER VERIFIED
              </span>
            ) : (
              <button onClick={() => setClaimOpen(true)} className="tap inline-flex items-center gap-1 bg-white border border-stone-300 text-ink-soft rounded-full px-2 py-[1px] text-[10px] font-extrabold hover:border-emerald-500">
                <ShieldCheck size={10} /> Claim this listing
              </button>
            )}
          </div>
          <button onClick={() => setPitchOpen(true)} className="tap h-8 px-3 rounded-xl bg-brand-soft border border-brand/40 text-brand-deeper font-extrabold text-[12px] flex items-center gap-1.5">
            <Wand2 size={13} /> Draft pitch
          </button>
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
          {mapHref && (
            <a href={mapHref} target="_blank" rel="noreferrer" title={`Open ${b.name} in Google Maps`} className="tap h-11 rounded-2xl bg-white border border-stone-300 text-ink-soft font-black text-[13px] flex items-center justify-center gap-1.5">
              <Navigation size={14} /> Directions
            </a>
          )}
        </div>
      </div>

      {/* Map — real pin only. A listing without a verified Pakistani coordinate shows an
          explicit "no map pin" note instead of guessing a location. */}
      {mapEmbed && mapHref ? (
        <div className="mt-5 rounded-[24px] overflow-hidden border border-stone-200/80 shadow-card bg-white">
          <iframe
            title={`${b.name} on map`}
            src={mapEmbed}
            className="w-full h-[260px] block border-0"
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
            allowFullScreen
          />
          <a href={mapHref} target="_blank" rel="noreferrer" className="tap flex items-center justify-center gap-2 h-11 font-black text-[13px] text-brand-deeper bg-brand-soft/60 hover:bg-brand-soft">
            <MapPin size={15} /> Open in Google Maps
          </a>
        </div>
      ) : (
        <p className="mt-5 flex items-center gap-2 rounded-2xl border border-dashed border-stone-300 bg-white/70 px-3.5 py-3 text-[12.5px] font-bold text-stone-500">
          <MapPin size={14} className="shrink-0 text-stone-400" />
          No map pin for this listing — we would rather show none than a wrong location.
        </p>
      )}

      {/* Similar */}
      {similar.length > 0 && (
        <section className="mt-6">
          <h2 className="font-black text-ink text-lg mb-2.5">Similar in {b.city} 🧭</h2>
          <div className="space-y-3">
            {similar.map((s) => <CompanyCard key={s.name + (s.__i ?? '')} b={s} dense />)}
          </div>
        </section>
      )}

      {/* Profile-Specific FAQ */}
      <div className="mt-8 pt-4">
        <PageFaq
          title={`About ${b.name}`}
          subtitle="Frequently asked questions about contacting this business."
          faqs={detailFaqs}
        />
      </div>

      {pitchOpen && <PitchModal business={b} onClose={() => setPitchOpen(false)} />}
      {claimOpen && (
        <ClaimListing
          business={b}
          listingId={bizKey(b, id)}
          onClose={() => setClaimOpen(false)}
          onClaimed={() => setSavedTick((t) => t + 1)}
        />
      )}
    </div>
  );
}

function bizKey(b, id) { return id || businessId(b); }
