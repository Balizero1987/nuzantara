/**
 * Zantara RAG Search Client
 * Direct search in knowledge base (14 ChromaDB collections)
 *
 * Features:
 * - Search across all collections or specific one
 * - Auto-detect best collection for query
 * - Cache results for performance
 * - Support for filters and limits
 */

class ZantaraRAGClient {
  constructor() {
    this.apiBase = 'https://nuzantara-rag.fly.dev';
    this.collections = [
      { id: 'bali_zero_pricing', name: 'Pricing & Services', icon: '💰' },
      { id: 'visa_oracle', name: 'Visa Oracle', icon: '🛂' },
      { id: 'kbli_eye', name: 'KBLI Codes', icon: '📊' },
      { id: 'tax_genius', name: 'Tax & Accounting', icon: '💼' },
      { id: 'legal_architect', name: 'Legal Documents', icon: '⚖️' },
      { id: 'kb_indonesian', name: 'Indonesian Knowledge', icon: '🇮🇩' },
      { id: 'kbli_comprehensive', name: 'KBLI Comprehensive', icon: '📋' },
      { id: 'zantara_books', name: 'Zantara Books', icon: '📚' },
      { id: 'cultural_insights', name: 'Cultural Insights', icon: '🎭' },
      { id: 'tax_updates', name: 'Tax Updates', icon: '📰' },
      { id: 'tax_knowledge', name: 'Tax Knowledge', icon: '💡' },
      { id: 'property_listings', name: 'Property Listings', icon: '🏠' },
      { id: 'property_knowledge', name: 'Property Knowledge', icon: '🏡' },
      { id: 'legal_updates', name: 'Legal Updates', icon: '⚖️' },
    ];

    this.cache = new Map();
    this.cacheTTL = 300000; // 5 minutes
  }

  /**
   * Search in knowledge base
   */
  async search(query, options = {}) {
    const {
      collection = null, // Specific collection or null for auto-detect
      limit = 5, // Number of results
      userLevel = 0, // Access level (0=public, 3=admin)
    } = options;

    console.log(
      `🔍 [RAGClient] Searching: "${query}"${collection ? ` in ${collection}` : ' (auto-detect)'}`
    );

    // Check cache
    const cacheKey = `${query}:${collection}:${limit}:${userLevel}`;
    const cached = this._getCached(cacheKey);
    if (cached) {
      console.log('✅ [RAGClient] Using cached results');
      return cached;
    }

    try {
      const response = await fetch(`${this.apiBase}/rag/search`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: this._getAuthToken(),
        },
        body: JSON.stringify({
          query,
          collection,
          limit,
          user_level: userLevel,
        }),
      });

      if (!response.ok) {
        throw new Error(`Search failed: ${response.status}`);
      }

      const data = await response.json();

      if (data.ok || data.success) {
        const results = {
          results: data.results || [],
          collection: data.collection || collection || 'auto',
          confidence: data.confidence || 0.8,
          sources: data.sources || [],
          total: (data.results || []).length,
        };

        console.log(`✅ [RAGClient] Found ${results.total} results in ${results.collection}`);

        // Cache results
        this._setCached(cacheKey, results);

        return results;
      }

      throw new Error('Invalid search response');
    } catch (error) {
      console.error('❌ [RAGClient] Search failed:', error);
      return {
        results: [],
        collection: collection || 'unknown',
        confidence: 0,
        sources: [],
        total: 0,
        error: error.message,
      };
    }
  }

  /**
   * Search in specific collection
   */
  async searchCollection(collectionId, query, limit = 5) {
    return this.search(query, { collection: collectionId, limit });
  }

  /**
   * Get list of available collections
   */
  getCollections() {
    return this.collections;
  }

  /**
   * Get collection info by ID
   */
  getCollection(collectionId) {
    return this.collections.find((c) => c.id === collectionId);
  }

  /**
   * Auto-detect best collection for query
   */
  detectCollection(query) {
    const queryLower = query.toLowerCase();

    // Pricing keywords
    if (this._containsAny(queryLower, ['price', 'cost', 'pricing', 'fee', 'harga', 'biaya'])) {
      return 'bali_zero_pricing';
    }

    // Visa keywords
    if (this._containsAny(queryLower, ['visa', 'kitas', 'kitap', 'visto', 'immigration'])) {
      return 'visa_oracle';
    }

    // KBLI keywords
    if (
      this._containsAny(queryLower, ['kbli', 'business code', 'activity code', 'classification'])
    ) {
      return 'kbli_eye';
    }

    // Tax keywords
    if (this._containsAny(queryLower, ['tax', 'pajak', 'npwp', 'pph', 'ppn', 'accounting'])) {
      return 'tax_genius';
    }

    // Legal keywords
    if (this._containsAny(queryLower, ['legal', 'law', 'contract', 'agreement', 'hukum'])) {
      return 'legal_architect';
    }

    // Property keywords
    if (this._containsAny(queryLower, ['property', 'real estate', 'properti', 'villa', 'land'])) {
      return 'property_knowledge';
    }

    // Default: let backend decide
    return null;
  }

  /**
   * Clear cache
   */
  clearCache() {
    this.cache.clear();
    console.log('🔍 [RAGClient] Cache cleared');
  }

  /**
   * Get search statistics
   */
  getStats() {
    return {
      cached_queries: this.cache.size,
      collections: this.collections.length,
    };
  }

  /**
   * Private: Check if string contains any of the keywords
   */
  _containsAny(str, keywords) {
    return keywords.some((keyword) => str.includes(keyword));
  }

  /**
   * Private: Get from cache
   */
  _getCached(key) {
    const cached = this.cache.get(key);
    if (!cached) return null;

    const age = Date.now() - cached.timestamp;
    if (age > this.cacheTTL) {
      this.cache.delete(key);
      return null;
    }

    return cached.data;
  }

  /**
   * Private: Set cache
   */
  _setCached(key, data) {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
    });

    // Limit cache size to 100 entries
    if (this.cache.size > 100) {
      const firstKey = this.cache.keys().next().value;
      this.cache.delete(firstKey);
    }
  }

  /**
   * Private: Get auth token
   */
  _getAuthToken() {
    const token = localStorage.getItem('zantara-token');
    return token ? `Bearer ${token}` : '';
  }
}

// Create global instance
window.RAG_CLIENT = new ZantaraRAGClient();

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
  module.exports = ZantaraRAGClient;
}
