const CACHE_NAME = 'geophoto-v1';
const urlsToCache = [
  './',
  './GeoPhoto_Editor.html',
  './style.css', // Remplacez par le vrai nom de votre fichier CSS
  './script.js', // Remplacez par le vrai nom de votre fichier JS
  './icone_geophoto.png'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(urlsToCache))
  );
});

self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request)
      .then(response => response || fetch(event.request))
  );
});