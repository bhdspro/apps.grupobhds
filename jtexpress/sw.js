const CACHE_NAME = 'bipador-cache-v1';
const urlsToCache = [
  '/jtexpress/',
  '/jtexpress/index.html',
  '/jtexpress/manifest.json',
  'https://app.grupobhds.com/jtexpress/app.png',
  'https://app.grupobhds.com/jtexpress/logo.png'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        return cache.addAll(urlsToCache);
      })
  );
});

self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request)
      .then(response => {
        if (response) {
          return response;
        }
        return fetch(event.request);
      })
  );
});