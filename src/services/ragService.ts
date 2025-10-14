/**
 * RAG Service - Proxy to Python RAG backend
 * Integrates Ollama LLM and Bali Zero (Haiku/Sonnet)
 */

import logger from './logger.js';
import axios, { AxiosInstance } from 'axios';

interface RAGQueryRequest {
  query: string;
  k?: number;
  use_llm?: boolean;
  conversation_history?: Array<{role: string; content: string}>;
}

export interface RAGQueryResponse {
  success: boolean;
  query: string;
  answer?: string;
  sources: Array<{
    content: string;
    metadata: Record<string, any>;
    similarity: number;
  }>;
  model_used?: string;
  error?: string;
}

interface BaliZeroRequest {
  query: string;
  conversation_history?: Array<{role: string; content: string}>;
  user_role?: 'member' | 'lead';
}

export interface BaliZeroResponse {
  success: boolean;
  response: string;
  model_used: string;
  sources: any[];
  usage?: {
    input_tokens: number;
    output_tokens: number;
  };
}

export class RAGService {
  private client: AxiosInstance;
  private baseURL: string;

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
  private async makeAuthenticatedRequest<T>(
    method: 'get' | 'post',
    path: string,
    data?: any
  ): Promise<T> {
    try {
      // RAG backend is public (allUsers) - no authentication needed
      const response = await this.client.request<T>({
        method,
        url: path,
        data
      });

      return response.data;
    } catch (error: any) {
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
  async healthCheck(): Promise<boolean> {
    try {
      const data = await this.makeAuthenticatedRequest<{status: string}>('get', '/health');
      return data.status === 'healthy';
    } catch (error) {
      logger.error('RAG backend health check failed:', error);
      return false;
    }
  }

  /**
   * Generate answer using RAG + Ollama
   * Use for general knowledge base queries
   */
  async generateAnswer(request: RAGQueryRequest): Promise<RAGQueryResponse> {
    try {
      return await this.makeAuthenticatedRequest<RAGQueryResponse>('post', '/search', request);
    } catch (error: any) {
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
  async baliZeroChat(request: BaliZeroRequest): Promise<BaliZeroResponse> {
    try {
      return await this.makeAuthenticatedRequest<BaliZeroResponse>('post', '/bali-zero/chat', request);
    } catch (error: any) {
      logger.error('Bali Zero error:', error);
      throw new Error(error.response?.data?.detail || 'Bali Zero service unavailable');
    }
  }

  /**
   * Search only (no LLM generation)
   * Use for fast semantic search
   */
  async search(query: string, k: number = 5) {
    try {
      return await this.makeAuthenticatedRequest('post', '/search', {
        query,
        k,
        use_llm: false
      });
    } catch (error: any) {
      logger.error('Search error:', error);
      throw new Error('Search service unavailable');
    }
  }
}

// Singleton instance
export const ragService = new RAGService();