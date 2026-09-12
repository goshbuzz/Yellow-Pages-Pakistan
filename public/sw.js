/* Yellow Pages Pakistan — Service Worker v1 */
const VERSION = 'ypk-v1';
const SHELL = `${VERSION}-shell`;
const PAGES = `${VERSION}-pages`;
const ASSETS = `${VERSION}-assets`;

const PRECACHE = [
  '/',
  '/index.html',
  '/manifest.webmanifest',
  '/favicon.svg',
  '/icons/icon-192.png',
  '/icons/icon-512.png',
  '/icons/icon-maskable-192.png',
  '/icons/icon-maskable-512.png',
  '/icons/apple-touch-icon.png',
  '/og-image.jpg',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(SHELL).then((cache) => cache.addAll(PRECACHE)).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => !k.startsWith(VERSION)).map((k) => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);

  // Never cache cross-origin (maps embeds, google) — let the browser handle them
  if (url.origin !== self.location.origin) return;

  // App shell navigations: network-first, fall back to cached index.html (offline SPA)
  if (req.mode === 'navigate') {
    event.respondWith(
      fetch(req)
        .then((res) => {
          const copy = res.clone();
          caches.open(PAGES).then((c) => c.put('/index.html', copy));
          return res;
        })
        .catch(() => caches.match('/index.html').then((r) => r || caches.match('/')))
    );
    return;
  }

  // Hashed build assets & icons: cache-first (they are immutable)
  if (url.pathname.startsWith('/assets/') || url.pathname.startsWith('/icons/')) {
    event.respondWith(
      caches.match(req).then(
        (hit) =>
          hit ||
          fetch(req).then((res) => {
            const copy = res.clone();
            caches.open(ASSETS).then((c) => c.put(req, copy));
            return res;
          })
      )
    );
    return;
  }

  // Everything else same-origin: stale-while-revalidate
  event.respondWith(
    caches.match(req).then((hit) => {
      const network = fetch(req)
        .then((res) => {
          const copy = res.clone();
          caches.open(ASSETS).then((c) => c.put(req, copy));
          return res;
        })
        .catch(() => hit);
      return hit || network;
    })
  );
});
