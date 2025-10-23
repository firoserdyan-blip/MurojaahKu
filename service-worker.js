const CACHE_NAME = 'murojaahku-v1.0.1';
const urlsToCache = [
  '/',
  '/index.html',
  '/logo.png',
  '/manifest.json',
  // Tambahkan file CSS/JS/Aset lain yang Anda miliki
];

// Instalasi Service Worker: Menyimpan aset statis ke cache
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('Opened cache');
        return cache.addAll(urlsToCache);
      })
      .catch(err => {
        console.error('Failed to cache assets:', err);
      })
  );
});

// Aktivasi Service Worker: Membersihkan cache lama
self.addEventListener('activate', event => {
  const cacheWhitelist = [CACHE_NAME];
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheWhitelist.indexOf(cacheName) === -1) {
            console.log('Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});

// Fetch Request: Melayani konten dari cache, fallback ke jaringan
self.addEventListener('fetch', event => {
  // Hanya melayani file yang ada di cache atau index.html
  event.respondWith(
    caches.match(event.request)
      .then(response => {
        // Jika ada di cache, kirimkan dari cache
        if (response) {
          return response;
        }
        // Jika tidak, ambil dari jaringan
        return fetch(event.request).catch(error => {
            // Ini akan menangani ketika offline dan file tidak ada di cache
            // Anda bisa mengembalikan halaman offline di sini jika diperlukan
            console.log('Fetch failed, request:', event.request.url, error);
        });
      })
  );
});
