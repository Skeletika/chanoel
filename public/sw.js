const CACHE_NAME = 'notre-espace-v2';
const ASSETS_TO_CACHE = [
  '/',
  '/index.html',
  '/icon-512.png',
  '/heart.svg',
  '/vite.svg'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('[Service Worker] Caching essential assets');
      return cache.addAll(ASSETS_TO_CACHE);
    })
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keyList) => {
      return Promise.all(
        keyList.map((key) => {
          if (key !== CACHE_NAME) {
            console.log('[Service Worker] Removing old cache', key);
            return caches.delete(key);
          }
        })
      );
    })
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  // Check if it's a navigation request (for HTML)
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request)
        .catch(() => {
          return caches.match('/index.html');
        })
    );
    return;
  }

  // Allow Supabase API
  if (url.origin.includes('supabase.co')) {
    return;
  }

  // Cache First for Assets
  event.respondWith(
    caches.match(event.request).then((response) => {
      return response || fetch(event.request);
    })
  );
});

// Push Logic (Receiver)
self.addEventListener('push', (event) => {
  if (event.data) {
    const data = event.data.json();
    const options = {
      body: data.body,
      icon: '/icon-512.svg',
      badge: '/heart.svg',
      data: {
        url: data.url || '/'
      }
    };

    event.waitUntil(
      self.registration.showNotification(data.title || 'Notre Espace', options)
    );
  }
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then(windowClients => {
        // Check if there is already a window/tab open with the target URL
        for (let i = 0; i < windowClients.length; i++) {
            const client = windowClients[i];
            // If so, just focus it.
            if (client.url === event.notification.data.url && 'focus' in client) {
                return client.focus();
            }
        }
        // If not, open a new window.
        if (clients.openWindow) {
            return clients.openWindow(event.notification.data.url);
        }
    })
  );
});
