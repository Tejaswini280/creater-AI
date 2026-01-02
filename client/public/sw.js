const CACHE_NAME = 'creatorai-offline-v2';
const OFFLINE_URLS = ['/', '/index.html'];
const ASSET_CACHE = 'creatorai-assets-v1';
const API_CACHE = 'creatorai-api-v1';
const ASSET_EXTENSIONS = [/\.js$/, /\.css$/, /\.(png|jpg|jpeg|gif|svg|webp)$/i, /\.(woff2?|ttf|otf)$/i];

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

  // Network-first for API, cache-first for static assets, stale-while-revalidate for others
  // In development, avoid caching API responses at all to prevent stale data
  const isDev = self.location.hostname === 'localhost' || self.location.hostname === '127.0.0.1';
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(
      (async () => {
        try {
          const resp = await fetch(request);
          // Only cache successful GET responses in non-dev environments
          if (!isDev && resp.ok && request.method === 'GET') {
            try {
              const c = await caches.open(API_CACHE);
              c.put(request, resp.clone());
            } catch {}
          }
          return resp;
        } catch (e) {
          return caches.match(request);
        }
      })()
    );
    return;
  }

  if (ASSET_EXTENSIONS.some((re) => re.test(url.pathname))) {
    event.respondWith(
      caches.match(request).then((cached) => {
        if (cached) return cached;
        return fetch(request).then((resp) => {
          const clone = resp.clone();
          caches.open(ASSET_CACHE).then((c) => c.put(request, clone)).catch(() => {});
          return resp;
        });
      })
    );
    return;
  }

  event.respondWith(
    caches.match(request).then((cached) =>
      fetch(request)
        .then((resp) => {
          const clone = resp.clone();
          caches.open(CACHE_NAME).then((c) => c.put(request, clone)).catch(() => {});
          return resp;
        })
        .catch(() => cached)
    )
  );
});


