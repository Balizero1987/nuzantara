/* eslint-disable no-undef */
import { UnifiedAPIClient } from './core/unified-api-client.js';
import { API_CONFIG } from './api-config.js';

/**
 * ZANTARA Collective Memory Client
 * Manages collective memory and team insights
 * Refactored to use UnifiedAPIClient
 */

class CollectiveMemoryClient {
    constructor() {
        this.config = {
            apiUrl: API_CONFIG.backend.url || 'https://nuzantara-rag.fly.dev',
            endpoints: API_CONFIG.endpoints.collective || {
                store: '/api/v3/zantara/collective',
                query: '/api/v3/zantara/collective'
            }, // Default endpoints if not provided
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
     * Query collective memory (Shared Memory)
     * Uses GET /api/shared-memory/search
     */
    async queryCollective(query, filters = {}) {
        try {
            const endpoint = this.config.endpoints.crm.sharedMemory + '/search';

            // Use GET for search as required by backend
            const params = new URLSearchParams({
                q: query,
                limit: filters.limit || 10
            });

            const data = await this.api.get(`${endpoint}?${params}`);

            // Backend returns { clients: [], practices: [], interactions: [], ... }
            // We normalize this to a list of insights
            // Backend returns { clients: [], practices: [], interactions: [], ... }
            // We normalize this to a list of insights
            if (data && typeof data === 'object') {
                const insights = [];

                // Add clients
                if (data.clients) {
                    data.clients.forEach(c => insights.push({
                        type: 'client',
                        content: `${c.full_name} (${c.email})`,
                        metadata: c
                    }));
                }

                // Add practices
                if (data.practices) {
                    data.practices.forEach(p => insights.push({
                        type: 'practice',
                        content: `${p.practice_type_name} for ${p.client_name} (${p.status})`,
                        metadata: p
                    }));
                }

                // Add interactions
                if (data.interactions) {
                    data.interactions.forEach(i => insights.push({
                        type: 'interaction',
                        content: `${i.interaction_type} with ${i.client_name}: ${i.summary || i.subject}`,
                        metadata: i
                    }));
                }

                console.log(`✅ Collective query returned ${insights.length} items`);
                return insights;
            }

            return [];
        } catch (error) {
            console.warn('⚠️ Failed to query collective memory:', error.message);
            // Return empty array instead of throwing to avoid breaking UI
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
