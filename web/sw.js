/* Seek First — offline shell. Bible text is cached the first time you read it. */
const VERSION = 'sf-v2';
const SHELL = ['./', './index.html', './assets/icon.png', './assets/wordmark-light.png', './assets/manifest.webmanifest', './bible/books.json'];

self.addEventListener('install', e => {
  e.waitUntil((async () => {
    const c = await caches.open(VERSION);
    await Promise.allSettled(SHELL.map(u => c.add(u)));
    self.skipWaiting();
  })());
});

self.addEventListener('activate', e => {
  e.waitUntil((async () => {
    for (const k of await caches.keys()) if (k !== VERSION) await caches.delete(k);
    await self.clients.claim();
  })());
});

self.addEventListener('fetch', e => {
  const { request } = e;
  if (request.method !== 'GET') return;
  const url = new URL(request.url);
  if (url.origin !== location.origin) return;              // fonts, CDN: straight to the network

  // Bible text and icons never change: serve from cache, fill it on first use.
  if (url.pathname.includes('/bible/') || url.pathname.includes('/assets/')) {
    e.respondWith((async () => {
      const hit = await caches.match(request);
      if (hit) return hit;
      const res = await fetch(request);
      if (res.ok) (await caches.open(VERSION)).put(request, res.clone());
      return res;
    })());
    return;
  }

  // The page itself: take a fresh copy when online, fall back to the cached one.
  e.respondWith((async () => {
    try {
      const res = await fetch(request);
      if (res.ok) (await caches.open(VERSION)).put(request, res.clone());
      return res;
    } catch {
      return (await caches.match(request)) || (await caches.match('./index.html')) || Response.error();
    }
  })());
});
