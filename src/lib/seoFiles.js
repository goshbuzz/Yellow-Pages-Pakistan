// Host-aware SEO file builders — shared by the Vercel serverless functions
// (api/robots.js, api/sitemap.js) and the Vite dev/preview servers.
//
// robots.txt and sitemap.xml are generated from the request's Host header so
// they always announce/contain URLs on the exact domain being crawled. This
// makes the classic "sitemap points at a different domain, so Google ignores
// it" failure impossible — on the custom domain, *.vercel.app, preview
// deployments, and local dev alike.

const SAFE_HOST = /^[a-z0-9.-]+$/;

export function cleanHost(rawHost, fallback = 'yellowpagespk.goshbuzz.com') {
  const h = String(rawHost || '').split(':')[0].toLowerCase();
  return SAFE_HOST.test(h) && h.includes('.') ? h : fallback;
}

export function buildRobots(host) {
  return `# robots.txt — Yellow Pages Pakistan
# Public content is open to search engines AND AI/answer engines.
# Raw listing data (/data/ and /api/) is app-internal and closed to everyone.

Sitemap: https://${host}/sitemap.xml

# ── Default rule: crawl the site, never the raw data endpoints ──
User-agent: *
Disallow: /data/
Disallow: /api/

# ── Search engines — explicitly welcome ──
User-agent: Googlebot
Allow: /
Disallow: /data/
Disallow: /api/

User-agent: Bingbot
Allow: /
Disallow: /data/
Disallow: /api/

User-agent: DuckDuckBot
Allow: /
Disallow: /data/
Disallow: /api/

User-agent: YandexBot
Allow: /
Disallow: /data/
Disallow: /api/

# ── AI / answer engines — explicitly welcome on all public content ──
# (GEO & AEO: let LLMs read pages, FAQs and metadata so they can cite us —
#  but never the dataset itself.)
User-agent: GPTBot
Allow: /
Disallow: /data/
Disallow: /api/

User-agent: OAI-SearchBot
Allow: /
Disallow: /data/
Disallow: /api/

User-agent: ChatGPT-User
Allow: /
Disallow: /data/
Disallow: /api/

User-agent: ClaudeBot
Allow: /
Disallow: /data/
Disallow: /api/

User-agent: Claude-Web
Allow: /
Disallow: /data/
Disallow: /api/

User-agent: Claude-SearchBot
Allow: /
Disallow: /data/
Disallow: /api/

User-agent: PerplexityBot
Allow: /
Disallow: /data/
Disallow: /api/

User-agent: Perplexity-User
Allow: /
Disallow: /data/
Disallow: /api/

User-agent: Google-Extended
Allow: /
Disallow: /data/
Disallow: /api/

User-agent: Applebot
Allow: /
Disallow: /data/
Disallow: /api/

User-agent: Applebot-Extended
Allow: /
Disallow: /data/
Disallow: /api/

User-agent: CCBot
Allow: /
Disallow: /data/
Disallow: /api/

User-agent: DuckAssistBot
Allow: /
Disallow: /data/
Disallow: /api/

User-agent: Meta-ExternalAgent
Allow: /
Disallow: /data/
Disallow: /api/

User-agent: Bytespider
Allow: /
Disallow: /data/
Disallow: /api/
`;
}

export function buildSitemap(host) {
  const today = new Date().toISOString().slice(0, 10);
  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url><loc>https://${host}/</loc><lastmod>${today}</lastmod><changefreq>daily</changefreq><priority>1.0</priority></url>
</urlset>
`;
}
