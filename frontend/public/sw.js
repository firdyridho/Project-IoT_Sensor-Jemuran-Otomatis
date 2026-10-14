// Rintik Service Worker
const CACHE_NAME = 'rintik-v2';
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/manifest.webmanifest',
  '/favicon.svg',
  '/favicon.ico',
  '/icons/icon-192.svg',
  '/icons/icon-512.svg'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(STATIC_ASSETS);
    })
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))
      );
    })
  );
  self.clients.claim();
});

self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  // Never cache API or broker requests
  if (
    url.hostname.includes('bmkg.go.id') ||
    url.hostname.includes('sslip.io') ||
    url.protocol.startsWith('ws')
  ) {
    return;
  }

  // Network-first for navigation (index.html), cache-first for hashed assets
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request).catch(() => caches.match('/index.html') || caches.match('/'))
    );
    return;
  }

  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      if (cachedResponse) {
        return cachedResponse;
      }
      return fetch(event.request).then((networkResponse) => {
        if (!networkResponse || networkResponse.status !== 200 || networkResponse.type !== 'basic') {
          return networkResponse;
        }
        const responseToCache = networkResponse.clone();
        caches.open(CACHE_NAME).then((cache) => {
          cache.put(event.request, responseToCache);
        });
        return networkResponse;
      });
    })
  );
});

// Web Push Notification Event Listener (REQ-FE-09 / REQ-BE-09)
self.addEventListener('push', (event) => {
  let data = {};
  if (event.data) {
    try {
      data = event.data.json();
    } catch {
      data = { body: event.data.text() };
    }
  }

  const title = data.title || '🌧️ Peringatan Hujan Rintik!';
  const options = {
    body: data.body || 'Sensor mendeteksi hujan! Kanopi jemuran diamankan secara otomatis.',
    icon: '/favicon.svg?v=2',
    badge: '/favicon.svg?v=2',
    vibrate: [200, 100, 200],
    data: {
      url: data.url || '/dashboard',
    },
    actions: [
      { action: 'open', title: 'Buka Aplikasi' },
      { action: 'dismiss', title: 'Matikan Alarm' }
    ]
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

// Handle Notification Click Event (REQ-FE-09 & REQ-FE-12)
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const action = event.action;
  const targetUrl = (event.notification.data && event.notification.data.url) || '/dashboard';

  if (action === 'dismiss') {
    // Notify all open client windows to stop looping alarm immediately
    event.waitUntil(
      clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
        clientList.forEach((client) => {
          client.postMessage({ type: 'DISMISS_ALARM', timestamp: Date.now() });
        });
      })
    );
    return;
  }

  // Otherwise 'open' or clicked body
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      // Focus existing tab if open
      for (const client of clientList) {
        if (client.url.includes(self.location.origin) && 'focus' in client) {
          return client.focus();
        }
      }
      // Otherwise open a new window
      if (clients.openWindow) {
        return clients.openWindow(targetUrl);
      }
    })
  );
});

