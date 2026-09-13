// Generates public/sitemap.xml and public/robots.txt from scripts/robots.template.txt.
// Both are templated on SITE_URL so robots.txt and the sitemap always agree on
// the domain (set SITE_URL in the Vercel project env for a custom domain).
//
// The app is a hash-routed SPA (#/browse, #/categories…), so the only real,
// crawlable URL is the root — Google strips URL fragments, and any '#/' URL
// listed here would just re-fetch the homepage and be reported as a duplicate.
// When real server-rendered routes are added later, append them here.
import { readFileSync, writeFileSync } from 'node:fs';

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

const robots = readFileSync(new URL('./robots.template.txt', import.meta.url), 'utf8')
  .replaceAll('__SITE_URL__', BASE);
writeFileSync(new URL('../public/robots.txt', import.meta.url), robots);

console.log(`SEO files generated for ${BASE}: sitemap.xml (${urls.length} url) + robots.txt`);
