// Thin TS wrapper to call existing JS cache (cache.js)

type CacheModule = {
  cache: {
    getAIResponse: (prompt: string, provider?: string) => Promise<any>;
    cacheAIResponse: (prompt: string, response: any, provider?: string) => Promise<void>;
  };
};

async function loadCache(): Promise<CacheModule> {
  // Dynamic import to avoid TS compiler scanning JS outside src
  const spec = '../../' + 'cache.ts';
  const mod: any = await import(spec as any);
  return mod as CacheModule;
}

export async function getCachedAI(provider: string, prompt: string) {
  try {
    const mod = await loadCache();
    return await mod.cache.getAIResponse(prompt, provider);
  } catch {
    return null;
  }
}

export async function setCachedAI(provider: string, prompt: string, response: any) {
  try {
    const mod = await loadCache();
    await mod.cache.cacheAIResponse(prompt, response, provider);
  } catch {
    // ignore cache errors
  }
}

// In-memory cache for identity resolution (for better performance)
const identityCache = new Map<string, { data: any; timestamp: number; ttl: number }>();

export function getCachedIdentity(email: string): any | null {
  const cached = identityCache.get(email);
  if (cached && Date.now() - cached.timestamp < cached.ttl) {
    return cached.data;
  }
  if (cached) {
    identityCache.delete(email); // Remove expired
  }
  return null;
}

export function setCachedIdentity(email: string, data: any, ttlMs: number = 300000) {
  // 5 min default
  identityCache.set(email, {
    data,
    timestamp: Date.now(),
    ttl: ttlMs,
  });

  // Cleanup old entries (simple LRU)
  if (identityCache.size > 1000) {
    const oldestKey = identityCache.keys().next().value;
    if (oldestKey) {
      identityCache.delete(oldestKey);
    }
  }
}
