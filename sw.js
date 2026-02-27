const CACHE_NAME = 'geophoto-v8';
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

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== CACHE_NAME) {
            console.log('Ancien cache supprimé:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => {
      // Force le nouveau Service Worker à prendre le contrôle immédiatement
      return self.clients.claim();
    })
  );
});

// Facultatif : forcer le SW à s'installer immédiatement sans attendre que l'ancien libère la page
self.addEventListener('install', event => {
  self.skipWaiting();
  // ... le reste de votre code d'installation (addAll) existant va au-dessus de ça
});
