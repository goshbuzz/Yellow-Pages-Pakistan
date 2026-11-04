// Lead Workspace — lists, statuses, notes, pitch drafting & CSV export.
//
// What was broken and is now fixed:
//  • The workspace never re-read storage after a change made on another screen (saving a
//    business, then opening Leads, showed a stale/empty list) — it now refreshes whenever
//    the tab regains focus or storage changes, and on mount.
//  • Rows only looked "whole" on a wide screen; on a phone the title, status pills, note
//    and four icon buttons competed for the same line. They are now stacked with real gaps
//    and full-height touch targets.
//  • A list could not be renamed, and the delete affordance was a tiny orphan link at the
//    bottom of the page.
//  • A lead with no number rendered a dead Call button.

import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Plus, FileSpreadsheet, Phone, MapPin, Trash2, Pencil, Wand2, Check,
  ChevronRight, Layers, MessageSquare, Search, X, FolderPlus,
} from 'lucide-react';
import {
  getLists, createList, deleteList, renameList, getLeadsIn, getLeads,
  updateLead, removeLead, STATUSES,
} from '../lib/leads';
import { leadsToCsv, downloadFile } from '../lib/export';
import { telHref } from '../lib/derive';
import { PageHeader, EmptyState, useToast, Section, StatTile, Chip } from '../components/ui';
import { PitchModal } from '../components/PitchModal';
import { WhatsAppButton, WhatsAppGlyph } from '../components/WhatsAppButton';
import { WhatsAppQueue } from '../components/WhatsAppQueue';
import SeoHead from '../components/SeoHead';
import PageFaq, { makeFaqSchema } from '../components/PageFaq';

const LEADS_FAQS = [
  {
    q: 'How does the Lead Workspace help freelancers and marketing agencies?',
    a: 'It is a built-in B2B outreach CRM. Save Pakistani businesses into prospect lists, track each one through New → Contacted → Replied → Won/Lost, add a note, draft a pitch, and export the list to CSV.',
  },
  {
    q: 'Is my saved lead data private?',
    a: 'Yes. Lead lists, statuses and notes are stored in your browser on this device. Nothing is uploaded and no other user can see your pipeline. Use the CSV export if you want a backup.',
  },
  {
    q: 'Can I export my lead lists to HubSpot, Excel, or Google Sheets?',
    a: 'Yes. The CSV button downloads the active list with company name, category, city, phone, a WhatsApp flag, the international WhatsApp number and a working WhatsApp link — the link is only filled for mobile numbers, so no dead chat URLs reach your CRM.',
  },
  {
    q: 'What happens to a business I saved that had a landline?',
    a: 'It stays in your list with a working Call button and a "Copy number" WhatsApp action that tells you why chat is unavailable. Landlines and UANs cannot receive WhatsApp, so the app never pretends otherwise.',
  },
];

export default function Leads() {
  const toast = useToast();
  const [tick, setTick] = useState(0);
  const [activeList, setActiveList] = useState('default');
  const [creating, setCreating] = useState(false);
  const [newName, setNewName] = useState('');
  const [renaming, setRenaming] = useState(null);
  const [renameDraft, setRenameDraft] = useState('');
  const [pitchFor, setPitchFor] = useState(null);
  const [queueOpen, setQueueOpen] = useState(false);
  const [editingNote, setEditingNote] = useState(null);
  const [noteDraft, setNoteDraft] = useState('');
  const [q, setQ] = useState('');
  const [statusFilter, setStatusFilter] = useState(null);

  const refresh = useCallback(() => setTick((t) => t + 1), []);

  // Keep the workspace honest: another screen may have added/removed a lead.
  useEffect(() => {
    const onFocus = () => refresh();
    const onStorage = (e) => { if (!e.key || e.key.startsWith('ypk.')) refresh(); };
    window.addEventListener('focus', onFocus);
    window.addEventListener('storage', onStorage);
    refresh();
    return () => {
      window.removeEventListener('focus', onFocus);
      window.removeEventListener('storage', onStorage);
    };
  }, [refresh]);

  const lists = useMemo(() => getLists(), [tick]);
  const allLeads = useMemo(() => getLeads(), [tick]);
  const listLeads = useMemo(() => getLeadsIn(activeList), [activeList, tick]);

  const counts = useMemo(() => {
    const c = {};
    for (const l of allLeads) c[l.listId] = (c[l.listId] || 0) + 1;
    return c;
  }, [allLeads]);

  // The list may have been deleted from another tab.
  useEffect(() => {
    if (lists.length && !lists.some((l) => l.id === activeList)) setActiveList(lists[0].id);
  }, [lists, activeList]);

  const leads = useMemo(() => {
    const term = q.trim().toLowerCase();
    return listLeads.filter((l) => {
      if (statusFilter && l.status !== statusFilter) return false;
      if (!term) return true;
      return `${l.name} ${l.city} ${l.cat} ${l.note}`.toLowerCase().includes(term);
    });
  }, [listLeads, q, statusFilter]);

  const stats = useMemo(() => ({
    new: listLeads.filter((l) => l.status === 'new').length,
    contacted: listLeads.filter((l) => l.status === 'contacted').length,
    replied: listLeads.filter((l) => l.status === 'replied').length,
    won: listLeads.filter((l) => l.status === 'won').length,
    lost: listLeads.filter((l) => l.status === 'lost').length,
  }), [listLeads]);

  const contactable = useMemo(
    () => listLeads.filter((l) => l.phone && l.phone.replace(/\D/g, '').length >= 9),
    [listLeads]
  );

  const activeName = lists.find((l) => l.id === activeList)?.name || 'My Leads';

  const doExport = () => {
    if (!leads.length) return toast('No leads to export yet', '🤷');
    const stamp = new Date().toISOString().slice(0, 10);
    downloadFile(`yellowpagespk-leads-${activeList}-${stamp}.csv`, leadsToCsv(leads));
    toast(`Exported ${leads.length} leads to CSV`, '📤');
  };

  const doCreate = () => {
    const name = newName.trim();
    if (!name) return;
    const id = createList(name);
    setNewName('');
    setCreating(false);
    setActiveList(id);
    refresh();
    toast(`List “${name}” created`, '📁');
  };

  const doRename = () => {
    const name = renameDraft.trim();
    if (name && renaming) { renameList(renaming, name); refresh(); toast('List renamed', '✏️'); }
    setRenaming(null);
  };

  const schema = makeFaqSchema(LEADS_FAQS);

  return (
    <div className="page-stack pb-10">
      <SeoHead
        title="B2B Lead Workspace & CRM Export | Yellow Pages PK"
        description="Save Pakistani company leads, organise outreach pipelines, draft WhatsApp and email pitches, and export contacts to CSV for your CRM."
        canonicalPath="/leads"
        schema={schema}
        noindex
      />

      <PageHeader
        icon={Layers}
        title="Lead workspace"
        subtitle="Shortlist businesses, track each conversation, then export or message them."
        actions={
          <>
            <button
              onClick={() => { if (!contactable.length) return toast('No WhatsApp-capable leads yet', '🤷'); setQueueOpen(true); }}
              className="tap inline-flex items-center gap-1.5 rounded-full bg-emerald-500 px-3 min-h-[2.5rem] text-[12.5px] font-extrabold text-white"
            >
              <WhatsAppGlyph size={14} /> <span className="hidden min-[380px]:inline">Outreach</span>
            </button>
            <button
              onClick={doExport}
              className="tap inline-flex items-center gap-1.5 rounded-full bg-ink px-3 min-h-[2.5rem] text-[12.5px] font-extrabold text-brand"
            >
              <FileSpreadsheet size={14} /> CSV
            </button>
          </>
        }
      />

      {/* ── Lists ─────────────────────────────────────────────────────────── */}
      <Section title="Your lists" subtitle="Group leads by campaign, city or client.">
        <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
          {lists.map((l) => (
            <button
              key={l.id}
              onClick={() => { setActiveList(l.id); setStatusFilter(null); }}
              className={`tap shrink-0 inline-flex items-center gap-1.5 rounded-full border px-3.5 min-h-[2.4rem] text-[12.5px] font-extrabold ${activeList === l.id ? 'bg-ink text-brand border-ink' : 'bg-white border-stone-300 text-ink-soft'}`}
            >
              {l.name}
              <span className={`text-[10.5px] font-black ${activeList === l.id ? 'text-brand/70' : 'text-stone-400'}`}>{counts[l.id] || 0}</span>
            </button>
          ))}
          <button
            onClick={() => setCreating(true)}
            aria-label="Create a new list"
            className="tap shrink-0 inline-flex items-center justify-center gap-1 rounded-full bg-brand-soft border border-brand/50 px-3 min-h-[2.4rem] text-[12.5px] font-extrabold text-brand-deeper"
          >
            <FolderPlus size={14} /> New
          </button>
        </div>

        {creating && (
          <div className="flex gap-2 animate-pop-in">
            <input
              autoFocus
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') doCreate(); if (e.key === 'Escape') setCreating(false); }}
              placeholder="List name, e.g. Karachi restaurants"
              className="field flex-1"
            />
            <button onClick={doCreate} className="btn-primary w-auto px-4">Create</button>
          </div>
        )}
      </Section>

      {/* ── Pipeline ──────────────────────────────────────────────────────── */}
      {listLeads.length > 0 && (
        <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
          {STATUSES.map((s) => (
            <button
              key={s.id}
              type="button"
              onClick={() => setStatusFilter((f) => (f === s.id ? null : s.id))}
              className={`rounded-2xl border py-2.5 px-1 text-center transition-colors ${statusFilter === s.id ? 'border-ink bg-ink text-cream' : 'border-stone-200 bg-white text-ink'}`}
              aria-pressed={statusFilter === s.id}
            >
              <p className="text-[18px] font-black leading-none" style={{ color: statusFilter === s.id ? '#F5B301' : s.color }}>
                {stats[s.id]}
              </p>
              <p className={`text-[9.5px] font-extrabold tracking-wider uppercase mt-1.5 ${statusFilter === s.id ? 'text-cream/70' : 'text-stone-500'}`}>
                {s.label}
              </p>
            </button>
          ))}
        </div>
      )}

      {/* ── Tools ─────────────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row gap-2 sm:items-center">
        <div className="flex items-center gap-2 bg-white rounded-2xl px-3.5 min-h-[3rem] border border-stone-300 shadow-card flex-1">
          <Search size={16} className="text-stone-400 shrink-0" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder={`Search in “${activeName}”…`}
            aria-label="Search this lead list"
            className="flex-1 min-w-0 bg-transparent outline-none text-[14px] font-bold text-ink placeholder:font-semibold placeholder:text-stone-400"
          />
          {q && (
            <button onClick={() => setQ('')} aria-label="Clear search" className="tap-sm shrink-0 w-6 h-6 rounded-full bg-stone-100 text-stone-500 flex items-center justify-center">
              <X size={12} />
            </button>
          )}
        </div>
        {(q || statusFilter) && (
          <button onClick={() => { setQ(''); setStatusFilter(null); }} className="btn-secondary shrink-0 justify-center">
            Clear filters
          </button>
        )}
        <button onClick={() => doExport} className="btn-secondary sm:hidden justify-center">
          <FileSpreadsheet size={14} /> Export this list
        </button>
      </div>

      {/* ── Leads ─────────────────────────────────────────────────────────── */}
      <div className="stack-md">
        <div className="flex items-center justify-between gap-3">
          <h2 className="font-black text-[16px] text-ink">
            {activeName} <span className="text-stone-400 font-extrabold">({leads.length})</span>
          </h2>
          {activeList !== 'default' && (
            <div className="flex items-center gap-2 shrink-0">
              <button
                onClick={() => { setRenaming(activeList); setRenameDraft(activeName); }}
                className="text-[12px] font-extrabold text-stone-500 inline-flex items-center gap-1"
              >
                <Pencil size={11} /> Rename
              </button>
              <button
                onClick={() => {
                  if (!window.confirm(`Delete the list “${activeName}” and its ${counts[activeList] || 0} saved leads?`)) return;
                  deleteList(activeList);
                  setActiveList('default');
                  refresh();
                  toast('List deleted', '🗑️');
                }}
                className="text-[12px] font-extrabold text-stone-400 inline-flex items-center gap-1"
              >
                <Trash2 size={11} /> Delete
              </button>
            </div>
          )}
        </div>

        {renaming && (
          <div className="flex gap-2 animate-pop-in">
            <input
              autoFocus
              value={renameDraft}
              onChange={(e) => setRenameDraft(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') doRename(); if (e.key === 'Escape') setRenaming(null); }}
              className="field flex-1"
            />
            <button onClick={doRename} className="btn-primary w-auto px-4">Save</button>
          </div>
        )}

        {listLeads.length === 0 ? (
          <EmptyState
            emoji="🔖"
            title="No leads in this list yet"
            hint="Open any business and tap the bookmark icon to save it here. You can then track stages, draft a pitch and export the list."
            action={<Link to="/browse" className="btn-primary mt-4 w-auto px-4"><Search size={15} /> Find businesses</Link>}
          />
        ) : leads.length === 0 ? (
          <EmptyState emoji="🔍" title="Nothing matches" hint="No lead in this list matches your search or the status you picked." />
        ) : (
          leads.map((l) => {
            const hasPhone = !!l.phone && l.phone.replace(/\D/g, '').length >= 9;
            return (
              <article key={l.bizId} className="card card-pad stack-md">
                {/* Identity */}
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <Link to={`/b/${l.bizId}`} className="font-extrabold text-[15px] text-ink leading-tight hover:underline block wrap-any">
                      {l.name}
                    </Link>
                    <p className="text-[12px] font-bold text-stone-500 mt-1.5 wrap-any">
                      {l.cat || 'Business'}
                      <span className="text-stone-300"> · </span>
                      <MapPin size={10} className="inline -mt-0.5" /> {l.city}
                    </p>
                    {hasPhone && (
                      <p className="text-[12.5px] font-extrabold text-stone-600 mt-1 wrap-any">{l.phone}</p>
                    )}
                  </div>
                  <button
                    onClick={() => { removeLead(l.bizId); refresh(); toast('Lead removed', '🗑️'); }}
                    aria-label={`Remove ${l.name} from leads`}
                    className="tap shrink-0 w-9 h-9 rounded-full bg-stone-100 text-stone-500 flex items-center justify-center"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>

                {/* Actions — full-width row so nothing is a 32px target on a phone */}
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {hasPhone ? (
                    <a href={telHref(l.phone)} className="tap inline-flex items-center justify-center gap-1.5 min-h-[2.5rem] rounded-xl bg-ink text-brand text-[12.5px] font-extrabold">
                      <Phone size={13} /> Call
                    </a>
                  ) : (
                    <span className="inline-flex items-center justify-center min-h-[2.5rem] rounded-xl bg-stone-100 text-stone-400 text-[12px] font-extrabold">No number</span>
                  )}
                  <WhatsAppButton b={{ ...l, cat: l.cat, city: l.city }} variant="ghost" className="w-full" />
                  <button
                    onClick={() => setPitchFor(l)}
                    className="tap inline-flex items-center justify-center gap-1.5 min-h-[2.5rem] rounded-xl bg-brand-soft text-brand-deeper border border-brand/40 text-[12.5px] font-extrabold col-span-2 sm:col-span-1"
                  >
                    <Wand2 size={13} /> Draft pitch
                  </button>
                </div>

                {/* Status */}
                <div className="flex gap-1.5 flex-wrap">
                  {STATUSES.map((s) => (
                    <button
                      key={s.id}
                      onClick={() => { updateLead(l.bizId, { status: s.id }); refresh(); }}
                      className={`tap rounded-full px-2.5 min-h-[1.9rem] text-[11px] font-extrabold border ${l.status === s.id ? 'text-white border-transparent' : 'bg-white border-stone-300 text-stone-500'}`}
                      style={l.status === s.id ? { background: s.color } : {}}
                    >
                      {l.status === s.id && <Check size={10} className="inline -mt-0.5 mr-0.5" />}
                      {s.label}
                    </button>
                  ))}
                </div>

                {/* Note */}
                {editingNote === l.bizId ? (
                  <div className="flex gap-2">
                    <input
                      autoFocus
                      value={noteDraft}
                      onChange={(e) => setNoteDraft(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') { updateLead(l.bizId, { note: noteDraft }); setEditingNote(null); refresh(); }
                        if (e.key === 'Escape') setEditingNote(null);
                      }}
                      placeholder="e.g. Called — wants a proposal on Monday"
                      className="field flex-1"
                    />
                    <button
                      onClick={() => { updateLead(l.bizId, { note: noteDraft }); setEditingNote(null); refresh(); }}
                      className="btn-primary w-auto px-4"
                    >
                      Save
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => { setEditingNote(l.bizId); setNoteDraft(l.note || ''); }}
                    className="flex items-center gap-1.5 text-[12px] font-bold text-stone-500 hover:text-stone-700 text-left min-h-[1.75rem] wrap-any"
                  >
                    <MessageSquare size={12} className="shrink-0" />
                    {l.note || <span className="text-stone-400">Add a note…</span>}
                  </button>
                )}
              </article>
            );
          })
        )}
      </div>

      <PageFaq
        title="Lead workspace FAQ"
        subtitle="Managing prospect lists, outreach and CRM export."
        faqs={LEADS_FAQS}
      />

      {pitchFor && <PitchModal business={pitchFor} onClose={() => setPitchFor(null)} />}
      {queueOpen && (
        <WhatsAppQueue
          leads={contactable}
          onClose={() => setQueueOpen(false)}
          onChanged={refresh}
        />
      )}
    </div>
  );
}
