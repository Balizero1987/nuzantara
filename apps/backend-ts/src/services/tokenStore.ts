import type { Credentials } from 'google-auth-library';

// Token store now uses in-memory cache (Firestore removed)
// TODO: If persistence needed, use PostgreSQL
const tokenCache = new Map<string, Credentials & { updatedAt: number }>();

export const tokenStore = {
  async save(email: string, tokens: Credentials) {
    tokenCache.set(email, { ...tokens, updatedAt: Date.now() });
  },
  async get(email: string) {
    return tokenCache.get(email) || null;
  },
};
