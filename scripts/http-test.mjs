// HTTP Integration Test — tests server responses for clean URLs and SEO assets.
const BASE = process.env.BASE_URL || 'http://localhost:4173';

const routes = [
  '/',
  '/app',
  '/browse',
  '/categories',
  '/leads',
  '/nearby',
  '/add',
  '/faq',
  '/sitemap.xml',
  '/robots.txt',
  '/llms.txt',
  '/favicon.svg',
  '/manifest.webmanifest',
];

async function run() {
  console.log(`Testing HTTP endpoints on ${BASE}...`);
  let failures = 0;

  for (const route of routes) {
    try {
      const res = await fetch(`${BASE}${route}`);
      if (res.status === 200) {
        console.log(`✔ [200 OK] ${route}`);
      } else {
        console.error(`✘ [${res.status}] ${route}`);
        failures++;
      }
    } catch (err) {
      console.error(`✘ [ERR] ${route}: ${err.message}`);
      failures++;
    }
  }

  // Also test that sitemap.xml does NOT contain hash URLs
  const sitemapRes = await fetch(`${BASE}/sitemap.xml`);
  const sitemapText = await sitemapRes.text();
  if (sitemapText.includes('/#/')) {
    console.error('✘ [FAIL] sitemap.xml contains hash fragment URLs');
    failures++;
  } else {
    console.log('✔ [PASS] sitemap.xml is clean of hash fragments');
  }

  // Verify robots.txt
  const robotsRes = await fetch(`${BASE}/robots.txt`);
  const robotsText = await robotsRes.text();
  if (robotsText.includes('sitemap.xml')) {
    console.log('✔ [PASS] robots.txt contains valid sitemap directive');
  } else {
    console.error('✘ [FAIL] robots.txt missing sitemap directive');
    failures++;
  }

  console.log(`\nHTTP Test Result: ${failures === 0 ? 'ALL PASSED' : failures + ' FAILED'}`);
  process.exit(failures === 0 ? 0 : 1);
}

run();
