const CACHE_NAME = 'murojaahku-tracker-v1.2.0'; // Ganti versi untuk memaksa update!
const urlsToCache = [
  '/', 
  './index.html',
  './logo.png',
  './manifest.json',
  // Pastikan Anda menambahkan semua file CSS dan JS yang diperlukan di sini!
];

// Instalasi Service Worker
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('Opened cache. Caching essential assets for MurojaahKu...');
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

// Fetch Request: LOGIKA PERBAIKAN 404
self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET') return;

  event.respondWith(
    caches.match(event.request)
      .then(response => {
        if (response) {
          return response;
        }

        return fetch(event.request).catch(error => {
          
          if (event.request.mode === 'navigate' || 
              (event.request.destination === 'document')) {
             
              console.log('Navigation request failed. Serving index.html as fallback for MurojaahKu.');
              
              return caches.match('./index.html');
          }
          
          throw error;
        });
      })
  );
});
