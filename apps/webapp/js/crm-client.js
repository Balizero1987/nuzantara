/* eslint-disable no-undef, no-console */
/**
 * ZANTARA CRM Client
 * Handles Clients, Practices, and Interactions
 */

class CRMClient {
    constructor(config = {}) {
        this.config = {
            apiUrl: window.API_CONFIG?.backend?.url || 'https://nuzantara-rag.fly.dev',
            endpoints: window.API_ENDPOINTS?.crm || {},
            ...config
        };
    }

    get headers() {
        return window.getAuthHeaders();
    }

    // ========================================================================
    // CLIENTS
    // ========================================================================

    async getClients(params = {}) {
        const query = new URLSearchParams(params).toString();
        const response = await fetch(`${this.config.apiUrl}${this.config.endpoints.clients}?${query}`, {
            headers: this.headers
        });
        if (!response.ok) throw new Error('Failed to fetch clients');
        return response.json();
    }

    async createClient(clientData) {
        const response = await fetch(`${this.config.apiUrl}${this.config.endpoints.clientsCreate}`, {
            method: 'POST',
            headers: this.headers,
            body: JSON.stringify(clientData)
        });
        if (!response.ok) throw new Error('Failed to create client');
        return response.json();
    }

    // ========================================================================
    // PRACTICES
    // ========================================================================

    async getPractices(params = {}) {
        const query = new URLSearchParams(params).toString();
        const response = await fetch(`${this.config.apiUrl}${this.config.endpoints.practices}?${query}`, {
            headers: this.headers
        });
        if (!response.ok) throw new Error('Failed to fetch practices');
        return response.json();
    }

    // ========================================================================
    // INTERACTIONS
    // ========================================================================

    async saveInteractionFromChat(data) {
        const response = await fetch(`${this.config.apiUrl}${this.config.endpoints.interactions}/from-conversation`, {
            method: 'POST',
            headers: this.headers,
            body: JSON.stringify(data)
        });
        if (!response.ok) throw new Error('Failed to save interaction');
        return response.json();
    }
}

if (typeof window !== 'undefined') {
    window.CRMClient = CRMClient;
}
