// Lead workspace — localStorage-backed. The core USP for freelancers & agencies.

const LS_LISTS = 'ypk.lists.v1';
const LS_LEADS = 'ypk.leads.v1';
const LS_PREFS = 'ypk.prefs.v1';

export const STATUSES = [
  { id: 'new', label: 'New', color: '#0EA5E9' },
  { id: 'contacted', label: 'Contacted', color: '#F59E0B' },
  { id: 'replied', label: 'Replied', color: '#8B5CF6' },
  { id: 'won', label: 'Won', color: '#16A34A' },
  { id: 'lost', label: 'Lost', color: '#EF4444' },
];

function read(k, fallback) {
  try { return JSON.parse(localStorage.getItem(k)) ?? fallback; } catch { return fallback; }
}
function write(k, v) {
  try { localStorage.setItem(k, JSON.stringify(v)); } catch { /* quota */ }
}

export function getLists() {
  const lists = read(LS_LISTS, null);
  if (lists) return lists;
  const def = [{ id: 'default', name: 'My Leads', createdAt: Date.now() }];
  write(LS_LISTS, def);
  return def;
}
export function createList(name) {
  const lists = getLists();
  const id = 'l' + Date.now().toString(36);
  lists.push({ id, name, createdAt: Date.now() });
  write(LS_LISTS, lists);
  return id;
}
export function renameList(id, name) {
  const lists = getLists().map((l) => (l.id === id ? { ...l, name } : l));
  write(LS_LISTS, lists);
}
export function deleteList(id) {
  const lists = getLists().filter((l) => l.id !== id);
  write(LS_LISTS, lists);
  write(LS_LEADS, getLeads().filter((l) => l.listId !== id));
}

export function getLeads() { return read(LS_LEADS, []); }
export function getLeadsIn(listId) { return getLeads().filter((l) => l.listId === listId); }

export function findLead(bizId) { return getLeads().find((l) => l.bizId === bizId); }

export function addLead(b, listId = 'default', extra = {}) {
  const leads = getLeads();
  if (leads.some((l) => l.bizId === b.bizId)) return false;
  leads.push({
    bizId: b.bizId,
    name: b.name,
    cat: b.cat?.name || b.catName || '',
    city: b.city,
    province: b.province,
    address: b.address,
    phone: b.phone,
    whatsapp: b.whatsapp || false,
    email: b.email || '',
    website: b.website || '',
    lat: b.lat, lng: b.lng,
    rating: b.rating, reviews: b.reviews,
    listId, status: 'new', note: '',
    addedAt: Date.now(),
    ...extra,
  });
  write(LS_LEADS, leads);
  return true;
}
export function removeLead(bizId) {
  write(LS_LEADS, getLeads().filter((l) => l.bizId !== bizId));
}
export function updateLead(bizId, patch) {
  write(LS_LEADS, getLeads().map((l) => (l.bizId === bizId ? { ...l, ...patch } : l)));
}

export function getPrefs() { return read(LS_PREFS, { installDismissedAt: 0, lastCity: null }); }
export function setPref(key, value) {
  const p = getPrefs();
  p[key] = value;
  write(LS_PREFS, p);
}
