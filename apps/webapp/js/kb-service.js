/**
 * ZANTARA Knowledge Base Service - RAG Backend Integration
 * Bridges existing webapp with new RAG backend KB system
 *
 * Usage:
 * const result = await ZANTARA_KB.search("What is KITAS?");
 * const answer = await ZANTARA_KB.ask("Corporate tax rates in Indonesia?");
 */

const ZANTARA_KB = {
  // RAG Backend URL
  RAG_BACKEND: 'https://nuzantara-rag.fly.dev',

  // Available KB collections
  COLLECTIONS: {
    VISA: 'visa_oracle',
    TAX: 'tax_genius',
    LEGAL: 'legal_architect',
    KBLI: 'kbli_eye',
    BOOKS: 'zantara_books',
    ALL: 'all'
  },

  /**
   * Search knowledge base
   * @param {string} query - Search query
   * @param {string|Array} collections - Target collections
   * @returns {Promise<Object>} Search results
   */
  async search(query, collections = 'all') {
    try {
      console.log(`🔍 KB Search: "${query}" in collections: ${collections}`);

      const response = await fetch(`${this.RAG_BACKEND}/api/oracle/query`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Requested-With': 'XMLHttpRequest'
        },
        body: JSON.stringify({
          query: query,
          collections: Array.isArray(collections) ? collections : [collections]
        })
      });

      if (!response.ok) {
        throw new Error(`KB API Error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();

      console.log(`✅ KB Results: ${data.total_results || 0} found`);

      return {
        success: true,
        query: data.query,
        results: data.results || [],
        answer: data.answer,
        collection: data.collection_used,
        routing: data.routing_reason,
        total: data.total_results || 0,
        executionTime: data.execution_time_ms
      };

    } catch (error) {
      console.error('❌ KB Search failed:', error);
      return {
        success: false,
        error: error.message,
        query: query,
        results: []
      };
    }
  },

  /**
   * Quick search with automatic domain detection
   * @param {string} query - Search query
   * @returns {Promise<Object>} Search results
   */
  async quickSearch(query) {
    // Auto-detect domain from query keywords
    const domainMap = {
      visa: ['visa', 'kitas', 'kitap', 'immigration', 'passport', 'entry'],
      tax: ['tax', 'pajak', 'npwp', 'pph', 'ppn', 'corporate', 'income'],
      legal: ['legal', 'law', 'contract', 'court', 'regulation', 'compliance'],
      business: ['business', 'company', 'pt pma', 'investment', 'kbli', 'license'],
      general: ['what', 'how', 'when', 'where', 'why']
    };

    const queryLower = query.toLowerCase();
    let detectedDomain = 'all';

    for (const [domain, keywords] of Object.entries(domainMap)) {
      if (keywords.some(keyword => queryLower.includes(keyword))) {
        if (domain === 'visa') detectedDomain = this.COLLECTIONS.VISA;
        else if (domain === 'tax') detectedDomain = this.COLLECTIONS.TAX;
        else if (domain === 'legal') detectedDomain = this.COLLECTIONS.LEGAL;
        else if (domain === 'business') detectedDomain = this.COLLECTIONS.KBLI;
        break;
      }
    }

    return this.search(query, detectedDomain);
  },

  /**
   * Get document summary
   * @param {string} docId - Document ID
   * @returns {Promise<Object>} Document details
   */
  async getDocument(docId) {
    try {
      const response = await fetch(`${this.RAG_BACKEND}/api/memory/${docId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'X-Requested-With': 'XMLHttpRequest'
        }
      });

      if (!response.ok) {
        throw new Error(`Document fetch error: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Document fetch failed:', error);
      return { success: false, error: error.message };
    }
  },

  /**
   * Get KB statistics
   * @returns {Promise<Object>} KB stats
   */
  async getStats() {
    try {
      const response = await fetch(`${this.RAG_BACKEND}/api/memory/stats`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'X-Requested-With': 'XMLHttpRequest'
        }
      });

      if (!response.ok) {
        throw new Error(`Stats fetch error: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Stats fetch failed:', error);
      return { success: false, error: error.message };
    }
  },

  /**
   * Helper: Format search results for UI
   * @param {Object} results - Raw search results
   * @returns {Array} Formatted results
   */
  formatResults(results) {
    if (!results.success || !results.results) {
      return [];
    }

    return results.results.map((doc, index) => ({
      id: doc.id || `doc_${index}`,
      title: doc.metadata?.title || `Document ${index + 1}`,
      snippet: doc.text?.substring(0, 200) + '...',
      score: doc.score || 0,
      source: doc.metadata?.source || 'Knowledge Base',
      collection: doc.metadata?.collection || results.collection,
      metadata: doc.metadata || {}
    }));
  },

  /**
   * Suggested questions based on current query
   * @param {string} query - Original query
   * @returns {Array} Suggested follow-up questions
   */
  getSuggestedQuestions(query) {
    const suggestions = {
      visa: [
        "What documents do I need for KITAS?",
        "How long does visa processing take?",
        "What are the requirements for business visa?"
      ],
      tax: [
        "What is corporate tax rate in Indonesia?",
        "How do I register for NPWP?",
        "When are tax filing deadlines?"
      ],
      business: [
        "What KBLI code do I need for restaurant?",
        "How much capital for PT PMA?",
        "What licenses do I need for business?"
      ]
    };

    const queryLower = query.toLowerCase();

    if (queryLower.includes('visa') || queryLower.includes('kitas')) {
      return suggestions.visa;
    } else if (queryLower.includes('tax') || queryLower.includes('pajak')) {
      return suggestions.tax;
    } else if (queryLower.includes('business') || queryLower.includes('company')) {
      return suggestions.business;
    }

    return [
      "What are the visa requirements for Indonesia?",
      "How to set up a business in Bali?",
      "What are the tax obligations for foreigners?"
    ];
  }
};

// Export for global access
if (typeof window !== 'undefined') {
  window.ZANTARA_KB = ZANTARA_KB;
  console.log('✅ ZANTARA KB Service loaded');
  console.log('🧠 Available collections:', Object.values(ZANTARA_KB.COLLECTIONS));
}

// Export for Node.js
if (typeof module !== 'undefined' && module.exports) {
  module.exports = ZANTARA_KB;
}