/* eslint-disable no-undef, no-console */
import { UnifiedAPIClient } from './core/unified-api-client.js';
import { API_CONFIG } from './api-config.js';

/**
 * System Handlers Client
 * Manages dynamic tool execution and system capabilities
 */
class SystemHandlersClient {
    constructor() {
        this.api = new UnifiedAPIClient({ baseURL: API_CONFIG.backend.url });
        this.config = {
            ...API_CONFIG.systemHandlers,
            cacheTTL: 10 * 60 * 1000, // 10 minutes (default, can be overridden by API_CONFIG)
        };
        this.tools = [];
        this.lastFetch = null;

        // Use unified API client
        this.api = window.apiClient || new window.UnifiedAPIClient({ baseURL: this.config.apiUrl });
    }

    /**
   * Get all available tools (with caching)
   */
    async getTools(forceRefresh = false) {
        // Check cache
        if (!forceRefresh && this.tools && this.lastFetch) {
            const age = Date.now() - this.lastFetch;
            if (age < this.config.cacheTTL) {
                console.log(`✅ Using cached tools (age: ${Math.round(age / 1000)}s)`);
                return this.tools;
            }
        }

        // Check if feature is enabled
        if (!this.config.endpoints.call) {
            console.log('ℹ️ System Handlers feature disabled (no call endpoint)');
            // Use correct endpoint: /call (not /api/v3/zantara/handlers/call)
            this.config.endpoints.call = '/call';
        }

        // Fetch from backend
        try {
            // Backend expects POST /call with body { key: 'system.handlers.tools' }
            // NOT /call/tools
            const endpoint = this.config.endpoints.call;
            console.log(`🔧 Fetching tools from: ${this.baseURL}${endpoint}`);
            const data = await this.api.post(endpoint, { key: 'system.handlers.tools' });

            // Backend returns { ok: true, tools: [...] } or { tools: [...] }
            this.tools = data.tools || data.data?.tools || [];
            this.lastFetch = Date.now();
            
            console.log(`✅ Received ${this.tools.length} tools from backend`);
            if (this.tools.length > 0) {
                console.log(`📋 Sample tools:`, this.tools.slice(0, 3).map(t => t.name || t.key || t.handler));
            }

            // Cache in localStorage
            try {
                localStorage.setItem('zantara-tools', JSON.stringify({
                    tools: this.tools,
                    timestamp: this.lastFetch
                }));
            } catch (error) {
                console.warn('Failed to cache tools in localStorage:', error);
            }

            console.log(`✅ Fetched ${this.tools.length} tools from backend`);
            return this.tools;
        } catch (error) {
            console.error('Failed to fetch tools:', error);

            // Try to load from localStorage as fallback
            try {
                const cached = localStorage.getItem('zantara-tools');
                if (cached) {
                    const { tools, timestamp } = JSON.parse(cached);
                    const age = Date.now() - timestamp;
                    if (age < 60 * 60 * 1000) { // 1 hour max for fallback
                        console.log(`⚠️ Using stale cached tools (age: ${Math.round(age / 1000 / 60)}min)`);
                        this.tools = tools;
                        return tools;
                    }
                }
            } catch (cacheError) {
                console.warn('Failed to load cached tools:', cacheError);
            }

            // Return empty array instead of throwing
            console.warn('⚠️ Returning empty tools array');
            return [];
        }
    }

    /**
     * Filter tools relevant to a query
     */
    filterToolsForQuery(query, allTools) {
        if (!query || !allTools || allTools.length === 0) return [];

        const queryLower = query.toLowerCase();
        const keywords = queryLower.split(/\s+/);

        return allTools.filter(tool => {
            const toolName = (tool.name || '').toLowerCase();
            const toolDesc = (tool.description || '').toLowerCase();
            const toolText = `${toolName} ${toolDesc}`;

            // Match if any keyword appears in tool name or description
            return keywords.some(keyword => toolText.includes(keyword));
        }).slice(0, 10); // Limit to 10 most relevant tools
    }

    /**
     * Call a specific handler
     */
    async callHandler(handlerKey, params = {}) {
        try {
            return await this.api.post(this.config.endpoints.call, { key: handlerKey, ...params });
        } catch (error) {
            console.error(`Handler call failed: ${handlerKey}`, error);
            if (window.toast) window.toast.error(`Failed to call handler: ${handlerKey}`);
            throw error;
        }
    }
}

if (typeof window !== 'undefined') {
    window.SystemHandlersClient = SystemHandlersClient;
}

export default SystemHandlersClient;
