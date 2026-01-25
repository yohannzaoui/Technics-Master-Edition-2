const CACHE_NAME = 'Technics Master Edition II';
const ASSETS = [
  './',
  './index.html',
  './style.css',
  './script.js',
  '.img/favicon.png',
  '.img/HR_logo.png',
  '.img/mash_logo_t.png',
  '.img/favicon.png',
  '.img/Technics_cover.png',
  '.img/Technics-Logo-org.png',
];

// Installation : Mise en cache des fichiers
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS);
    })
  );
});

// Activation : Nettoyage des anciens caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))
      );
    })
  );
});

// Stratégie : Cache First (priorité au cache pour la vitesse)
self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request).then((response) => {
      return response || fetch(event.request);
    })
  );
});

