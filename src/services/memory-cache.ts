/**
 * MEMORY CACHE SERVICE
 * Caches embeddings and search results to reduce RAG backend calls
 * Target: Reduce hybrid search from ~800ms to ~200ms for cached queries
 */

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  hits: number;
}

class MemoryCache {
  private embeddingCache: Map<string, CacheEntry<number[]>> = new Map();
  private searchCache: Map<string, CacheEntry<any>> = new Map();

  // Cache TTLs (milliseconds)
  private readonly EMBEDDING_TTL = 60 * 60 * 1000; // 1 hour
  private readonly SEARCH_TTL = 5 * 60 * 1000;      // 5 minutes

  // Max cache sizes (LRU)
  private readonly MAX_EMBEDDING_CACHE = 1000;
  private readonly MAX_SEARCH_CACHE = 500;

  /**
   * Get cached embedding for text
   */
  getEmbedding(text: string): number[] | null {
    const key = this.normalizeKey(text);
    const entry = this.embeddingCache.get(key);

    if (!entry) return null;

    // Check if expired
    if (Date.now() - entry.timestamp > this.EMBEDDING_TTL) {
      this.embeddingCache.delete(key);
      return null;
    }

    // Update hit counter
    entry.hits++;

    return entry.data;
  }

  /**
   * Store embedding in cache
   */
  setEmbedding(text: string, embedding: number[]): void {
    const key = this.normalizeKey(text);

    // Evict oldest if cache full (simple LRU)
    if (this.embeddingCache.size >= this.MAX_EMBEDDING_CACHE) {
      const oldestKey = this.embeddingCache.keys().next().value;
      this.embeddingCache.delete(oldestKey);
    }

    this.embeddingCache.set(key, {
      data: embedding,
      timestamp: Date.now(),
      hits: 0
    });
  }

  /**
   * Get cached search results
   */
  getSearchResults(query: string, userId?: string, limit: number = 10): any | null {
    const key = this.getSearchKey(query, userId, limit);
    const entry = this.searchCache.get(key);

    if (!entry) return null;

    // Check if expired
    if (Date.now() - entry.timestamp > this.SEARCH_TTL) {
      this.searchCache.delete(key);
      return null;
    }

    entry.hits++;
    return entry.data;
  }

  /**
   * Store search results in cache
   */
  setSearchResults(query: string, userId: string | undefined, limit: number, results: any): void {
    const key = this.getSearchKey(query, userId, limit);

    // Evict oldest if cache full
    if (this.searchCache.size >= this.MAX_SEARCH_CACHE) {
      const oldestKey = this.searchCache.keys().next().value;
      this.searchCache.delete(oldestKey);
    }

    this.searchCache.set(key, {
      data: results,
      timestamp: Date.now(),
      hits: 0
    });
  }

  /**
   * Clear all caches
   */
  clear(): void {
    this.embeddingCache.clear();
    this.searchCache.clear();
  }

  /**
   * Get cache statistics
   */
  getStats() {
    const embeddingHits = Array.from(this.embeddingCache.values()).reduce((sum, e) => sum + e.hits, 0);
    const searchHits = Array.from(this.searchCache.values()).reduce((sum, e) => sum + e.hits, 0);

    return {
      embeddings: {
        size: this.embeddingCache.size,
        maxSize: this.MAX_EMBEDDING_CACHE,
        totalHits: embeddingHits,
        ttl: this.EMBEDDING_TTL / 1000 / 60 + ' minutes'
      },
      searches: {
        size: this.searchCache.size,
        maxSize: this.MAX_SEARCH_CACHE,
        totalHits: searchHits,
        ttl: this.SEARCH_TTL / 1000 / 60 + ' minutes'
      }
    };
  }

  /**
   * Invalidate cache for specific user (e.g., after new memory added)
   */
  invalidateUser(userId: string): void {
    // Remove all search results for this user
    for (const [key, _] of this.searchCache.entries()) {
      if (key.includes(`user:${userId}`)) {
        this.searchCache.delete(key);
      }
    }
  }

  /**
   * Normalize cache key (lowercase, trim, remove extra spaces)
   */
  private normalizeKey(text: string): string {
    return text.toLowerCase().trim().replace(/\s+/g, ' ');
  }

  /**
   * Generate search cache key
   */
  private getSearchKey(query: string, userId?: string, limit?: number): string {
    const normalizedQuery = this.normalizeKey(query);
    return `query:${normalizedQuery}|user:${userId || 'all'}|limit:${limit || 10}`;
  }
}

// Singleton instance
export const memoryCache = new MemoryCache();

/**
 * Cache-aware wrapper for embedding generation
 */
export async function getCachedEmbedding(
  text: string,
  generateFn: () => Promise<number[]>
): Promise<{ embedding: number[]; cached: boolean }> {
  // Try cache first
  const cached = memoryCache.getEmbedding(text);
  if (cached) {
    return { embedding: cached, cached: true };
  }

  // Generate and cache
  const embedding = await generateFn();
  memoryCache.setEmbedding(text, embedding);

  return { embedding, cached: false };
}

/**
 * Cache-aware wrapper for search
 */
export async function getCachedSearch(
  query: string,
  userId: string | undefined,
  limit: number,
  searchFn: () => Promise<any>
): Promise<{ results: any; cached: boolean }> {
  // Try cache first
  const cached = memoryCache.getSearchResults(query, userId, limit);
  if (cached) {
    return { results: cached, cached: true };
  }

  // Execute search and cache
  const results = await searchFn();
  memoryCache.setSearchResults(query, userId, limit, results);

  return { results, cached: false };
}
