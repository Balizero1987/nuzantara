/**
 * Memory Cache Statistics Handler
 * Exposes cache performance metrics
 */
import { memoryCache } from '../../services/memory-cache.js';
import { ok } from '../../utils/response.js';
/**
 * Get memory cache statistics
 */
export async function memoryCacheStats(_params) {
    const stats = memoryCache.getStats();
    return ok({
        cache_stats: stats,
        performance_impact: {
            embedding_cache_hit_savings: '~500ms per hit',
            search_cache_hit_savings: '~800ms per hit',
            total_potential_savings: `${stats.embeddings.totalHits * 500 + stats.searches.totalHits * 800}ms`
        },
        recommendations: getRecommendations(stats)
    });
}
/**
 * Clear memory cache (for testing/maintenance)
 */
export async function memoryCacheClear(_params) {
    const statsBefore = memoryCache.getStats();
    memoryCache.clear();
    return ok({
        message: 'Cache cleared successfully',
        cleared: {
            embeddings: statsBefore.embeddings.size,
            searches: statsBefore.searches.size
        }
    });
}
/**
 * Generate recommendations based on cache stats
 */
function getRecommendations(stats) {
    const recommendations = [];
    // Check if cache is being utilized
    if (stats.embeddings.totalHits === 0 && stats.embeddings.size > 10) {
        recommendations.push('Low cache hit rate - queries may be too diverse');
    }
    if (stats.embeddings.size >= stats.embeddings.maxSize * 0.9) {
        recommendations.push('Embedding cache nearly full - consider increasing MAX_EMBEDDING_CACHE');
    }
    if (stats.searches.size >= stats.searches.maxSize * 0.9) {
        recommendations.push('Search cache nearly full - consider increasing MAX_SEARCH_CACHE');
    }
    if (stats.embeddings.totalHits > 50) {
        recommendations.push(`✅ Cache is working well - ${stats.embeddings.totalHits} embedding hits saved ~${stats.embeddings.totalHits * 500}ms`);
    }
    if (recommendations.length === 0) {
        recommendations.push('Cache is operating normally');
    }
    return recommendations;
}
