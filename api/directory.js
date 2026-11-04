// Guarded dataset endpoint — serves the imported listing corpus ONLY to the app itself.
//
// The corpus is imported directly (server-data/corpus.js, produced by `npm run stats`),
// so no includeFiles config or non-default memory settings are required —
// the function deploys fine on the free Hobby plan.
//
// Defences:
//   1. User-agent blocklist — curl, wget, python-requests, scrapy, SEO bots, crawlers…
//   2. Browser-integrity check — requests must come from our own page (sec-fetch-site:
//      same-origin, browsers only) or carry the app header.
//   3. X-Robots-Tag: noindex — never appears in any search engine or AI index.
//   4. Per-instance rate limiting — burst protection.

import corpus from '../server-data/corpus.js';

const BLOCKED_UA = /(curl|wget|python-requests|python-urllib|aiohttp|httpx|libwww|httpclient|okhttp|java\/|go-http-client|scrapy|httrack|harvest|sitecheck|semrush|ahrefs|mj12bot|dotbot|petalbot|dataforseo|serpstat|moz\.com|sistrix|lundunbot|bot|crawl|spider|slurp)/i;

const RATE_LIMIT_MAX = 25;        // requests …
const RATE_LIMIT_WINDOW = 10 * 60 * 1000; // … per 10 min per IP (per lambda instance)
const hits = new Map();

function rateLimited(ip) {
  const now = Date.now();
  const arr = (hits.get(ip) || []).filter((t) => now - t < RATE_LIMIT_WINDOW);
  if (arr.length >= RATE_LIMIT_MAX) {
    hits.set(ip, arr);
    return true;
  }
  arr.push(now);
  hits.set(ip, arr);
  if (hits.size > 5000) hits.clear(); // crude memory guard
  return false;
}

export default function handler(req, res) {
  res.setHeader('X-Robots-Tag', 'noindex, nofollow, noarchive');
  // A cleaned corpus must reach users immediately: an hour-old copy of a bad dataset is a
  // business risk, not a performance win. Browsers may keep it, but must revalidate.
  res.setHeader('Cache-Control', 'private, no-cache, must-revalidate');

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const ua = String(req.headers['user-agent'] || '');
  const secFetchSite = req.headers['sec-fetch-site'];
  const appHeader = req.headers['x-ypk-app'];

  // 1. Block known scraping tools & crawlers outright
  if (BLOCKED_UA.test(ua)) {
    return res.status(403).json({ error: 'Automated access to this resource is not permitted.' });
  }

  // 2. Only the app itself: same-origin browser fetch, or explicit app header
  const fromOurPage = secFetchSite === 'same-origin' || appHeader === '1';
  if (!fromOurPage) {
    return res.status(403).json({ error: 'This resource is only available inside the Yellow Pages Pakistan app.' });
  }

  // 3. Burst protection
  const ip = req.headers['x-forwarded-for']?.split(',')[0]?.trim() || 'unknown';
  if (rateLimited(ip)) {
    return res.status(429).json({ error: 'Too many requests.' });
  }

  res.setHeader('Content-Type', 'text/plain; charset=utf-8');
  // No dataset configured: tell the app plainly instead of shipping placeholder rows.
  if (!corpus || corpus.startsWith('{"v":1,"total":0}')) {
    return res.status(404).json({ error: 'No dataset configured', hint: 'npm run import && npm run stats' });
  }
  return res.status(200).send(corpus);
}
