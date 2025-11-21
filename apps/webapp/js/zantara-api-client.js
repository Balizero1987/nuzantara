/**
 * ZANTARA API Client - Unified Client
 * Consolidates all API calls with backend routing
 */

class ZantaraAPIClient {
  constructor() {
    this.config = {
      backend: window.API_CONFIG?.backend?.url || 'http://localhost:8080',
      rag: window.API_CONFIG?.rag?.url || 'http://localhost:8000',
      timeout: 30000,
      retries: 3
    };
  }

  async call(service, endpoint, data = {}) {
    const url = service === 'rag'
      ? `${this.config.rag}${endpoint}`
      : `${this.config.backend}${endpoint}`;

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...this.getAuthHeaders()
      },
      body: JSON.stringify(data)
    });

    return response.json();
  }

  async streamChat(message, options = {}) {
    const response = await fetch(`${this.config.rag}/bali-zero/chat-stream`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...this.getAuthHeaders()
      },
      body: JSON.stringify({
        query: message,
        user_email: options.userEmail,
        conversation_history: options.conversationHistory
      })
    });

    return response.body;
  }

  getAuthHeaders() {
    const token = localStorage.getItem('zantara-token');
    return token ? { 'Authorization': `Bearer ${token}` } : {};
  }
}

window.ZantaraAPIClient = new ZantaraAPIClient();