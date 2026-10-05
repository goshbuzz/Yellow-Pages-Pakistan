// Generates public/sitemap.xml — ONLY clean, self-canonical, indexable URLs:
// static pages, the cities hub, every category page and every city page.
// (Query-string URLs like /browse?cat=1 are NOT listed: they canonicalise elsewhere.)
import { writeFileSync } from 'node:fs';
import { CATEGORIES } from '../src/data/categories.js';
import { CITIES } from '../src/data/geo.js';
import { STATIC_PAGES, categoryPath, cityPath } from '../src/lib/landing.js';

const BASE = process.env.SITE_URL || 'https://yellowpagespakistan.goshbuzz.com';
const today = new Date().toISOString().slice(0, 10);

const staticMeta = {
  '/': ['daily', '1.0'], '/app': ['daily', '0.8'], '/categories': ['weekly', '0.9'], '/browse': ['daily', '0.7'],
  '/nearby': ['weekly', '0.6'], '/leads': ['monthly', '0.6'], '/add': ['monthly', '0.8'], '/faq': ['monthly', '0.7'],
};

const urls = STATIC_PAGES.map((p) => ({ loc: p.path, changefreq: staticMeta[p.path]?.[0] || 'monthly', priority: staticMeta[p.path]?.[1] || '0.6' }));
urls.push({ loc: '/cities', changefreq: 'weekly', priority: '0.9' });
for (const c of CATEGORIES) urls.push({ loc: categoryPath(c), changefreq: 'weekly', priority: '0.7' });
for (const c of [...CITIES].sort((a, b) => b.pop - a.pop)) urls.push({ loc: cityPath(c), changefreq: 'weekly', priority: c.pop > 500000 ? '0.7' : '0.5' });

const full = (p) => (p === '/' ? `${BASE}/` : `${BASE}${p}`);
const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.map((u) => `  <url><loc>${full(u.loc)}</loc><lastmod>${today}</lastmod><changefreq>${u.changefreq}</changefreq><priority>${u.priority}</priority></url>`).join('\n')}
</urlset>
`;

writeFileSync(new URL('../public/sitemap.xml', import.meta.url), xml);
console.log(`sitemap.xml: ${urls.length} clean urls generated for ${BASE}`);
