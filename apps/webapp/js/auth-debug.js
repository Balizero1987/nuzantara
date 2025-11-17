/**
 * Auth Debug Module
 *
 * This file was created to resolve 404 errors in browser console.
 * Debug functionality is currently disabled in production.
 *
 * To enable debugging, set localStorage.setItem('zantara-debug', 'true')
 */

(function() {
  'use strict';

  // Check if debug mode is enabled
  const isDebugEnabled = localStorage.getItem('zantara-debug') === 'true';

  if (!isDebugEnabled) {
    console.debug('Auth debug mode disabled. Enable with localStorage.setItem("zantara-debug", "true")');
    return;
  }

  // Debug logging for authentication events
  const originalConsoleLog = console.log;
  window.authDebug = {
    log: function(...args) {
      if (isDebugEnabled) {
        originalConsoleLog.apply(console, ['[AUTH DEBUG]', ...args]);
      }
    },
    enabled: isDebugEnabled
  };

  console.log('🔍 Auth Debug Mode: ENABLED');
})();
