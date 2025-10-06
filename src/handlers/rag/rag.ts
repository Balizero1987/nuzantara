/**
 * RAG Handlers - Proxy to Python RAG backend
 * Integrates Ollama LLM and Bali Zero routing
 */

import { ragService } from '../../services/ragService.js';
import type { Request } from 'express';
import type { RAGQueryResponse, BaliZeroResponse } from '../../services/ragService.js';

/**
 * RAG Query - Generate answer using Ollama + ChromaDB
 * Handler: rag.query
 */
export async function ragQuery(params: any, req?: Request): Promise<RAGQueryResponse> {
  const { query, k = 5, use_llm = true, conversation_history } = params;

  if (!query) {
    throw new Error('Query parameter is required');
  }

  try {
    const result = await ragService.generateAnswer({
      query,
      k,
      use_llm,
      conversation_history
    });

    return result;
  } catch (error: any) {
    console.error('RAG query error:', error);
    return {
      success: false,
      query,
      sources: [],
      error: error.message || 'RAG service unavailable'
    };
  }
}

/**
 * Bali Zero Chat - Intelligent Haiku/Sonnet routing
 * Handler: bali.zero.chat
 * Specialized for immigration/visa queries
 */
export async function baliZeroChat(params: any, req?: Request): Promise<BaliZeroResponse> {
  const { query, conversation_history, user_role = 'member' } = params;

  if (!query) {
    throw new Error('Query parameter is required');
  }

  try {
    const result = await ragService.baliZeroChat({
      query,
      conversation_history,
      user_role
    });

    return result;
  } catch (error: any) {
    console.error('Bali Zero chat error:', error);
    throw error;
  }
}

/**
 * RAG Search - Fast semantic search (no LLM)
 * Handler: rag.search
 */
export async function ragSearch(params: any, req?: Request) {
  const { query, k = 5 } = params;

  if (!query) {
    throw new Error('Query parameter is required');
  }

  try {
    const result = await ragService.search(query, k);
    return result;
  } catch (error: any) {
    console.error('RAG search error:', error);
    throw error;
  }
}

/**
 * RAG Health Check
 * Handler: rag.health
 */
export async function ragHealth(params: any, req?: Request) {
  try {
    const isHealthy = await ragService.healthCheck();

    return {
      success: true,
      status: isHealthy ? 'healthy' : 'unhealthy',
      rag_backend: isHealthy,
      backend_url: process.env.RAG_BACKEND_URL || 'http://localhost:8000'
    };
  } catch (error: any) {
    return {
      success: false,
      status: 'unhealthy',
      error: error.message
    };
  }
}