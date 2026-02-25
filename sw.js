const CACHE_NAME = 'geophoto-v1';
const urlsToCache = [
  './',
  './index.html',
  './style.css',
  './script.js',
  './icone_geophoto.png'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('Cache ouvert');
        return cache.addAll(urlsToCache);
      })
  );
});

self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request)
      .then(response => {
        // Si le fichier est dans le cache, on le retourne
        if (response) {
          return response;
        }
        // Sinon, on le télécharge depuis internet
        return fetch(event.request);
      })
  );
});