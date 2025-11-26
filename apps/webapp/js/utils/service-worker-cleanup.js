/**
 * Service Worker Cleanup Utility
 * 
 * Removes old service worker registrations to prevent conflicts.
 * Should be run once to clean up any cached old service workers.
 */

export async function cleanupOldServiceWorkers() {
  if (!('serviceWorker' in navigator)) {
    console.log('[SW Cleanup] Service workers not supported');
    return;
  }

  try {
    const registrations = await navigator.serviceWorker.getRegistrations();
    let cleaned = 0;

    for (const registration of registrations) {
      const scriptURL = registration.active?.scriptURL || registration.installing?.scriptURL || registration.waiting?.scriptURL;
      
      // Check if this is an old service worker we want to remove
      if (scriptURL && scriptURL.includes('service-worker-zantara.js')) {
        console.log(`[SW Cleanup] Unregistering old service worker: ${scriptURL}`);
        await registration.unregister();
        cleaned++;
      }
    }

    if (cleaned > 0) {
      console.log(`[SW Cleanup] Cleaned up ${cleaned} old service worker(s)`);
    } else {
      console.log('[SW Cleanup] No old service workers found');
    }

    // Also clear old caches
    if ('caches' in window) {
      const cacheNames = await caches.keys();
      const oldCaches = cacheNames.filter(name => 
        name.includes('zantara-v1') || 
        name.includes('zantara-runtime') ||
        name.includes('service-worker-zantara')
      );

      for (const cacheName of oldCaches) {
        console.log(`[SW Cleanup] Deleting old cache: ${cacheName}`);
        await caches.delete(cacheName);
      }

      if (oldCaches.length > 0) {
        console.log(`[SW Cleanup] Deleted ${oldCaches.length} old cache(s)`);
      }
    }

  } catch (error) {
    console.error('[SW Cleanup] Error during cleanup:', error);
  }
}

// Auto-run cleanup on load (only once)
let cleanupRun = false;
if (typeof window !== 'undefined' && !cleanupRun) {
  cleanupRun = true;
  // Run cleanup after a short delay to not block page load
  setTimeout(() => {
    cleanupOldServiceWorkers().catch(err => {
      console.warn('[SW Cleanup] Cleanup failed:', err);
    });
  }, 2000);
}

export default cleanupOldServiceWorkers;

