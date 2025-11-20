/* eslint-disable no-undef, no-console */
/**
 * ZANTARA Collective Memory Client
 * Manages persistent and collective memory across users and sessions
 */

class CollectiveMemoryClient {
    constructor(config = {}) {
        this.config = {
            apiUrl: window.API_CONFIG?.backend?.url || 'https://nuzantara-rag.fly.dev',
            collectiveEndpoint: '/api/v3/zantara/collective',
            cacheTTL: 30 * 60 * 1000, // 30 minutes
            ...config
        };
        this.insights = [];
        this.lastFetch = null;
    }

    get headers() {
        return window.getAuthHeaders();
    }

    /**
     * Store collective insight
     */
    async storeInsight(category, content, metadata = {}) {
        try {
            const response = await fetch(`${this.config.apiUrl}${this.config.collectiveEndpoint}`, {
                method: 'POST',
                headers: this.headers,
                body: JSON.stringify({
                    query: `Store ${category}: ${content}`,
                    category: category,
                    metadata: {
                        ...metadata,
                        timestamp: new Date().toISOString(),
                        source: 'chat'
                    }
                })
            });

            if (!response.ok) throw new Error('Failed to store insight');

            const data = await response.json();
            console.log(`✅ Collective insight stored: ${category}`);
            return data;
        } catch (error) {
            console.error('Failed to store collective insight:', error);
            return null;
        }
    }

    /**
     * Query collective memory
     */
    async queryCollective(query, filters = {}) {
        try {
            const response = await fetch(`${this.config.apiUrl}${this.config.collectiveEndpoint}`, {
                method: 'POST',
                headers: this.headers,
                body: JSON.stringify({
                    query: query,
                    filters: filters
                })
            });

            if (!response.ok) throw new Error('Failed to query collective');

            const data = await response.json();

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
