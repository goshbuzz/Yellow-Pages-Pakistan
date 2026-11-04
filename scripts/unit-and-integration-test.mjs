// Unit & Integration Test Suite — validates routing, SEO schemas, dataset,
// categories, sitemap, robots.txt, llms.txt, and HTTP responses.
import { readFileSync, existsSync } from 'node:fs';
import { CATEGORIES, CATEGORY_GROUPS, CATEGORY_BY_ID } from '../src/data/categories.js';
import { CITIES } from '../src/data/geo.js';
import { STATS, DATASET_MODE } from '../src/data/stats.generated.js';
import { CURATED } from '../src/data/curated.js';
import { makeFaqSchema } from '../src/lib/seo.js';
import { waNumber, isWaCapable, waHref, waInfo, waDisplayNumber } from '../src/lib/whatsapp.js';
import { leadsToCsv } from '../src/lib/export.js';
import { SOURCE, isReal, provenanceFields, trustBadge, sourceOf } from '../src/lib/provenance.js';
import { claimToken, verifyClaim, isVerificationFresh, claimHref } from '../src/lib/verify.js';
import { execFileSync } from 'node:child_process';
import { writeFileSync } from 'node:fs';
import { inPakistan, validPkPoint, haversineKm, cityForPoint } from '../src/lib/geovalidate.js';
import { isUsableName, isPlaceholderPhone, isPlausiblePkPhone, resolveCity, matchCategoryByWords } from '../src/lib/quality.js';
import { googleMapsUrl, googleMapsEmbedUrl } from '../src/lib/derive.js';
import { buildIndex, runQuery } from '../src/lib/searchCore.js';
import {
  validateCustomListing, saveCustomListing, getCustomListings, getCustomListing,
  deleteCustomListing, parseCustomImport, mergeCustomResults, asResultRow, matchCategory,
} from '../src/lib/customListings.js';


// Minimal localStorage so device-local libraries can be tested under Node.
if (!globalThis.localStorage) {
  const store = new Map();
  globalThis.localStorage = {
    getItem: (k) => (store.has(k) ? store.get(k) : null),
    setItem: (k, v) => store.set(k, String(v)),
    removeItem: (k) => store.delete(k),
    clear: () => store.clear(),
    key: (i) => [...store.keys()][i] ?? null,
    get length() { return store.size; },
  };
}

let passed = 0;
let failed = 0;

function assert(name, condition, extra = '') {
  if (condition) {
    console.log(`✔ [PASS] ${name}`);
    passed++;
  } else {
    console.error(`✘ [FAIL] ${name} ${extra}`);
    failed++;
  }
}

console.log('=== 1. DATA INTEGRITY & TAXONOMY TESTS ===');
assert('Categories defined', CATEGORIES.length === 130, `Found: ${CATEGORIES.length}`);
assert('Category groups defined', CATEGORY_GROUPS.length > 0);
assert('All categories mapped by ID', Object.keys(CATEGORY_BY_ID).length === 130);
assert('Cities defined (420 cities)', CITIES.length === 420, `Found: ${CITIES.length}`);
assert('Stats reflect the configured dataset (never a fixed 200k)', STATS.total >= 0 && Number.isFinite(STATS.total), `Found: ${STATS.total}`);
assert('Dataset mode is coherent with the counts', (STATS.total === 0) === (DATASET_MODE === 'empty'), `mode=${DATASET_MODE} total=${STATS.total}`);
assert('No fake volume padding in the totals', !JSON.stringify(STATS).includes('200000'));
assert('Sample generator is gone', !existsSync('scripts/generate-data.mjs'));
assert('No generated dataset file in public/data', !existsSync('public/data/directory.txt'));
assert('Curated flagship listings exist', CURATED.length > 0);

console.log('\n=== 1b. WHATSAPP DIRECT-CHAT TESTS ===');
assert('Mobile 0300-1234567 is WhatsApp-capable', waNumber('0300-1234567') === '923001234567');
assert('Spaced mobile normalises', waNumber('0300 1234567') === '923001234567');
assert('+92 format normalises', waNumber('+92 321 9876543') === '923219876543');
assert('0092 format normalises', waNumber('0092 333 1234567') === '923331234567');
assert('Bare 92 format normalises', waNumber('923451234567') === '923451234567');
assert('Landline has no WhatsApp', waNumber('021-99220100') === null && !isWaCapable('021-99220100'));
assert('UAN 111 number has no WhatsApp', waNumber('021-111-111-425') === null);
assert('Vanity/UAN with letters has no WhatsApp', waNumber('051-111-OGDCL-1') === null);
assert('Short/invalid numbers rejected', waNumber('12345') === null && waNumber('') === null && waNumber(null) === null);
assert('waHref builds a direct chat link', waHref('0300-1234567') === 'https://wa.me/923001234567');
assert('waHref prefills the message', waHref('0300-1234567', { text: 'Salam' }) === 'https://wa.me/923001234567?text=Salam');
assert('waHref returns null for landlines (no dead links)', waHref('042-3523-2009') === null);
assert('Display form is readable', waDisplayNumber('0300-1234567') === '+92 300 1234567');
const waMobile = waInfo({ name: 'Al-Madina Store', cat: { name: 'Kirana Store' }, city: 'Sahiwal', phone: '0300-1234567', whatsapp: true });
assert('waInfo: confirmed mobile', waMobile.state === 'confirmed' && waMobile.href.startsWith('https://wa.me/923001234567?text='));
assert('waInfo: greeting names the business', decodeURIComponent(waMobile.href).includes('Al-Madina Store'));
assert('waInfo: unverified mobile is flagged', waInfo({ phone: '0300-1234567' }).state === 'mobile');
assert('waInfo: landline state', waInfo({ phone: '021-111-111-425' }).state === 'landline');

const csvMobile = leadsToCsv([
  { name: 'Mobile Shop', cat: 'Retail', city: 'Sahiwal', province: 'Punjab', address: 'A', phone: '0300-1234567', whatsapp: true, lat: 1, lng: 2, rating: 4, reviews: 9, status: 'new', note: '', addedAt: 0 },
  { name: 'Landline Co', cat: 'Bank', city: 'Karachi', province: 'Sindh', address: 'B', phone: '021-111-111-425', whatsapp: true, lat: 3, lng: 4, rating: 4, reviews: 9, status: 'new', note: '', addedAt: 0 },
]);
const csvRows = csvMobile.split('\n');
assert('CSV has WhatsApp Link column', csvRows[0].includes('WhatsApp Link'));
assert('CSV exports a working direct link for mobiles', csvRows[1].includes('https://wa.me/923001234567'));
assert('CSV flags landline as not WhatsApp', csvRows[2].includes(',No,') && !csvRows[2].includes('wa.me'));
assert('CSV never carries a dead wa.me link', (csvMobile.match(/wa\.me/g) || []).length === 1);

const cardJsx = readFileSync('src/components/CompanyCard.jsx', 'utf8');
assert('Every business card renders a WhatsApp action', cardJsx.includes('<WhatsAppButton'));
assert('Cards no longer hide WhatsApp behind the flag', !cardJsx.includes('{b.whatsapp &&'));
const leadsJsx = readFileSync('src/pages/Leads.jsx', 'utf8');
assert('Lead workspace renders WhatsApp on every lead', leadsJsx.includes('<WhatsAppButton'));
assert('Lead workspace has bulk WhatsApp outreach', leadsJsx.includes('WhatsAppQueue') && leadsJsx.includes('Outreach'));
const detailJsx = readFileSync('src/pages/BusinessDetail.jsx', 'utf8');
assert('Business detail always shows a WhatsApp action', detailJsx.includes('<WhatsAppButton'));
const waQueueJsx = readFileSync('src/components/WhatsAppQueue.jsx', 'utf8');
assert('Outreach queue skips landlines explicitly', waQueueJsx.includes("state !== 'landline'"));
assert('Outreach queue opens the business number', waQueueJsx.includes("info.href.split('?')[0]"));

console.log('\n=== 1c. PROVENANCE & REAL-DATA INTEGRITY TESTS ===');
assert('No sample-marked records in the shipped stats', !JSON.stringify(STATS.byCat).includes('sample'));
assert('Dataset defaults to empty until real data is imported', DATASET_MODE === 'empty' || STATS.source !== 'none');
assert('Sample rows are not real businesses', !isReal({ source: SOURCE.SAMPLE }));
assert('Curated flagship records are real', isReal({ source: SOURCE.SEED }) && isReal({ verified: true }));
assert('Owner submissions are real', isReal({ source: SOURCE.OWNER }));
assert('Sample rows earn no trust badge', trustBadge({ source: SOURCE.SAMPLE }) === null);
assert('dataset.js does not fabricate records', !readFileSync('src/lib/dataset.js', 'utf8').includes('derive('));
const deriveSrc = readFileSync('src/lib/derive.js', 'utf8');
assert('Listing fabricator removed from derive.js', !deriveSrc.includes('mulberry32') && !deriveSrc.includes('export function derive('));
assert('derive.js keeps the link helpers', deriveSrc.includes('telHref') && deriveSrc.includes('googleMapsUrl'));
assert('Dataset client never falls back to generated data', !readFileSync('src/lib/dataset.js', 'utf8').includes('CURATED[+id.slice(1)]\n    ? '));
assert('Unknown provenance fails closed to sample', !isReal({ name: 'Mystery', phone: '0300-1234567' }));
assert('Legacy curated lead is inferred as seed', isReal({ bizId: 'c12', verified: true }));
assert('Legacy generated lead is inferred as sample', !isReal({ bizId: 'g1234' }));
assert('Owner submissions earn the top badge', trustBadge({ source: SOURCE.OWNER }).level === 'owner');
assert('Provenance names the source', provenanceFields({ source: SOURCE.OFFICIAL }).source === 'Official registry');
assert('Sample rows export as unverified', provenanceFields({ source: SOURCE.SAMPLE }).trust === 'unverified');

const provCsv = leadsToCsv([
  { name: 'Real Co', phone: '0300-1234567', lat: 1, lng: 2, addedAt: 0, source: SOURCE.OWNER },
  { name: 'Filler Co', phone: '0300-7654321', lat: 1, lng: 2, addedAt: 0, source: SOURCE.SAMPLE },
]).split('\n');
assert('CSV carries Source and Trust columns', provCsv[0].includes('Source') && provCsv[0].includes('Trust'));
assert('CSV can filter real from sample', provCsv[1].endsWith(',Owner verified,verified') && provCsv[2].endsWith(',Sample data,unverified'));

const waBtn = readFileSync('src/components/WhatsAppButton.jsx', 'utf8');
assert('WhatsApp button refuses to open a chat for sample rows', waBtn.includes('isReal(b)') && waBtn.includes('Sample record'));
const cardJsx2 = readFileSync('src/components/CompanyCard.jsx', 'utf8');
assert('Cards label sample rows as not real', cardJsx2.includes('NOT A REAL BUSINESS'));
const detailJsx2 = readFileSync('src/pages/BusinessDetail.jsx', 'utf8');
assert('Detail page warns on sample rows', detailJsx2.includes('Sample record'));

// Import pipeline: real CSV in -> dropped/deduped/flagged records out.
const tmpCsv = '/tmp/ypk-import-test.csv';
writeFileSync(tmpCsv, [
  'Company Name,Nature of Business,City,Telephone,WhatsApp,NTN',
  'Alpha Software,Software House,Lahore,+92 300 1112223,Yes,1001',
  'Beta Traders,Wholesale Grocery,Karachi,021-1234567,Yes,1002',   // landline claiming WhatsApp
  'Beta Traders,Wholesale Grocery,Karachi,021-1234567,Yes,1002',   // duplicate
  'Gamma Ltd,Trading,Islamabad,,No,1003',                          // no phone
].join('\n'));
const tmpOut = '/tmp/ypk-import-test.json';
execFileSync('node', ['scripts/import-listings.mjs', `--in=${tmpCsv}`, '--as=official', `--out=${tmpOut}`], { encoding: 'utf8' });
const imported = JSON.parse(readFileSync(tmpOut, 'utf8'));
assert('Import drops rows with no phone number', imported.records.length === 2);
assert('Import removes duplicates', imported.records.filter((r) => r.name === 'Beta Traders').length === 1);
assert('Import keeps real provenance', imported.records.every((r) => r.source === 'official'));
assert('Import downgrades WhatsApp claim on a landline', imported.records.find((r) => r.name === 'Beta Traders').whatsapp === false);
assert('Import keeps WhatsApp claim on a mobile', imported.records.find((r) => r.name === 'Alpha Software').whatsapp === true);

// Registry rows (SECP/PSX registers) may legitimately have no phone on record — kept
// only when the importer is explicitly asked to.
const tmpOut2 = '/tmp/ypk-import-test-nophone.json';
execFileSync('node', ['scripts/import-listings.mjs', `--in=${tmpCsv}`, '--as=official', `--out=${tmpOut2}`, '--allow-missing-phone'], { encoding: 'utf8' });
const imported2 = JSON.parse(readFileSync(tmpOut2, 'utf8'));
assert('Registry import can keep rows with no phone on record', imported2.records.length === 3);
const gamma = imported2.records.find((r) => r.name === 'Gamma Ltd');
assert('A no-phone row keeps an empty phone, never an invented one', gamma && gamma.phone === '');
assert('A no-phone row is not claimed to support WhatsApp', gamma && gamma.whatsapp === false && gamma.whatsappCapable === false);
const cardJsx3 = readFileSync('src/components/CompanyCard.jsx', 'utf8');
assert('Cards replace Call/WhatsApp with an honest no-phone notice', cardJsx3.includes('No phone on record'));

// Merge enrichment & legal-suffix dedupe (used when SECP NBFC/SFA merges into SECP brokers/PSX).
const tmpMergeCsv = '/tmp/ypk-import-merge-test.csv';
writeFileSync(tmpMergeCsv, [
  'Company Name,Nature of Business,City,Address,Telephone',
  'Gamma Limited,Financial & Investment Services,Islamabad,"Blue Area, Islamabad",0300-5556677',
  'BETA TRADERS (PVT.) LTD.,Wholesale Grocery,Karachi,"Saddar, Karachi",021-7654321',
].join('\n'));
execFileSync('node', ['scripts/import-listings.mjs', `--in=${tmpMergeCsv}`, '--as=official', `--out=${tmpOut2}`, '--merge', '--allow-missing-phone'], { encoding: 'utf8' });
const mergedRegistry = JSON.parse(readFileSync(tmpOut2, 'utf8'));
const enrichedGamma = mergedRegistry.records.find((r) => r.name === 'Gamma Ltd');
assert('Merge deduplicates Ltd vs Limited in the same city', mergedRegistry.records.filter((r) => r.city === 'Islamabad').length === 1);
assert('Merge enriches an existing phone-less registry row with a real number and address',
  enrichedGamma && enrichedGamma.phone === '0300-5556677' && enrichedGamma.whatsappCapable === true && enrichedGamma.address === 'Blue Area, Islamabad');

// Exact category names in CSVs win over company-name keywords, and two-pass TREC merge
// enriches CRO-city broker rows in place without colliding on swapped SECP TREC numbers.
const tmpTrecSeed = '/tmp/ypk-trec-seed.csv';
const tmpTrecMerge = '/tmp/ypk-trec-merge.csv';
const tmpTrecOut = '/tmp/ypk-trec-out.json';
writeFileSync(tmpTrecSeed, [
  'Company Name,Nature of Business,City,Address,Telephone,Registration No',
  'Aba Ali Habib Securities (Private) Limited,Stock Brokers & Securities,Karachi,"Karachi, Pakistan",,TREC311',
  'Abbasi & Company (Private) Limited,Stock Brokers & Securities,Lahore,"Lahore, Pakistan",,TREC162',
  'Ahsam Securities (Private) Limited,Stock Brokers & Securities,Islamabad,"Islamabad, Pakistan",,TREC501',
].join('\n'));
execFileSync('node', ['scripts/import-listings.mjs', `--in=${tmpTrecSeed}`, '--as=official', `--out=${tmpTrecOut}`, '--allow-missing-phone'], { encoding: 'utf8' });
const seedIds = Object.fromEntries(JSON.parse(readFileSync(tmpTrecOut, 'utf8')).records.map((r) => [r.name, r.id]));
writeFileSync(tmpTrecMerge, [
  'Company Name,Nature of Business,City,Address,Telephone,Email,Website,Registration No',
  'Aba Ali Habib Securities (Private) Limited,Stock Brokers & Securities,Karachi,"Business Plaza, Karachi",021-32429664,info@abaalihabib.com,https://www.abaalihabib.com,TREC162',
  'Abbasi & Company (Private) Limited,Stock Brokers & Securities,Lahore,"6-Shadman, Lahore",042-38302028,info@abbasiandcompany.com,https://www.abbasiandcompany.com,TREC311',
  'Ahsam Securities (Private) Limited,Stock Brokers & Securities,Rawalpindi,"27-A, Gulistan Colony, Rawalpindi",0321-5178338,ahsamsec@hotmail.com,https://www.ahsam.org,TREC501',
  'All Pakistan Textile Mills Association,NGOs & Community Organizations,Karachi," Clifton, Karachi",021-35875941,aptma@aptma.org.pk,https://www.aptma.org.pk,FPCCI-999',
].join('\n'));
execFileSync('node', ['scripts/import-listings.mjs', `--in=${tmpTrecMerge}`, '--as=official', `--out=${tmpTrecOut}`, '--merge'], { encoding: 'utf8' });
const trecMerged = JSON.parse(readFileSync(tmpTrecOut, 'utf8')).records;
const abaMerged = trecMerged.find((r) => r.name.startsWith('Aba Ali Habib'));
const abbasiMerged = trecMerged.find((r) => r.name.startsWith('Abbasi & Company'));
const ahsamMerged = trecMerged.find((r) => r.name.startsWith('Ahsam Securities'));
const aptmaMerged = trecMerged.find((r) => r.name.startsWith('All Pakistan Textile Mills'));
assert('Two-pass merge keeps swapped TREC rows matched to their own name+city',
  abaMerged.phone === '021-32429664' && abbasiMerged.phone === '042-38302028');
assert('TREC fallback enriches CRO-city broker row in place while preserving its id slug',
  ahsamMerged.id === seedIds['Ahsam Securities (Private) Limited']
    && ahsamMerged.city === 'Rawalpindi'
    && ahsamMerged.phone === '0321-5178338'
    && ahsamMerged.email === 'ahsamsec@hotmail.com'
    && ahsamMerged.website === 'https://www.ahsam.org');
assert('Exact category name in CSV is respected over company-name words',
  aptmaMerged && aptmaMerged.cat === 56);

const nbfcSourceLines = readFileSync('scripts/sources/secp-nbfcs.txt', 'utf8').split('\n').filter((l) => l && !l.startsWith('#'));
assert('SECP NBFCs & SFAs source table is present (281 official license rows)', nbfcSourceLines.length === 281);
const psxTrecLines = readFileSync('scripts/sources/psx-trec-holders.txt', 'utf8').split('\n').filter((l) => l && !l.startsWith('#'));
const pmexLines = readFileSync('scripts/sources/pmex-brokers.txt', 'utf8').split('\n').filter((l) => l && !l.startsWith('#'));
const insurerLines = readFileSync('scripts/sources/secp-insurers.txt', 'utf8').split('\n').filter((l) => l && !l.startsWith('#'));
const ppibLines = readFileSync('scripts/sources/ppib-solar-installers.txt', 'utf8').split('\n').filter((l) => l && !l.startsWith('#'));
const icapLines = readFileSync('scripts/sources/icap-ca-firms.txt', 'utf8').split('\n').filter((l) => l && !l.startsWith('#'));
const fpcciLines = readFileSync('scripts/sources/fpcci-trade-bodies.txt', 'utf8').split('\n').filter((l) => l && !l.startsWith('#'));
assert('Official PSX TREC, PMEX, SECP Insurers, PPIB Solar, ICAP & FPCCI source tables are present',
  psxTrecLines.length === 206
    && pmexLines.length >= 100
    && insurerLines.length === 48
    && ppibLines.length >= 420
    && icapLines.length >= 260
    && fpcciLines.length >= 230);
const shippedCorpus = JSON.parse(readFileSync('public/data/listings.json', 'utf8'));
assert('Shipped corpus matches STATS.total and credits all imported official registers',
  shippedCorpus.records.length === STATS.total
    && shippedCorpus.attribution.includes('SECP NBFCs & Securities/Futures Advisors register')
    && shippedCorpus.attribution.includes('PSX Active TREC Holders register')
    && shippedCorpus.attribution.includes('PMEX Licensed Futures Brokers')
    && shippedCorpus.attribution.includes('SECP Active Insurers')
    && shippedCorpus.attribution.includes('PPIB/AEDB Certified Solar & Wind Installers')
    && shippedCorpus.attribution.includes('ICAP Directory of Practising Chartered Accountant Firms')
    && shippedCorpus.attribution.includes('FPCCI Registered Member Trade Organizations'));
const shippedHygieneLog = execFileSync('node', ['scripts/verify-numbers.mjs', '--data=public/data/listings.json'], { encoding: 'utf8' });
assert('Shipped corpus has zero unparseable phones and zero >5 shared numbers',
  !/unparseable number/.test(shippedHygieneLog) && /numbers shared by >5 different businesses: 0/.test(shippedHygieneLog));

console.log('\n=== 1d. OWNER VERIFICATION (CLAIM LOOP) TESTS ===');
const vNow = Date.now();
const tok = claimToken('g1', '923001234567', vNow);
assert('Claim token verifies for the same listing + number', verifyClaim('g1', '923001234567', tok, vNow).ok);
assert('Token bound to listing id', !verifyClaim('g2', '923001234567', tok, vNow).ok);
assert('Token bound to number', !verifyClaim('g1', '923009999999', tok, vNow).ok);
assert('Garbage token rejected', verifyClaim('g1', '923001234567', 'not a token!!').ok === false);
assert('Yesterday\'s token still accepted (slow operator)', verifyClaim('g1', '923001234567', claimToken('g1', '923001234567', vNow - 86400000), vNow).ok);
assert('Old token rejected (replay window closed)', !verifyClaim('g1', '923001234567', claimToken('g1', '923001234567', vNow - 7 * 86400000), vNow).ok);
assert('Verification expires after 30 days', !isVerificationFresh({ verifiedAt: vNow - 31 * 86400000 }));
assert('Verification fresh inside 30 days', isVerificationFresh({ verifiedAt: vNow - 29 * 86400000 }));
assert('Claim link targets the owner\'s own number', claimHref({ listingId: 'g1', number: '923001234567', businessName: 'X' }).startsWith('https://wa.me/923001234567?text='));
assert('Stats never describe sample records', !readFileSync('src/data/stats.generated.js', 'utf8').includes("'sample'"));

// Claim merge: forged, stale, landline and mismatched claims must not upgrade a listing.
const claimsFile = '/tmp/ypk-claims-test.json';
const dataFile = '/tmp/ypk-claims-data.json';
writeFileSync(claimsFile, JSON.stringify({ claims: [
  { listingId: 'g1', number: '0300-1234567', token: claimToken('g1', '923001234567', vNow), verifiedAt: vNow },
  { listingId: 'g2', number: '0300-9999999', token: 'forgedtoken1', verifiedAt: vNow },
  { listingId: 'g3', number: '0300-1111111', token: claimToken('g3', '923001111111', vNow - 45 * 86400000), verifiedAt: vNow - 45 * 86400000 },
  { listingId: 'g4', number: '021-99220100', token: claimToken('g4', '02199220100', vNow), verifiedAt: vNow },
  { listingId: 'g5', number: '0300-2222222', token: claimToken('g5', '923002222222', vNow), verifiedAt: vNow },
] }));
writeFileSync(dataFile, JSON.stringify({ records: [
  { id: 'g1', name: 'A', phone: '0300-1234567' },
  { id: 'g2', name: 'B', phone: '0300-9999999' },
  { id: 'g3', name: 'C', phone: '0300-1111111' },
  { id: 'g4', name: 'D', phone: '021-99220100' },
  { id: 'g5', name: 'E', phone: '0300-3333333' }, // claim was for a different number
] }));
const mergedOut = '/tmp/ypk-claims-merged.json';
const claimLog = execFileSync('node', ['scripts/claims.mjs', `--claims=${claimsFile}`, `--data=${dataFile}`, `--out=${mergedOut}`], { encoding: 'utf8' });
const merged = JSON.parse(readFileSync(mergedOut, 'utf8'));
assert('Only the legitimately signed claim is applied', merged.records.filter((r) => r.ownerVerified).length === 1);
assert('Verified record becomes source=owner', merged.records[0].source === SOURCE.OWNER && merged.records[0].ownerVerified === true);
assert('Forged claim rejected', !merged.records[1].ownerVerified);
assert('Stale claim rejected', !merged.records[2].ownerVerified);
assert('Landline claim rejected', !merged.records[3].ownerVerified);
assert('Claim for a different number rejected', !merged.records[4].ownerVerified);
assert('Claim runner rejects forged/stale/landline claims', /3 rejected/.test(claimLog));
assert('Claim runner reports a number conflict separately', /claim number differs/.test(claimLog));

console.log('\n=== 1e. NUMBER HYGIENE TESTS ===');
const hygieneIn = '/tmp/ypk-hygiene.json';
writeFileSync(hygieneIn, JSON.stringify({ records: [
  { id: 'a', name: 'Alpha', phone: '0300-1234567', whatsapp: true },
  { id: 'b', name: 'Bank', phone: '021-99220100', whatsapp: true },        // landline claiming WA
  { id: 'c', name: 'Fake', phone: '0300-1111111', whatsapp: true },        // repeated digits
  { id: 'd', name: 'Odd', phone: '0300-1234567' },                          // sequential-ish, kept
  { id: 'e', name: 'Junk', phone: 'not-a-number', whatsapp: true },         // unparseable
  { id: 'f', name: 'Owner', phone: '0321-9988776', source: 'owner' },       // claim without date
] }));
const hygieneOut = '/tmp/ypk-hygiene-clean.json';
const hygieneLog = execFileSync('node', ['scripts/verify-numbers.mjs', `--data=${hygieneIn}`, '--patch', `--out=${hygieneOut}`], { encoding: 'utf8' });
const clean = JSON.parse(readFileSync(hygieneOut, 'utf8')).records;
assert('Hygiene clears an impossible WhatsApp claim on a landline', clean.find((r) => r.id === 'b').whatsapp === false);
assert('Hygiene clears a repeated-digit number', clean.find((r) => r.id === 'c').phone === null);
assert('Hygiene clears an unparseable number', clean.find((r) => r.id === 'e').phone === null);
assert('Hygiene keeps a real mobile number', clean.find((r) => r.id === 'a').phone === '0300-1234567');
assert('Hygiene never deletes a merely odd number', clean.find((r) => r.id === 'd').phone === '0300-1234567');
assert('Hygiene reports an owner claim with no date', /owner claim without verification date/.test(hygieneLog));
assert('Hygiene flags shared numbers', /numbers shared by/.test(hygieneLog));

console.log('\n=== 1f. PER-CITY IMPORT TESTS ===');
const cityCsv = '/tmp/ypk-city-karachi.csv';
writeFileSync(cityCsv, [
  'name,tel,latitude,longitude,address,locality,category',
  'Real Kiryana Store,0300-4455667,24.8607,67.0011,Bolton Market,Karachi,Kirana Store',
  'Burns Road Biryani,0321-8877665,24.8559,67.0144,Burns Road,Karachi,Biryani Restaurant',
  'Landline Textiles,021-32770123,24.8540,66.9990,Jodia Bazar,Karachi,Textile Wholesaler',
  'Number Reuser,0321-8877665,24.8600,67.0200,Burns Road,Karachi,Restaurant',   // steals a number
  'No Phone Shop,,24.8610,67.0100,Boulton Market,Karachi,Traders',               // no phone
  'Lahore Intruder,0300-9998887,31.5204,74.3587,Mall Road,Lahore,Kirana Store',   // outside radius
].join('\n'));

// Keep the working files out of the repo's real dataset.
const cityWork = '/tmp/ypk-city-work';
execFileSync('node', ['-e', `
  const fs = require('fs');
  fs.rmSync('${cityWork}', { recursive: true, force: true });
  fs.mkdirSync('${cityWork}/public/data', { recursive: true });
`]);
const cityLog = execFileSync('node', ['scripts/import-city.mjs', '--city=Karachi', '--source=file', `--from=${cityCsv}`, `--data=${cityWork}/public/data/listings.json`], { encoding: 'utf8' });
assert('City import runs for a named city', /Karachi\s+fetched/.test(cityLog));
assert('City import rejects a number reused by another business', /number already used by another business/.test(cityLog));
assert('City import rejects a record with no phone', /no phone/.test(cityLog));
assert('City import rejects a record outside the city radius', /outside city radius/.test(cityLog));

const cityListings = JSON.parse(readFileSync(`${cityWork}/public/data/listings.json`, 'utf8'));
const karachiRecords = cityListings.records.filter((r) => r.city === 'Karachi');
assert('Only valid Karachi records were kept', karachiRecords.length === 3, `kept ${karachiRecords.length}`);
assert('Landline listing is kept for calls but not marked WhatsApp-capable',
  karachiRecords.find((r) => r.name === 'Landline Textiles').whatsappCapable === false);
assert('Kept records carry a map location', karachiRecords.every((r) => Number.isFinite(r.lat) && r.lat !== 0));
assert('Kept records carry provenance', karachiRecords.every((r) => r.source === 'dataset' && r.sourceRef));
assert('Mobile numbers are marked WhatsApp-capable', karachiRecords.find((r) => r.name === 'Real Kiryana Store').whatsappCapable === true);
assert('No record claims unverified WhatsApp presence', karachiRecords.every((r) => r.whatsapp === false));

// The importer must never silently accept Google-sourced input.
const citySrc = readFileSync('scripts/import-city.mjs', 'utf8');
assert('City importer documents the Google restriction', citySrc.includes('3.2.3') && citySrc.toLowerCase().includes('google maps platform'));
assert('City importer supports licence-clean sources only', citySrc.includes('fsq') && citySrc.includes('overture'));
assert('Coverage report exists', /CITY COVERAGE/.test(execFileSync('node', ['scripts/import-city.mjs', '--report'], { encoding: 'utf8' })));

const coverageJsx = readFileSync('src/pages/Coverage.jsx', 'utf8');
assert('Coverage page shows per-city counts', coverageJsx.includes('CITY_COVERAGE'));
assert('Coverage page distinguishes WhatsApp-capable from verified', coverageJsx.includes('whatsappCapable'));

console.log('\n=== 1g. CUSTOM LISTING TESTS ===');
localStorage.clear();

const goodDraft = {
  name: 'Al-Madina Kiryana Store', phone: '0300-4455667', cat: '1', city: 'Sahiwal',
  area: 'Bolton Market', address: 'Shop 4, Bolton Market', whatsapp: true,
};
const vGood = validateCustomListing(goodDraft, { existing: [] });
assert('Custom listing validates with name + mobile + city + category', vGood.ok, JSON.stringify(vGood.errors));
assert('Custom mobile is WhatsApp-capable', vGood.record.whatsappCapable === true && vGood.record.whatsapp === true);
assert('Custom listing stores the category name, not just the id', vGood.record.catName === 'Textile Mills & Fabrics', vGood.record.catName);
assert('Custom listing is stamped with its own provenance', vGood.record.source === 'custom');

assert('Custom listing without a phone is rejected',
  !validateCustomListing({ ...goodDraft, phone: '' }, { existing: [] }).ok);
assert('Custom listing with a too-short number is rejected',
  validateCustomListing({ ...goodDraft, phone: '0300' }, { existing: [] }).errors.phone != null);
assert('Custom listing without a city is rejected',
  !validateCustomListing({ ...goodDraft, city: '' }, { existing: [] }).ok);
assert('Custom listing with an unknown city is rejected',
  validateCustomListing({ ...goodDraft, city: 'Atlantis' }, { existing: [] }).errors.city != null);
assert('Custom listing without a category is rejected',
  !validateCustomListing({ ...goodDraft, cat: '' }, { existing: [] }).ok);
assert('Custom listing with coordinates outside Pakistan is rejected',
  validateCustomListing({ ...goodDraft, lat: '51.5', lng: '-0.1' }, { existing: [] }).errors.location != null);

const savedA = saveCustomListing(goodDraft);
assert('Custom listing saves to device storage', savedA.ok && getCustomListings().length === 1);
assert('Saved listing can be read back by id', getCustomListing(savedA.record.id)?.name === goodDraft.name);
assert('Saved listing id is prefixed so it never collides with imported ids', savedA.record.id.startsWith('u'));

const clash = saveCustomListing({ ...goodDraft, name: 'Another Shop' });
assert('A number already used by another custom listing is rejected',
  !clash.ok && /already used/i.test(clash.errors.phone || ''), JSON.stringify(clash.errors));

const dupName = saveCustomListing({ ...goodDraft, phone: '0321-1112223' });
assert('A duplicate name in the same city is rejected',
  !dupName.ok && /already exists/i.test(dupName.errors.name || ''));

const sameNameOtherCity = saveCustomListing({ ...goodDraft, city: 'Lahore', phone: '0321-1112223' });
assert('The same name in a different city is allowed', sameNameOtherCity.ok);

const edited = saveCustomListing({ ...goodDraft, phone: '0300-4455660', area: 'New Area' }, { editingId: savedA.record.id });
assert('Editing keeps the id but updates the number',
  edited.ok && edited.record.id === savedA.record.id && edited.record.phone === '0300-4455660');
assert('Editing does not create a second copy',
  getCustomListings().filter((r) => r.id === savedA.record.id).length === 1);

// Provenance: a self-typed listing is real for its author, labelled as theirs, never "verified".
const customRow = asResultRow(savedA.record);
assert('Custom row carries a source the UI can explain', sourceOf(customRow) === 'custom');
assert('Custom row is contactable (not treated as sample filler)', isReal(customRow));
assert('Custom row earns a "mine" label, never a verified badge',
  trustBadge(customRow)?.level === 'custom' && customRow.verified === false);

// Landline custom listing: kept, callable, never WhatsApp-capable.
const land = saveCustomListing({ name: 'Landline Traders', phone: '021-32770123', cat: '1', city: 'Karachi' });
assert('A landline custom listing is accepted', land.ok);
assert('A landline custom listing is not marked WhatsApp-capable',
  land.record.whatsappCapable === false && land.record.whatsapp === false);
const landClaim = saveCustomListing({ name: 'Claiming Traders', phone: '021-32770124', cat: '1', city: 'Karachi', whatsapp: true });
assert('A landline cannot claim WhatsApp even if the box is ticked',
  landClaim.ok && landClaim.record.whatsapp === false);

// CSV/JSON import
const csvIn = 'name,phone,city,category\nImported Store,0333-1234567,Sahiwal,Grocery & Supermarkets\nLandline Shop,042-35761234,Lahore,Textile Mills & Fabrics';
const parsedCsv = parseCustomImport(csvIn);
assert('CSV import reads both rows', parsedCsv.error === null && parsedCsv.rows.length === 2);
assert('CSV import maps the category name to an id',
  parsedCsv.rows[0].cat === CATEGORIES.find((c) => c.name === 'Grocery & Supermarkets').id, parsedCsv.rows[0].cat);
assert('CSV import normalises the city name', parsedCsv.rows[1].city === 'Lahore');
const parsedJson = parseCustomImport(JSON.stringify([{ Name: 'JSON Store', Phone: '0345-9988776', City: 'Multan', Category: 'Pharmacy' }]));
assert('JSON import is case-insensitive about column names', parsedJson.rows[0].name === 'JSON Store');
assert('A partial category name is resolved ("Pharmacy" → Pharmacies & Medical Stores)',
  parsedJson.rows[0].cat === CATEGORIES.find((c) => c.name === 'Pharmacies & Medical Stores').id,
  String(parsedJson.rows[0].cat));
assert('A meaningless category is left empty rather than guessed',
  parseCustomImport('name,phone,city,category\nX,0300-1234567,Sahiwal,qqqq').rows[0].cat === '');
assert('Empty import is reported, not silently accepted', parseCustomImport('').error != null);

// Search merge
const mergedCustom = mergeCustomResults({ rows: [{ name: 'Imported Co' }], total: 1, page: 1, pages: 1 }, getCustomListings());
assert('Custom listings are merged into search results first', mergedCustom.rows[0].isCustom === true);
assert('Merged result count includes custom listings', mergedCustom.total === 1 + getCustomListings().length);

assert('Deleting a custom listing removes it', deleteCustomListing(savedA.record.id) && !getCustomListing(savedA.record.id));

// Wiring
const browseSrc = readFileSync('src/pages/Browse.jsx', 'utf8');
assert('Browse lets the user type a city name', browseSrc.includes('Type a city') && browseSrc.includes('role="combobox"'));
assert('Browse keeps the full city picker as a fallback', browseSrc.includes('All cities') && browseSrc.includes('CityPicker'));
assert('Browse has a collapsible filter panel', browseSrc.includes('filtersOpen'));
assert('Browse offers adding a business when a search finds nothing', browseSrc.includes('/my-listings'));

const myListingsSrc = readFileSync('src/pages/MyListings.jsx', 'utf8');
assert('My listings page can create, edit and delete', myListingsSrc.includes('saveCustomListing') && myListingsSrc.includes('deleteCustomListing'));
assert('My listings page imports CSV/JSON', myListingsSrc.includes('parseCustomImport'));
assert('My listings page exports CSV', myListingsSrc.includes('downloadFile'));
assert('My listings page says data is device-local', /on this device/i.test(myListingsSrc));

const leadsSrc = readFileSync('src/pages/Leads.jsx', 'utf8');
assert('Leads refresh when storage changes (no stale workspace)', leadsSrc.includes("addEventListener('focus'") && leadsSrc.includes("addEventListener('storage'"));
assert('Leads refuse a dead Call link when a lead has no number', leadsSrc.includes('No number'));
assert('Leads can rename and delete a list', leadsSrc.includes('renameList') && leadsSrc.includes('deleteList'));
assert('Leads support searching within a list', leadsSrc.includes('Search in'));

const datasetSrc = readFileSync('src/lib/dataset.js', 'utf8');
assert('Search merges the user\'s own listings', datasetSrc.includes('matchCustom') && datasetSrc.includes('getCustomListings'));
assert('A custom listing opens without the data worker', datasetSrc.includes('isCustomId(id)'));

const appSrc = readFileSync('src/App.jsx', 'utf8');
assert('Route /my-listings exists', appSrc.includes('/my-listings'));
const layoutSrc = readFileSync('src/components/Layout.jsx', 'utf8');
assert('Bottom nav links to My listings', layoutSrc.includes("to: '/my-listings'"));
assert('Lead badge re-reads storage instead of freezing at first render',
  layoutSrc.includes('setLeadCount(getLeads().length)'));

const css = readFileSync('src/index.css', 'utf8');
assert('Spacing scale primitives exist', css.includes('.page-stack') && css.includes('.card-pad') && css.includes('.field'));
assert('Form fields are at least 48px tall for touch', /min-height:\s*3rem/.test(css));

// Mobile layout audit — the specific failure modes that made the UI hard to use.
const layoutPages = ['src/pages/Leads.jsx', 'src/pages/MyListings.jsx', 'src/pages/Browse.jsx', 'src/pages/Nearby.jsx'];
for (const f of layoutPages) {
  const src = readFileSync(f, 'utf8');
  assert(`${f} uses the shared vertical rhythm`, /className="page-stack/.test(src));
  const tiny = [...src.matchAll(/className="[^"]*\b(w-[6-7]|h-[6-7])\b[^"]*"/g)]
    .filter((m) => !m[0].includes('tap-sm'));
  assert(`${f} has no sub-40px touch target without an expanded hit area`, tiny.length === 0, JSON.stringify(tiny.map((m) => m[0].slice(0, 40))));
  assert(`${f} has no fixed width that could overflow a 360px screen`, !/min-w-\[(4\d{2,}|[5-9]\d{2,})px\]/.test(src));
}
assert('Clear buttons get an expanded hit area', css.includes('.tap-sm'));
assert('PageHeader stacks actions on phones', readFileSync('src/components/ui.jsx', 'utf8').includes('flex-col sm:flex-row'));

console.log('\n=== 1h. GEO INTEGRITY & FAKE-LISTING TESTS ===');

// The exact failure reported: a "Sahiwal hospital" whose pin was in Africa / Europe.
assert('A Nairobi coordinate is not in Pakistan', !inPakistan(-1.2921, 36.8219));
assert('A Lagos coordinate is not in Pakistan', !inPakistan(6.5244, 3.3792));
assert('A Cairo coordinate is not in Pakistan', !inPakistan(30.0444, 31.2357));
assert('A London coordinate is not in Pakistan', !inPakistan(51.5074, -0.1278));
assert('Null island (0,0) is not a location', !validPkPoint(0, 0));
assert('Missing coordinates are not a location', !validPkPoint(null, null) && !validPkPoint('', ''));
assert('Sahiwal itself is a valid Pakistani point', validPkPoint(31.9739, 72.3311));
assert('Karachi, Lahore, Quetta, Gilgit all validate',
  validPkPoint(24.8608, 67.0104) && validPkPoint(31.5204, 74.3587)
  && validPkPoint(30.1798, 66.975) && validPkPoint(35.9208, 74.3089));

// A foreign point must not be adopted by "the nearest Pakistani city".
assert('A foreign point has no nearest Pakistani city', cityForPoint(-1.2921, 36.8219, CITIES) === null);
// The 420-city list is dense enough that most of Pakistan is within 120 km of a town; this
// is a genuinely remote corner (821 km from the nearest one).
assert('A point far from every city has no city', cityForPoint(36.75, 61, CITIES) === null);
assert('A point in Sahiwal resolves to Sahiwal', cityForPoint(31.9739, 72.3311, CITIES)?.name === 'Sahiwal');

// The Map button must disappear rather than link to the wrong country.
assert('No Maps link for a foreign pin', googleMapsUrl({ lat: -1.2921, lng: 36.8219 }) === null);
assert('No Maps embed for a foreign pin', googleMapsEmbedUrl({ lat: 51.5074, lng: -0.1278 }) === null);
assert('No Maps link when the pin is missing', googleMapsUrl({}) === null && googleMapsUrl({ lat: null, lng: null }) === null);
assert('A real pin still produces a Maps link', String(googleMapsUrl({ lat: 31.9739, lng: 72.3311 })).includes('31.9739'));

// Placeholder and junk records.
assert('Placeholder names are refused', ['Test', 'xxxx', '12345', 'sample', 'aaaa', ''].every((n) => !isUsableName(n)));
assert('Real business names are accepted', ['DHQ Teaching Hospital Sahiwal', 'Al-Madina Kiryana Store', 'علی کلینک'].every(isUsableName));
assert('Placeholder phone numbers are refused', ['0300-0000000', '1234567890', '1111111111'].every(isPlaceholderPhone));
assert('A real mobile is not a placeholder', !isPlaceholderPhone('0300-1112223'));
assert('Real landlines are treated as dialable',
  ['021-99220100', '042-35761234', '040-9200377', '051-111-911-911'].every(isPlausiblePkPhone));
assert('Vanity/UAN letters are refused', !isPlausiblePkPhone('051-111-OGDCL-1'));
assert('Too-short numbers are refused', !isPlausiblePkPhone('12345') && !isPlausiblePkPhone('040-920037'));
assert('Unknown city names resolve to null, not to a real city',
  resolveCity('Atlantis', CITIES) === null && resolveCity('', CITIES) === null);
assert('City names resolve regardless of case and spacing',
  resolveCity(' sahiwal ', CITIES)?.name === 'Sahiwal' && resolveCity('SAHIWAL', CITIES)?.name === 'Sahiwal');

// Category matching: a wrong category is a wrong listing, so it must not guess.
assert('A real industry hint maps to its category',
  matchCategoryByWords(CATEGORIES, 'Hospitals & Medical Centers')?.name === 'Hospitals & Medical Centers');
assert('Category matching understands Pakistani shop wording ("Kirana Store" → Grocery)',
  matchCategoryByWords(CATEGORIES, 'Al-Madina Kiryana Store')?.name === 'Grocery & Supermarkets');
assert('Category matching does not file leftovers under Textile Mills',
  matchCategoryByWords(CATEGORIES, 'Mystery Services Ltd') === null);
assert('Category matching needs real evidence (empty hint → null)',
  matchCategoryByWords(CATEGORIES, '', null) === null);
assert('"Pharmacy" resolves to Pharmacies & Medical Stores',
  matchCategoryByWords(CATEGORIES, 'Pharmacy')?.name === 'Pharmacies & Medical Stores');
assert('"Medicare Centre" is a hospital, not a pharmacy',
  matchCategoryByWords(CATEGORIES, 'Medicare Centre')?.name === 'Hospitals & Medical Centers');
assert('"Real Estate Agency" keeps the estate, not the agency suffix',
  matchCategoryByWords(CATEGORIES, 'Real Estate Agency')?.name === 'Real Estate Agents & Dealers');
assert('A trade the taxonomy lacks is dropped, not misfiled elsewhere',
  matchCategoryByWords(CATEGORIES, 'Travel Agency') === null);

// A foreign pin on a custom listing is rejected in the form, not just on import.
const foreignCustom = validateCustomListing({ name: 'Ghost Hospital', phone: '0300-5556667', cat: '97', city: 'Sahiwal', lat: '-1.2921', lng: '36.8219' }, { existing: [] });
assert('Custom listing rejects a foreign pin', !foreignCustom.ok && /not inside Pakistan/.test(foreignCustom.errors.location || ''));
const farCityPin = validateCustomListing({ name: 'Ghost Hospital 2', phone: '0300-5556668', cat: '97', city: 'Sahiwal', lat: '31.5204', lng: '74.3587' }, { existing: [] });
assert('Custom listing rejects a pin that is in another city', !farCityPin.ok && /km from Sahiwal/.test(farCityPin.errors.location || ''));
assert('Custom listing refuses a placeholder name',
  !validateCustomListing({ name: 'Test', phone: '0300-5556669', cat: '97', city: 'Sahiwal' }, { existing: [] }).ok);
assert('Custom listing refuses a placeholder number',
  !validateCustomListing({ name: 'Fine Hospital', phone: '0300-0000000', cat: '97', city: 'Sahiwal' }, { existing: [] }).ok);

// The shipping curated data itself must pass the same tests — no hand-entered foreign pin.
const curatedBad = CURATED.filter((c) => c.lat != null && !validPkPoint(c.lat, c.lng));
assert('Every curated profile has a Pakistani pin', curatedBad.length === 0, JSON.stringify(curatedBad.map((c) => c.name)));
const curatedOff = CURATED.filter((c) => {
  const city = CITIES.find((x) => x.name === c.city);
  return city && haversineKm(city.lat, city.lng, c.lat, c.lng) > 150;
});
assert('No curated profile is pinned more than 150 km from its city', curatedOff.length === 0, JSON.stringify(curatedOff.map((c) => c.name)));

console.log('\n=== 1i. SEARCH FILTER & RANKING TESTS ===');

// A synthetic index that reproduces the reported situation: hospitals in Sahiwal, a hospital
// in Lahore, and a row that only matches because of its category.
const idx = buildIndex({
  names: ['DHQ Teaching Hospital Sahiwal', 'Sahiwal Medicare Centre', 'Lahore General Hospital', 'Al-Madina Kiryana Store'],
  cats: [97, 97, 97, 1],
  cityIdxs: [0, 0, 1, 0],
  reviews: [40, 5, 900, 12],
  ratings: [4.2, 4.0, 4.5, 4.1],
  cityNames: ['Sahiwal', 'Lahore'],
  catNames: { 97: 'hospitals & medical centers', 1: 'textile mills & fabrics' },
});
const qq = (params) => runQuery(idx, { page: 1, perPage: 10, ...params });

assert('City filter matches exactly', qq({ city: 'Sahiwal' }).total === 3);
assert('City filter is case-insensitive ("sahiwal")', qq({ city: 'sahiwal' }).total === 3);
assert('City filter tolerates pasted whitespace (" Sahiwal ")', qq({ city: ' Sahiwal ' }).total === 3);
assert('Unknown city returns nothing rather than every city',
  qq({ city: 'Atlantis' }).total === 0 && qq({ city: 'Atlantis' }).cityUnknown === true);
assert('City + query keeps only that city', qq({ city: 'Sahiwal', q: 'hospital' }).total === 2);
assert("A city filter never leaks another city's rows",
  qq({ city: 'Sahiwal' }).rows.every((i) => idx.cityIdxs[i] === 0));
assert('Lahore filter returns only the Lahore hospital',
  qq({ city: 'Lahore' }).rows.map((i) => idx.names[i]).join() === 'Lahore General Hospital');
assert('A query with no matches returns zero, not everything', qq({ q: 'zzzzz' }).total === 0);
assert('Category filter still works with a city filter', qq({ cat: '1', city: 'Sahiwal' }).total === 1);
assert('Name matches outrank category-only matches',
  idx.names[qq({ q: 'sahiwal hospital' }).rows[0]].toLowerCase().includes('sahiwal'));

const workerSrc = readFileSync('src/lib/dataWorker.js', 'utf8');
assert('The worker delegates filtering to the tested search core', workerSrc.includes('runQuery(index'));
assert('Search rules live in one testable module', existsSync('src/lib/searchCore.js'));
assert('A foreign coordinate is never returned as a location', workerSrc.includes('hasLocation: located'));
assert('The worker revalidates the dataset instead of trusting the HTTP cache',
  workerSrc.includes("cache: 'no-cache'"));

const browseTxt = readFileSync('src/pages/Browse.jsx', 'utf8');
assert('Browse names the empty city instead of blaming the search', browseTxt.includes('No listings in ${city || \'this area\'} yet'));
assert('Browse explains an unknown city instead of showing other cities',
  browseTxt.includes('cityUnknown') && browseTxt.includes('no city called'));
assert('Browse result count states which city was searched', browseTxt.includes('found${city ? ` in ${city}`'));

const datasetTxt = readFileSync('src/lib/dataset.js', 'utf8');
assert('Curated results are filtered by an exact, case-insensitive city',
  datasetTxt.includes('c.city.toLowerCase() === cityLc'));
assert('Custom listings are filtered the same way', datasetTxt.includes('r.city.toLowerCase() !== cityLc'));

const cardTxt = readFileSync('src/components/CompanyCard.jsx', 'utf8');
assert('The card hides its Map button when there is no pin', cardTxt.includes('{mapHref && ('));
const detailTxt = readFileSync('src/pages/BusinessDetail.jsx', 'utf8');
assert('The detail page hides the map and Directions without a pin',
  detailTxt.includes('{mapEmbed && mapHref ? (') && detailTxt.includes('{mapHref && ('));
assert('The detail page explains the missing pin', detailTxt.includes('No map pin for this listing'));

const auditSrc = readFileSync('scripts/audit-listings.mjs', 'utf8');
assert('The audit script detects foreign pins', auditSrc.includes('pin outside Pakistan'));
assert('The audit script is wired to npm run audit',
  readFileSync('package.json', 'utf8').includes('node scripts/audit-listings.mjs'));
assert('stats.mjs refuses to publish foreign pins', readFileSync('scripts/stats.mjs', 'utf8').includes('refused to publish'));

const importSrc = readFileSync('scripts/import-listings.mjs', 'utf8');
assert('The CSV importer drops foreign coordinates', importSrc.includes('are not in Pakistan'));
assert('The CSV importer no longer invents a city for unknown names', !importSrc.includes('|| CITIES[0];'));
assert('The CSV importer no longer invents a category', !importSrc.includes('return best || CATEGORIES[0]'));
assert('The CSV importer no longer invents coordinates', !importSrc.includes('Math.random() - 0.5'));
assert('The city importer no longer invents a category',
  !readFileSync('scripts/import-city.mjs', 'utf8').includes('return best || CATEGORIES[0]'));

const swSrc = readFileSync('public/sw.js', 'utf8');
assert('Service worker no longer serves the dataset stale-while-revalidate',
  swSrc.includes("url.pathname.startsWith('/data/')") && swSrc.includes('ypk-v2'));
assert('Old service-worker caches are purged on activate', swSrc.includes('caches.delete(k)'));
assert('The dataset endpoint must revalidate',
  readFileSync('api/directory.js', 'utf8').includes('no-cache, must-revalidate'));

console.log('\n=== 2. SEO & AEO SCHEMA GENERATION TESTS ===');
const sampleFaqs = [
  { q: 'What is Yellow Pages Pakistan?', a: 'Pakistan business directory with 200,000+ listings.' },
  { q: 'Is it free?', a: 'Yes, 100% free forever.' },
];
const faqSchema = makeFaqSchema(sampleFaqs);
assert('FAQ schema has correct @context', faqSchema['@context'] === 'https://schema.org');
assert('FAQ schema has type FAQPage', faqSchema['@type'] === 'FAQPage');
assert('FAQ schema has 2 entities', faqSchema.mainEntity.length === 2);
assert('FAQ question preserved', faqSchema.mainEntity[0].name === 'What is Yellow Pages Pakistan?');
assert('FAQ answer preserved', faqSchema.mainEntity[0].acceptedAnswer.text === 'Pakistan business directory with 200,000+ listings.');

console.log('\n=== 3. SITEMAP.XML VALIDATION (CLEAN URLS) ===');
const sitemapContent = readFileSync('public/sitemap.xml', 'utf8');
assert('sitemap.xml exists and is non-empty', sitemapContent.length > 500);
assert('sitemap.xml has NO hash (#) URLs', !sitemapContent.includes('/#/'));
assert('sitemap.xml includes root URL /', sitemapContent.includes('<loc>https://yellowpagespakistan.goshbuzz.com/</loc>'));
assert('sitemap.xml includes /app', sitemapContent.includes('<loc>https://yellowpagespakistan.goshbuzz.com/app</loc>'));
assert('sitemap.xml includes /categories', sitemapContent.includes('<loc>https://yellowpagespakistan.goshbuzz.com/categories</loc>'));
assert('sitemap.xml includes /browse', sitemapContent.includes('<loc>https://yellowpagespakistan.goshbuzz.com/browse</loc>'));
assert('sitemap.xml includes /leads', sitemapContent.includes('<loc>https://yellowpagespakistan.goshbuzz.com/leads</loc>'));
assert('sitemap.xml includes /nearby', sitemapContent.includes('<loc>https://yellowpagespakistan.goshbuzz.com/nearby</loc>'));
assert('sitemap.xml includes /add', sitemapContent.includes('<loc>https://yellowpagespakistan.goshbuzz.com/add</loc>'));
assert('sitemap.xml includes /faq', sitemapContent.includes('<loc>https://yellowpagespakistan.goshbuzz.com/faq</loc>'));
assert('sitemap.xml lists clean category pages', sitemapContent.includes('/category/textile-mills-and-fabrics</loc>'));
assert('sitemap.xml lists clean city pages', sitemapContent.includes('/city/karachi</loc>') && sitemapContent.includes('/cities</loc>'));
assert('sitemap.xml has no query-string URLs (they canonicalise elsewhere)', !/<loc>[^<]*\?[^<]*<\/loc>/.test(sitemapContent));

console.log('\n=== 4. ROBOTS.TXT & LLMS.TXT VALIDATION ===');
const robotsContent = readFileSync('public/robots.txt', 'utf8');
assert('robots.txt points to clean sitemap.xml', robotsContent.includes('Sitemap: https://yellowpagespakistan.goshbuzz.com/sitemap.xml'));
assert('robots.txt disallows raw data scraping', robotsContent.includes('Disallow: /data/') && robotsContent.includes('Disallow: /api/'));
assert('robots.txt permits AI answer engines (GPTBot, ClaudeBot, PerplexityBot)',
  robotsContent.includes('User-agent: GPTBot') &&
  robotsContent.includes('User-agent: ClaudeBot') &&
  robotsContent.includes('User-agent: PerplexityBot')
);

const llmsContent = readFileSync('public/llms.txt', 'utf8');
assert('llms.txt has no hash URLs', !llmsContent.includes('/#/'));
assert('llms.txt documents 200,000+ listings fact', llmsContent.includes('200,000+'));
assert('llms.txt documents 420 cities fact', llmsContent.includes('420 cities'));
assert('llms.txt documents 130 categories fact', llmsContent.includes('130'));
assert('llms.txt documents Lead Workspace', llmsContent.includes('Lead Workspace'));

console.log('\n=== 5. SOURCE CODE & ROUTING CHECKS ===');
const appJsx = readFileSync('src/App.jsx', 'utf8');
assert('App uses BrowserRouter (not HashRouter)', appJsx.includes('BrowserRouter') && !appJsx.includes('HashRouter'));
assert('App includes LegacyHashRedirect', appJsx.includes('LegacyHashRedirect'));
assert('Route / maps to WebsiteHome', appJsx.includes('<Route path="/" element={<WebsiteHome />}'));
assert('Route /app maps to Home (Directory Web App)', appJsx.includes('<Route path="/app" element={<Home />}'));
assert('Route /browse maps to Browse', appJsx.includes('<Route path="/browse" element={<Browse />}'));
assert('Route /categories maps to Categories', appJsx.includes('<Route path="/categories" element={<Categories />}'));
assert('Route /leads maps to Leads', appJsx.includes('<Route path="/leads" element={<Leads />}'));
assert('Route /nearby maps to Nearby', appJsx.includes('<Route path="/nearby" element={<Nearby />}'));
assert('Route /add maps to AddListing', appJsx.includes('<Route path="/add" element={<AddListing />}'));
assert('Route /faq maps to Faq', appJsx.includes('<Route path="/faq" element={<Faq />}'));

const layoutJsx = readFileSync('src/components/Layout.jsx', 'utf8');
assert('Layout checks for website home', layoutJsx.includes("location.pathname === '/'"));
assert('Layout links back to Website Home from web app top bar', layoutJsx.includes('Website Home'));

const websiteHomeJsx = readFileSync('src/pages/WebsiteHome.jsx', 'utf8');
assert('WebsiteHome contains pure website hero', websiteHomeJsx.includes('Find, Connect & Pitch to'));
assert('WebsiteHome contains Launch Web App CTA', websiteHomeJsx.includes('Launch Web App') || websiteHomeJsx.includes('Launch Directory Web App'));
assert('WebsiteHome contains Lead Workspace CTA', websiteHomeJsx.includes('/leads'));
assert('WebsiteHome contains Category Explorer', websiteHomeJsx.includes('Popular Business Categories'));
assert('WebsiteHome contains City Directory', websiteHomeJsx.includes('Business Directory by City'));
assert('WebsiteHome contains Comparison Matrix', websiteHomeJsx.includes('Why Yellow Pages Pakistan Wins'));
assert('WebsiteHome contains PageFaq', websiteHomeJsx.includes('<PageFaq'));
assert('WebsiteHome contains SeoHead', websiteHomeJsx.includes('<SeoHead'));
assert('WebsiteHome contains Website Footer', websiteHomeJsx.includes('<footer'));

console.log(`\n========================================`);
console.log(`SUMMARY: ${passed} passed, ${failed} failed`);
console.log(`========================================`);

if (failed > 0) process.exit(1);
