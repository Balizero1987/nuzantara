/**
 * ZANTARA Service Worker
 * Provides offline support and caching
 */

const CACHE_NAME = 'zantara-v1';
const RUNTIME_CACHE = 'zantara-runtime';

// Assets to cache on install
const PRECACHE_ASSETS = [
    '/',
    '/chat.html',
    '/login.html',
    '/team-dashboard.html',
    '/css/design-system.css',
    '/css/variables-and-utilities.css',
    '/css/bali-zero-theme.css',
    '/css/toast-notifications.css',
    '/css/skeleton-screens.css',
    '/js/core/unified-api-client.js',
    '/js/core/toast-notification.js',
    '/js/core/keyboard-shortcuts.js',
    '/js/app.js',
    '/js/api-config.js'
];

// Install event - cache assets
self.addEventListener('install', (event) => {
    console.log('[Service Worker] Installing...');

    event.waitUntil(
        caches.open(CACHE_NAME)
            .then((cache) => {
                console.log('[Service Worker] Precaching assets');
                return cache.addAll(PRECACHE_ASSETS);
            })
            .then(() => self.skipWaiting())
    );
});

// Activate event - clean old caches
self.addEventListener('activate', (event) => {
    console.log('[Service Worker] Activating...');

    event.waitUntil(
        caches.keys()
            .then((cacheNames) => {
                return Promise.all(
                    cacheNames
                        .filter((name) => name !== CACHE_NAME && name !== RUNTIME_CACHE)
                        .map((name) => caches.delete(name))
                );
            })
            .then(() => self.clients.claim())
    );
});

// Fetch event - serve from cache, fallback to network
self.addEventListener('fetch', (event) => {
    const { request } = event;
    const url = new URL(request.url);

    // Skip cross-origin requests
    if (url.origin !== location.origin) {
        return;
    }

    // Network-first strategy for API requests
    if (url.pathname.startsWith('/api/')) {
        // 1. Skip caching for POST, PUT, DELETE requests
        if (event.request.method !== 'GET') {
            event.respondWith(fetch(event.request));
            return;
        }

        event.respondWith(
            fetch(request)
                .then((response) => {
                    // Cache successful API responses
                    if (response.ok) {
                        const responseClone = response.clone();
                        caches.open(RUNTIME_CACHE).then((cache) => {
                            cache.put(request, responseClone);
                        });
                    }
                    return response;
                })
                .catch(() => {
                    // Return cached response if offline
                    return caches.match(request);
                })
        );
        return;
    }

    // For other requests, use cache-first strategy
    event.respondWith(
        caches.match(request)
            .then((cachedResponse) => {
                if (cachedResponse) {
                    return cachedResponse;
                }

                return fetch(request)
                    .then((response) => {
                        // Cache successful responses
                        if (response.ok) {
                            const responseClone = response.clone();
                            caches.open(RUNTIME_CACHE).then((cache) => {
                                cache.put(request, responseClone);
                            });
                        }
                        return response;
                    });
            })
    );
});

// Message event - handle messages from clients
self.addEventListener('message', (event) => {
    if (event.data && event.data.type === 'SKIP_WAITING') {
        self.skipWaiting();
    }
});
