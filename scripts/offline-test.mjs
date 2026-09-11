// Offline PWA verification — loads the app, waits for the service worker,
// goes fully offline, reloads and confirms search still works from cache.

import { chromium } from 'playwright';

const BASE = 'http://localhost:4173';
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
const ctx = page.context();
const errors = [];
page.on('pageerror', (e) => errors.push(String(e).slice(0, 200)));

const ok = (name, cond) => console.log((cond ? '✔' : '✘ FAIL'), name) || (!cond && (process.exitCode = 1));

// 1. Load online, wait for SW + dataset
await page.goto(BASE, { waitUntil: 'networkidle' });
await page.waitForTimeout(2500);
const swState = await page.evaluate(async () => {
  const reg = await navigator.serviceWorker.getRegistration();
  if (!reg) return 'none';
  await navigator.serviceWorker.ready.catch(() => {});
  return reg.active ? 'active' : 'installing';
});
ok('service worker registered & active', swState === 'active');

// Make sure the dataset is fetched & cached through the SW
const dataBytes = await page.evaluate(() => fetch('/data/directory.txt').then((r) => r.arrayBuffer()).then((b) => b.byteLength).catch(() => 0));
ok('dataset fetched online', dataBytes > 1_000_000);
await page.waitForTimeout(2000); // let SW caches settle

// 2. Go offline, reload, verify the app still boots and search works
await ctx.setOffline(true);
await page.reload({ waitUntil: 'domcontentloaded' });
await page.waitForTimeout(4500);
ok('offline: app shell renders', await page.locator('text=Popular categories').count() > 0);
ok('offline: OFFLINE MODE badge shows', await page.locator('text=OFFLINE MODE').count() === 1);

// 3. Offline search
await page.fill('input[aria-label="Search businesses"]', 'biryani');
await page.press('input[aria-label="Search businesses"]', 'Enter');
await page.waitForTimeout(2500);
const cards = await page.locator('a[href^="#/b/"]').count();
ok('offline: search returns results from cache', cards > 3);
await page.screenshot({ path: 'art/shot-offline.png' });

// 4. Offline business detail (map embed will fail gracefully — card must still render)
const maybeLater = page.locator('button:has-text("Maybe later")');
if (await maybeLater.count()) { await maybeLater.first().click(); await page.waitForTimeout(400); }
await page.locator('a[href^="#/b/"]').first().click();
await page.waitForTimeout(2500);
const dirBtn = page.getByRole('link', { name: 'Directions' });
ok('offline: business detail renders', (await dirBtn.count()) === 1);

console.log('page errors:', errors.length ? errors : 'none');
await browser.close();
process.exit(process.exitCode || 0);
