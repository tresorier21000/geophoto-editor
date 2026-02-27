const CACHE_NAME = 'geophoto-v7';
const urlsToCache = [
  './',
  './index.html',
  './style.css',
  './script.js',
  './manifest.json',
  './icone_geophoto.png',
  // Librairies externes critiques (EXIF + Carte)
  'https://unpkg.com/piexifjs',
  'https://unpkg.com/leaflet/dist/leaflet.js',
  'https://unpkg.com/leaflet/dist/leaflet.css',
  // Police Inter (Google Fonts)
  'https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap'
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



