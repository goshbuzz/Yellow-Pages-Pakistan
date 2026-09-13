// Generates public/sitemap.xml.
// The app is a hash-routed SPA (#/browse, #/categories…), so the only real,
// crawlable URL is the root — Google strips URL fragments, and any '#/' URL
// listed here would just re-fetch the homepage and be reported as a duplicate.
// When real server-rendered routes are added later, append them here.
import { writeFileSync } from 'node:fs';

const BASE = process.env.SITE_URL || 'https://yellow-pages-pakistan-pi.vercel.app';
const today = new Date().toISOString().slice(0, 10);

const urls = [
  { loc: `${BASE}/`, priority: '1.0', changefreq: 'daily' },
];

const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.map((u) => `  <url><loc>${u.loc}</loc><lastmod>${today}</lastmod><changefreq>${u.changefreq}</changefreq><priority>${u.priority}</priority></url>`).join('\n')}
</urlset>
`;
writeFileSync(new URL('../public/sitemap.xml', import.meta.url), xml);
console.log(`sitemap.xml: ${urls.length} urls`);
