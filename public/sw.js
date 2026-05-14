// Service Worker for "בגרות בכיס" PWA
// Strategy:
//   - Network-first for everything (so users get fresh content when online)
//   - Cache fallback when network fails (so app still loads offline)
//   - API calls (/api/*) bypass the cache entirely — quiz questions are
//     dynamic and re-using stale ones would be worse than failing.

const CACHE_VERSION = 'v2';
const CACHE_NAME = `bagrut-app-${CACHE_VERSION}`;

self.addEventListener('install', (event) => {
  // Pre-cache the shell so first offline visit works
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(['/', '/quiz']))
  );
  // Activate this SW immediately, replacing any previous version
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  // Clean up old caches from previous versions
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((key) => key.startsWith('bagrut-app-') && key !== CACHE_NAME)
          .map((key) => caches.delete(key))
      )
    )
  );
  // Take control of open pages
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  const { request } = event;

  // Only handle GETs — POST/etc. are passed through untouched
  if (request.method !== 'GET') return;

  const url = new URL(request.url);

  // Skip API routes — always go to network, never cache
  if (url.pathname.startsWith('/api/')) return;

  // Skip cross-origin requests (Google fonts, analytics, etc.)
  if (url.origin !== self.location.origin) return;

  event.respondWith(
    fetch(request)
      .then((response) => {
        // Only cache successful basic responses
        if (response.ok && response.type === 'basic') {
          const clone = response.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(request, clone).catch(() => {
              // Some responses (e.g., chunked) can't be cached — ignore silently
            });
          });
        }
        return response;
      })
      .catch(() =>
        // Offline — try cache
        caches.match(request).then((cached) => cached || caches.match('/'))
      )
  );
});
