// Lead Workspace — lists, statuses, notes, pitch drafting & CSV export.
// The core feature for freelancers & marketing agencies.

import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Plus, FileSpreadsheet, Phone, MessageCircle, MapPin, Trash2, Pencil, Wand2, Check, ChevronRight, Send } from 'lucide-react';
import { getLists, createList, deleteList, getLeadsIn, getLeads, updateLead, removeLead, STATUSES } from '../lib/leads';
import { leadsToCsv, downloadFile } from '../lib/export';
import { telHref, waHref } from '../lib/derive';
import { EmptyState, useToast } from '../components/ui';
import { PitchModal } from '../components/PitchModal';

const CATS = { cat: 'category', city: 'city', area: 'area' };

export default function Leads() {
  const toast = useToast();
  const [tick, setTick] = useState(0);
  const [activeList, setActiveList] = useState('default');
  const [creating, setCreating] = useState(false);
  const [newName, setNewName] = useState('');
  const [pitchFor, setPitchFor] = useState(null);
  const [editingNote, setEditingNote] = useState(null);
  const [noteDraft, setNoteDraft] = useState('');

  const lists = useMemo(() => getLists(), [tick]);
  const allLeads = useMemo(() => getLeads(), [tick]);
  const leads = useMemo(() => getLeadsIn(activeList), [activeList, tick]);
  const counts = useMemo(() => {
    const c = {};
    for (const l of allLeads) c[l.listId] = (c[l.listId] || 0) + 1;
    return c;
  }, [allLeads]);

  const stats = useMemo(() => ({
    new: leads.filter((l) => l.status === 'new').length,
    contacted: leads.filter((l) => l.status === 'contacted').length,
    replied: leads.filter((l) => l.status === 'replied').length,
    won: leads.filter((l) => l.status === 'won').length,
  }), [leads]);

  const doExport = () => {
    if (!leads.length) return toast('No leads to export yet', '🤷');
    const stamp = new Date().toISOString().slice(0, 10);
    downloadFile(`yellowpagespk-leads-${activeList}-${stamp}.csv`, leadsToCsv(leads));
    toast(`Exported ${leads.length} leads to CSV 📤`, '📤');
  };

  const doCreate = () => {
    const name = newName.trim();
    if (!name) return;
    createList(name);
    setNewName('');
    setCreating(false);
    setTick((t) => t + 1);
    toast(`List “${name}” created`, '📁');
  };

  return (
    <div className="animate-slide-up">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-black text-2xl text-ink">Lead workspace 💼</h1>
          <p className="text-[13px] font-semibold text-stone-500 mt-0.5">Shortlist businesses, track outreach, export & pitch.</p>
        </div>
        <button onClick={doExport} className="tap bg-ink text-brand font-black text-[13px] rounded-2xl px-3.5 py-2.5 flex items-center gap-1.5 shrink-0">
          <FileSpreadsheet size={15} /> CSV
        </button>
      </div>

      {/* Lists */}
      <div className="flex gap-2 mt-4 overflow-x-auto no-scrollbar pb-0.5">
        {lists.map((l) => (
          <button key={l.id} onClick={() => setActiveList(l.id)}
            className={`tap shrink-0 rounded-full px-3.5 py-2 text-[12.5px] font-extrabold border flex items-center gap-1.5 ${activeList === l.id ? 'bg-ink text-brand border-ink' : 'bg-white/80 border-stone-300 text-ink-soft'}`}>
            {l.name} <span className={`text-[10.5px] font-black ${activeList === l.id ? 'text-brand/70' : 'text-stone-400'}`}>{counts[l.id] || 0}</span>
          </button>
        ))}
        <button onClick={() => setCreating(true)} className="tap shrink-0 w-9 h-9 rounded-full bg-brand text-ink font-black flex items-center justify-center border border-brand-dark">+</button>
      </div>

      {creating && (
        <div className="flex gap-2 mt-2 animate-pop-in">
          <input autoFocus value={newName} onChange={(e) => setNewName(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && doCreate()}
            placeholder="List name e.g. “Karachi restaurants — website pitch”"
            className="flex-1 bg-white rounded-xl border border-stone-300 px-3 py-2 text-[13px] font-bold text-ink outline-none focus:border-brand" />
          <button onClick={doCreate} className="tap bg-ink text-brand rounded-xl px-4 font-black text-[13px]">Create</button>
        </div>
      )}

      {/* Pipeline stats */}
      {leads.length > 0 && (
        <div className="grid grid-cols-4 gap-2 mt-4">
          {STATUSES.slice(0, 4).map((s) => (
            <div key={s.id} className="bg-white/90 rounded-2xl border border-stone-200/80 py-2.5 text-center shadow-card">
              <p className="text-lg font-black" style={{ color: s.color }}>{stats[s.id]}</p>
              <p className="text-[9.5px] font-extrabold tracking-wider text-stone-400">{s.label.toUpperCase()}</p>
            </div>
          ))}
        </div>
      )}

      {/* Leads */}
      <div className="mt-4 space-y-3">
        {leads.length === 0 ? (
          <EmptyState emoji="🔖" title="No leads in this list yet"
            hint="Tap the bookmark icon on any business to save it here — then export to CSV or draft a pitch."
            action={<Link to="/browse" className="mt-3 inline-block bg-ink text-brand font-black text-[13px] rounded-xl px-4 py-2.5">Find businesses →</Link>} />
        ) : leads.map((l) => (
          <div key={l.bizId} className="bg-white/90 rounded-2xl border border-stone-200/80 shadow-card p-3.5">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <Link to={`/b/${l.bizId}`} className="font-extrabold text-ink text-[15px] hover:underline truncate block">{l.name}</Link>
                <p className="text-[11.5px] font-bold text-stone-500 truncate">{l.cat} · <MapPin size={10} className="inline -mt-0.5" /> {l.city}</p>
              </div>
              <div className="flex gap-1 shrink-0">
                <a href={telHref(l.phone)} className="tap w-8 h-8 rounded-full bg-ink text-brand flex items-center justify-center" title={l.phone}><Phone size={13} /></a>
                {l.whatsapp && (
                  <a href={waHref(l.phone)} target="_blank" rel="noreferrer" className="tap w-8 h-8 rounded-full bg-emerald-500 text-white flex items-center justify-center"><MessageCircle size={13} /></a>
                )}
                <button onClick={() => setPitchFor(l)} className="tap w-8 h-8 rounded-full bg-brand text-ink flex items-center justify-center" title="Draft pitch"><Wand2 size={13} /></button>
                <button onClick={() => { removeLead(l.bizId); setTick((t) => t + 1); toast('Lead removed', '🗑️'); }} className="tap w-8 h-8 rounded-full bg-stone-100 text-stone-500 flex items-center justify-center" title="Remove"><Trash2 size={13} /></button>
              </div>
            </div>

            {/* Status pills */}
            <div className="flex gap-1.5 mt-2.5 flex-wrap">
              {STATUSES.map((s) => (
                <button key={s.id} onClick={() => { updateLead(l.bizId, { status: s.id }); setTick((t) => t + 1); }}
                  className={`tap rounded-full px-2.5 py-1 text-[10.5px] font-black border ${l.status === s.id ? 'text-white border-transparent' : 'bg-white border-stone-300 text-stone-500'}`}
                  style={l.status === s.id ? { background: s.color } : {}}>
                  {l.status === s.id && <Check size={10} className="inline -mt-0.5 mr-0.5" />}{s.label}
                </button>
              ))}
            </div>

            {/* Note */}
            {editingNote === l.bizId ? (
              <div className="mt-2.5 flex gap-2">
                <input autoFocus value={noteDraft} onChange={(e) => setNoteDraft(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter') { updateLead(l.bizId, { note: noteDraft }); setEditingNote(null); setTick((t) => t + 1); } }}
                  placeholder="e.g. Called — wants proposal on Monday"
                  className="flex-1 bg-brand-softer rounded-xl border border-brand/40 px-3 py-1.5 text-[12px] font-bold text-ink outline-none" />
                <button onClick={() => { updateLead(l.bizId, { note: noteDraft }); setEditingNote(null); setTick((t) => t + 1); }} className="tap bg-ink text-brand rounded-xl px-3 text-[12px] font-black">Save</button>
              </div>
            ) : (
              <button onClick={() => { setEditingNote(l.bizId); setNoteDraft(l.note || ''); }} className="mt-2.5 flex items-center gap-1.5 text-[11.5px] font-bold text-stone-400 hover:text-stone-600">
                <Pencil size={11} /> {l.note || 'Add note…'}
              </button>
            )}
          </div>
        ))}
      </div>

      {/* Footer helper */}
      {lists.length > 1 && activeList !== 'default' && (
        <button onClick={() => { deleteList(activeList); setActiveList('default'); setTick((t) => t + 1); toast('List deleted', '🗑️'); }}
          className="mt-5 mx-auto block text-[12px] font-bold text-stone-400 hover:text-red-500 flex items-center gap-1">
          <Trash2 size={12} /> Delete this list
        </button>
      )}

      {pitchFor && <PitchModal business={pitchFor} onClose={() => setPitchFor(null)} />}
    </div>
  );
}
