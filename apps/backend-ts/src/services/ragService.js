/**
 * RAG Service - Proxy to Python RAG backend
 * Integrates Ollama LLM and Bali Zero (Haiku/Sonnet)
 */
import logger from './logger.js';
import axios from 'axios';
export class RAGService {
    client;
    baseURL;
    constructor() {
        // URL del backend Python RAG
        this.baseURL = process.env.RAG_BACKEND_URL || 'http://localhost:8000';
        this.client = axios.create({
            baseURL: this.baseURL,
            timeout: 90000, // 90 seconds (cold start tolerance)
            headers: {
                'Content-Type': 'application/json'
            }
        });
    }
    /**
     * Make request to RAG backend (public endpoint - no auth needed)
     */
    async makeAuthenticatedRequest(method, path, data) {
        try {
            // RAG backend is public (allUsers) - no authentication needed
            const response = await this.client.request({
                method,
                url: path,
                data
            });
            return response.data;
        }
        catch (error) {
            logger.error('RAG backend request failed:', {
                method,
                path,
                error: error.message,
                response: error.response?.data,
                status: error.response?.status
            });
            throw new Error(error.response?.data?.detail || error.message || 'Search service unavailable');
        }
    }
    /**
     * Check if RAG backend is healthy
     */
    async healthCheck() {
        try {
            const data = await this.makeAuthenticatedRequest('get', '/health');
            return data.status === 'healthy';
        }
        catch (error) {
            logger.error('RAG backend health check failed:', error);
            return false;
        }
    }
    /**
     * Generate answer using RAG + Ollama
     * Use for general knowledge base queries
     */
    async generateAnswer(request) {
        try {
            return await this.makeAuthenticatedRequest('post', '/search', request);
        }
        catch (error) {
            logger.error('RAG generate error:', error);
            return {
                success: false,
                query: request.query,
                sources: [],
                error: error.message || 'RAG service unavailable'
            };
        }
    }
    /**
     * Bali Zero chat - intelligent routing (Haiku/Sonnet)
     * Use for immigration/visa specialized queries
     */
    async baliZeroChat(request) {
        try {
            return await this.makeAuthenticatedRequest('post', '/bali-zero/chat', request);
        }
        catch (error) {
            logger.error('Bali Zero error:', error);
            throw new Error(error.response?.data?.detail || 'Bali Zero service unavailable');
        }
    }
    /**
     * Search only (no LLM generation)
     * Use for fast semantic search
     */
    async search(query, k = 5) {
        try {
            return await this.makeAuthenticatedRequest('post', '/search', {
                query,
                k,
                use_llm: false
            });
        }
        catch (error) {
            logger.error('Search error:', error);
            throw new Error('Search service unavailable');
        }
    }
}
// Singleton instance
export const ragService = new RAGService();
