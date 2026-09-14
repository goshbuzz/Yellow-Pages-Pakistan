// Host-aware sitemap.xml — served at /sitemap.xml via vercel.json rewrite.
// Static public/sitemap.xml remains the fallback for non-Vercel hosting.
import { cleanHost, buildSitemap } from '../src/lib/seoFiles.js';

export default function handler(req, res) {
  const host = cleanHost(req.headers.host);
  res.setHeader('Content-Type', 'application/xml; charset=utf-8');
  res.setHeader('Cache-Control', 'public, max-age=300');
  res.setHeader('X-Robots-Tag', 'noindex');
  return res.status(200).send(buildSitemap(host));
}
