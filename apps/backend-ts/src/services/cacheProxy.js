// Thin TS wrapper to call existing JS cache (cache.js)
async function loadCache() {
    // Dynamic import to avoid TS compiler scanning JS outside src
    const spec = '../../' + 'cache.ts';
    const mod = await import(spec);
    return mod;
}
export async function getCachedAI(provider, prompt) {
    try {
        const mod = await loadCache();
        return await mod.cache.getAIResponse(prompt, provider);
    }
    catch {
        return null;
    }
}
export async function setCachedAI(provider, prompt, response) {
    try {
        const mod = await loadCache();
        await mod.cache.cacheAIResponse(prompt, response, provider);
    }
    catch {
        // ignore cache errors
    }
}
// In-memory cache for identity resolution (for better performance)
const identityCache = new Map();
export function getCachedIdentity(email) {
    const cached = identityCache.get(email);
    if (cached && Date.now() - cached.timestamp < cached.ttl) {
        return cached.data;
    }
    if (cached) {
        identityCache.delete(email); // Remove expired
    }
    return null;
}
export function setCachedIdentity(email, data, ttlMs = 300000) {
    identityCache.set(email, {
        data,
        timestamp: Date.now(),
        ttl: ttlMs
    });
    // Cleanup old entries (simple LRU)
    if (identityCache.size > 1000) {
        const oldestKey = identityCache.keys().next().value;
        if (oldestKey) {
            identityCache.delete(oldestKey);
        }
    }
}
