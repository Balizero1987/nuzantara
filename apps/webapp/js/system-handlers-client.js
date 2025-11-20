/* eslint-disable no-undef, no-console */
/**
 * ZANTARA System Handlers Client
 * Handles tool discovery and caching
 */

class SystemHandlersClient {
    constructor(config = {}) {
        this.config = {
            apiUrl: window.API_CONFIG?.backend?.url || 'https://nuzantara-rag.fly.dev',
            endpoints: window.API_ENDPOINTS?.system || {},
            cacheTTL: 10 * 60 * 1000, // 10 minutes
            ...config
        };
        this.tools = null;
        this.lastFetch = null;
    }

    get headers() {
        return window.getAuthHeaders();
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

        // Fetch from backend
        try {
            const response = await fetch(`${this.config.apiUrl}${this.config.endpoints.call}`, {
                method: 'POST',
                headers: this.headers,
                body: JSON.stringify({ key: 'system.handlers.tools' })
            });

            if (!response.ok) throw new Error('Failed to fetch tools');

            const data = await response.json();
            this.tools = data.tools || [];
            this.lastFetch = Date.now();

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

            throw error;
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
        const response = await fetch(`${this.config.apiUrl}${this.config.endpoints.call}`, {
            method: 'POST',
            headers: this.headers,
            body: JSON.stringify({ key: handlerKey, ...params })
        });

        if (!response.ok) throw new Error(`Handler call failed: ${handlerKey}`);
        return response.json();
    }
}

if (typeof window !== 'undefined') {
    window.SystemHandlersClient = SystemHandlersClient;
}
