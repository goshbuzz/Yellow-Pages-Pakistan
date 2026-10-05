// Build-time prerender. Runs AFTER `vite build`.
// Takes dist/index.html as a template and writes one static HTML file per indexable
// route with its own <title>, meta description, canonical, Open Graph tags, JSON-LD,
// and a crawlable <main> (H1, intro, internal links, FAQ). React replaces the <main>
// on load, so visitors see the normal app; crawlers and AI bots that don't run
// JavaScript see real content, real headings and real internal links.
//
// Output uses `<path>.html` (Vercel `cleanUrls: true` serves it at `/path`).
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { CATEGORIES } from '../src/data/categories.js';
import { CITIES } from '../src/data/geo.js';
import {
  SITE_URL, STATIC_PAGES, buildCategoryPage, buildCityPage, buildCitiesHub, buildCategoriesHub,
} from '../src/lib/landing.js';

const DIST = join(dirname(fileURLToPath(import.meta.url)), '..', 'dist');
const template = readFileSync(join(DIST, 'index.html'), 'utf8');

const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const jsonLd = (o) => JSON.stringify(o).replace(/</g, '\\u003c');
const url = (p) => (p === '/' ? `${SITE_URL}/` : `${SITE_URL}${p}`);

const GLOBAL_NAV = [
  ['/', 'Home'], ['/categories', 'Categories'], ['/cities', 'Cities'], ['/browse', 'Search'],
  ['/nearby', 'Nearby'], ['/leads', 'Lead workspace'], ['/add', 'List your business'], ['/faq', 'FAQ'],
];

function linksHtml(groups) {
  return groups.map((g) => `<section><h2>${esc(g.heading)}</h2><ul>${g.links.map((l) => `<li><a href="${esc(l.href)}">${esc(l.text)}</a></li>`).join('')}</ul></section>`).join('');
}

function bodyHtml(page, extraGroups = []) {
  const crumbs = page.crumbs && page.crumbs.length > 1
    ? `<nav aria-label="Breadcrumb">${page.crumbs.map((c, i) => (i < page.crumbs.length - 1 ? `<a href="${esc(c.path)}">${esc(c.name)}</a>` : `<span>${esc(c.name)}</span>`)).join(' › ')}</nav>`
    : '';
  const faqs = (page.faqs || []).length
    ? `<section><h2>Frequently asked questions</h2>${page.faqs.map((f) => `<h3>${esc(f.q)}</h3><p>${esc(f.a)}</p>`).join('')}</section>`
    : '';
  return `<main id="ypk-prerender" style="max-width:860px;margin:0 auto;padding:24px 16px;font-family:system-ui,sans-serif;color:#1c1917">
${crumbs}
<h1>${esc(page.h1)}</h1>
${(page.intro || []).map((p) => `<p>${esc(p)}</p>`).join('\n')}
${linksHtml([...(page.linkGroups || []), ...extraGroups])}
${faqs}
<nav aria-label="Site"><ul>${GLOBAL_NAV.map(([h, t]) => `<li><a href="${h}">${esc(t)}</a></li>`).join('')}</ul></nav>
</main>`;
}

function render(page, extraGroups = []) {
  const canon = url(page.path);
  let html = template;
  const set = (re, repl) => { html = html.replace(re, repl); };
  set(/<title>[\s\S]*?<\/title>/, `<title>${esc(page.title)}</title>`);
  set(/<meta name="description" content="[^"]*"\s*\/>/, `<meta name="description" content="${esc(page.description)}" />`);
  set(/<link rel="canonical" href="[^"]*"\s*\/>/, `<link rel="canonical" href="${canon}" />`);
  set(/<meta property="og:url" content="[^"]*"\s*\/>/, `<meta property="og:url" content="${canon}" />`);
  set(/<meta property="og:title" content="[^"]*"\s*\/>/, `<meta property="og:title" content="${esc(page.title)}" />`);
  set(/<meta property="og:description" content="[^"]*"\s*\/>/, `<meta property="og:description" content="${esc(page.description)}" />`);
  set(/<meta name="twitter:title" content="[^"]*"\s*\/>/, `<meta name="twitter:title" content="${esc(page.title)}" />`);
  set(/<meta name="twitter:description" content="[^"]*"\s*\/>/, `<meta name="twitter:description" content="${esc(page.description)}" />`);
  if (page.schema) {
    const tags = page.schema.map((s) => `<script type="application/ld+json">${jsonLd(s)}</script>`).join('\n    ');
    set(/<\/head>/, `    ${tags}\n  </head>`);
  }
  // Keep the splash (covers the static content for real visitors), add the static <main> after it.
  // (inside #root, right after the splash block; React replaces the whole root on mount)
  const main = bodyHtml(page, extraGroups).replace(/\$/g, '$$$$');
  set(/(<p>Opening Yellow Pages Pakistan…<\/p>\s*<\/div>)/, `$1\n${main}`);
  return html;
}

function write(path, html) {
  const rel = path === '/' ? 'index.html' : `${path.slice(1)}.html`;
  const file = join(DIST, rel);
  mkdirSync(dirname(file), { recursive: true });
  writeFileSync(file, html);
}

const categoriesHub = buildCategoriesHub();
const cityHub = buildCitiesHub();
let count = 0;

for (const p of STATIC_PAGES) {
  const extra = p.path === '/categories' ? categoriesHub.groups
    : p.path === '/' ? [{ heading: 'Popular categories', links: categoriesHub.groups.flatMap((g) => g.links).slice(0, 24) }, { heading: 'Popular cities', links: cityHub.linkGroups.flatMap((g) => g.links).slice(0, 30) }]
    : [];
  write(p.path, render({ ...p, crumbs: [], linkGroups: [], faqs: [] }, extra));
  count++;
}
write('/cities', render(cityHub)); count++;
for (const c of CATEGORIES) { const pg = buildCategoryPage(c); write(pg.path, render(pg)); count++; }
for (const c of CITIES) { const pg = buildCityPage(c); write(pg.path, render(pg)); count++; }
console.log(`prerender: ${count} static HTML pages written to dist/`);
