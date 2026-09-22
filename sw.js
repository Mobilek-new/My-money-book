const CACHE_NAME = 'Money Book v2';
const FILES_TO_CACHE = [
  './index.html',
  './manifest.json'
];

self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(FILES_TO_CACHE))
  );
  self.skipWaiting();
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (e) => {
  // สำหรับ index.html และ manifest.json: ลองโหลดจากเน็ตก่อนเสมอ (network-first)
  // เพื่อให้เห็นเวอร์ชันล่าสุดทันทีที่อัปเดตขึ้น GitHub ถ้าออฟไลน์ค่อย fallback ไปใช้ cache
  const isCoreFile = FILES_TO_CACHE.some(f => e.request.url.endsWith(f.replace('./', '')));

  if (isCoreFile) {
    e.respondWith(
      fetch(e.request)
        .then(res => {
          const resClone = res.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(e.request, resClone));
          return res;
        })
        .catch(() => caches.match(e.request))
    );
    return;
  }

  // ไฟล์อื่น ๆ (เช่น icon, font ที่แคชไว้): cache-first ตามเดิม เพื่อความเร็ว/ใช้ออฟไลน์ได้
  e.respondWith(
    caches.match(e.request).then(res => res || fetch(e.request))
  );
});
