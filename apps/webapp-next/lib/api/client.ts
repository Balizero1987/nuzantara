import { NuzantaraClient } from './generated/NuzantaraClient';

/**
 * Server-side Client Factory (Authenticated)
 * Use this in Next.js Route Handlers or Server Components
 * @param token - The JWT token extracted from cookies or headers
 */
export const createServerClient = (token: string) => {
  return new NuzantaraClient({
    BASE: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000',
    TOKEN: token,
    HEADERS: {
      'X-API-Key': process.env.NUZANTARA_API_KEY || ''
    }
  });
};

/**
 * Server-side Client Factory (Public)
 * Use this for public endpoints like Login
 */
export const createPublicClient = () => {
  return new NuzantaraClient({
    BASE: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000',
    HEADERS: {
      'X-API-Key': process.env.NUZANTARA_API_KEY || ''
    }
  });
};

class ClientWrapper {
  public client: NuzantaraClient;

  constructor() {
    this.client = new NuzantaraClient({
      BASE: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000',
      TOKEN: async () => {
        if (typeof window !== 'undefined') {
          return localStorage.getItem('zantara_session_token') || '';
        }
        return '';
      }
    });
  }

  getToken(): string | null {
    if (typeof window === "undefined") return null
    return localStorage.getItem("zantara_session_token")
  }

  setToken(token: string): void {
    if (typeof window !== "undefined") {
      localStorage.setItem("zantara_session_token", token)
    }
  }

  clearToken(): void {
    if (typeof window !== "undefined") {
      localStorage.removeItem("zantara_session_token")
      localStorage.removeItem("zantara_user")
    }
  }

  logout(): void {
    this.clearToken()
    if (typeof window !== "undefined") {
      window.location.href = "/"
    }
  }
}

export const apiClient = new ClientWrapper();
// Export the underlying client for direct usage if needed
export const client = apiClient.client;
