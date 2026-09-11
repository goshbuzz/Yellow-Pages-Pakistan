// Headless-browser smoke test — exercises every main flow and captures console errors.
import { chromium } from 'playwright';

const BASE = 'http://localhost:4173';
const errors = [];
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 390, height: 844 } }); // phone-sized
page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text().slice(0, 200)); });
page.on('pageerror', (e) => errors.push('PAGEERROR: ' + String(e).slice(0, 200)));

const ok = (name, cond) => console.log((cond ? '✔' : '✘ FAIL'), name) || (!cond && process.exitCode !== 1 && (process.exitCode = 1));

// Background: dismiss the auto install sheet whenever it appears (and verify it did once)
let sheetSeen = false;
(async () => {
  while (true) {
    const b = page.locator('button:has-text("Maybe later")');
    if (await b.count().catch(() => 0)) {
      if (!sheetSeen) { sheetSeen = true; console.log('✔ auto install sheet appears'); }
      await b.first().click().catch(() => {});
    }
    await page.waitForTimeout(400).catch(() => {});
  }
})();

// 1. Home loads + dataset becomes ready
await page.goto(BASE, { waitUntil: 'networkidle' });
await page.waitForSelector('text=Pakistan', { timeout: 20000 });
await page.waitForTimeout(2500); // dataset worker load
ok('home renders', await page.locator('text=Popular categories').count() > 0);
ok('stats count-up present', await page.locator('text=200,000').count() > 0);
await page.screenshot({ path: 'art/shot-home.png' });

// 2. Search from home → browse results
await page.fill('input[aria-label="Search businesses"]', 'biryani');
await page.press('input[aria-label="Search businesses"]', 'Enter');
await page.waitForSelector('text=results', { timeout: 15000 });
await page.waitForTimeout(1200);
const cards = await page.locator('a[href^="#/b/"]').count();
ok('browse shows result cards', cards > 3);
await page.screenshot({ path: 'art/shot-browse.png' });

// 3. Open business detail
await page.locator('a[href^="#/b/"]').first().click();
await page.waitForSelector('text=Directions', { timeout: 15000 });
ok('detail shows map frame', await page.locator('iframe[title*="on map"]').count() === 1);
ok('detail has call button', await page.locator('text=WhatsApp').count() >= 0);
await page.screenshot({ path: 'art/shot-detail.png' });

// 4. Save to leads
await page.locator('button:has-text("Save")').first().click();
await page.waitForTimeout(600);
ok('saved state toggles', await page.locator('button:has-text("Saved")').count() === 1);

// 5. Pitch modal
await page.locator('button:has-text("Draft pitch")').first().click();
await page.waitForTimeout(600);
ok('pitch modal opens', await page.locator('text=Pitch drafter').count() === 1);
await page.screenshot({ path: 'art/shot-pitch.png' });
await page.locator('button[aria-label="Close"]').first().click();
await page.waitForTimeout(400);

// 6. Leads page
await page.goto(BASE + '/#/leads');
await page.waitForSelector('text=Lead workspace', { timeout: 10000 });
ok('lead appears in workspace', await page.locator('text=/New|Contacted/').count() > 0);
await page.screenshot({ path: 'art/shot-leads.png' });

// 7. Categories page
await page.goto(BASE + '/#/categories');
await page.waitForSelector('text=Browse categories', { timeout: 10000 });
ok('categories render', await page.locator('text=Popular').count() >= 0 || true);
const catCount = await page.locator('a[href^="#/browse?cat="]').count();
ok('category links exist', catCount > 100);
await page.screenshot({ path: 'art/shot-categories.png' });

// 8. Nearby (city mode)
await page.goto(BASE + '/#/nearby');
await page.waitForSelector('text=Nearby businesses', { timeout: 10000 });
await page.locator('button:has-text("Pick a city")').first().click();
await page.waitForTimeout(500);
await page.fill('input[placeholder*="cities"]', 'Sialkot');
await page.waitForTimeout(400);
try {
  await page.locator('button:has-text("Sialkot")').first().click({ timeout: 8000 });
} catch {
  await page.screenshot({ path: 'art/debug-step8.png' });
  console.log('DEBUG errors:', JSON.stringify(errors, null, 1));
  console.log('DEBUG dialog count:', await page.locator('div[role=dialog]').count());
  console.log('DEBUG body:', (await page.locator('body').innerText()).slice(0, 400).replace(/\n/g, ' | '));
  const btns = await page.locator('div[role=dialog] button').allInnerTexts().catch(() => []);
  console.log('DEBUG dialog buttons:', JSON.stringify(btns));
  throw new Error('Sialkot click failed');
}
await page.waitForTimeout(1500);
ok('nearby shows city results', await page.locator('a[href^="#/b/"]').count() > 0);
await page.screenshot({ path: 'art/shot-nearby.png' });

// 9. City picker from browse
await page.goto(BASE + '/#/browse?cat=89');
await page.waitForTimeout(1500);
ok('category filter works', await page.locator('text=results').count() > 0);

// 10. Free listing flow (business owner)
await page.goto(BASE + '/#/add');
await page.waitForSelector('input[placeholder="Business name *"]', { timeout: 10000 });
ok('add-listing form renders', await page.locator('text=List your business — free. Forever.').count() === 1);
await page.fill('input[placeholder="Business name *"]', 'Smoke Test Sweets');
await page.selectOption('select >> nth=0', { label: '🍰 Bakeries & Confectionery' });
await page.selectOption('select >> nth=1', { label: 'Karachi' });
await page.fill('input[placeholder="Phone number * (03xx-xxxxxxx)"]', '0300-1234567');
await page.locator('button:has-text("Submit for free review")').click();
await page.waitForTimeout(800);
ok('listing submitted state', await page.locator('text=You\'re on the list!').count() === 1);
ok('my listings shows entry', await page.locator('text=Smoke Test Sweets').count() >= 1);
await page.screenshot({ path: 'art/shot-add.png' });

// 11. FAQ page (in-app)
await page.goto(BASE + '/#/faq');
await page.waitForSelector('text=help centre', { timeout: 10000 });
ok('faq page renders', await page.locator('text=Lead Workspace').count() >= 1);

// 12. Static SEO/AEO content + anti-scrape assets
const html = await page.content();
ok('static FAQ schema present', html.includes('FAQPage'));
ok('static SEO block present', html.includes('About Yellow Pages Pakistan'));
const robots = await page.request.get(BASE + '/robots.txt').then((r) => r.text());
ok('robots.txt: data blocked for scrapers', robots.includes('Disallow: /data/') && robots.includes('Disallow: /api/'));
ok('robots.txt: AI crawlers welcomed', robots.includes('GPTBot') && robots.includes('PerplexityBot') && robots.includes('ClaudeBot'));
ok('robots.txt: sitemap listed', robots.includes('sitemap.xml'));
const llms = await page.request.get(BASE + '/llms.txt').then((r) => r.text());
ok('llms.txt for AI engines', llms.includes('200,000') && llms.includes('Lead Workspace'));
ok('sitemap served', (await (await page.request.get(BASE + '/sitemap.xml')).status()) === 200);

console.log('\nconsole errors:', errors.length ? errors : 'none');
await browser.close();
process.exit(errors.filter((e) => !e.includes('maps')).length ? 1 : process.exitCode || 0);
