// Host-aware robots.txt — served at /robots.txt via vercel.json rewrite.
// Static public/robots.txt remains the fallback for non-Vercel hosting.
import { cleanHost, buildRobots } from '../src/lib/seoFiles.js';

export default function handler(req, res) {
  const host = cleanHost(req.headers.host);
  res.setHeader('Content-Type', 'text/plain; charset=utf-8');
  res.setHeader('Cache-Control', 'public, max-age=300');
  res.setHeader('X-Robots-Tag', 'noindex');
  return res.status(200).send(buildRobots(host));
}
