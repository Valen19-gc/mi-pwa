const CACHE_NAME = 'limpieza-app-cache-v1';
const DATA_CACHE_NAME = 'limpieza-app-data-cache-v1';

// Archivos que siempre queremos cachear
const FILES_TO_CACHE = [
  '/',
  '/index.html',
  '/favicon.ico',
  '/manifest.json',
  '/logo192.png',
  '/logo512.png',
  // CSS y JS generados por CRA
  '/static/js/bundle.js',
  '/static/js/main.chunk.js',
  '/static/js/0.chunk.js',
  '/static/css/main.chunk.css',
];

// Instalación del service worker
self.addEventListener('install', (evt) => {
  evt.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('[SW] Pre-cacheando archivos');
      return cache.addAll(FILES_TO_CACHE);
    })
  );
  self.skipWaiting();
});

// Activación
self.addEventListener('activate', (evt) => {
  evt.waitUntil(
    caches.keys().then((keyList) =>
      Promise.all(
        keyList.map((key) => {
          if (key !== CACHE_NAME && key !== DATA_CACHE_NAME) {
            console.log('[SW] Eliminando cache viejo', key);
            return caches.delete(key);
          }
        })
      )
    )
  );
  self.clients.claim();
});

// Fetch: intercepta requests
self.addEventListener('fetch', (evt) => {
  // Para las llamadas a la API (trabajos/extras)
  if (evt.request.url.includes('/api/trabajos') || evt.request.url.includes('/api/extras')) {
    evt.respondWith(
      caches.open(DATA_CACHE_NAME).then((cache) =>
        fetch(evt.request)
          .then((response) => {
            // Guardamos la respuesta en cache
            if (response.status === 200) {
              cache.put(evt.request.url, response.clone());
            }
            return response;
          })
          .catch(() => {
            // Si falla, usamos el cache
            return cache.match(evt.request);
          })
      )
    );
    return;
  }

  // Para archivos estáticos
  evt.respondWith(
    caches.match(evt.request).then((response) => {
      return response || fetch(evt.request);
    })
  );
});
