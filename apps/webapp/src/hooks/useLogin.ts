import { useState, useCallback, useRef } from 'react';
import { fetchWithTimeout, parseLoginResponse, formatErrorMessage } from '../utils/login-utils';

// Configuration - Use centralized API_CONFIG
const API_CONFIG = globalThis.API_CONFIG || {
  backend: { url: 'https://nuzantara-rag.fly.dev' },
  memory: { url: 'https://nuzantara-rag.fly.dev' }
};
const API_BASE_URL = API_CONFIG.backend.url;

// Rate limiting
const MIN_TIME_BETWEEN_ATTEMPTS = 2000; // 2 seconds

interface UseLoginReturn {
  loading: boolean;
  error: string;
  success: string;
  login: (email: string, pin: string) => Promise<void>;
  clearError: () => void;
  clearSuccess: () => void;
}

export const useLogin = (): UseLoginReturn => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const lastLoginAttemptRef = useRef(0);

  const login = useCallback(async (email: string, pin: string) => {
    const trimmedEmail = email.trim();
    const trimmedPin = pin.trim();

    // Rate limiting check
    const now = Date.now();
    if (now - lastLoginAttemptRef.current < MIN_TIME_BETWEEN_ATTEMPTS) {
      const remainingTime = Math.ceil(
        (MIN_TIME_BETWEEN_ATTEMPTS - (now - lastLoginAttemptRef.current)) / 1000
      );
      setError(`Please wait ${remainingTime} second(s) before trying again.`);
      return;
    }
    lastLoginAttemptRef.current = now;

    // Validate
    if (!trimmedEmail || !trimmedPin) {
      setError('Please enter both email and PIN');
      return;
    }

    if (!/^\d{4,8}$/.test(trimmedPin)) {
      setError('PIN must be 4-8 digits');
      return;
    }

    // Show loading state
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      console.log('🔐 Attempting login...');

      // Call auth API with email + PIN (sent as password) - with timeout
      const response = await fetchWithTimeout(
        `${API_BASE_URL}/auth/login`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            email: trimmedEmail,
            password: trimmedPin  // PIN sent as password field
          }),
        },
        10000 // 10 seconds timeout
      );

      // Parse JSON with error handling
      let result;
      try {
        const contentType = response.headers.get('content-type');
        if (!contentType || !contentType.includes('application/json')) {
          throw new Error('Invalid response format from server');
        }
        result = await response.json();
      } catch (parseError) {
        console.error('❌ JSON parsing error:', parseError);
        throw new Error('Invalid response from server. Please try again.');
      }

      if (!response.ok) {
        throw new Error(result.detail || result.error || result.message || 'Login failed');
      }

      // Parse response
      const { user, token, expiresIn } = parseLoginResponse(result);

      console.log('✅ Login successful:', user.name || user.email);

      // Store auth data in ZANTARA format (zantara-*)
      localStorage.setItem('zantara-token', JSON.stringify({
        token: token,
        expiresAt: Date.now() + (expiresIn * 1000), // Convert seconds to milliseconds
      }));
      localStorage.setItem('zantara-user', JSON.stringify(user));
      localStorage.setItem('zantara-session', JSON.stringify({
        id: user.id || `session_${Date.now()}`,
        createdAt: Date.now(),
        lastActivity: Date.now(),
      }));

      console.log('✅ Auth data saved to localStorage (zantara-* format)');

      // Show success message
      setSuccess(`Welcome back, ${user.name || user.email}! 🎉`);

      // Redirect after 1.5 seconds
      setTimeout(() => {
        globalThis.location.href = '/chat.html';
      }, 1500);

    } catch (error: any) {
      console.error('❌ Login failed:', error);
      setError(formatErrorMessage(error.message || 'Login failed'));
      setLoading(false);
      throw error; // Re-throw to allow component to handle
    }
  }, []);

  const clearError = useCallback(() => {
    setError('');
  }, []);

  const clearSuccess = useCallback(() => {
    setSuccess('');
  }, []);

  return {
    loading,
    error,
    success,
    login,
    clearError,
    clearSuccess,
  };
};

