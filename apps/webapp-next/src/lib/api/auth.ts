/* eslint-disable @typescript-eslint/no-explicit-any */
import type { LoginRequest, LoginResponse, User } from './types';
import { apiClient } from './client';
import { fetchWithRetry } from './fetch-utils';

export const authAPI = {
  async login(credentials: LoginRequest): Promise<LoginResponse> {
    try {
      // Call Next.js Proxy Route with retry
      const response = await fetchWithRetry('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: credentials.email,
          pin: credentials.pin, // The proxy expects 'pin', not 'password'
        }),
        retries: 3,
        timeout: 10000,
      });

      const data = (await response.json()) as any;

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
    if (typeof globalThis !== 'undefined' && (globalThis as any).localStorage) {
      (globalThis as any).localStorage.setItem('zantara_user', JSON.stringify(user));
      (globalThis as any).localStorage.setItem('zantara_user_email', user.email);
    }
  },

  getUser(): User | null {
    if (typeof globalThis === 'undefined' || !(globalThis as any).localStorage) return null;
    const userStr = (globalThis as any).localStorage.getItem('zantara_user');
    return userStr ? JSON.parse(userStr) : null;
  },

  clearUser(): void {
    if (typeof globalThis !== 'undefined' && (globalThis as any).localStorage) {
      (globalThis as any).localStorage.removeItem('zantara_user');
      (globalThis as any).localStorage.removeItem('zantara_user_email');
      (globalThis as any).localStorage.removeItem('zantara_session_token');
    }
  },

  logout(): void {
    this.clearUser();
    apiClient.clearToken();
    if (typeof globalThis !== 'undefined' && (globalThis as any).window) {
      (globalThis as any).window.location.href = '/';
    }
  },
};
