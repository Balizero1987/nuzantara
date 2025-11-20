import { UnifiedAPIClient } from './core/unified-api-client.js';

/**
 * CRM Client
 * Handles client management, practice tracking, and interaction logging
 */
class CRMClient {
    constructor() {
        this.api = new UnifiedAPIClient();
        this.config = window.API_CONFIG || {};
    }

    // ========================================================================
    // CLIENTS
    // ========================================================================

    async getClients(params = {}) {
        try {
            const query = new URLSearchParams(params).toString();
            return await this.api.get(`${this.config.endpoints.crm.clients}?${query}`);
        } catch (error) {
            console.error('Failed to fetch clients:', error);
            if (window.toast) window.toast.error('Failed to load clients');
            throw error;
        }
    }

    async createClient(clientData) {
        try {
            const result = await this.api.post(this.config.endpoints.crm.clients, clientData);
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
            return await this.api.get(`${this.config.endpoints.crm.practices}?${query}`);
        } catch (error) {
            console.error('Failed to fetch practices:', error);
            if (window.toast) window.toast.error('Failed to load practices');
            throw error;
        }
    }

    // ========================================================================
    // INTERACTIONS
    // ========================================================================

    /**
     * Save interaction from chat
     * Matches InteractionCreate schema in backend
     */
    async saveInteractionFromChat(data) {
        try {
            const endpoint = this.config.endpoints.crm.interactions;

            // Prepare payload matching InteractionCreate schema
            const payload = {
                interaction_type: 'chat',
                channel: 'web_chat',
                direction: 'inbound',
                team_member: 'AI Assistant', // Default if not provided
                summary: data.summary || 'Chat conversation',
                full_content: data.messages ? JSON.stringify(data.messages) : '',
                interaction_date: new Date().toISOString(),
                ...data
            };

            // Ensure required fields
            if (!payload.client_id && data.user_email) {
                // Note: Backend handles client lookup via email in specialized endpoints, 
                // but for standard create we might need client_id. 
                // We proceed with what we have.
            }

            const response = await this.api.post(endpoint, payload);
            console.log('✅ Interaction saved to CRM:', response);
            return response;
        } catch (error) {
            console.warn('⚠️ Failed to save interaction:', error.message);
            // Don't throw, just log to avoid disrupting chat flow
            return null;
        }
    }

    /**
     * Save interaction from conversation (Specialized endpoint)
     * Uses POST /api/interactions/from-conversation
     */
    async saveInteractionFromConversation(conversationId, userEmail, summary) {
        try {
            const endpoint = this.config.endpoints.crm.interactions + '/from-conversation';
            const params = new URLSearchParams({
                conversation_id: conversationId,
                client_email: userEmail,
                team_member: 'AI Assistant',
                summary: summary || ''
            });

            const response = await this.api.post(`${endpoint}?${params}`);
            console.log('✅ Interaction saved from conversation:', response);
            return response;
        } catch (error) {
            console.warn('⚠️ Failed to save interaction from conversation:', error.message);
            return null;
        }
    }
}

if (typeof window !== 'undefined') {
    window.CRMClient = CRMClient;
}

export default CRMClient;
