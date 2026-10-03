// Comprehensive smoke test — validates Website Home, Directory Web App,
// clean URLs, SEO tags, schema, per-page identity, and search flows.
import { chromium } from 'playwright';

const BASE = 'http://localhost:4173';
const errors = [];
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1280, height: 800 } }); // desktop viewport
page.on('console', (m) => {
  if (m.type() === 'error') errors.push(m.text().slice(0, 200));
});
page.on('pageerror', (e) => errors.push('PAGEERROR: ' + String(e).slice(0, 200)));

const ok = (name, cond) => {
  console.log(cond ? '✔' : '✘ FAIL', name);
  if (!cond && process.exitCode !== 1) process.exitCode = 1;
};

// Background: dismiss auto install sheet if it ever appears
(async () => {
  while (true) {
    const b = page.locator('button:has-text("Maybe later")');
    if (await b.count().catch(() => 0)) {
      await b.first().click().catch(() => {});
    }
    await page.waitForTimeout(400).catch(() => {});
  }
})();

console.log('\n--- 1. Testing Pure Website Home Page (/) ---');
await page.goto(BASE + '/', { waitUntil: 'networkidle' });
await page.waitForSelector('text=Pakistan', { timeout: 20000 });
ok('website home title matches', (await page.title()).includes('Yellow Pages Pakistan'));
ok('website home h1 present', await page.locator('h1').count() === 1);
ok('website hero CTA to webapp present', await page.locator('a[href="/app"]:has-text("Launch")').count() >= 1);
ok('website lead workspace CTA present', await page.locator('a[href="/leads"]').count() >= 1);
ok('website category preview present', await page.locator('a[href^="/browse?cat="]').count() >= 8);
ok('website comparison table present', await page.locator('text=Why Yellow Pages Pakistan Wins').count() === 1);
ok('website FAQ present', await page.locator('text=Frequently Asked Questions').count() >= 1);
ok('website footer present', await page.locator('footer').count() >= 1);

// Test Search from Website Home into Web App
console.log('\n--- 2. Testing Website Home Search Redirection ---');
await page.fill('input[placeholder*="textile mills"]', 'biryani');
await page.locator('form button[type="submit"]').click();
await page.waitForSelector('text=results', { timeout: 15000 });
await page.waitForTimeout(1200);
ok('navigated to clean /browse?q=biryani', page.url().includes('/browse?q=biryani'));
const cards = await page.locator('a[href^="/b/"]').count();
ok('browse shows result cards', cards > 0);

console.log('\n--- 3. Testing Directory Web App (/app) ---');
await page.goto(BASE + '/app', { waitUntil: 'networkidle' });
await page.waitForSelector('text=now in your pocket', { timeout: 15000 });
ok('app home title distinct', (await page.title()).includes('Directory Web App'));
ok('app home h1 present', await page.locator('h1').count() === 1);
ok('return to website home link present', await page.locator('a[href="/"]:has-text("Website Home")').count() >= 1);

console.log('\n--- 4. Testing Business Detail (/b/c0) ---');
await page.goto(BASE + '/b/c0', { waitUntil: 'networkidle' });
await page.waitForSelector('text=Directions', { timeout: 15000 });
ok('detail page has distinct title', (await page.title()).includes('Yellow Pages PK'));
ok('detail shows map frame', await page.locator('iframe[title*="on map"]').count() === 1);
ok('detail has call button', await page.locator('a[href^="tel:"]').count() >= 1);

// Save to leads
await page.locator('button:has-text("Save")').first().click();
await page.waitForTimeout(500);
ok('saved toggle state', await page.locator('button:has-text("Saved")').count() === 1);

console.log('\n--- 5. Testing Lead Workspace (/leads) ---');
await page.goto(BASE + '/leads', { waitUntil: 'networkidle' });
await page.waitForSelector('text=Lead workspace', { timeout: 10000 });
ok('leads title distinct', (await page.title()).includes('Lead Workspace'));
ok('lead workspace h1 present', await page.locator('h1').count() === 1);
ok('lead present in workspace', await page.locator('text=/New|Contacted/').count() >= 1);
ok('lead workspace FAQ present', await page.locator('text=Lead Workspace FAQ').count() === 1);

console.log('\n--- 6. Testing Categories (/categories) ---');
await page.goto(BASE + '/categories', { waitUntil: 'networkidle' });
await page.waitForSelector('text=Browse categories', { timeout: 10000 });
ok('categories title distinct', (await page.title()).includes('130 Business Categories'));
ok('categories h1 present', await page.locator('h1').count() === 1);
const catCount = await page.locator('a[href^="/browse?cat="]').count();
ok('category links exist', catCount >= 100);

console.log('\n--- 7. Testing Free Listing (/add) ---');
await page.goto(BASE + '/add', { waitUntil: 'networkidle' });
await page.waitForSelector('input[placeholder="Business name *"]', { timeout: 10000 });
ok('add listing title distinct', (await page.title()).includes('List Your Business'));
ok('add listing h1 present', await page.locator('h1').count() === 1);
ok('add listing FAQ present', await page.locator('text=Free Listing FAQ').count() === 1);

console.log('\n--- 8. Testing FAQ Page (/faq) ---');
await page.goto(BASE + '/faq', { waitUntil: 'networkidle' });
await page.waitForSelector('text=help centre', { timeout: 10000 });
ok('faq title distinct', (await page.title()).includes('Help Centre'));
ok('faq h1 present', await page.locator('h1').count() === 1);

console.log('\n--- 9. Testing Legacy Hash Redirect (/#/categories -> /categories) ---');
await page.goto(BASE + '/#/categories', { waitUntil: 'networkidle' });
await page.waitForTimeout(600);
ok('legacy hash redirect rewrote to clean /categories', page.url().endsWith('/categories'));

console.log('\n--- 10. Technical SEO & Assets Verification ---');
const robots = await page.request.get(BASE + '/robots.txt').then((r) => r.text());
ok('robots.txt present and references sitemap.xml', robots.includes('sitemap.xml'));
const sitemap = await page.request.get(BASE + '/sitemap.xml').then((r) => r.text());
ok('sitemap.xml has clean URLs (no #)', !sitemap.includes('/#/'));
ok('sitemap.xml includes /app and /browse', sitemap.includes('/app</loc>') && sitemap.includes('/browse</loc>'));
const llms = await page.request.get(BASE + '/llms.txt').then((r) => r.text());
ok('llms.txt present and updated with clean URLs', llms.includes('200,000') && !llms.includes('/#/browse'));

console.log('\nErrors recorded:', errors.length ? errors : 'None');
await browser.close();
process.exit(errors.filter((e) => !e.includes('maps')).length ? 1 : process.exitCode || 0);
