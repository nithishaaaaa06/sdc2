const CACHE_NAME = 'news-reader-cache-v2';
const OFFLINE_URLS = [
  '/',
  '/index.html',
  '/manifest.json'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(OFFLINE_URLS))
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => Promise.all(
      keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k))
    ))
  );
  self.clients.claim();
});

// Cache-first for same-origin navigations and static assets; network-first for API
self.addEventListener('fetch', (event) => {
  const req = event.request;
  const url = new URL(req.url);

  if (req.method !== 'GET') return;

  if (url.origin === location.origin) {
    // HTML navigation -> offline fallback
    if (req.mode === 'navigate') {
      event.respondWith(
        fetch(req).catch(() => caches.match('/index.html'))
      );
      return;
    }
    // static assets cache-first
    event.respondWith(
      caches.match(req).then((cached) => cached || fetch(req).then((res) => {
        const resClone = res.clone();
        caches.open(CACHE_NAME).then((cache) => cache.put(req, resClone));
        return res;
      }))
    );
    return;
  }

  // Pass-through for API requests: no caching, always go to network (same-origin only)
  if (url.origin === location.origin && url.pathname.startsWith('/api/')) {
    event.respondWith(fetch(req));
    return;
  }
});

// Push notification handler
self.addEventListener('push', (event) => {
  let data = {};
  try { data = event.data ? event.data.json() : {}; } catch (e) {}
  const title = data.title || 'Breaking News';
  const body = data.body || 'Tap to read more';
  const url = data.url || '/';
  const options = {
    body,
    icon: '/icons/icon-192.png',
    badge: '/icons/icon-192.png',
    data: { url }
  };
  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const url = event.notification.data && event.notification.data.url ? event.notification.data.url : '/';
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then(windowClients => {
      for (const client of windowClients) {
        if (client.url.includes(url) && 'focus' in client) return client.focus();
      }
      if (clients.openWindow) return clients.openWindow(url);
    })
  );
});


