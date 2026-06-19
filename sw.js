const CACHE = 'gf-v2';
const BASE = '/Gesture-Factory';
const ASSETS = [
  BASE + '/',
  BASE + '/index.html',
  BASE + '/icon-192.png',
  BASE + '/icon-512.png',
  BASE + '/Thousandth_Rotation.mp3'
];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(ASSETS)));
  self.skipWaiting();
});

self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(keys =>
    Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
  ));
  self.clients.claim();
});

self.addEventListener('fetch', e => {
  e.respondWith(
    caches.match(e.request).then(r => r || fetch(e.request))
  );
});
