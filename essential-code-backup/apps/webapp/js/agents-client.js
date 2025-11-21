/* eslint-disable no-undef */
/**
 * ZANTARA Agents Client
 * Handles Compliance, Journey, and Research agents
 * Refactored to use UnifiedAPIClient
 */

class AgentsClient {
    constructor(config = {}) {
        this.config = {
            apiUrl: window.API_CONFIG?.backend?.url || 'https://nuzantara-rag.fly.dev',
            endpoints: window.API_ENDPOINTS?.agents || {},
            ...config
        };

        // Use unified API client
        this.api = window.apiClient || new window.UnifiedAPIClient({ baseURL: this.config.apiUrl });
    }

    // ========================================================================
    // COMPLIANCE AGENT
    // ========================================================================

    async getComplianceAlerts() {
        try {
            return await this.api.get(this.config.endpoints.compliance);
        } catch (error) {
            console.error('Failed to fetch compliance alerts:', error);
            if (window.toast) window.toast.error('Failed to load compliance alerts');
            throw error;
        }
    }

    // ========================================================================
    // CLIENT JOURNEY AGENT
    // ========================================================================

    async getNextSteps(clientId) {
        try {
            return await this.api.get(`${this.config.endpoints.journey}?client_id=${clientId}`);
        } catch (error) {
            console.error('Failed to fetch next steps:', error);
            if (window.toast) window.toast.error('Failed to load client journey');
            return null;
        }
    }

    // ========================================================================
    // RESEARCH AGENT
    // ========================================================================

    async startResearch(params) {
        try {
            const result = await this.api.post(this.config.endpoints.research, params);
            if (window.toast) window.toast.success('Research started successfully');
            return result;
        } catch (error) {
            console.error('Failed to start research:', error);
            if (window.toast) window.toast.error('Failed to start research');
            return null;
        }
    }
}

if (typeof window !== 'undefined') {
    window.AgentsClient = AgentsClient;
}

export default AgentsClient;
