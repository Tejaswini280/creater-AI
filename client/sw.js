const CACHE_NAME = 'creatorai-offline-v1';
const OFFLINE_URLS = [
  '/',
  '/index.html',
  '/src/main.tsx',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(OFFLINE_URLS))
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET') return;
  const url = new URL(request.url);
  const isDev = self.location.hostname === 'localhost' || self.location.hostname === '127.0.0.1';
  // Never cache API responses during development; network-first otherwise
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(
      (async () => {
        try { return await fetch(request); } catch (e) { return caches.match(request); }
      })()
    );
    return;
  }
  event.respondWith(
    caches.match(request).then((cached) => (
      cached || fetch(request).then((resp) => {
        // Cache only successful GET responses in non-dev environments
        if (!isDev && resp.ok) {
          const clone = resp.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(request, clone)).catch(() => {});
        }
        return resp;
      }).catch(() => cached)
    ))
  );
});


