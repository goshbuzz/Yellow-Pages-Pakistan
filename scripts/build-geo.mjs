// Builds src/data/geo.js from the full GeoNames Pakistan dump (PK.txt) + curated overrides.
// Includes EVERY real city/town: all admin seats (PPLA*) + every place with pop >= 12k.
// Villages/hamlets/city-sections (149k entries without pop data) are excluded — not cities.

import { readFileSync, writeFileSync } from 'node:fs';

const PROV = { '02': 'Balochistan', '03': 'Khyber Pakhtunkhwa', '04': 'Punjab', '05': 'Sindh', '06': 'Azad Kashmir', '07': 'Gilgit-Baltistan', '08': 'Islamabad Capital Territory' };

// Union: full-dump populated places (admin seats ∪ pop>=12k)
const pkRows = readFileSync('/tmp/PK.txt', 'utf8').trim().split('\n').map((l) => l.split('\t'));
const cities = pkRows
  .filter((c) => c[6] === 'P' && (/^PPLA/.test(c[7]) || c[7] === 'PPLC' || +c[14] >= 12000) && !['PPLX', 'PPLQ', 'PPLW', 'PPLH'].includes(c[7]))
  .map((c) => ({
    name: (c[2] || c[1]).normalize('NFD').replace(/[\u0300-\u036f]/g, ''), // ascii name, no diacritics
    lat: +c[4], lng: +c[5],
    province: PROV[c[10]] || 'Punjab',
    pop: +c[14] || 15000, // admin seats without pop data -> assume 15k (tehsil HQs)
  }));

// Curated 2023-census populations (better than GeoNames for the big cities)
const POP = { Karachi: 18868021, Lahore: 13004135, Faisalabad: 3691999, Rawalpindi: 3357612, Gujranwala: 2511118, Multan: 2169915, Hyderabad: 1921275, Quetta: 1565546, Peshawar: 1970042, Islamabad: 1100000, Sargodha: 975886, Sialkot: 911817, Bahawalpur: 903795, Sukkur: 631000, Larkana: 490508, Sheikupura: 520000, 'Rahim Yar Khan': 560000, Sahiwal: 425000, 'Dera Ghazi Khan': 400000, Gujrat: 390000, Jhang: 415000, Kasur: 400000, Okara: 375000, Chiniot: 315000, Muzaffargarh: 265000, Khanewal: 250000, Vehari: 185000, Bahawalnagar: 155000, Kamoke: 320000, Daska: 200000, Wazirabad: 130000, Sadiqabad: 240000, Khanpur: 175000, Muzaffarabad: 180000, Mirpur: 160000, Gilgit: 220000, Skardu: 100000, Gwadar: 90000, Murree: 45000, Taxila: 70000, 'Gujar Khan': 90000, Kamalia: 120000, Gojra: 150000, 'Toba Tek Singh': 165000, Chishtian: 160000, Hasilpur: 120000, Pakpattan: 155000, Narowal: 120000, Hafizabad: 145000, 'Kot Addu': 160000, Burewala: 210000, Mianwali: 120000, Bhakkar: 110000, Khushab: 120000, Attock: 100000, Chakwal: 90000, 'Mandi Bahauddin': 130000, 'Nankana Sahib': 110000, Jhelum: 190000, Chichawatni: 130000, Kabirwala: 100000, Abbottabad: 280000, Mardan: 370000, Mingora: 330000, Kohat: 240000, Bannu: 350000, 'Dera Ismail Khan': 270000, Haripur: 115000, Charsadda: 120000, Nowshera: 120000, Swabi: 115000, Mansehra: 100000, Jacobabad: 200000, 'Mirpur Khas': 260000, Nawabshah: 280000, Khairpur: 180000, Shikarpur: 180000, Dadu: 175000, Loralai: 60000, Chaman: 100000, Khuzdar: 150000, Hub: 120000, Sibi: 60000, Zhob: 60000, Turbat: 110000, Ghotki: 100000, Kandhkot: 90000, Gambat: 80000, Rohri: 65000, Thatta: 85000, Badin: 110000, Sanghar: 100000, Umerkot: 80000, 'Tando Adam': 150000, 'Tando Allahyar': 120000, Chitral: 50000, Chilas: 40000, Hunza: 30000, Batkhela: 70000, Timargara: 80000, Hangu: 80000, Karak: 70000, Tank: 60000, Parachinar: 80000 };

// Area codes (confident ones only; others -> mobile-first numbers)
const CODES = { Karachi: ['021', 8], Lahore: ['042', 8], Faisalabad: ['041', 7], Rawalpindi: ['051', 7], Islamabad: ['051', 7], Gujranwala: ['055', 7], Multan: ['061', 7], Hyderabad: ['022', 7], Quetta: ['081', 7], Peshawar: ['091', 7], Sargodha: ['048', 7], Sialkot: ['052', 7], Bahawalpur: ['062', 7], Sukkur: ['071', 7], Larkana: ['074', 7], Sheikhupura: ['056', 7], 'Rahim Yar Khan': ['068', 7], Sahiwal: ['040', 7], 'Dera Ghazi Khan': ['064', 7], Gujrat: ['053', 7], Kasur: ['049', 7], Chiniot: ['047', 7], Muzaffargarh: ['066', 7], Khanewal: ['065', 7], Vehari: ['067', 7], Okara: ['0449', 6], Jhelum: ['0544', 6], Muzaffarabad: ['0588', 6], Mirpur: ['05327', 6], Gilgit: ['05811', 6], Skardu: ['05815', 6], Abbottabad: ['0992', 6], Mardan: ['0937', 6], Mingora: ['0946', 6], Kohat: ['0922', 6], Bannu: ['0928', 6], 'Dera Ismail Khan': ['0966', 6], Haripur: ['0995', 6], Charsadda: ['0921', 6], Nowshera: ['0923', 6], Swabi: ['0938', 6], Mansehra: ['0997', 6], Gwadar: ['086', 6], Khuzdar: ['0848', 6], Turbat: ['0852', 6], Nawabshah: ['0244', 6], 'Mirpur Khas': ['0233', 6], Jacobabad: ['0722', 6], Khairpur: ['0711', 6], Chaman: ['081', 6] };

// Custom real neighbourhoods for major cities
const RICH = {
  Karachi: { areas: ['DHA Phase 6', 'Clifton Block 5', 'Saddar', 'Gulshan-e-Iqbal', 'North Nazimabad', 'Federal B Area', 'Korangi', 'SITE Area', 'Gulistan-e-Johar', 'Bahadurabad', 'PECHS', 'Malir'], streets: ['I.I. Chundrigar Road', 'M.A. Jinnah Road', 'Shahrah-e-Faisal', 'Rashid Minhas Road', 'Tariq Road', 'University Road', 'Korangi Road', 'Khayaban-e-Shahbaz', 'Shaheed-e-Millat Road'] },
  Lahore: { areas: ['Gulberg III', 'DHA Phase 5', 'Johar Town', 'Model Town', 'Faisal Town', 'Garden Town', 'Cantt', 'Township', 'Bahria Town', 'Shadman', 'Muslim Town'], streets: ['Mall Road', 'Ferozepur Road', 'Jail Road', 'Main Boulevard Gulberg', 'Canal Road', 'Multan Road', 'Barki Road', 'DHA Main Boulevard'] },
  Islamabad: { areas: ['Blue Area', 'F-7 Markaz', 'F-8 Markaz', 'G-8', 'G-9 Markaz', 'G-10 Markaz', 'I-8 Markaz', 'E-11'], streets: ['Jinnah Avenue', 'Kashmir Highway', 'Islamabad Highway', 'Aabpara Market', '9th Avenue', 'Faisal Avenue'] },
  Rawalpindi: { areas: ['Saddar', 'Raja Bazaar', 'Satellite Town', 'Chaklala Scheme III', 'Westridge', 'Commercial Market'], streets: ['Mall Road', 'Murree Road', 'Bank Road', 'Peshawar Road', 'Adamjee Road'] },
  Faisalabad: { areas: ['Peoples Colony', 'Madina Town', 'Jinnah Colony', 'Gulberg Colony', 'D Ground', 'Kohinoor City'], streets: ['Susan Road', 'Jhang Road', 'Sargodha Road', 'Narwala Road', 'Jail Road'] },
  Multan: { areas: ['Cantt', 'Gulgasht Colony', 'Shah Rukn-e-Alam Colony', 'Bosan Road', 'Askari'], streets: ['Bosan Road', 'Abdali Road', 'Vehari Road', 'Lodhran Road', 'Khanewal Road'] },
  Peshawar: { areas: ['Saddar', 'University Road', 'Hayatabad', 'Karkhano Market', 'Warsak Road', 'Gulberg'], streets: ['GT Road', 'University Road', 'Jamrud Road', 'Ring Road', 'Dalazak Road'] },
  Quetta: { areas: ['Jinnah Town', 'Satellite Town', 'Sariab Road', 'Brewery Road', 'Chiltan Town'], streets: ['Jinnah Road', 'Sariab Road', 'Airport Road', 'Circular Road', 'Sabzal Road'] },
  Hyderabad: { areas: ['Latifabad', 'Qasimabad', 'Saddar', 'Gari Khata'], streets: ['Auto Bhan Road', 'Thandi Sarak', 'Main Bazaar', 'Naseem Nagar Road'] },
  Gujranwala: { areas: ['Satellite Town', 'Civil Lines', 'D.C. Colony', 'Wapda Town', 'Model Town'], streets: ['GT Road', 'Sialkot Road', 'Gujrat Road', 'Lahore Road'] },
  Sialkot: { areas: ['Kashmir Road', 'Ugoki Road', 'Cantt', 'Daska Road', 'Small Industries Estate'], streets: ['Kashmir Road', 'Pasrur Road', 'Daska Road', 'Circular Road', 'Ugoki Road'] },
};

const DEFAULT = {
  areas: ['Main Bazaar', 'Cantt', 'Satellite Town', 'Model Town', 'Jinnah Colony', 'Gulshan Colony', 'Peoples Colony', 'Madina Town', 'Muslim Town', 'Industrial Estate'],
  streets: ['Main Bazaar Road', 'GT Road', 'Station Road', 'Circular Road', 'College Road', 'Hospital Road', 'Airport Road', 'Jail Road'],
};

// Manual additions (notable places missing from the dump's populated-place set)
const EXTRA = [
  { name: 'Gwadar', province: 'Balochistan', lat: 25.1264, lng: 62.3225, pop: 90000 },
  { name: 'Chitral', province: 'Khyber Pakhtunkhwa', lat: 35.8511, lng: 71.7864, pop: 50000 },
  { name: 'Murree', province: 'Punjab', lat: 33.9070, lng: 73.3943, pop: 45000 },
  { name: 'Taxila', province: 'Punjab', lat: 33.7460, lng: 72.7860, pop: 70000 },
  { name: 'Hunza', province: 'Gilgit-Baltistan', lat: 36.3167, lng: 74.6500, pop: 30000 },
];

const RENAME = { 'Jhang Sadr': 'Jhang', 'New Mirpur City': 'Mirpur' };

const seen = new Set();
const all = [];
for (const c of [...cities, ...EXTRA]) {
  const name = RENAME[c.name] || c.name;
  if (seen.has(name)) continue;
  seen.add(name);
  all.push({ ...c, name, pop: POP[c.name] ?? POP[name] ?? c.pop });
}

// Weight ~ population, compressed so small towns still get listings
all.forEach((c) => { c.weight = Math.max(0.15, Math.pow((c.pop || 15000) / 150000, 0.72)); });

// Sort: big first
all.sort((a, b) => b.pop - a.pop);

let out = `// AUTO-GENERATED by scripts/build-geo.mjs (GeoNames full PK dump + 2023 census overrides).
// ${all.length} cities & towns — every Pakistani city (all admin seats + all places >= 12k pop),
// all provinces + AJK + Gilgit-Baltistan. lat/lng are real city centres;
// listing pins jitter deterministically around them.

export const CITIES = [
`;
for (const c of all) {
  const code = CODES[c.name];
  const rich = RICH[c.name];
  out += `  { name: ${JSON.stringify(c.name)}, province: ${JSON.stringify(c.province)}, lat: ${c.lat}, lng: ${c.lng}, pop: ${c.pop}, weight: ${+c.weight.toFixed(2)}, code: ${code ? `'${code[0]}'` : 'null'}, digits: ${code ? code[1] : 7}, mobileBias: ${code ? '0.55' : '0.92'},
    areas: ${JSON.stringify(rich ? rich.areas : DEFAULT.areas)}, streets: ${JSON.stringify(rich ? rich.streets : DEFAULT.streets)} },
`;
}
out += `];

export const PROVINCES = [...new Set(CITIES.map((c) => c.province))];

export function slugify(s) {
  return s.toLowerCase().replace(/&/g, 'and').replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
}
`;

writeFileSync(new URL('../src/data/geo.js', import.meta.url), out);
const totalWeight = all.reduce((a, c) => a + c.weight, 0);
console.log(`${all.length} cities written`);
console.log('provinces:', [...new Set(all.map((c) => c.province))].join(', '));
console.log('top 12:', all.slice(0, 12).map((c) => `${c.name}(${c.pop})`).join(', '));
console.log('smallest 5:', all.slice(-5).map((c) => `${c.name}(${c.pop})`).join(', '));
console.log('weight share — top 5 metros:', (all.slice(0, 5).reduce((a, c) => a + c.weight, 0) / totalWeight * 100).toFixed(1) + '%',
  '| towns <50k:', (all.filter((c) => c.pop < 50000).reduce((a, c) => a + c.weight, 0) / totalWeight * 100).toFixed(1) + '%');
