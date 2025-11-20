/* eslint-disable no-undef */
/**
 * ZANTARA Agents Client
 * Handles Compliance, Journey, and Research agents
 */

class AgentsClient {
    constructor(config = {}) {
        this.config = {
            apiUrl: window.API_CONFIG?.backend?.url || 'https://nuzantara-rag.fly.dev',
            endpoints: window.API_ENDPOINTS?.agents || {},
            ...config
        };
    }

    get headers() {
        return window.getAuthHeaders();
    }

    // ========================================================================
    // COMPLIANCE AGENT
    // ========================================================================

    async getComplianceAlerts() {
        const response = await fetch(`${this.config.apiUrl}${this.config.endpoints.compliance}`, {
            headers: this.headers
        });
        if (!response.ok) throw new Error('Failed to fetch compliance alerts');
        return response.json();
    }

    // ========================================================================
    // CLIENT JOURNEY AGENT
    // ========================================================================

    async getNextSteps(clientId) {
        const response = await fetch(`${this.config.apiUrl}${this.config.endpoints.journey}?client_id=${clientId}`, {
            headers: this.headers
        });
        if (!response.ok) throw new Error('Failed to fetch next steps');
        return null;
    }

    /**
     * Start autonomous research
     */
    async startResearch(params) {
        try {
            const response = await fetch(
                `${this.config.apiUrl}${this.config.endpoints.research}`,
                {
                    method: 'POST',
                    headers: this.headers,
                    body: JSON.stringify(params)
                }
            );

            if (!response.ok) throw new Error('Failed to start research');
            return response.json();
        } catch (error) {
            console.error('Failed to start research:', error);
            return null;
        }
    }
}

if (typeof window !== 'undefined') {
    window.AgentsClient = AgentsClient;
}
