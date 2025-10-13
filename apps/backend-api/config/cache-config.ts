/**
 * CONSERVATIVE CACHE CONFIGURATION
 * Zero-risk caching strategy for ZANTARA v5.2.0
 * Only caches static data, never dynamic/critical information
 */

export interface CacheConfig {
  ttl: number;  // Time to live in seconds
  category: 'static' | 'dynamic' | 'never';
  description: string;
}

export const SAFE_CACHE_CONFIG: Record<string, CacheConfig> = {
  // ========== STATIC DATA (Safe to cache) ==========
  'contact.info': {
    ttl: 3600,  // 1 hour
    category: 'static',
    description: 'Company contact information'
  },
  'document.prepare': {
    ttl: 1800,  // 30 minutes
    category: 'static',
    description: 'Document checklists and requirements'
  },
  'services.list': {
    ttl: 3600,  // 1 hour
    category: 'static',
    description: 'Available services catalog'
  },
  'faq.get': {
    ttl: 7200,  // 2 hours
    category: 'static',
    description: 'Frequently asked questions'
  },

  // ========== DYNAMIC DATA (Short cache) ==========
  'ai.chat': {
    ttl: 300,  // 5 minutes max
    category: 'dynamic',
    description: 'AI conversation responses'
  },
  'memory.search': {
    ttl: 60,  // 1 minute
    category: 'dynamic',
    description: 'Memory search results'
  },
  'calendar.list': {
    ttl: 180,  // 3 minutes
    category: 'dynamic',
    description: 'Calendar events listing'
  },

  // ========== NEVER CACHE (Critical data) ==========
  'quote.generate': {
    ttl: 0,
    category: 'never',
    description: 'Always generate fresh quotes'
  },
  'lead.save': {
    ttl: 0,
    category: 'never',
    description: 'Always save directly to database'
  },
  'payment.process': {
    ttl: 0,
    category: 'never',
    description: 'Never cache payment operations'
  },
  'user.auth': {
    ttl: 0,
    category: 'never',
    description: 'Never cache authentication'
  },
  'ambaradam.profile.upsert': {
    ttl: 0,
    category: 'never',
    description: 'Always update user profiles in real-time'
  }
};

/**
 * Cache utility class with conservative defaults
 */
export class SafeCache {
  private cache: Map<string, { data: any; expires: number }> = new Map();
  private readonly DEFAULT_TTL = 60; // 1 minute default

  /**
   * Get cached value if not expired
   */
  get(key: string): any | null {
    const cached = this.cache.get(key);
    if (!cached) return null;

    if (Date.now() > cached.expires) {
      this.cache.delete(key);
      return null;
    }

    return cached.data;
  }

  /**
   * Set cache with handler-specific TTL
   */
  set(handler: string, key: string, data: any): void {
    const config = SAFE_CACHE_CONFIG[handler];

    // Never cache if handler says so
    if (!config || config.category === 'never' || config.ttl === 0) {
      return;
    }

    const ttl = config.ttl || this.DEFAULT_TTL;
    const expires = Date.now() + (ttl * 1000);

    this.cache.set(key, { data, expires });
  }

  /**
   * Clear expired entries periodically
   */
  cleanup(): void {
    const now = Date.now();
    for (const [key, value] of this.cache.entries()) {
      if (now > value.expires) {
        this.cache.delete(key);
      }
    }
  }

  /**
   * Get cache statistics
   */
  getStats(): object {
    return {
      size: this.cache.size,
      entries: Array.from(this.cache.keys()),
      memoryUsage: process.memoryUsage().heapUsed / 1024 / 1024 + ' MB'
    };
  }
}

// Export singleton instance
export const safeCache = new SafeCache();

// Cleanup expired entries every 5 minutes
setInterval(() => safeCache.cleanup(), 5 * 60 * 1000);