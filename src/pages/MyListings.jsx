// My Listings — the user's own records, editable at any time.
//
// Why this exists: a directory you can only read is a brochure. Agencies, shopkeepers and
// field sales teams keep their own books — clients they visited, numbers they collected on
// the road, businesses the directory has not imported yet. This page lets them keep those
// records here: validated like any other listing, searchable with the rest of the directory,
// savable as leads, and exportable to CSV.
//
// It is explicitly device-local. Nothing here is uploaded, and every row is labelled
// "My own listing" wherever it appears, so a self-typed number is never confused with a
// dataset record or an owner-verified one.

import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import {
  Plus, Upload, Download, Pencil, Trash2, Search, Phone,
  MapPin, Bookmark, BookmarkCheck, ArrowLeft, AlertTriangle, FileSpreadsheet,
} from 'lucide-react';
import { CATEGORIES, CATEGORY_BY_ID } from '../data/categories';
import { CITIES } from '../data/geo';
import {
  getCustomListings, getCustomListing, saveCustomListing, deleteCustomListing,
  parseCustomImport, customCount,
} from '../lib/customListings';
import { findLead, addLead, removeLead } from '../lib/leads';
import { downloadFile } from '../lib/export';
import { telHref } from '../lib/derive';
import { isWaCapable, waDisplayNumber } from '../lib/whatsapp';
import { PageHeader, EmptyState, useToast, Monogram, CustomBadge, Section } from '../components/ui';
import { WhatsAppButton } from '../components/WhatsAppButton';
import SeoHead from '../components/SeoHead';

const BLANK = {
  name: '', phone: '', cat: '', city: '', area: '', address: '',
  email: '', website: '', hours: '', desc: '', lat: '', lng: '', whatsapp: false,
};

const CUSTOM_CSV_HEAD =
  'Name,Category,City,Area,Address,Phone,WhatsApp,Email,Website,Hours,Latitude,Longitude,My Listing';

function toCsv(rows) {
  const esc = (v) => {
    const s = String(v ?? '');
    return /[",\n]/.test(s) ? `"${s.replaceAll('"', '""')}"` : s;
  };
  const body = rows.map((r) => [
    r.name, r.catName, r.city, r.area, r.address, r.phone,
    isWaCapable(r.phone) ? (r.whatsapp ? 'Yes' : 'Unverified') : 'No',
    r.email, r.website, r.hours, r.lat ?? '', r.lng ?? '', 'yes',
  ].map(esc).join(','));
  return [CUSTOM_CSV_HEAD, ...body].join('\n');
}

export default function MyListings() {
  const toast = useToast();
  const navigate = useNavigate();
  const { id: editingParam } = useParams();
  const editing = editingParam ? getCustomListing(editingParam) : null;

  const [tick, setTick] = useState(0);
  const [form, setForm] = useState(() => (editing ? { ...editing, cat: String(editing.catId) } : BLANK));
  const [errors, setErrors] = useState({});
  const [open, setOpen] = useState(!!editingParam || getCustomListings().length === 0);
  const [q, setQ] = useState('');
  const [importOpen, setImportOpen] = useState(false);
  const [importText, setImportText] = useState('');
  const [importMsg, setImportMsg] = useState(null);

  const rows = useMemo(() => getCustomListings(), [tick]);
  const filtered = useMemo(() => {
    const t = q.trim().toLowerCase();
    if (!t) return rows;
    return rows.filter((r) => `${r.name} ${r.city} ${r.catName} ${r.area}`.toLowerCase().includes(t));
  }, [rows, q]);

  useEffect(() => {
    if (!editingParam) return;
    const r = getCustomListing(editingParam);
    if (r) { setForm({ ...r, cat: String(r.catId) }); setOpen(true); }
  }, [editingParam]);

  const set = (k, v) => {
    setForm((f) => ({ ...f, [k]: v }));
    setErrors((e) => (e[k] ? { ...e, [k]: undefined } : e));
  };

  const reset = () => {
    setForm(BLANK);
    setErrors({});
    if (editingParam) navigate('/my-listings');
  };

  const submit = (e) => {
    e.preventDefault();
    const res = saveCustomListing(form, { editingId: editingParam || null });
    if (!res.ok) {
      setErrors(res.errors);
      toast(res.quota ? 'Device storage is full' : 'Check the highlighted fields', '⚠️');
      return;
    }
    setTick((t) => t + 1);
    toast(editingParam ? 'Listing updated ✅' : `“${res.record.name}” added to your directory 🎉`);
    reset();
    if (!rows.length) setOpen(false);
  };

  const doImport = () => {
    const { rows: parsed, error } = parseCustomImport(importText);
    if (error) { setImportMsg({ tone: 'bad', text: error }); return; }
    let added = 0;
    const failed = [];
    for (const draft of parsed) {
      const res = saveCustomListing(draft);
      if (res.ok) added++;
      else failed.push(`${draft.name || '(no name)'} — ${Object.values(res.errors)[0]}`);
    }
    setTick((t) => t + 1);
    setImportMsg({
      tone: failed.length ? 'warn' : 'good',
      text: `${added} of ${parsed.length} rows imported.${failed.length ? ` Skipped: ${failed.slice(0, 4).join('; ')}${failed.length > 4 ? ` …and ${failed.length - 4} more` : ''}` : ''}`,
    });
    if (added) toast(`${added} listings imported`, '📥');
  };

  const onFile = async (file) => {
    if (!file) return;
    const text = await file.text();
    setImportText(text);
  };

  const isSaved = (r) => !!findLead(r.id);
  const toggleSave = (r) => {
    if (isSaved(r)) { removeLead(r.id); toast('Removed from leads', '🗑️'); } else { addLead({ ...r, bizId: r.id }); toast('Saved to leads', '🔖'); }
    setTick((t) => t + 1);
  };

  const mobileOk = isWaCapable(form.phone);
  const count = customCount();

  return (
    <div className="page-stack pb-10">
      <SeoHead
        title="My Listings — Add Your Own Businesses | Yellow Pages PK"
        description="Create your own business listings with name, phone, WhatsApp and city. They appear in your search results, lead lists and CSV exports on this device."
        canonicalPath="/my-listings"
        noindex
      />

      <PageHeader
        icon={Plus}
        title="My listings"
        subtitle="Businesses you add yourself — kept on this device, searchable with the rest of the directory."
        actions={
          <button
            type="button"
            onClick={() => { setOpen((o) => !o); if (open) reset(); }}
            className="tap inline-flex items-center gap-1.5 rounded-full bg-ink px-3.5 min-h-[2.5rem] text-[12.5px] font-extrabold text-brand"
          >
            <Plus size={14} /> {open ? 'Close' : 'Add'}
          </button>
        }
      />

      {/* ── Form ───────────────────────────────────────────────────────────── */}
      {open && (
        <form onSubmit={submit} className="card card-pad stack-md animate-pop-in">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h2 className="font-black text-[16px] text-ink">
                {editingParam ? 'Edit listing' : 'New listing'}
              </h2>
              <p className="text-[12px] font-semibold text-stone-500 mt-1">
                Two required things: a name and a number people can actually reach.
              </p>
            </div>
            {editingParam && (
              <Link to="/my-listings" className="text-[12px] font-extrabold text-stone-500 underline shrink-0">Cancel edit</Link>
            )}
          </div>

          <div>
            <label className="field-label" htmlFor="cl-name">Business name *</label>
            <input
              id="cl-name"
              className={`field ${errors.name ? 'field-error' : ''}`}
              value={form.name}
              onChange={(e) => set('name', e.target.value)}
              placeholder="e.g. Al-Madina Kiryana Store"
              autoComplete="organization"
              list="cl-name-suggestions"
            />
            <datalist id="cl-name-suggestions">
              {CATEGORIES.slice(0, 0).map(() => null)}
            </datalist>
            {errors.name && <span className="field-hint-error">{errors.name}</span>}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="field-label" htmlFor="cl-phone">Phone number *</label>
              <input
                id="cl-phone"
                className={`field ${errors.phone ? 'field-error' : ''}`}
                value={form.phone}
                onChange={(e) => set('phone', e.target.value)}
                placeholder="0300-1234567 or 021-1234567"
                inputMode="tel"
                autoComplete="tel"
              />
              {errors.phone ? (
                <span className="field-hint-error">{errors.phone}</span>
              ) : (
                <span className="field-hint">
                  {mobileOk
                    ? `Mobile → WhatsApp chat available (${waDisplayNumber(form.phone)})`
                    : form.phone
                      ? 'Landline or UAN → Call button only, no dead WhatsApp link.'
                      : 'Mobiles (03xx) can start a WhatsApp chat; landlines cannot.'}
                </span>
              )}
            </div>
            <div>
              <label className="field-label" htmlFor="cl-cat">Category *</label>
              <select
                id="cl-cat"
                className={`field ${errors.cat ? 'field-error' : ''}`}
                value={form.cat}
                onChange={(e) => set('cat', e.target.value)}
              >
                <option value="">Choose a category…</option>
                {CATEGORIES.map((c) => (
                  <option key={c.id} value={c.id}>{c.emoji} {c.name}</option>
                ))}
              </select>
              {errors.cat && <span className="field-hint-error">{errors.cat}</span>}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="field-label" htmlFor="cl-city">City *</label>
              <select
                id="cl-city"
                className={`field ${errors.city ? 'field-error' : ''}`}
                value={form.city}
                onChange={(e) => set('city', e.target.value)}
              >
                <option value="">Choose a city…</option>
                {CITIES.map((c) => (
                  <option key={c.name} value={c.name}>{c.name} — {c.province}</option>
                ))}
              </select>
              {errors.city && <span className="field-hint-error">{errors.city}</span>}
            </div>
            <div>
              <label className="field-label" htmlFor="cl-area">Area / market</label>
              <input
                id="cl-area"
                className="field"
                value={form.area}
                onChange={(e) => set('area', e.target.value)}
                placeholder="e.g. Bolton Market, Gulberg"
              />
            </div>
          </div>

          <label className={`flex items-start gap-3 rounded-xl border px-3.5 py-3 cursor-pointer ${mobileOk ? 'border-stone-300 bg-white' : 'border-stone-200 bg-stone-50'}`}>
            <input
              type="checkbox"
              checked={form.whatsapp}
              disabled={!mobileOk}
              onChange={(e) => set('whatsapp', e.target.checked)}
              className="accent-[#F5B301] w-[18px] h-[18px] mt-0.5 disabled:opacity-40"
            />
            <span className="min-w-0">
              <span className="block text-[13.5px] font-extrabold text-ink-soft">This number is on WhatsApp</span>
              <span className="block text-[11.5px] font-semibold text-stone-500 mt-0.5">
                {mobileOk ? 'Buyers get a direct chat button.' : 'Only possible with a mobile (03xx) number.'}
              </span>
            </span>
          </label>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="field-label" htmlFor="cl-email">Email</label>
              <input id="cl-email" className="field" value={form.email} onChange={(e) => set('email', e.target.value)} inputMode="email" placeholder="optional" />
            </div>
            <div>
              <label className="field-label" htmlFor="cl-web">Website</label>
              <input id="cl-web" className="field" value={form.website} onChange={(e) => set('website', e.target.value)} placeholder="optional" />
            </div>
          </div>

          <div>
            <label className="field-label" htmlFor="cl-addr">Full address</label>
            <input id="cl-addr" className="field" value={form.address} onChange={(e) => set('address', e.target.value)} placeholder="Shop 4, main road…" />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="field-label" htmlFor="cl-hours">Business hours</label>
              <input id="cl-hours" className="field" value={form.hours} onChange={(e) => set('hours', e.target.value)} placeholder="Mon–Sat, 9am–8pm" />
            </div>
            <div>
              <label className="field-label" htmlFor="cl-lat">Map pin (optional)</label>
              <div className="grid grid-cols-2 gap-2">
                <input id="cl-lat" className={`field ${errors.location ? 'field-error' : ''}`} value={form.lat ?? ''} onChange={(e) => set('lat', e.target.value)} placeholder="Latitude" inputMode="decimal" />
                <input className={`field ${errors.location ? 'field-error' : ''}`} value={form.lng ?? ''} onChange={(e) => set('lng', e.target.value)} placeholder="Longitude" inputMode="decimal" aria-label="Longitude" />
              </div>
              {errors.location ? (
                <span className="field-hint-error">{errors.location}</span>
              ) : (
                <span className="field-hint">Leave empty if you don’t know it — the Map button hides itself.</span>
              )}
            </div>
          </div>

          <div>
            <label className="field-label" htmlFor="cl-desc">What does this business do?</label>
            <textarea id="cl-desc" className="field" rows={3} value={form.desc} onChange={(e) => set('desc', e.target.value)} placeholder="One or two lines in your own words." />
          </div>

          {errors._ && (
            <p className="flex items-center gap-2 text-[12.5px] font-extrabold text-red-600">
              <AlertTriangle size={14} /> {errors._}
            </p>
          )}

          <button type="submit" className="btn-primary">
            <Plus size={16} /> {editingParam ? 'Save changes' : 'Add to my directory'}
          </button>
          <p className="text-[11.5px] font-semibold text-stone-400 text-center leading-relaxed">
            Saved on this device only. To publish a business publicly, use <Link to="/add" className="underline font-extrabold">the free listing form</Link>.
          </p>
        </form>
      )}

      {/* ── Import / export ────────────────────────────────────────────────── */}
      <Section
        title="Bulk add"
        subtitle="Already keep a spreadsheet of clients? Bring them in."
        action={
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setImportOpen((o) => !o)}
              className="btn-secondary"
            >
              <Upload size={14} /> Import
            </button>
            <button
              type="button"
              onClick={() => {
                if (!rows.length) return toast('Nothing to export yet', '🤷');
                downloadFile(`my-listings-${new Date().toISOString().slice(0, 10)}.csv`, toCsv(rows));
                toast(`Exported ${rows.length} listings`, '📤');
              }}
              className="btn-secondary"
            >
              <FileSpreadsheet size={14} /> CSV
            </button>
          </div>
        }
      >
        {importOpen && (
          <div className="card card-pad stack-md animate-pop-in">
            <div>
              <p className="text-[13px] font-bold text-ink-soft leading-relaxed">
                Paste CSV with a header row, or a JSON array. Recognised columns:
                <span className="font-mono text-[11.5px] text-stone-500 wrap-any"> name, phone, city, category, area, address, email, website, hours, lat, lng</span>.
              </p>
              <label className="field-label mt-3" htmlFor="cl-file">Or choose a .csv / .json file</label>
              <input
                id="cl-file"
                type="file"
                accept=".csv,.json,text/csv,application/json"
                onChange={(e) => onFile(e.target.files?.[0])}
                className="block w-full text-[12.5px] font-bold text-stone-500 file:mr-3 file:rounded-xl file:border-0 file:bg-ink file:px-3 file:py-2 file:text-[12.5px] file:font-extrabold file:text-brand"
              />
            </div>
            <div>
              <label className="field-label" htmlFor="cl-import">Rows</label>
              <textarea
                id="cl-import"
                className="field"
                rows={5}
                value={importText}
                onChange={(e) => setImportText(e.target.value)}
                placeholder={'name,phone,city,category\nAl-Madina Store,0300-1234567,Sahiwal,Kirana Store'}
              />
            </div>
            {importMsg && (
              <p className={`text-[12.5px] font-bold leading-relaxed ${importMsg.tone === 'bad' ? 'text-red-600' : importMsg.tone === 'warn' ? 'text-amber-700' : 'text-emerald-700'}`}>
                {importMsg.text}
              </p>
            )}
            <div className="flex flex-col sm:flex-row gap-2">
              <button type="button" onClick={doImport} disabled={!importText.trim()} className="btn-primary sm:flex-1">
                <Upload size={15} /> Import rows
              </button>
              <button
                type="button"
                onClick={() => downloadFile('my-listings-template.csv', `${CUSTOM_CSV_HEAD}\nAl-Madina Kiryana Store,Kirana Store,Sahiwal,Bolton Market,Shop 4,0300-1234567,Yes,,,Mon-Sat 9-8,,,yes`)}
                className="btn-secondary sm:w-auto justify-center"
              >
                <Download size={14} /> Template
              </button>
            </div>
          </div>
        )}
      </Section>

      {/* ── The list ──────────────────────────────────────────────────────── */}
      <Section
        title={count ? `Your listings (${count})` : 'Your listings'}
        subtitle={count ? 'Tap a row to open it, or the pencil to edit.' : undefined}
      >
        {count > 3 && (
          <div className="flex items-center gap-2 bg-white rounded-2xl px-3.5 min-h-[3rem] border border-stone-300 shadow-card">
            <Search size={16} className="text-stone-400 shrink-0" />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search your listings…"
              className="flex-1 bg-transparent outline-none text-[14px] font-bold text-ink placeholder:font-semibold placeholder:text-stone-400 min-w-0"
            />
            {q && (
              <button type="button" onClick={() => setQ('')} className="text-[12px] font-extrabold text-stone-400 shrink-0">Clear</button>
            )}
          </div>
        )}

        {count === 0 ? (
          <EmptyState
            emoji="🗂️"
            title="No custom listings yet"
            hint="Add a business you already know — a client, a shop you visited, a supplier. It will show up in your searches and lead lists."
            action={
              <button type="button" onClick={() => setOpen(true)} className="mt-4 inline-flex items-center gap-1.5 rounded-xl bg-ink px-4 py-2.5 text-[13px] font-extrabold text-brand">
                <Plus size={14} /> Add your first listing
              </button>
            }
          />
        ) : filtered.length === 0 ? (
          <EmptyState emoji="🔍" title="No match" hint={`Nothing here matches “${q}”.`} />
        ) : (
          <div className="stack-sm">
            {filtered.map((r) => {
              const saved = isSaved(r);
              return (
                <div key={r.id} className="card card-pad stack-sm">
                  <div className="flex items-start gap-3">
                    <Monogram name={r.name} color={CATEGORY_BY_ID[r.catId]?.color || '#F5B301'} emoji={r.catEmoji} size={42} />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <Link to={`/b/${r.id}`} className="font-extrabold text-[15px] text-ink leading-tight hover:underline wrap-any">
                          {r.name}
                        </Link>
                        <CustomBadge />
                      </div>
                      <p className="text-[12px] font-bold text-stone-500 mt-1 wrap-any">
                        {r.catEmoji} {r.catName}
                        <span className="text-stone-300"> · </span>
                        <MapPin size={10} className="inline -mt-0.5" /> {r.area || r.city}
                      </p>
                      <p className="text-[12px] font-extrabold text-stone-600 mt-1 wrap-any">{r.phone}</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => toggleSave(r)}
                      aria-label={saved ? 'Remove from leads' : 'Save to leads'}
                      className={`tap shrink-0 w-9 h-9 rounded-full flex items-center justify-center border ${saved ? 'bg-brand border-brand text-ink' : 'bg-white border-stone-300 text-stone-500'}`}
                    >
                      {saved ? <BookmarkCheck size={16} /> : <Bookmark size={16} />}
                    </button>
                  </div>

                  <div className="flex flex-wrap gap-2 pt-1">
                    <a href={telHref(r.phone)} className="tap inline-flex items-center justify-center gap-1.5 flex-1 min-w-[6.5rem] min-h-[2.5rem] rounded-xl bg-ink text-brand text-[12.5px] font-extrabold">
                      <Phone size={13} /> Call
                    </a>
                    <WhatsAppButton b={r} variant="ghost" />
                    <Link
                      to={`/my-listings/${r.id}`}
                      className="tap inline-flex items-center justify-center gap-1.5 min-h-[2.5rem] rounded-xl bg-brand-soft text-brand-deeper border border-brand/40 px-3 text-[12.5px] font-extrabold"
                    >
                      <Pencil size={13} /> Edit
                    </Link>
                    <button
                      type="button"
                      onClick={() => {
                        if (!window.confirm(`Delete “${r.name}” from your listings?`)) return;
                        deleteCustomListing(r.id);
                        setTick((t) => t + 1);
                        toast('Listing deleted', '🗑️');
                      }}
                      aria-label={`Delete ${r.name}`}
                      className="tap inline-flex items-center justify-center w-[2.5rem] min-h-[2.5rem] rounded-xl bg-stone-100 text-stone-500"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </Section>

      <div className="flex flex-col gap-2.5 rounded-2xl border border-stone-200 bg-white/70 p-4">
        <p className="text-[12.5px] font-bold text-stone-500 leading-relaxed">
          These listings live in this browser. Clearing site data removes them —
          export a CSV first if they matter.
        </p>
        <Link to="/leads" className="inline-flex items-center gap-1.5 text-[12.5px] font-extrabold text-brand-deeper">
          <ArrowLeft size={13} /> Go to lead workspace
        </Link>
      </div>
    </div>
  );
}
