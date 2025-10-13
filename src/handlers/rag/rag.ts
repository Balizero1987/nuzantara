/**
 * RAG Handlers - Proxy to Python RAG backend
 * Integrates Ollama LLM and Bali Zero routing
 */

import logger from '../services/logger.js';
import { ragService } from '../../services/ragService.js';
import type { Request } from 'express';
import type { RAGQueryResponse, BaliZeroResponse } from '../../services/ragService.js';

/**
 * RAG Query - Generate answer using Ollama + ChromaDB
 * Handler: rag.query
 */
export async function ragQuery(params: any, _req?: Request): Promise<RAGQueryResponse> {
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
    logger.error('RAG query error:', error);
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
export async function baliZeroChat(params: any, _req?: Request): Promise<BaliZeroResponse> {
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

    // Normalize empty responses to a safe, user‑visible fallback to avoid "blank" UI replies
    // Keep the contract stable: always return a non‑empty `response` string
    const hasText = typeof result?.response === 'string' && result.response.trim().length > 0;
    const fallback = 'I could not generate a direct answer from the knowledge base. Please rephrase or ask a more specific question.';
    const normalized = {
      ...result,
      response: hasText ? result.response : fallback,
    } as BaliZeroResponse;

    return normalized;
  } catch (error: any) {
    logger.error('Bali Zero chat error:', error);
    throw error;
  }
}

/**
 * RAG Search - Fast semantic search (no LLM)
 * Handler: rag.search
 */
export async function ragSearch(params: any, _req?: Request) {
  const { query, k = 5 } = params;

  if (!query) {
    throw new Error('Query parameter is required');
  }

  try {
    const result = await ragService.search(query, k);
    return result;
  } catch (error: any) {
    logger.error('RAG search error:', error);
    throw error;
  }
}

/**
 * RAG Health Check
 * Handler: rag.health
 */
export async function ragHealth(_params: any, _req?: Request) {
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
