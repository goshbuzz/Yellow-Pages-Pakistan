// Generates 200,000 unique listings -> public/data/directory.txt (compact pipe format)
// + src/data/stats.generated.js (aggregates for the landing page).
// Deterministic: same master seed => same dataset.
// Run: node scripts/generate-data.mjs

import { writeFileSync, mkdirSync } from 'node:fs';
import { CITIES } from '../src/data/geo.js';
import { CATEGORIES } from '../src/data/categories.js';
import { mulberry32, pick, randInt } from '../src/lib/rng.js';

const TOTAL = 200000;
const MASTER_SEED = 20260911;

// ── Name banks ──────────────────────────────────────────────────────────────
const FAMILIES = ['Butt','Sheikh','Chaudhry','Malik','Qureshi','Awan','Siddiqui','Ansari','Hashmi','Raza','Javed','Iqbal','Hussain','Khan','Baloch','Abbasi','Bhatti','Khokhar','Niazi','Tareen','Lodhi','Soomro','Memon','Farooqi','Zaidi','Naqvi','Rizvi','Tariq','Yousuf','Kamran','Aslam','Akram','Zaheer','Nadeem','Saleem','Jameel','Rasool','Baksh','Gill','Chishti','Gardezi','Arain','Rajput','Meo','Wattoo','Sial','Chattha','Gondal','Tarar','Warraich','Sandhu','Cheema','Dhillon','Randhawa','Mahr','Daha','Sahi'];

const PREFIXES = ['Al-Madina','Al-Rehman','Al-Noor','Al-Faisal','Al-Hamd','Al-Barkat','New','Star','Golden','Royal','National','Pakistan','City','Sun','Moon','Green','Silver','Crescent','Shaheen','Eagle','Falcon','Pearl','Diamond','Super','Metro','Pak','Desi','Urban','Prime','First','Dawn','Sky','Indus','Chenab','Ravi','Himalaya','Karakoram','Bolan','Khyber','Bilal','Madina','Noor','Rehman','Haji','Mian','Raja','Sardar','Nawab','Zamzam','Safa','Marwa','Badar','Uhud','Quba'];

const WORDS = {
  mfg: ['Textile','Fabrics','Steel','Metal','Chemical','Plastic','Machinery','Engineering','Packaging','Printing','Ceramic','Marble','Granite','Cable','Pipe','Paint','Rubber','Glass','Wood','Foam','Cement','Ghee','Rice','Flour','Sugar','Edible','Spinning','Weaving','Denim','Yarn','Dyes','Leather','Surgical','Sports'],
  retail: ['Cloth','Fashion','Boutique','Jewellers','Electronics','Mobile','Grocery','General','Book','Toy','Gift','Hardware','Crockery','Cosmetics','Perfume','Footwear','Eyewear','Furniture','Kids','Garments','Home','Winter','Blanket','Suiting','Shirting','Ladies','Gents','Perfumery'],
  prof: ['Law','Legal','Tax','Accounting','Insurance','Security','Recruitment','Manpower','Business','Corporate','Financial','Audit','Consultancy','Advisory'],
  tech: ['Software','Digital','Tech','Web','Media','Creative','Design','Marketing','Printing','Network','Data','Cloud','App','Cyber','Graphic','Photo','Video','Ads','Brand'],
  prop: ['Builders','Developers','Construction','Estate','Interiors','Architecture','Renovation','Maintenance','Property','Housing','Town','Builders & Developers'],
  auto: ['Motors','Auto','Courier','Cargo','Logistics','Transport','Travels','Car Rental','Workshop','Service Station','Parts','Freight','Shipping','Movers'],
  food: ['Biryani','BBQ','Karahi','Foods','Restaurant','Café','Bakers','Sweets','Juice','Pizza','Burger','Fast Food','Kitchen','Eatery','Catering','Banquet','Marquee','Hotel','Chaat','Nihari','Pulao','Kebab','Ice Cream','Tea'],
  health: ['Pharmacy','Medical','Dental','Clinic','Lab','Diagnostics','Gym','Fitness','Salon','Spa','Barber','Beauty','Physio','Hospital','Dispensary','Homeo','Child Care','Skin'],
  edu: ['School','Academy','College','Coaching','Tuition','Education','Learning','Institute','Training','Grammar','Public','Model','Science'],
  home: ['Electric','Plumbing','AC Repair','Pest Control','Cleaning','Laundry','Dry Cleaners','Tailors','Carpentry','Home Services','Painting','Generators'],
  agri: ['Farms','Dairy','Poultry','Seeds','Nursery','Agro','Agriculture','Gardening','Landscaping','Irrigation','Fertilizer'],
};

const SUFFIXES = {
  mfg: ['Mills','Industries','Manufacturing','Works','Enterprises','Factory'],
  retail: ['Store','House','Mart','Centre','Bazaar','Shop','Gallery','Emporium','Traders'],
  prof: ['Services','Agency','Consultants','Associates','Group','Co.'],
  tech: ['Solutions','Technologies','Media','Studio','Labs','Systems'],
  prop: ['Builders','Developers','Construction','Associates','Enterprises'],
  auto: ['Services','Transport','Logistics','Motors','Express','Movers'],
  food: ['Foods','Kitchen','Restaurant','Café','Bakers','Corner','Point','House'],
  health: ['Clinic','Center','Care','Pharmacy','Lab','Studio'],
  edu: ['School','Academy','Institute','Center','Coaching'],
  home: ['Services','Point','Care','Experts','Master'],
  agri: ['Farms','Agro','Center','Enterprises','Nursery'],
};

// Real-world category→city affinities (multipliers on city weight)
const AFFINITY = {
  1: { Faisalabad: 3, Karachi: 2, Lahore: 1.5, Multan: 2 },
  2: { Faisalabad: 3, Karachi: 2, Sialkot: 1.5 },
  15: { Sialkot: 6, Karachi: 2 },
  16: { Sialkot: 10 },
  17: { Sialkot: 10 },
  18: { Quetta: 3, Karachi: 1.5 },
  45: { Karachi: 2.5, Lahore: 2, Islamabad: 2 },
  57: { Karachi: 2, Lahore: 2, Islamabad: 2.5, Rawalpindi: 2 },
  58: { Karachi: 2, Lahore: 2, Islamabad: 2.5 },
  59: { Karachi: 2, Lahore: 2, Islamabad: 2.5 },
  125: { Faisalabad: 2, Multan: 2, Lahore: 1.5 },
  68: { Lahore: 1.8, Karachi: 1.8, Islamabad: 1.8 },
  86: { Karachi: 4, Gwadar: 2 },
  80: { Karachi: 3, Lahore: 2 },
  82: { Karachi: 2, Lahore: 2 },
  89: { Karachi: 1.6, Lahore: 1.6, Islamabad: 1.4 },
};

// ── Weighted pickers (precomputed) ──────────────────────────────────────────
const master = mulberry32(MASTER_SEED);
const catWeights = CATEGORIES.map((c) => c.weight);
const catTotal = catWeights.reduce((a, b) => a + b, 0);

function pickCategory() {
  let r = master() * catTotal;
  for (let i = 0; i < catWeights.length; i++) {
    r -= catWeights[i];
    if (r <= 0) return CATEGORIES[i];
  }
  return CATEGORIES[0];
}

const cityBase = CITIES.map((c) => c.weight);
const cityTotal = cityBase.reduce((a, b) => a + b, 0);
const cityCache = {};

function pickCity(catId) {
  let weights = cityCache[catId];
  if (!weights) {
    const aff = AFFINITY[catId] || {};
    weights = CITIES.map((c, i) => cityBase[i] * (aff[c.name] || 1));
    cityCache[catId] = weights;
  }
  let total = 0;
  for (const w of weights) total += w;
  let r = master() * total;
  for (let i = 0; i < weights.length; i++) {
    r -= weights[i];
    if (r <= 0) return i;
  }
  return 0;
}

function makeName(cat, attempt) {
  const group = cat.group;
  const word = pick(master, WORDS[group]);
  const suffix = pick(master, SUFFIXES[group]);
  const family = pick(master, FAMILIES);
  const prefix = pick(master, PREFIXES);
  const r = master();
  let name;
  if (r < 0.3) name = `${prefix} ${word} ${suffix}`;
  else if (r < 0.55) name = `${family} ${word} ${suffix}`;
  else if (r < 0.67) name = `${prefix} ${suffix}`;
  else if (r < 0.85) name = `${family} ${word}`;
  else name = `${word} ${suffix}`;
  if (group === 'food' && /Biryani|Karahi|Kebab|Pulao|Nihari/.test(word) && master() < 0.5) {
    name += ' & ' + pick(master, ['BBQ', 'Grill', 'Karachi Foods', 'Fast Food']);
  }
  if (attempt > 0) name += attempt === 1 ? ' II' : ` ${pick(master, ['Model Town', 'Satellite Town', 'New Branch', 'Main Bazaar', 'Cantt Branch'])}`;
  return name;
}

const BLDG = ['Shop', 'Plot', 'Office', 'Unit', 'Godown', 'Suite', 'Stall', 'Building', 'Plaza'];
function makeBldg() {
  const kind = pick(master, BLDG);
  const n = randInt(master, 1, 999);
  const suffix = master() < 0.3 ? `-${String.fromCharCode(65 + randInt(master, 0, 25))}` : '';
  return `${kind} ${n}${suffix}`;
}

// ── Generate ────────────────────────────────────────────────────────────────
const seen = new Set();
const rows = new Array(TOTAL);
const byCat = {};
const byCity = {};
let i = 0;
let guard = 0;

while (i < TOTAL) {
  const cat = pickCategory();
  const cityIdx = pickCity(cat.id);
  const city = CITIES[cityIdx];
  let attempt = 0;
  let name;
  while (attempt < 4) {
    name = makeName(cat, attempt);
    if (!seen.has(name)) break;
    attempt++;
  }
  if (seen.has(name)) { guard++; if (guard > 5000) throw new Error('name space exhausted'); continue; }
  seen.add(name);
  const areaIdx = randInt(master, 0, city.areas.length - 1);
  const streetIdx = randInt(master, 0, city.streets.length - 1);
  const bldg = makeBldg();
  const seed = (i * 48271 + 1013904223) >>> 0;
  rows[i] = `${name}|${cat.id}|${cityIdx}|${areaIdx}|${streetIdx}|${bldg}|${seed}`;
  byCat[cat.id] = (byCat[cat.id] || 0) + 1;
  byCity[city.name] = (byCity[city.name] || 0) + 1;
  i++;
}

// ── Write compact data file ─────────────────────────────────────────────────
// server-data/  -> bundled into the guarded serverless endpoint (production)
// public/data/  -> local dev/preview only; stripped from production builds
const header = JSON.stringify({ v: 1, total: TOTAL, generated: '2026-09-11', format: 'name|catId|cityIdx|areaIdx|streetIdx|bldg|seed' });
const payload = header + '\n' + rows.join('\n');
mkdirSync(new URL('../server-data/', import.meta.url), { recursive: true });
writeFileSync(new URL('../server-data/directory.txt', import.meta.url), payload, 'utf8');
mkdirSync(new URL('../public/data/', import.meta.url), { recursive: true });
writeFileSync(new URL('../public/data/directory.txt', import.meta.url), payload, 'utf8');

// ── Stats for the bundle ────────────────────────────────────────────────────
const stats = `// AUTO-GENERATED by scripts/generate-data.mjs — do not edit
export const STATS = {
  total: ${TOTAL},
  generatedAt: '2026-09-11',
  byCat: ${JSON.stringify(byCat)},
  byCity: ${JSON.stringify(byCity)},
};
`;
writeFileSync(new URL('../src/data/stats.generated.js', import.meta.url), stats, 'utf8');

console.log(`✔ ${TOTAL.toLocaleString()} listings written`);
console.log(`  categories: ${Object.keys(byCat).length}, cities: ${Object.keys(byCity).length}`);
console.log(`  top cities:`, Object.entries(byCity).sort((a, b) => b[1] - a[1]).slice(0, 5));
