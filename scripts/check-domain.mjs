#!/usr/bin/env node
// One-command deployment & SEO health check.
//
//   node scripts/check-domain.mjs [host]
//
// Verifies the full chain Google needs before a domain can be indexed:
//   1. Registry nameserver delegation (who actually controls the domain DNS)
//   2. DNS records (CNAME/A) for the host — via Google/Cloudflare DoH
//   3. HTTPS serving of the site
//   4. robots.txt Sitemap line  — must announce a sitemap on the SAME host
//   5. sitemap.xml URLs        — must be on the SAME host
//   6. Canonical tag           — must not point at a different domain
//
// Uses only https:// requests (no dig/nslookup needed) so it runs anywhere.

const hostRaw = (process.argv[2] || 'yellowpagespk.goshbuzz.com').toLowerCase().replace(/^https?:\/\//, '').replace(/\/+$/, '');
const host = hostRaw.split(':')[0];
const port = hostRaw.includes(':') ? hostRaw.split(':')[1] : '';
const isLocal = /^(localhost|127\.0\.0\.1|\[::1\])$/.test(host);
const scheme = isLocal ? 'http' : 'https';
const fetchHost = host === 'localhost' ? '127.0.0.1' : host;
const compareHost = host === 'localhost' ? '127.0.0.1' : host;
const origin = `${scheme}://${fetchHost}${port ? ':' + port : ''}`;

let fails = 0;
const ok = (label, cond, detail = '') => {
  console.log(`${cond ? '✅' : '❌'} ${label}${detail ? ` — ${detail}` : ''}`);
  if (!cond) fails++;
};
const info = (s) => console.log(`   ${s}`);

async function doh(name, type) {
  const providers = [
    `https://dns.google/resolve?name=${encodeURIComponent(name)}&type=${type}`,
    `https://cloudflare-dns.com/dns-query?name=${encodeURIComponent(name)}&type=${type}`,
  ];
  let lastErr = null;
  for (const url of providers) {
    try {
      const r = await fetch(url, { signal: AbortSignal.timeout(10000), headers: { accept: 'application/dns-json' } });
      const d = await r.json();
      if (d.Status !== undefined) return d;
      lastErr = `bad response from ${new URL(url).hostname}`;
    } catch (e) {
      lastErr = String(e);
    }
  }
  return { Status: -1, error: lastErr || 'network error' };
}

async function httpGet(url) {
  try {
    const r = await fetch(url, { signal: AbortSignal.timeout(15000), redirect: 'manual' });
    const text = await r.text();
    return { status: r.status, text };
  } catch (e) {
    return { status: 0, text: '', error: `${String(e)} ${e.cause?.code || ''}`.trim() };
  }
}

console.log(`\n🔎 Domain health check: ${host}\n`);

if (isLocal) {
  info('local host detected — skipping DNS/registry checks');
} else {
  // 1. Registry delegation
  {
    const apex = host.split('.').slice(-2).join('.');
    try {
      const r = await fetch(`https://rdap.verisign.com/com/v1/domain/${apex}`, { signal: AbortSignal.timeout(15000) });
      if (r.ok) {
        const d = await r.json();
        const ns = (d.nameservers || []).map((n) => n.ldhName.toLowerCase());
        info(`apex ${apex} nameservers (registry): ${ns.join(', ')}`);
        const parked = ns.some((n) => /dns-parking|parking/.test(n));
        ok('Registry nameservers', !parked, parked ? 'domain looks PARKED — custom DNS records will not publish' : 'not parking NS');
      } else {
        info(`RDAP unavailable (HTTP ${r.status}) — skipping registry check`);
      }
    } catch (e) {
      info(`RDAP unavailable (${String(e).slice(0, 60)}) — skipping registry check`);
    }
  }

  // 2. DNS records
  const cname = await doh(host, 'CNAME');
  const a = await doh(host, 'A');
  const cnameVal = cname.Answer?.[0]?.data;
  const aVals = (a.Answer || []).map((x) => x.data).join(', ');
  if (cnameVal) info(`CNAME ${host} -> ${cnameVal}`);
  if (aVals) info(`A ${host} -> ${aVals}`);
  if (cnameVal && !/vercel/.test(cnameVal)) info('note: CNAME target does not mention Vercel — verify it points to cname.vercel-dns.com');

  if (cname.Status === -1) {
    console.log(`
   ── Could not query DNS from this network ──
   Run this on your own machine:  node scripts/check-domain.mjs ${host}
   Or check manually: https://dns.google/resolve?name=${host}&type=CNAME
   → Status 0 with an Answer = published. Status 3 = still missing.
`);
    process.exit(1);
  }

  ok('DNS record exists', !!cnameVal || !!aVals, cname.Status === 3 ? 'NXDOMAIN — no record is published in the live zone' : `status ${cname.Status}`);

  if (!cnameVal && !aVals) {
    const apex = host.split('.').slice(-2).join('.');
    console.log(`
   ── DNS NOT PUBLISHED — this is why Google can't fetch anything ──
   Fix order:
   1. Check where ${apex}'s nameservers actually point (registry).
      If they are Hostinger parking NS (pixel/byte.dns-parking.com), the
      domain is PARKED — unpark it in Hostinger hPanel first.
   2. Add the record in hPanel → Domains → ${apex} → DNS / Nameservers
      (NOT Websites → DNS Zone):
        CNAME   ${host.split('.')[0]}   cname.vercel-dns.com   3600
   3. Verify it published (open in a browser):
      https://dns.google/resolve?name=${host}&type=CNAME
      → Status 0 with an Answer = published. Status 3 = still missing.
   4. In Vercel: Settings → Domains → confirm ${host} shows
      "Valid Configuration" → Production.
   5. Re-run: node scripts/check-domain.mjs ${host}
`);
    process.exit(1);
  }
}

// 3. Site serves
const home = await httpGet(`${origin}/`);
ok(`${scheme.toUpperCase()} site serves`, home.status === 200, `HTTP ${home.status}${home.error ? ' ' + home.error.slice(0, 50) : ''}`);
if (home.status !== 200) process.exit(1);

// 4. robots.txt
const robots = await httpGet(`${origin}/robots.txt`);
const sitemapLine = (robots.text.match(/^Sitemap:\s*(\S+)/m) || [])[1];
ok('robots.txt serves', robots.status === 200, `HTTP ${robots.status}`);
ok('robots.txt Sitemap on same host', !!sitemapLine && sitemapLine.includes(compareHost), sitemapLine || 'no Sitemap line');

// 5. sitemap.xml
const sitemap = await httpGet(`${origin}/sitemap.xml`);
const locs = [...sitemap.text.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]);
const badLocs = locs.filter((l) => !l.includes(`://${compareHost}`));
ok('sitemap.xml serves', sitemap.status === 200, `HTTP ${sitemap.status}`);
ok('sitemap URLs on same host', locs.length > 0 && badLocs.length === 0, locs.length ? `${locs.length} url(s)` : 'no urls');
if (badLocs.length) info(`wrong-domain urls: ${badLocs.slice(0, 3).join(', ')}`);

// 6. Canonical
const canonical = (home.text.match(/<link\s+rel="canonical"\s+href="([^"]+)"/i) || [])[1];
ok('canonical is same-host or root-relative', !!canonical && (canonical.startsWith('/') || canonical.includes(compareHost)), canonical || 'no canonical tag');

console.log(`\n${fails === 0 ? '🎉 ALL CHECKS PASSED — submit this sitemap in Search Console:' : '⚠️  FIX THE FAILED CHECKS ABOVE, THEN RE-RUN'}`);
if (fails === 0) console.log(`   ${origin}/sitemap.xml\n`);
process.exit(fails === 0 ? 0 : 1);
