/* リスニング ラボ service worker
   アプリや sets.js を更新したら VERSION の数字を1つ上げてください（例：v1 → v2）。 */
const VERSION = 'v2';
const CORE = 'listening-lab-core-' + VERSION;
const FONTS = 'listening-lab-fonts';
const CORE_FILES = [
  './', './index.html', './sets.js', './manifest.webmanifest',
  './icons/icon-192.png', './icons/icon-512.png', './icons/maskable-512.png', './icons/apple-touch-icon.png', './icons/favicon-32.png',
  './img/mic.png', './img/read.png', './img/cheer.png', './img/guide.png', './img/welcome.png', './img/think.png', './img/tablet.png'
];
self.addEventListener('install', e => { e.waitUntil(caches.open(CORE).then(c => c.addAll(CORE_FILES)).then(() => self.skipWaiting())); });
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k => k.startsWith('listening-lab-core-') && k !== CORE).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', e => {
  const req = e.request; if (req.method !== 'GET') return;
  const url = new URL(req.url);
  // ページ本体と問題データ：通信できれば最新、できなければ保存済み
  if (req.mode === 'navigate' || url.pathname.endsWith('/sets.js')) {
    e.respondWith(fetch(req).then(res => { const copy = res.clone(); caches.open(CORE).then(c => c.put(req.mode === 'navigate' ? './index.html' : req, copy)); return res; })
      .catch(() => caches.match(req.mode === 'navigate' ? './index.html' : req)));
    return;
  }
  if (url.hostname === 'fonts.googleapis.com' || url.hostname === 'fonts.gstatic.com') {
    e.respondWith(caches.open(FONTS).then(async c => { const hit = await c.match(req); const net = fetch(req).then(res => { c.put(req, res.clone()); return res; }).catch(() => hit); return hit || net; }));
    return;
  }
  if (url.origin === self.location.origin) {
    e.respondWith(caches.match(req).then(hit => hit || fetch(req).then(res => { if (res.ok) { const copy = res.clone(); caches.open(CORE).then(c => c.put(req, copy)); } return res; })));
  }
});
