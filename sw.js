const CACHE = 'gf-v3';
const BASE = '/Gesture-Factory';
const STATIC_ASSETS = [
  BASE + '/icon-192.png',
  BASE + '/icon-512.png',
  BASE + '/Thousandth_Rotation.mp3',
  BASE + '/The_Unspoken_Guest.mp3',
  BASE + '/dyson-bg.jpg',
  BASE + '/genesis-bg.jpg',
  BASE + '/opening.png',
];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(STATIC_ASSETS)));
  self.skipWaiting();
});

self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(keys =>
    Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
  ));
  self.clients.claim();
});

self.addEventListener('fetch', e => {
  const url = new URL(e.request.url);

  // HTML（ナビゲーション）はネットワークファースト → 常に最新を取得
  if (e.request.mode === 'navigate') {
    e.respondWith(
      fetch(e.request)
        .then(res => {
          const clone = res.clone();
          caches.open(CACHE).then(c => c.put(e.request, clone));
          return res;
        })
        .catch(() => caches.match(e.request))
    );
    return;
  }

  // 静的アセットはキャッシュファースト（バックグラウンドで更新）
  e.respondWith(
    caches.open(CACHE).then(async cache => {
      const cached = await cache.match(e.request);
      const fetchPromise = fetch(e.request).then(res => {
        cache.put(e.request, res.clone());
        return res;
      });
      return cached || fetchPromise;
    })
  );
});
