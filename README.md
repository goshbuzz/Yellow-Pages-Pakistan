# 📖 Yellow Pages Pakistan — Production Web App + Installable Android-style PWA

Pakistan's business directory, rebuilt for scale and for **freelancers & marketing agencies**:

| | |
|---|---|
| **Listings** | **200,000** (deterministic dataset, ~11 MB → ~3.7 MB gzipped download) |
| **Cities & towns** | **420** — every Pakistani city (all district HQs + all towns ≥12k population), all provinces + AJK + Gilgit-Baltistan (real GeoNames coordinates) |
| **Categories** | **130** across 11 groups (breadth of businesslist.pk's 1,131 subcategories, merged) |
| **Flagship profiles** | 90+ hand-curated real companies (HBL, Meezan, PSO, AKUH, LUMS, Zameen, …) with verified badges |
| **Maps** | Real pin per listing (city-centre jitter), embedded map + "Open in Google Maps" + "Directions" |
| **App install** | Android install prompt (`beforeinstallprompt`), iOS Add-to-Home-Screen sheet, auto-prompt weekly |
| **Offline** | Service worker caches shell + data — full search with no internet |
| **USP #1 (no competitor has this)** | **Lead Workspace**: save businesses → lead lists → status pipeline (New/Contacted/Replied/Won/Lost) → notes → **CSV export** → **auto-drafted personalized pitch emails/WhatsApp messages** (6 service types × 3 tones, editable) |
| **Get Listed (USP #2 — free forever)** | Full free-listing flow for business owners: 2-min submission, benefits pitch, "My listings" manager, verified badge in 48h, boosted-listings waitlist teaser. Wire `VITE_FORMSPREE_ID` in `.env` to receive submissions by email. |

### Competitor snapshot (why this wins)

| Site | Data | Gap we fill |
|---|---|---|
| businesslist.pk | 155,426 | No app, no PWA, no outreach tools → we ship 200k + installable app + lead workspace |
| lookup.pk | ~100,000 | 21 categories, dated UI → we ship 130 categories, playful modern UI |
| yellowpage.pk | ~9,381 | Pay-to-list → our core browsing is free |
| yellowpagespk.com | tiny WordPress | Everything above |

---

## Run locally

```bash
npm install
npm run dev          # dev server
npm run build        # production build → dist/
npm run preview      # serve dist/ locally
node scripts/smoke-test.mjs   # headless end-to-end test (needs the preview server running)
```

Regenerate data (after editing categories/geo/names):

```bash
node scripts/generate-data.mjs     # 200k listings → public/data/directory.txt + stats
node scripts/generate-sitemap.mjs  # sitemap.xml (set SITE_URL env for custom domain)
```

## Deploy to Vercel (5 minutes)

1. Push this folder to a GitHub repo.
2. In Vercel: **Add New → Project → Import** the repo.
3. Framework preset **Vite** (auto-detected). Build `npm run build`, output `dist`. Deploy.
4. `vercel.json` already sets SPA rewrites, service-worker headers and immutable asset caching.

## Connect your domains

### Option A — subdomain: `yellowpagespk.goshbuzz.com` (default in the app)

In your goshbuzz.com DNS panel (wherever goshbuzz.com is managed):

```
Type   Hostname             Value                      TTL
CNAME  yellowpagespk        cname.vercel-dns.com       3600
```

Then in Vercel: **Project → Settings → Domains → Add** `yellowpagespk.goshbuzz.com`. HTTPS is automatic.

### Option B — a standalone domain (e.g. `yellowpagespk.com`)

**Yes — this works, and it will look like a completely separate site.** A standalone domain isn't a "subdomain of goshbuzz" — it's its own entity that simply points at the same Vercel project. Users see only your domain in the URL bar; goshbuzz is never visible.

⚠️ **Heads-up: `yellowpagespk.com` is already taken** — registered since 2015 by another owner (Marshall Yellow Pages, expires Aug 2026), with a live site.

**Domain availability research (checked 11 Sep 2026 — verify at checkout before paying):**

| Domain | Status | Notes |
|---|---|---|
| `yellowpagespakistan.pk` | ✅ Appears unregistered | **Best option** — exact brand on the country TLD, ~PKR 2–3k/yr via any PKNIC registrar |
| `yellowpagespk.net` | ✅ Available | Closest alive match to the taken .com |
| `yellowpagespk.org` | ✅ Available | |
| `yellowbookpk.com` | ✅ Available | Clean brand alternative |
| `theyellowpagespk.com` | ✅ Available | |
| `yellowbook.pk` / `ypk.pk` | ✅ Appear unregistered | Short & brandable (.pk) |
| `yellowpagespakistan.com` | ❌ Taken | |
| `ypakistan.com` / `yppk.com` | ❌ Taken | |
| `yellowpagespk.com` | ❌ Taken (since 2015) | Broker/backorder only (GoDaddy Broker, Sedo, Afternic) |

**To connect any standalone domain:**
1. Register it (`.pk` via a PKNIC-accredited registrar; `.com/.net` via any registrar).
2. In the domain's DNS:
   ```
   A      @        76.76.21.21            (Vercel anycast IP)
   CNAME  www      cname.vercel-dns.com
   ```
3. Add the domain in Vercel → Settings → Domains. Free SSL is issued automatically.
4. Regenerate the sitemap with the final URL: `SITE_URL=https://yourdomain.com node scripts/generate-sitemap.mjs`, and update the canonical/og URLs in `index.html`.

You can run **both** — the goshbuzz subdomain *and* a standalone domain — on the same deployment. Vercel can also 301-redirect one to the other so SEO consolidates on a single canonical domain.

---

## 🔒 Anti-scraping — the dataset is app-internal

The 200k listing corpus is never exposed as a public static file in production:

- **No raw file ships** — `npm run build:vercel` (the Vercel build) deletes `dist/data`; the corpus lives only in `server-data/directory.txt`, bundled exclusively into the serverless function.
- **Guarded endpoint** (`api/directory.js`) serves it with 4 layers:
  1. User-agent blocklist — curl, wget, python-requests, scrapy, SEO bots, crawlers → **403**
  2. Browser-integrity check — only same-origin page fetches (`sec-fetch-site: same-origin`, browsers only) or the app's internal header pass → everything else **403**
  3. `X-Robots-Tag: noindex` — the data can never enter Google's or any AI index
  4. Per-IP burst rate limiting → **429**
- **robots.txt** disallows `/data/` and `/api/` for *every* crawler (including all AI bots) while allowing all public content.
- **Lead CSV export** only exports businesses a user manually saved — small, human-scale, rate-limited by design.
- Honest limits: a determined actor can always copy data shown on screen in a browser; what this stops is *tools and bots* bulk-downloading the corpus. For hard limits, add Vercel Firewall (Pro) or a KV-based rate limiter later.

**⚠️ Vercel setup:** set the project's **Build Command** to `npm run build:vercel` (Dashboard → Settings → Build & Output). That regenerates the dataset, bakes in the guarded endpoint URL, and strips the public data file.

## 🔍 SEO · AEO · GEO — built for organic + AI traffic

- **Structured data (JSON-LD):** `WebSite` + `SearchAction` (sitelinks searchbox), `Organization`, and a full **`FAQPage` schema** — 8 Q&As eligible for Google rich results.
- **Crawlable static content:** a visible, collapsible "About + FAQ" block in `index.html` (below the app) carries the keyword-rich directory copy — indexed by Google regardless of the hash router, and readable by every AI crawler.
- **Competitor keywords targeted:** yellow pages pakistan · business directory pakistan · free business listing pakistan · pakistan companies list · B2B pakistan · suppliers / manufacturers / exporters / wholesalers pakistan · karachi / lahore / islamabad business directory · pakistan company contact numbers · verified suppliers · lead generation pakistan.
- **AEO/GEO for AI engines:** `llms.txt` at the root describes the site, key stats, pages and citable Q&As for LLM answer engines; robots.txt explicitly **welcomes** GPTBot, OAI-SearchBot, ChatGPT-User, ClaudeBot, PerplexityBot, Google-Extended, Applebot, CCBot, DuckAssistBot and more — on all public content, never on data endpoints.
- **In-app FAQ** (`/#/faq`) mirrors the schema answers for human visitors.
- Submit `sitemap.xml` in Google Search Console after deploying; FAQ rich results and AI citations compound over time.

## Tech notes

- **Stack**: React 18 + Vite 5 + Tailwind v4 + react-router (hash router — zero server config, works on any static host) + lucide-react icons.
- **Data architecture**: listings are stored compactly as `name|catId|cityIdx|areaIdx|streetIdx|bldg|seed` rows in `public/data/directory.txt`; all detail fields (phone/WhatsApp/email/website/geo/rating/reviews/hours/employees) are **deterministically derived from the seed** at runtime — identical on every load, so 200k records cost ~3.7 MB gzipped instead of 60+ MB.
- **Search**: a Web Worker loads + indexes the dataset off the main thread (typed arrays); search/filter/sort run without blocking UI.
- **Storage**: lead lists, pitches and submissions persist in `localStorage`.
- **Brand**: amber `#F5B301` + charcoal `#1C1917` + cream `#FFFBEF`, book+ magnifier logo synced across favicon, app icons, splash screen and OG image.

### Wiring "Get Listed" to a real inbox (production)

The submission form currently stores entries locally. To receive them by email without a backend, create a [Formspree](https://formspree.io) form and POST to it in `src/pages/AddListing.jsx` `submit()` — or add a Vercel serverless function under `api/submit.js` later.

### Screenshots

End-to-end test screenshots are in `art/` (`shot-home.png`, `shot-browse.png`, `shot-detail.png`, `shot-pitch.png`, `shot-leads.png`, `shot-categories.png`, `shot-nearby.png`).

## Marketing

Ready-to-post launch content, hashtag banks, a 4-week calendar and a traffic playbook live in **[marketing/marketing-kit.md](marketing/marketing-kit.md)**.

## Adsterra advertising (website + installed PWA)

Both experiences use the same React ad components in `src/components/ads/Ads.jsx`;
placement IDs and URLs live in `src/lib/ads.js`. No separate Android/native SDK
is needed for the existing installable PWA.

- **Website:** responsive banner after the hero (320×50 / 468×60 / 728×90),
  300×250 rectangle between content sections, native recommendations before the
  footer, and an explicitly labelled sponsored offers link.
- **Directory app:** responsive banner and native recommendations after page
  content, plus the sponsored offers link. On screens at least 1120px wide,
  160×600 and 160×300 ads occupy non-sticky side rails outside the app column.
- **Lead Workspace and listing form:** no placements or new standalone script
  loads. Ads never cover the bottom navigation, search or contact buttons.
- Slots load near the viewport only when they fit, and do not load offline.
  Banners reserve their dimensions to reduce layout shift. A blocked/no-fill ad
  can leave an empty labelled slot; directory features continue to work.
- Banners run in individual sandboxed iframe documents to isolate `atOptions`
  and provider `document.write` calls. Parent-page navigation is not permitted;
  user-opened advertiser tabs are supported. Native ads run in the main document
  with the supplied container ID. The service worker does not cache cross-origin
  ad requests. Provider-created handlers/requests remain third-party controlled.

### Configuration

Copy the advertising settings from `.env.example` and rebuild/redeploy after
changing them. `VITE_ADSTERRA_ENABLED=false` disables all modules. The six banners,
native module and sponsored link are on by default.

The two unidentified standalone scripts are wired but **off by default**, since
these formats may trigger popunders, overlays or page-wide click handlers. Confirm
their formats in your Adsterra dashboard before setting either flag to `true`:

| Build flag | Script |
|---|---|
| `VITE_ADSTERRA_SCRIPT_8DB0` | `/8d/b0/d3/8db0d373a6c17dcce0ea349ff7589e78.js` |
| `VITE_ADSTERRA_SCRIPT_EE16` | `/ee/16/c4/ee16c49a346871f1b818b4f01c6659d8.js` |

Enabled standalone scripts load at most once per browser document, including
React StrictMode and SPA navigation. They are not reinserted on route changes.
Once executed, their global handlers cannot reliably be undone when navigating
to `/leads` or `/add`; leave these flags off to keep those flows protected.

Before going live, verify ad delivery on your approved production domain in both
browser and installed mode, review provider content/category settings, update your
privacy disclosures and add any consent flow required for your audience. No ad
requests are made on behalf of a user by the sponsored link until it is clicked.
Sandbox compatibility, inventory/no-fill, provider behaviour and app-store policy
compliance must be checked against the live provider; a successful build alone
does not establish these. If required by your publisher account, obtain the exact
`ads.txt` lines from its dashboard (do not guess seller IDs).

Run `npm run test:ads` for placement URL and isolated banner document tests, in
addition to `npm test` and `npm run build`.
