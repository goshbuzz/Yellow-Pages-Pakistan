// Unit & Integration Test Suite — validates routing, SEO schemas, dataset,
// categories, sitemap, robots.txt, llms.txt, and HTTP responses.
import { readFileSync, existsSync } from 'node:fs';
import { CATEGORIES, CATEGORY_GROUPS, CATEGORY_BY_ID } from '../src/data/categories.js';
import { CITIES } from '../src/data/geo.js';
import { STATS } from '../src/data/stats.generated.js';
import { CURATED } from '../src/data/curated.js';
import { makeFaqSchema } from '../src/lib/seo.js';
import { waNumber, isWaCapable, waHref, waInfo, waDisplayNumber } from '../src/lib/whatsapp.js';
import { leadsToCsv } from '../src/lib/export.js';

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
assert('Listing statistics generated', STATS.total >= 200000, `Found: ${STATS.total}`);
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
