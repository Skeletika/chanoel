// Service Worker Minimal & Propre
const CACHE_NAME = 'notre-espace-v1';
const ASSETS_TO_CACHE = [
  '/',
  '/index.html',
  '/vite.svg',
  // Ajoutez ici d'autres ressources statiques essentielles si nécessaire
];

// 1. Installation : On met en cache les fichiers essentiels
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('[Service Worker] Caching essential assets');
      return cache.addAll(ASSETS_TO_CACHE);
    })
  );
  self.skipWaiting(); // Force le nouveau SW à s'activer immédiatement
});

// 2. Activation : On nettoie les anciens caches
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
  self.clients.claim(); // Prend le contrôle des pages immédiatement
});

// 3. Interception des requêtes (Stratégie hybride)
// - Pour la navigation et les assets statiques : Cache First, fall back to Network
// - Pour les API (commençant par /rest/v1/ ou autre) : Network Only (toujours frais)
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  // Ignorer les requêtes API Supabase ou autres requêtes dynamiques
  // Adaptez ce filtre selon votre URL Supabase
  if (url.origin.includes('supabase.co')) {
    return; // Laisser le navigateur gérer normalement (Network only)
  }

  // Pour le reste (HTML, JS, CSS, Images locales)
  event.respondWith(
    caches.match(event.request).then((response) => {
      // Si trouvé dans le cache, on le retourne
      if (response) {
        return response;
      }
      // Sinon, on va chercher sur le réseau
      return fetch(event.request);
    })
  );
});

// 4. Gestion des Notifications Push
self.addEventListener('push', (event) => {
  if (event.data) {
    const data = event.data.json();
    const options = {
      body: data.body,
      icon: '/heart.svg', // Remplacez par votre icône
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

// 5. Clic sur la notification
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  event.waitUntil(
    clients.openWindow(event.notification.data.url)
  );
});
