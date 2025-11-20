/* eslint-disable no-undef, no-console */
/**
 * ZANTARA Team Analytics Client
 * Interfaces with TeamAnalyticsService for team knowledge and performance metrics
 */

class TeamAnalyticsClient {
    constructor(config = {}) {
        this.config = {
            apiUrl: window.API_CONFIG?.backend?.url || 'https://nuzantara-rag.fly.dev',
            ...config
        };
    }

    get headers() {
        return window.getAuthHeaders();
    }

    /**
     * Get performance trends
     */
    async getPerformanceTrends(userEmail, weeks = 4) {
        try {
            const response = await fetch(
                `${this.config.apiUrl}/team/analytics/trends?user_email=${encodeURIComponent(userEmail)}&weeks=${weeks}`,
                { headers: this.headers }
            );

            if (!response.ok) throw new Error('Failed to fetch performance trends');
            return response.json();
        } catch (error) {
            console.error('Failed to get performance trends:', error);
            return null;
        }
    }

    /**
     * Get skill gaps analysis
     */
    async getSkillGaps(userEmail) {
        try {
            const response = await fetch(
                `${this.config.apiUrl}/team/analytics/skills?user_email=${encodeURIComponent(userEmail)}`,
                { headers: this.headers }
            );

            if (!response.ok) throw new Error('Failed to fetch skill gaps');
            return response.json();
        } catch (error) {
            console.error('Failed to get skill gaps:', error);
            return null;
        }
    }

    /**
     * Get workload distribution
     */
    async getWorkloadDistribution(teamId) {
        try {
            const response = await fetch(
                `${this.config.apiUrl}/team/analytics/workload?team_id=${teamId}`,
                { headers: this.headers }
            );

            if (!response.ok) throw new Error('Failed to fetch workload');
            return response.json();
        } catch (error) {
            console.error('Failed to get workload distribution:', error);
            return null;
        }
    }

    /**
     * Get collaboration patterns
     */
    async getCollaborationPatterns(teamId) {
        try {
            const response = await fetch(
                `${this.config.apiUrl}/team/analytics/collaboration?team_id=${teamId}`,
                { headers: this.headers }
            );

            if (!response.ok) throw new Error('Failed to fetch collaboration');
            return response.json();
        } catch (error) {
            console.error('Failed to get collaboration patterns:', error);
            return null;
        }
    }

    /**
     * Get response times
     */
    async getResponseTimes(userEmail) {
        try {
            const response = await fetch(
                `${this.config.apiUrl}/team/analytics/response-times?user_email=${encodeURIComponent(userEmail)}`,
                { headers: this.headers }
            );

            if (!response.ok) throw new Error('Failed to fetch response times');
            return response.json();
        } catch (error) {
            console.error('Failed to get response times:', error);
            return null;
        }
    }

    /**
     * Get client satisfaction metrics
     */
    async getClientSatisfaction(userEmail) {
        try {
            const response = await fetch(
                `${this.config.apiUrl}/team/analytics/satisfaction?user_email=${encodeURIComponent(userEmail)}`,
                { headers: this.headers }
            );

            if (!response.ok) throw new Error('Failed to fetch satisfaction');
            return response.json();
        } catch (error) {
            console.error('Failed to get client satisfaction:', error);
            return null;
        }
    }

    /**
     * Get knowledge sharing index
     */
    async getKnowledgeSharingIndex(teamId) {
        try {
            const response = await fetch(
                `${this.config.apiUrl}/team/analytics/knowledge-sharing?team_id=${teamId}`,
                { headers: this.headers }
            );

            if (!response.ok) throw new Error('Failed to fetch knowledge sharing');
            return response.json();
        } catch (error) {
            console.error('Failed to get knowledge sharing index:', error);
            return null;
        }
    }
}

if (typeof window !== 'undefined') {
    window.TeamAnalyticsClient = TeamAnalyticsClient;
}
