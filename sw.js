const CACHE_NAME = 'myelin-studio-v2';

// Install: cache core assets
self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        // Cache the page itself using the service worker's scope
        const scope = self.registration.scope;
        return cache.addAll([
          scope,
          scope + 'index.html',
          scope + 'manifest.json',
          scope + 'icons/icon-192x192.png',
          scope + 'icons/icon-512x512.png',
          scope + 'icons/apple-touch-icon.png'
        ]);
      })
      .then(() => self.skipWaiting())
  );
});

// Activate: clean old caches
self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

// Fetch: try network first, fall back to cache (ensures fresh content)
self.addEventListener('fetch', e => {
  e.respondWith(
    fetch(e.request)
      .then(response => {
        if (response.status === 200) {
          const clone = response.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(e.request, clone));
        }
        return response;
      })
      .catch(() => caches.match(e.request).then(cached => cached || caches.match(self.registration.scope + 'index.html')))
  );
});