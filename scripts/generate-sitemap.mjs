// Generates public/sitemap.xml for clean, crawlable routes (no hash fragments).
import { writeFileSync } from 'node:fs';
import { CATEGORIES } from '../src/data/categories.js';
import { CITIES } from '../src/data/geo.js';

const BASE = process.env.SITE_URL || 'https://yellowpagespakistan.goshbuzz.com';
const today = new Date().toISOString().slice(0, 10);

const urls = [
  { loc: `${BASE}/`, priority: '1.0', changefreq: 'daily' },
  { loc: `${BASE}/app`, priority: '0.9', changefreq: 'daily' },
  { loc: `${BASE}/categories`, priority: '0.9', changefreq: 'weekly' },
  { loc: `${BASE}/browse`, priority: '0.9', changefreq: 'daily' },
  { loc: `${BASE}/leads`, priority: '0.8', changefreq: 'monthly' },
  { loc: `${BASE}/nearby`, priority: '0.8', changefreq: 'weekly' },
  { loc: `${BASE}/add`, priority: '0.9', changefreq: 'monthly' },
  { loc: `${BASE}/faq`, priority: '0.8', changefreq: 'monthly' },
];

for (const c of CATEGORIES) {
  urls.push({ loc: `${BASE}/browse?cat=${c.id}`, priority: '0.7', changefreq: 'weekly' });
}

for (const c of CITIES.slice(0, 80)) {
  urls.push({ loc: `${BASE}/browse?city=${encodeURIComponent(c.name)}`, priority: '0.6', changefreq: 'weekly' });
}

const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.map((u) => `  <url><loc>${u.loc}</loc><lastmod>${today}</lastmod><changefreq>${u.changefreq}</changefreq><priority>${u.priority}</priority></url>`).join('\n')}
</urlset>
`;

writeFileSync(new URL('../public/sitemap.xml', import.meta.url), xml);
console.log(`sitemap.xml: ${urls.length} clean urls generated for ${BASE}`);
