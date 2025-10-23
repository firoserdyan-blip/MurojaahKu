const CACHE_NAME = 'murojaahku-cache-v1';
const urlsToCache = [
  './',
  'index.html',
  'logo.png',
  'manifest.json'
];

// Instalasi Service Worker
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('Opened cache');
        return cache.addAll(urlsToCache);
      })
  );
});

// Aktivasi Service Worker
self.addEventListener('activate', event => {
  console.log('Service Worker activated.');
});

// Fetching (opsional: agar bisa berjalan offline)
self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request)
      .then(response => {
        // Cache hit - kembalikan response
        if (response) {
          return response;
        }
        // Jika tidak ada di cache, lakukan fetch normal
        return fetch(event.request);
      })
  );
});
