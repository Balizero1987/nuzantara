import logger from './logger.js';
import NodeCache from 'node-cache';

// Cache intelligente con TTL differenziati per tipo di richiesta
const cacheInstances = {
  static: new NodeCache({ stdTTL: 3600, checkperiod: 600 }), // 1h per dati statici
  dynamic: new NodeCache({ stdTTL: 300, checkperiod: 60 }), // 5m per AI responses
  critical: new NodeCache({ stdTTL: 0 }), // No cache per dati critici
};

// Configurazione TTL conservativa per handler
const CACHE_CONFIG: Record<string, { ttl: number; type: 'static' | 'dynamic' | 'critical' }> = {
  // Dati statici - cache lunga
  'contact.info': { ttl: 3600, type: 'static' },
  'document.prepare': { ttl: 1800, type: 'static' },
  'assistant.route': { ttl: 900, type: 'static' },

  // Dati dinamici - cache breve
  'ai.chat': { ttl: 300, type: 'dynamic' },

  // Dati critici - nessuna cache
  'quote.generate': { ttl: 0, type: 'critical' },
  'lead.save': { ttl: 0, type: 'critical' },
  'memory.save': { ttl: 0, type: 'critical' },
  'drive.upload': { ttl: 0, type: 'critical' },
};

export function getCacheKey(handler: string, params: any): string {
  // Genera chiave univoca basata su handler e parametri
  const paramStr = JSON.stringify(params || {});
  return `${handler}:${Buffer.from(paramStr).toString('base64').substring(0, 32)}`;
}

export async function getFromCache(handler: string, params: any): Promise<any> {
  const config = CACHE_CONFIG[handler];
  if (!config || config.ttl === 0) return null;

  const key = getCacheKey(handler, params);
  const cache = cacheInstances[config.type];

  try {
    const cached = cache.get(key);
    if (cached) {
      logger.info(`🎯 Cache hit: ${handler} (${config.type})`);
      return cached;
    }
  } catch (err) {
    logger.info(`⚠️ Cache error: ${err}`);
  }

  return null;
}

export async function setInCache(handler: string, params: any, result: any): Promise<void> {
  const config = CACHE_CONFIG[handler];
  if (!config || config.ttl === 0) return;

  const key = getCacheKey(handler, params);
  const cache = cacheInstances[config.type];

  try {
    cache.set(key, result, config.ttl);
    logger.info(`💾 Cached: ${handler} for ${config.ttl}s`);
  } catch (err) {
    logger.info(`⚠️ Cache set error: ${err}`);
  }
}

export function invalidateCache(handler?: string): void {
  if (handler) {
    // Invalida cache specifica per handler
    Object.values(cacheInstances).forEach((cache) => {
      const keys = cache.keys();
      keys.forEach((key) => {
        if (key.startsWith(`${handler}:`)) {
          cache.del(key);
        }
      });
    });
    logger.info(`🗑️ Cache invalidated for: ${handler}`);
  } else {
    // Flush completo
    Object.values(cacheInstances).forEach((cache) => cache.flushAll());
    logger.info('🗑️ All caches flushed');
  }
}

// Cache stats per monitoring
export function getCacheStats() {
  const stats: Record<string, any> = {};
  Object.entries(cacheInstances).forEach(([type, cache]) => {
    stats[type] = {
      keys: cache.keys().length,
      hits: cache.getStats().hits,
      misses: cache.getStats().misses,
      hitRate: cache.getStats().hits / (cache.getStats().hits + cache.getStats().misses) || 0,
    };
  });
  return stats;
}
