// Guarded dataset endpoint — serves the 200k listing corpus ONLY to the app itself.
// Static /data/* files are stripped from production builds, so this is the only door.
//
// Defences:
//   1. User-agent blocklist — curl, wget, python-requests, scrapy, SEO bots, crawlers…
//   2. Browser-integrity check — requests must come from our own page (sec-fetch-site:
//      same-origin, set by browsers, same-origin only) or carry the app header.
//   3. X-Robots-Tag: noindex — never appears in any search engine or AI index.
//   4. Per-instance rate limit — burst protection.
//   5. robots.txt disallows /api/ and /data/ for every crawler, including AI bots.

import fs from 'node:fs';
import path from 'node:path';

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
  res.setHeader('Cache-Control', 'private, max-age=3600');

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

  try {
    const file = path.join(process.cwd(), 'server-data', 'directory.txt');
    const data = fs.readFileSync(file, 'utf8');
    res.setHeader('Content-Type', 'text/plain; charset=utf-8');
    return res.status(200).send(data);
  } catch {
    return res.status(503).json({ error: 'Dataset unavailable.' });
  }
}
