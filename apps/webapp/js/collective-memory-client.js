/* eslint-disable no-undef */
/**
 * ZANTARA Collective Memory Client
 * Manages collective memory and team insights
 * Refactored to use UnifiedAPIClient
 */

class CollectiveMemoryClient {
    constructor(config = {}) {
        this.config = {
            apiUrl: window.API_CONFIG?.backend?.url || 'https://nuzantara-rag.fly.dev',
            endpoints: window.API_ENDPOINTS?.collective || {
                store: '/api/v3/zantara/collective',
                query: '/api/v3/zantara/collective'
            }, // Default endpoints if not provided
            ...config
        };

        // Use unified API client
        this.api = window.apiClient || new window.UnifiedAPIClient({ baseURL: this.config.apiUrl });
    }

    /**
     * Store an insight to collective memory
     */
    async storeInsight(category, content, metadata = {}) {
        try {
            const data = {
                query: `Store ${category}: ${content}`, // Keep original query format for backend
                category,
                metadata: {
                    ...metadata,
                    timestamp: new Date().toISOString(),
                    source: 'chat'
                }
            };

            const result = await this.api.post(this.config.endpoints.store, data);

            if (window.toast) {
                window.toast.success('Insight saved to collective memory');
            }
            console.log(`✅ Collective insight stored: ${category}`);
            return result;
        } catch (error) {
            console.error('Failed to store insight:', error);
            if (window.toast) {
                window.toast.error('Failed to save insight');
            }
            throw error; // Re-throw to allow further handling if needed
        }
    }

    /**
     * Query collective memory
     */
    async queryCollective(query, filters = {}) {
        try {
            const endpoint = this.config.endpoints.query || '/api/v3/zantara/collective';

            // Use POST for query as required by backend
            const data = await this.api.post(endpoint, {
                query,
                filters
            });

            if (data.success && data.data) {
                console.log(`✅ Collective query returned ${data.data.collective_insights?.length || 0} insights`);
                return data.data.collective_insights || [];
            }

            return [];
        } catch (error) {
            console.error('Failed to query collective memory:', error);
            return [];
        }
    }

    /**
     * Get user preferences from collective memory
     */
    async getUserPreferences(userId) {
        const insights = await this.queryCollective(`user preferences for ${userId}`, {
            category: 'preference',
            user_id: userId
        });
        return insights;
    }

    /**
     * Get team milestones
     */
    async getTeamMilestones(teamId) {
        const insights = await this.queryCollective(`team milestones for ${teamId}`, {
            category: 'milestone',
            team_id: teamId
        });
        return insights;
    }

    /**
     * Auto-detect and store important insights from chat
     */
    async autoStoreFromChat(message, response, metadata = {}) {
        // Detect important patterns
        const patterns = {
            preference: /prefer|like|want|need|always|never/i,
            fact: /is|are|was|were|will be|has been/i,
            milestone: /completed|achieved|reached|finished|done/i,
            relationship: /client|customer|partner|team|member/i
        };

        for (const [category, pattern] of Object.entries(patterns)) {
            if (pattern.test(message) || pattern.test(response)) {
                await this.storeInsight(category, response.substring(0, 200), {
                    user_message: message,
                    ...metadata
                });
                break; // Store only one category per message
            }
        }
    }

    /**
     * Display collective insights in UI
     */
    displayInsights(insights, containerId = 'collective-insights') {
        const container = document.getElementById(containerId);
        if (!container || insights.length === 0) return;

        container.innerHTML = `
      <div class="collective-insights-widget">
        <h4>💡 Collective Insights</h4>
        <div class="insights-list">
          ${insights.slice(0, 5).map(insight => `
            <div class="insight-item">
              <span class="insight-icon">${this.getCategoryIcon(insight.category)}</span>
              <span class="insight-text">${insight.content || insight.snippet}</span>
            </div>
          `).join('')}
        </div>
      </div>
    `;
    }

    getCategoryIcon(category) {
        const icons = {
            'fact': '📚',
            'preference': '⭐',
            'milestone': '🎯',
            'relationship': '🤝'
        };
        return icons[category] || '💡';
    }
}

if (typeof window !== 'undefined') {
    window.CollectiveMemoryClient = CollectiveMemoryClient;
}
