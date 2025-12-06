'use client';

import { useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { apiClient } from '@/lib/api/client';

// Refresh check interval (every 2 minutes)
const REFRESH_CHECK_INTERVAL_MS = 2 * 60 * 1000;

// Warn user if token expires in less than 10 minutes
const EXPIRY_WARNING_THRESHOLD_MS = 10 * 60 * 1000;

interface UseTokenRefreshOptions {
  /** Called when token refresh fails and user needs to re-login */
  onAuthExpired?: () => void;
  /** Called when token is about to expire (warning) */
  onExpiryWarning?: (minutesLeft: number) => void;
  /** Enable/disable the hook */
  enabled?: boolean;
}

/**
 * Hook for automatic token refresh
 *
 * Monitors the JWT token expiration and automatically refreshes it
 * when it's about to expire. If refresh fails, redirects to login.
 *
 * Features:
 * - Periodic token expiry check
 * - Automatic refresh when token is about to expire
 * - Expiry warning callback
 * - Graceful handling of refresh failures
 */
export function useTokenRefresh(options: UseTokenRefreshOptions = {}) {
  const { onAuthExpired, onExpiryWarning, enabled = true } = options;
  const router = useRouter();
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const lastWarningRef = useRef<number>(0);

  const handleAuthExpired = useCallback(() => {
    console.log('[TokenRefresh] Auth expired, redirecting to login');
    apiClient.clearToken();
    if (onAuthExpired) {
      onAuthExpired();
    } else {
      router.push('/login');
    }
  }, [onAuthExpired, router]);

  const checkAndRefreshToken = useCallback(async () => {
    if (!apiClient.isAuthenticated()) {
      console.log('[TokenRefresh] Not authenticated');
      return;
    }

    const timeUntilExpiry = apiClient.getTimeUntilExpiry();
    const minutesLeft = Math.floor(timeUntilExpiry / 60000);

    console.log('[TokenRefresh] Time until expiry:', minutesLeft, 'minutes');

    // Warn user if token is about to expire
    if (timeUntilExpiry <= EXPIRY_WARNING_THRESHOLD_MS && timeUntilExpiry > 0) {
      // Only warn once per 5 minutes to avoid spam
      const now = Date.now();
      if (now - lastWarningRef.current > 5 * 60 * 1000) {
        lastWarningRef.current = now;
        if (onExpiryWarning) {
          onExpiryWarning(minutesLeft);
        }
      }
    }

    // Check if token needs refresh
    if (apiClient.needsRefresh()) {
      console.log('[TokenRefresh] Token needs refresh, attempting...');

      const refreshed = await apiClient.refreshToken();

      if (!refreshed) {
        // Check if token is completely expired
        if (!apiClient.isAuthenticated()) {
          handleAuthExpired();
        } else {
          console.log('[TokenRefresh] Refresh failed but token still valid');
        }
      }
    }
  }, [handleAuthExpired, onExpiryWarning]);

  // Set up periodic check
  useEffect(() => {
    if (!enabled) {
      return;
    }

    // Initial check
    checkAndRefreshToken();

    // Set up interval
    intervalRef.current = setInterval(checkAndRefreshToken, REFRESH_CHECK_INTERVAL_MS);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [enabled, checkAndRefreshToken]);

  // Also check on window focus (user returns to tab)
  useEffect(() => {
    if (!enabled) {
      return;
    }

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        console.log('[TokenRefresh] Tab became visible, checking token');
        checkAndRefreshToken();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [enabled, checkAndRefreshToken]);

  return {
    /** Manually trigger a token refresh check */
    checkToken: checkAndRefreshToken,
    /** Check if currently authenticated */
    isAuthenticated: apiClient.isAuthenticated(),
    /** Get time until token expires (in ms) */
    timeUntilExpiry: apiClient.getTimeUntilExpiry(),
  };
}
