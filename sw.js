// sw.js
const CACHE_NAME = 'diary-pwa-v2'; // Обновлена версия для сброса кэша
const urlsToCache = [
    '/',
    '/index.html',
    '/style.css',
    '/app.js',
    '/manifest.json',
    '/icon-192.png',
    '/icon-512.png'
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

self.addEventListener('sync', event => {
    if (event.tag === 'sync-data') {
        // Здесь можно добавить логику синхронизации, если нужны оффлайн изменения
    }
});