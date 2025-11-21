/**
 * ZANTARA SSE Client - Real-time Streaming Chat
 * Connects to Llama 4 Scout backend with SSE streaming
 */

import { API_CONFIG } from './api-config.js';
import { generateSessionId } from './utils/session-id.js';

class ZantaraSSEClient {
    constructor(config = {}) {
        this.baseURL = config.baseURL || API_CONFIG.rag.url;
        this.chatEndpoint = '/bali-zero/chat';
        this.streamEndpoint = '/bali-zero/chat-stream';
        this.aiModel = 'ZANTARA AI';
        this.fallbackModel = 'ZANTARA AI';
        this.eventSource = null;
        this.abortController = null;
    }

    /**
     * Send message with SSE streaming
     */
    async sendMessage(message, options = {}) {
        const {
            onToken = () => {},
            onComplete = () => {},
            onError = () => {},
            onSources = () => {},
            onMetadata = () => {},
            sessionId = null,
            userEmail = null
        } = options;

        // Abort any existing connection
        this.abort();

        // Build query parameters
        const params = new URLSearchParams({
            query: message
        });
        
        if (sessionId) params.append('session_id', sessionId);
        if (userEmail) params.append('user_email', userEmail);

        const url = `${this.baseURL}${this.streamEndpoint}?${params}`;

        return new Promise((resolve, reject) => {
            let fullResponse = '';
            let sources = null;
            let metadata = null;

            this.eventSource = new EventSource(url);

            this.eventSource.onmessage = (event) => {
                try {
                    const data = JSON.parse(event.data);

                    switch (data.type) {
                        case 'token':
                            fullResponse += data.content;
                            onToken(data.content, data);
                            break;

                        case 'sources':
                            sources = data.sources;
                            onSources(sources);
                            break;

                        case 'metadata':
                            metadata = data;
                            onMetadata(metadata);
                            break;

                        case 'done':
                            this.close();
                            onComplete(fullResponse, sources, metadata);
                            resolve({ response: fullResponse, sources, metadata });
                            break;

                        case 'error':
                            this.close();
                            onError(data.message);
                            reject(new Error(data.message));
                            break;
                    }
                } catch (err) {
                    // Handle non-JSON messages (like pings)
                    if (event.data && event.data.trim()) {
                        console.debug('SSE ping:', event.data);
                    }
                }
            };

            this.eventSource.onerror = (error) => {
                console.error('SSE Error:', error);
                this.close();
                onError('Connection error');
                reject(error);
            };
        });
    }

    /**
     * Send non-streaming message
     */
    async sendMessageSync(message, options = {}) {
        const { sessionId, userEmail } = options;

        const response = await fetch(`${this.baseURL}${this.chatEndpoint}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                query: message,
                session_id: sessionId,
                user_email: userEmail
            })
        });

        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        return await response.json();
    }

    /**
     * Abort current connection
     */
    abort() {
        if (this.eventSource) {
            this.eventSource.close();
            this.eventSource = null;
        }
    }

    /**
     * Close connection
     */
    close() {
        this.abort();
    }
}

/**
 * ZANTARA Chat UI - Complete UI Integration
 */
class ZantaraChatUI {
    constructor(config) {
        this.client = new ZantaraSSEClient({
            baseURL: config.baseURL || 'https://nuzantara-rag.fly.dev'
        });

        // DOM elements
        this.chatContainer = config.chatContainer;
        this.inputElement = config.inputElement;
        this.sendButton = config.sendButton;
        this.typingIndicator = config.typingIndicator;
        this.sourcesContainer = config.sourcesContainer;
        this.metadataContainer = config.metadataContainer;

        // Options
        this.sessionId = config.sessionId || this.generateSessionId();
        this.userEmail = config.userEmail || null;

        // Initialize
        this.init();
    }

    init() {
        // Bind send button
        if (this.sendButton) {
            this.sendButton.addEventListener('click', () => this.handleSend());
        }

        // Bind enter key
        if (this.inputElement) {
            this.inputElement.addEventListener('keypress', (e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    this.handleSend();
                }
            });
        }
    }

    async handleSend() {
        const message = this.inputElement?.value?.trim();
        if (!message) return;

        // Clear input
        if (this.inputElement) this.inputElement.value = '';

        // Show user message
        this.addMessage('user', message);

        // Show typing indicator
        this.showTyping();

        // Create assistant message container
        const assistantMsg = this.addMessage('assistant', '');
        let currentText = '';

        try {
            await this.client.sendMessage(message, {
                sessionId: this.sessionId,
                userEmail: this.userEmail,
                
                onToken: (token) => {
                    currentText += token;
                    this.updateMessage(assistantMsg, currentText);
                },

                onSources: (sources) => {
                    this.displaySources(sources);
                },

                onMetadata: (metadata) => {
                    this.displayMetadata(metadata);
                },

                onComplete: () => {
                    this.hideTyping();
                },

                onError: (error) => {
                    this.hideTyping();
                    this.updateMessage(assistantMsg, `Error: ${error}`);
                }
            });
        } catch (error) {
            this.hideTyping();
            console.error('Chat error:', error);
        }
    }

    addMessage(role, content) {
        if (!this.chatContainer) return null;

        const messageDiv = document.createElement('div');
        messageDiv.className = `message message-${role}`;
        messageDiv.innerHTML = `
            <div class="message-content">${this.formatMessage(content)}</div>
        `;

        this.chatContainer.appendChild(messageDiv);
        this.scrollToBottom();

        return messageDiv;
    }

    updateMessage(messageEl, content) {
        if (!messageEl) return;
        const contentEl = messageEl.querySelector('.message-content');
        if (contentEl) {
            contentEl.innerHTML = this.formatMessage(content);
        }
        this.scrollToBottom();
    }

    formatMessage(text) {
        // Basic markdown formatting
        return text
            .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
            .replace(/\*(.*?)\*/g, '<em>$1</em>')
            .replace(/\n/g, '<br>');
    }

    showTyping() {
        if (this.typingIndicator) {
            this.typingIndicator.style.display = 'block';
        }
    }

    hideTyping() {
        if (this.typingIndicator) {
            this.typingIndicator.style.display = 'none';
        }
    }

    displaySources(sources) {
        if (!this.sourcesContainer || !sources?.length) return;

        this.sourcesContainer.innerHTML = '<h3>📚 Sources</h3>';
        sources.forEach((source, i) => {
            const sourceEl = document.createElement('div');
            sourceEl.className = 'source-item';
            sourceEl.innerHTML = `
                <div class="source-header">Source ${i + 1}</div>
                <div class="source-content">${source.content || source.text}</div>
                <div class="source-similarity">Relevance: ${((source.similarity || 0.8) * 100).toFixed(0)}%</div>
            `;
            this.sourcesContainer.appendChild(sourceEl);
        });

        this.sourcesContainer.style.display = 'block';
    }

    displayMetadata(metadata) {
        if (!this.metadataContainer) return;

        this.metadataContainer.innerHTML = `
            <div class="metadata-item">
                <span class="metadata-label">Model:</span>
                <span class="metadata-value">${metadata.model || 'Llama 4 Scout'}</span>
            </div>
            <div class="metadata-item">
                <span class="metadata-label">Tokens:</span>
                <span class="metadata-value">${metadata.tokens?.total || 'N/A'}</span>
            </div>
            <div class="metadata-item">
                <span class="metadata-label">Cost:</span>
                <span class="metadata-value">${metadata.cost || '$0.0003'}</span>
            </div>
        `;

        this.metadataContainer.style.display = 'block';
    }

    scrollToBottom() {
        if (this.chatContainer) {
            this.chatContainer.scrollTop = this.chatContainer.scrollHeight;
        }
    }

    generateSessionId() {
        return generateSessionId(); // Use shared utility
    }
}

// Export for use in other scripts
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { ZantaraSSEClient, ZantaraChatUI };
}
