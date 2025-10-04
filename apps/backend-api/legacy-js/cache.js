import { createClient } from 'redis';
import { LRUCache } from 'lru-cache';
class ZantaraCache {
    constructor() {
        this.redisClient = null;
        this.isRedisConnected = false;
        // Memory cache (L1) - Ultra fast for immediate requests
        this.memoryCache = new LRUCache({
            max: 1000, // Max 1000 entries
            ttl: 1000 * 60 * 15, // 15 minutes default TTL
            allowStale: true
        });
        this.initRedis();
    }
    async initRedis() {
        try {
            // Redis cache (L2) - Persistent across restarts
            const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';
            this.redisClient = createClient({ url: redisUrl });
            await this.redisClient.connect();
            this.isRedisConnected = true;
            console.log('✅ Redis cache connected');
        }
        catch (error) {
            console.log('⚠️ Redis not available, using memory-only cache');
            this.isRedisConnected = false;
        }
    }
    async get(key) {
        // Try L1 cache first (memory)
        const memoryEntry = this.memoryCache.get(key);
        if (memoryEntry && this.isValid(memoryEntry)) {
            console.log(`🎯 Cache HIT (memory): ${key}`);
            return memoryEntry.data;
        }
        // Try L2 cache (Redis)
        if (this.isRedisConnected) {
            try {
                const redisData = await this.redisClient.get(key);
                if (redisData) {
                    const entry = JSON.parse(redisData);
                    if (this.isValid(entry)) {
                        // Promote to L1 cache
                        this.memoryCache.set(key, entry);
                        console.log(`🎯 Cache HIT (redis): ${key}`);
                        return entry.data;
                    }
                }
            }
            catch (error) {
                console.log('⚠️ Redis get error:', error);
            }
        }
        console.log(`🚫 Cache MISS: ${key}`);
        return null;
    }
    async set(key, data, ttlSeconds = 900) {
        const entry = {
            data,
            timestamp: Date.now(),
            ttl: ttlSeconds * 1000
        };
        // Set in L1 cache (memory)
        this.memoryCache.set(key, entry);
        // Set in L2 cache (Redis)
        if (this.isRedisConnected) {
            try {
                await this.redisClient.setEx(key, ttlSeconds, JSON.stringify(entry));
                console.log(`💾 Cache SET: ${key} (TTL: ${ttlSeconds}s)`);
            }
            catch (error) {
                console.log('⚠️ Redis set error:', error);
            }
        }
        else {
            console.log(`💾 Cache SET (memory): ${key} (TTL: ${ttlSeconds}s)`);
        }
    }
    async del(key) {
        this.memoryCache.delete(key);
        if (this.isRedisConnected) {
            try {
                await this.redisClient.del(key);
                console.log(`🗑️ Cache DELETE: ${key}`);
            }
            catch (error) {
                console.log('⚠️ Redis delete error:', error);
            }
        }
    }
    async clear() {
        this.memoryCache.clear();
        if (this.isRedisConnected) {
            try {
                await this.redisClient.flushAll();
                console.log('🧹 Cache CLEARED');
            }
            catch (error) {
                console.log('⚠️ Redis clear error:', error);
            }
        }
    }
    isValid(entry) {
        return (Date.now() - entry.timestamp) < entry.ttl;
    }
    // Special methods for common use cases
    async cacheAIResponse(prompt, response, provider = 'ai') {
        const key = `ai:${provider}:${this.hashString(prompt)}`;
        await this.set(key, response, 3600); // 1 hour for AI responses
    }
    async getAIResponse(prompt, provider = 'ai') {
        const key = `ai:${provider}:${this.hashString(prompt)}`;
        return await this.get(key);
    }
    async cacheMemorySearch(query, results) {
        const key = `memory:search:${this.hashString(query)}`;
        await this.set(key, results, 600); // 10 minutes for memory searches
    }
    async getMemorySearch(query) {
        const key = `memory:search:${this.hashString(query)}`;
        return await this.get(key);
    }
    async cacheCalendarEvents(userId, events) {
        const key = `calendar:${userId}:events`;
        await this.set(key, events, 300); // 5 minutes for calendar
    }
    async getCalendarEvents(userId) {
        const key = `calendar:${userId}:events`;
        return await this.get(key);
    }
    hashString(str) {
        let hash = 0;
        for (let i = 0; i < str.length; i++) {
            const char = str.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash; // Convert to 32-bit integer
        }
        return Math.abs(hash).toString(36);
    }
    getStats() {
        return {
            memory: {
                size: this.memoryCache.size,
                max: this.memoryCache.max
            },
            redis: {
                connected: this.isRedisConnected
            }
        };
    }
}
// Global cache instance
export const cache = new ZantaraCache();
export default cache;
