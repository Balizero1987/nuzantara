import type { LoginRequest, LoginResponse, User } from './types';
import { apiClient } from '@/lib/api/client';

const AUTH_TIMEOUT = 30000; // 30 seconds for auth requests

/**
 * Fetch with timeout for auth operations
 */
async function fetchWithTimeout(
  url: string,
  options: RequestInit,
  timeout: number = AUTH_TIMEOUT
): Promise<Response> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);

  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
    });
    return response;
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') {
      throw new Error(`Authentication request timeout after ${timeout}ms`);
    }
    throw error;
  } finally {
    clearTimeout(timeoutId);
  }
}

export const authAPI = {
  async login(credentials: LoginRequest): Promise<LoginResponse> {
    try {
      // Call Next.js Proxy Route with timeout
      const response = await fetchWithTimeout('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: credentials.email,
          pin: credentials.pin, // The proxy expects 'pin', not 'password'
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Login failed');
      }

      // The proxy returns { token, user, message }
      // We need to map it to LoginResponse structure if needed,
      // but the proxy response seems to match what we need mostly.

      const userData: User = {
        id: data.user.id,
        email: data.user.email,
        name: data.user.name,
        role: data.user.role,
        avatar: null,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      const authResponse: LoginResponse = {
        user: userData,
        token: data.token,
        expiresIn: 3600, // Default 1 hour if not provided
      };

      this.saveUser(userData);
      apiClient.setToken(authResponse.token);
      return authResponse;
    } catch (error) {
      console.error('Login error:', error);
      throw new Error(error instanceof Error ? error.message : 'Login failed');
    }
  },

  saveUser(user: User): void {
    if (typeof window !== 'undefined') {
      localStorage.setItem('zantara_user', JSON.stringify(user));
      localStorage.setItem('zantara_user_email', user.email);
    }
  },

  getUser(): User | null {
    if (typeof window === 'undefined') return null;
    const userStr = localStorage.getItem('zantara_user');
    return userStr ? JSON.parse(userStr) : null;
  },

  clearUser(): void {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('zantara_user');
      localStorage.removeItem('zantara_user_email');
      localStorage.removeItem('zantara_session_token');
    }
  },

  logout(): void {
    this.clearUser();
    apiClient.clearToken();
    if (typeof window !== 'undefined') {
      window.location.href = '/';
    }
  },
};
