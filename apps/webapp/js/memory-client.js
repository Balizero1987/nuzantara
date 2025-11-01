/**
 * Zantara Memory API Client
 * Manages persistent user memory (facts, summary, counters)
 *
 * Features:
 * - Get user memory from PostgreSQL
 * - Add facts to user profile
 * - Update conversation summary
 * - Track activity counters
 * - Local caching for performance
 */

class ZantaraMemoryClient {
  constructor() {
    this.apiBase = 'https://nuzantara-rag.fly.dev';
    this.cache = new Map();
    this.cacheTTL = 60000; // 1 minute cache
  }

  /**
   * Get user memory (facts, summary, counters)
   */
  async getMemory(userId) {
    console.log(`🧠 [MemoryClient] Fetching memory for user: ${userId}`);

    // Check cache first
    const cached = this._getCached(userId);
    if (cached) {
      console.log(`✅ [MemoryClient] Using cached memory`);
      return cached;
    }

    try {
      const response = await fetch(`${this.apiBase}/memory/get?userId=${encodeURIComponent(userId)}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': this._getAuthToken()
        }
      });

      if (!response.ok) {
        if (response.status === 404) {
          console.log(`ℹ️ [MemoryClient] No memory found for user (new user)`);
          return this._getEmptyMemory(userId);
        }
        throw new Error(`Memory fetch failed: ${response.status}`);
      }

      const data = await response.json();

      if (data.success) {
        const memory = {
          user_id: data.userId,
          profile_facts: data.profile_facts || [],
          summary: data.summary || '',
          counters: data.counters || {},
          updated_at: data.updated_at
        };

        console.log(`✅ [MemoryClient] Memory loaded: ${memory.profile_facts.length} facts`);
        this._setCached(userId, memory);
        return memory;
      }

      throw new Error('Invalid memory response');
    } catch (error) {
      console.error('❌ [MemoryClient] Failed to fetch memory:', error);

      // Return cached if available, otherwise empty
      const cached = this.cache.get(userId);
      if (cached) return cached.data;

      return this._getEmptyMemory(userId);
    }
  }

  /**
   * Add a fact to user memory
   */
  async addFact(userId, fact) {
    console.log(`🧠 [MemoryClient] Adding fact for ${userId}: "${fact}"`);

    try {
      const response = await fetch(`${this.apiBase}/memory/save`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': this._getAuthToken()
        },
        body: JSON.stringify({
          userId: userId,
          profile_facts: [fact],
          summary: ''
        })
      });

      if (!response.ok) {
        throw new Error(`Add fact failed: ${response.status}`);
      }

      const data = await response.json();

      if (data.success) {
        console.log(`✅ [MemoryClient] Fact added successfully`);

        // Invalidate cache
        this.cache.delete(userId);

        return { success: true };
      }

      throw new Error('Invalid response');
    } catch (error) {
      console.error('❌ [MemoryClient] Failed to add fact:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Update conversation summary
   */
  async updateSummary(userId, summary) {
    console.log(`🧠 [MemoryClient] Updating summary for ${userId}`);

    try {
      const response = await fetch(`${this.apiBase}/memory/save`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': this._getAuthToken()
        },
        body: JSON.stringify({
          userId: userId,
          profile_facts: [],
          summary: summary
        })
      });

      if (!response.ok) {
        throw new Error(`Update summary failed: ${response.status}`);
      }

      const data = await response.json();

      if (data.success) {
        console.log(`✅ [MemoryClient] Summary updated successfully`);

        // Invalidate cache
        this.cache.delete(userId);

        return { success: true };
      }

      throw new Error('Invalid response');
    } catch (error) {
      console.error('❌ [MemoryClient] Failed to update summary:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Delete a specific fact (re-save without that fact)
   */
  async deleteFact(userId, factIndex) {
    console.log(`🧠 [MemoryClient] Deleting fact ${factIndex} for ${userId}`);

    try {
      // First get current memory
      const memory = await this.getMemory(userId);

      // Remove the fact at the specified index
      const updatedFacts = memory.profile_facts.filter((_, index) => index !== factIndex);

      // Save the updated facts
      const response = await fetch(`${this.apiBase}/memory/save`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': this._getAuthToken()
        },
        body: JSON.stringify({
          userId: userId,
          profile_facts: updatedFacts,
          summary: memory.summary
        })
      });

      if (!response.ok) {
        throw new Error(`Delete fact failed: ${response.status}`);
      }

      const data = await response.json();

      if (data.success) {
        console.log(`✅ [MemoryClient] Fact deleted successfully`);

        // Invalidate cache
        this.cache.delete(userId);

        return { success: true };
      }

      throw new Error('Invalid response');
    } catch (error) {
      console.error('❌ [MemoryClient] Failed to delete fact:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Get memory statistics
   */
  async getStats(userId) {
    const memory = await this.getMemory(userId);

    return {
      facts_count: memory.profile_facts.length,
      summary_length: memory.summary ? memory.summary.length : 0,
      conversations: memory.counters.conversations || 0,
      searches: memory.counters.searches || 0,
      tasks: memory.counters.tasks || 0,
      last_updated: memory.updated_at
    };
  }

  /**
   * Clear cache for user
   */
  clearCache(userId = null) {
    if (userId) {
      this.cache.delete(userId);
      console.log(`🧠 [MemoryClient] Cache cleared for ${userId}`);
    } else {
      this.cache.clear();
      console.log(`🧠 [MemoryClient] All cache cleared`);
    }
  }

  /**
   * Private: Get from cache
   */
  _getCached(userId) {
    const cached = this.cache.get(userId);
    if (!cached) return null;

    const age = Date.now() - cached.timestamp;
    if (age > this.cacheTTL) {
      this.cache.delete(userId);
      return null;
    }

    return cached.data;
  }

  /**
   * Private: Set cache
   */
  _setCached(userId, data) {
    this.cache.set(userId, {
      data,
      timestamp: Date.now()
    });
  }

  /**
   * Private: Get auth token
   */
  _getAuthToken() {
    const token = localStorage.getItem('zantara-token');
    return token ? `Bearer ${token}` : '';
  }

  /**
   * Private: Get empty memory structure
   */
  _getEmptyMemory(userId) {
    return {
      user_id: userId,
      profile_facts: [],
      summary: '',
      counters: {
        conversations: 0,
        searches: 0,
        tasks: 0
      },
      updated_at: new Date().toISOString()
    };
  }

  /**
   * Get current user ID from localStorage
   */
  getCurrentUserId() {
    const email = localStorage.getItem('zantara-email');
    if (email) return email;

    const user = localStorage.getItem('zantara-user');
    if (user) {
      try {
        const userData = JSON.parse(user);
        return userData.email || userData.id || 'anonymous';
      } catch (e) {
        return 'anonymous';
      }
    }

    return 'anonymous';
  }
}

// Create global instance
window.MEMORY_CLIENT = new ZantaraMemoryClient();

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
  module.exports = ZantaraMemoryClient;
}
