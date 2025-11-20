/* eslint-disable no-undef */
/**
 * ZANTARA CRM Client
 * Handles Clients, Practices, and Interactions
 * Refactored to use UnifiedAPIClient
 */

class CRMClient {
    constructor(config = {}) {
        this.config = {
            apiUrl: window.API_CONFIG?.backend?.url || 'https://nuzantara-rag.fly.dev',
            endpoints: window.API_ENDPOINTS?.crm || {},
            ...config
        };

        // Use unified API client
        this.api = window.apiClient || new window.UnifiedAPIClient({ baseURL: this.config.apiUrl });
    }

    // ========================================================================
    // CLIENTS
    // ========================================================================

    async getClients(params = {}) {
        try {
            const query = new URLSearchParams(params).toString();
            return await this.api.get(`${this.config.endpoints.clients}?${query}`);
        } catch (error) {
            console.error('Failed to fetch clients:', error);
            if (window.toast) window.toast.error('Failed to load clients');
            throw error;
        }
    }

    async createClient(clientData) {
        try {
            const result = await this.api.post(this.config.endpoints.clientsCreate, clientData);
            if (window.toast) window.toast.success('Client created successfully');
            return result;
        } catch (error) {
            console.error('Failed to create client:', error);
            if (window.toast) window.toast.error('Failed to create client');
            throw error;
        }
    }

    // ========================================================================
    // PRACTICES
    // ========================================================================

    async getPractices(params = {}) {
        try {
            const query = new URLSearchParams(params).toString();
            return await this.api.get(`${this.config.endpoints.practices}?${query}`);
        } catch (error) {
            console.error('Failed to fetch practices:', error);
            if (window.toast) window.toast.error('Failed to load practices');
            throw error;
        }
    }

    // ========================================================================
    // INTERACTIONS
    // ========================================================================

    async saveInteractionFromChat(data) {
        try {
            const result = await this.api.post(`${this.config.endpoints.interactions}/from-conversation`, data);
            if (window.toast) window.toast.success('Interaction saved');
            return result;
        } catch (error) {
            console.error('Failed to save interaction:', error);
            if (window.toast) window.toast.error('Failed to save interaction');
            throw error;
        }
    }
}

if (typeof window !== 'undefined') {
    window.CRMClient = CRMClient;
}

export default CRMClient;
