/* eslint-disable no-undef */
/**
 * ZANTARA Team Analytics Client
 * Provides team analytics and performance metrics
 * Refactored to use UnifiedAPIClient
 */

class TeamAnalyticsClient {
    constructor(config = {}) {
        this.config = {
            apiUrl: window.API_CONFIG?.backend?.url,
            endpoints: window.API_ENDPOINTS?.team || {},
            ...config
        };

        // Use unified API client if available, fallback to fetch
        this.api = window.apiClient || new window.UnifiedAPIClient({ baseURL: this.config.apiUrl });
    }

    /**
     * Get performance trends
     */
    async getPerformanceTrends(userEmail, weeks = 4) {
        try {
            const endpoint = `${this.config.endpoints.trends}?user_email=${userEmail}&weeks=${weeks}`;
            return await this.api.get(endpoint);
        } catch (error) {
            console.error('Failed to get performance trends:', error);
            if (window.toast) {
                window.toast.error('Failed to load performance trends');
            }
            throw error;
        }
    }

    /**
     * Get skill gaps analysis
     */
    async getSkillGaps(userEmail) {
        try {
            const endpoint = `${this.config.endpoints.skills}?user_email=${userEmail}`;
            return await this.api.get(endpoint);
        } catch (error) {
            console.error('Failed to get skill gaps:', error);
            if (window.toast) {
                window.toast.error('Failed to load skill analysis');
            }
            throw error;
        }
    }

    /**
     * Get workload distribution
     */
    async getWorkloadDistribution(teamId) {
        try {
            const endpoint = `${this.config.endpoints.workload}?team_id=${teamId}`;
            return await this.api.get(endpoint);
        } catch (error) {
            console.error('Failed to get workload distribution:', error);
            if (window.toast) {
                window.toast.error('Failed to load workload data');
            }
            throw error;
        }
    }

    /**
     * Get collaboration patterns
     */
    async getCollaborationPatterns(teamId) {
        try {
            const endpoint = `${this.config.endpoints.collaboration}?team_id=${teamId}`;
            return await this.api.get(endpoint);
        } catch (error) {
            console.error('Failed to get collaboration patterns:', error);
            if (window.toast) {
                window.toast.error('Failed to load collaboration data');
            }
            throw error;
        }
    }

    /**
     * Get response times
     */
    async getResponseTimes(userEmail) {
        try {
            const endpoint = `${this.config.endpoints.responseTimes}?user_email=${userEmail}`;
            return await this.api.get(endpoint);
        } catch (error) {
            console.error('Failed to get response times:', error);
            if (window.toast) {
                window.toast.error('Failed to load response metrics');
            }
            throw error;
        }
    }

    /**
     * Get client satisfaction metrics
     */
    async getClientSatisfaction(userEmail) {
        try {
            const endpoint = `${this.config.endpoints.satisfaction}?user_email=${userEmail}`;
            return await this.api.get(endpoint);
        } catch (error) {
            console.error('Failed to get client satisfaction:', error);
            if (window.toast) {
                window.toast.error('Failed to load satisfaction metrics');
            }
            throw error;
        }
    }

    /**
     * Get knowledge sharing index
     */
    async getKnowledgeSharingIndex(teamId) {
        try {
            const endpoint = `${this.config.endpoints.knowledgeSharing}?team_id=${teamId}`;
            return await this.api.get(endpoint);
        } catch (error) {
            console.error('Failed to get knowledge sharing index:', error);
            if (window.toast) {
                window.toast.error('Failed to load knowledge sharing data');
            }
            throw error;
        }
    }
}

if (typeof window !== 'undefined') {
    window.TeamAnalyticsClient = TeamAnalyticsClient;
}

export default TeamAnalyticsClient;
