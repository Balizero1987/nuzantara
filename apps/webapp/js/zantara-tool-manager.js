/**
 * ZANTARA Tool Manager
 * Manages tool discovery, filtering, and caching for Zantara AI
 *
 * Features:
 * - Auto-loads tool definitions from backend
 * - Smart filtering based on query intent
 * - Local caching for offline support
 * - Automatic refresh every 5 minutes
 */

class ZantaraToolManager {
  constructor() {
    this.tools = []; // All tool definitions
    this.toolMap = new Map(); // Map for fast lookup
    this.lastUpdate = null; // Timestamp of last update
    this.updateInterval = 300000; // Refresh every 5 minutes
    this.isInitialized = false;
  }

  /**
   * Initialize tool manager - load definitions from backend
   */
  async initialize() {
    console.log('🔧 [ToolManager] Initializing...');

    try {
      // Call backend TypeScript to get Anthropic-formatted tool definitions
      const response = await fetch('https://nuzantara-orchestrator.fly.dev/call', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          key: 'system.handlers.tools', // Existing endpoint!
          params: {},
        }),
      });

      const data = await response.json();

      if (data.ok && data.data && data.data.tools) {
        this.tools = data.data.tools;
        this.lastUpdate = Date.now();

        // Create Map for fast lookup
        data.data.tools.forEach((tool) => {
          this.toolMap.set(tool.name, tool);
        });

        console.log(`✅ [ToolManager] Loaded ${this.tools.length} tools`);
        console.log(
          `   Sample tools: ${this.tools
            .map((t) => t.name)
            .slice(0, 5)
            .join(', ')}...`
        );

        // Cache in localStorage for offline support
        localStorage.setItem(
          'zantara_tools',
          JSON.stringify({
            tools: this.tools,
            timestamp: this.lastUpdate,
          })
        );

        this.isInitialized = true;

        // Dispatch event for other components
        window.dispatchEvent(
          new CustomEvent('tools-loaded', {
            detail: {
              count: this.tools.length,
              tools: this.tools,
            },
          })
        );

        return true;
      } else {
        throw new Error('Invalid response from tools endpoint');
      }
    } catch (error) {
      console.error('❌ [ToolManager] Failed to load tools:', error);

      // Fallback: Load from localStorage if available
      const cached = localStorage.getItem('zantara_tools');
      if (cached) {
        try {
          const data = JSON.parse(cached);
          this.tools = data.tools;
          this.lastUpdate = data.timestamp;
          this.isInitialized = true;
          console.log(`⚠️ [ToolManager] Using cached tools (${this.tools.length})`);
          return true;
        } catch (e) {
          console.error('❌ [ToolManager] Cache parse error:', e);
        }
      }

      return false;
    }
  }

  /**
   * Get relevant tools for a specific query
   * Smart filtering to avoid context overload
   */
  getToolsForQuery(query) {
    if (!this.tools || this.tools.length === 0) {
      console.warn('⚠️ [ToolManager] No tools available');
      return [];
    }

    const queryLower = query.toLowerCase();

    // 1. Pricing queries → pricing tools
    if (this._isPricingQuery(queryLower)) {
      const pricingTools = this.tools.filter(
        (t) =>
          t.name.includes('pricing') || t.name.includes('get_pricing') || t.name.includes('quote')
      );
      console.log(`🔧 [ToolManager] Pricing query detected → ${pricingTools.length} tools`);
      return pricingTools;
    }

    // 2. Team queries → team tools
    if (this._isTeamQuery(queryLower)) {
      const teamTools = this.tools.filter(
        (t) =>
          t.name.includes('team') ||
          t.name.includes('search_team_member') ||
          t.name.includes('get_team_members_list')
      );
      console.log(`🔧 [ToolManager] Team query detected → ${teamTools.length} tools`);
      return teamTools;
    }

    // 3. KBLI queries → KBLI tools
    if (this._isKBLIQuery(queryLower)) {
      const kbliTools = this.tools.filter((t) => t.name.includes('kbli'));
      console.log(`🔧 [ToolManager] KBLI query detected → ${kbliTools.length} tools`);
      return kbliTools;
    }

    // 4. Business queries → core business tools
    if (this._isBusinessQuery(queryLower)) {
      const coreToolNames = [
        'get_pricing',
        'search_team_member',
        'get_team_members_list',
        'kbli_lookup',
      ];
      const businessTools = this.tools.filter((t) => coreToolNames.includes(t.name));
      console.log(`🔧 [ToolManager] Business query detected → ${businessTools.length} tools`);
      return businessTools;
    }

    // 5. Greetings/casual → NO tools (avoid context bleeding)
    if (this._isGreeting(queryLower)) {
      console.log(`🔧 [ToolManager] Greeting detected → 0 tools (no context bleeding)`);
      return [];
    }

    // 6. Default: return limited core tools only (max 10)
    const defaultTools = this.tools
      .filter((t) => t.name.includes('pricing') || t.name.includes('team'))
      .slice(0, 10);

    console.log(`🔧 [ToolManager] Default filtering → ${defaultTools.length} tools`);
    return defaultTools;
  }

  /**
   * Query classification helpers
   */
  _isPricingQuery(query) {
    const keywords = [
      'price',
      'cost',
      'harga',
      'biaya',
      'berapa',
      'quanto costa',
      'fee',
      'pricing',
      'tarif',
    ];
    return keywords.some((k) => query.includes(k));
  }

  _isTeamQuery(query) {
    const keywords = [
      'team',
      'staff',
      'chi è',
      'chi e',
      'who is',
      'member',
      'colleague',
      'dipendente',
    ];
    return keywords.some((k) => query.includes(k));
  }

  _isKBLIQuery(query) {
    const keywords = ['kbli', 'business code', 'activity code', 'kode bisnis', 'classification'];
    return keywords.some((k) => query.includes(k));
  }

  _isBusinessQuery(query) {
    const keywords = [
      'kitas',
      'visa',
      'pt pma',
      'npwp',
      'company',
      'business',
      'tax',
      'pajak',
      'legal',
    ];
    return keywords.some((k) => query.includes(k));
  }

  _isGreeting(query) {
    const greetings = ['ciao', 'hello', 'hi', 'hey', 'hola', 'buongiorno', 'good morning'];
    // Greeting if starts with greeting AND has less than 3 words
    const startsWithGreeting = greetings.some((g) => query.startsWith(g));
    const isShort = query.split(' ').length <= 3;
    return startsWithGreeting && isShort;
  }

  /**
   * Get all tools (for admin/debug)
   */
  getAllTools() {
    return this.tools;
  }

  /**
   * Get specific tool by name
   */
  getTool(name) {
    return this.toolMap.get(name);
  }

  /**
   * Get tool count
   */
  getToolCount() {
    return this.tools.length;
  }

  /**
   * Check if tools are loaded
   */
  isLoaded() {
    return this.isInitialized && this.tools.length > 0;
  }

  /**
   * Refresh tools if cache expired
   */
  async refreshIfNeeded() {
    if (!this.lastUpdate || Date.now() - this.lastUpdate > this.updateInterval) {
      console.log('🔄 [ToolManager] Refreshing tools (cache expired)');
      await this.initialize();
    }
  }

  /**
   * Get statistics
   */
  getStats() {
    return {
      total: this.tools.length,
      lastUpdate: this.lastUpdate ? new Date(this.lastUpdate).toISOString() : null,
      isInitialized: this.isInitialized,
      categories: this._getCategories(),
    };
  }

  _getCategories() {
    const categories = {};
    this.tools.forEach((tool) => {
      const category = tool.name.split('_')[0] || 'other';
      categories[category] = (categories[category] || 0) + 1;
    });
    return categories;
  }
}

// Create global instance
window.ZANTARA_TOOLS = new ZantaraToolManager();

// Auto-initialize on page load
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', async () => {
    await window.ZANTARA_TOOLS.initialize();
    console.log('✅ [ToolManager] Ready');
  });
} else {
  // Page already loaded
  window.ZANTARA_TOOLS.initialize().then(() => {
    console.log('✅ [ToolManager] Ready');
  });
}

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
  module.exports = ZantaraToolManager;
}
