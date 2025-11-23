/**
 * RAG Handlers - Unified Module
 * Consolidates all RAG backend integration
 * Feature #11: RAG Query + Semantic Search + Embeddings
 */

import logger from '../../services/logger.js';
import { ragService } from '../../services/ragService.js';
import type { RAGQueryResponse, BaliZeroResponse } from '../../services/ragService.js';

const RAG_BACKEND_URL = process.env.RAG_BACKEND_URL || 'https://nuzantara-rag.fly.dev';

// ============================================================================
// HANDLER FUNCTIONS (for Handler Registry)
// ============================================================================

/**
 * RAG Query - Generate answer using Ollama + Qdrant
 * Handler: rag.query (Feature #11)
 */
export async function ragQuery(params: any): Promise<RAGQueryResponse> {
  const {
    query,
    k = 5,
    use_llm = true,
    collection = 'legal_unified', // Default: 1536-dim OpenAI embeddings
    conversation_history,
    user_id = 'guest',
    user_email = 'guest@demo.com',
  } = params;

  if (!query) {
    throw new Error('Query parameter is required');
  }

  try {
    const result = await ragService.generateAnswer({
      query,
      k,
      use_llm,
      collection, // Pass collection to service
      conversation_history,
      user_id,
      user_email,
    });

    return result;
  } catch (error: any) {
    logger.error('RAG query error:', error instanceof Error ? error : new Error(String(error)));
    return {
      success: false,
      query,
      sources: [],
      error: error.message || 'RAG service unavailable',
    };
  }
}

/**
 * Bali Zero Chat - Intelligent Haiku/Sonnet routing
 * Handler: bali.zero.chat
 * Specialized for immigration/visa queries
 */
import { zantaraRouter } from '../../services/zantara-router.js';

export async function baliZeroChat(params: any): Promise<BaliZeroResponse> {
  const { query, conversation_history, user_role = 'member', user_email } = params;

  if (!query) {
    throw new Error('Query parameter is required');
  }

  logger.info(`🔐 [baliZeroChat] Forwarding to Zantara Router with user_email: ${user_email || 'NONE'}`);

  try {
    // Use Zantara Router (Smart Broker)
    const routerResult = await zantaraRouter.handleRequest({
      message: query,
      user_email: user_email || 'guest'
    });

    return {
      success: true,
      response: routerResult.response,
      sources: [],
      model_used: routerResult.source || 'zantara-smart-broker',
      token_usage: { total_tokens: 0, prompt_tokens: 0, completion_tokens: 0 }, // Oracle doesn't return usage yet
      execution_time: 0
    };

  } catch (error: any) {
    logger.error('Bali Zero chat error:', error instanceof Error ? error : new Error(String(error)));
    throw error;
  }
}

/**
 * RAG Search - Fast semantic search (no LLM)
 * Handler: rag.search
 */
export async function ragSearch(params: any) {
  const { query, k = 5, collection = 'legal_unified' } = params;

  if (!query) {
    throw new Error('Query parameter is required');
  }

  try {
    const result = await ragService.search(query, k, collection);
    return result;
  } catch (error: any) {
    logger.error('RAG search error:', error instanceof Error ? error : new Error(String(error)));
    throw error;
  }
}

/**
 * RAG Health Check
 * Handler: rag.health
 */
export async function ragHealth() {
  try {
    const isHealthy = await ragService.healthCheck();

    return {
      success: true,
      status: isHealthy ? 'healthy' : 'unhealthy',
      rag_backend: isHealthy,
      backend_url: process.env.RAG_BACKEND_URL || 'http://localhost:8000',
    };
  } catch (error: any) {
    return {
      success: false,
      status: 'unhealthy',
      error: error.message,
    };
  }
}

// ============================================================================
// API ROUTE HANDLERS (for Direct API Access)
// ============================================================================

/**
 * Direct query to RAG backend - for API routes
 */
export interface RAGQueryParams {
  query: string;
  collection?: string;
  limit?: number;
  metadata_filter?: Record<string, any>;
}

export async function ragQueryDirect(params: RAGQueryParams) {
  const { query, collection, limit = 10, metadata_filter } = params;

  try {
    logger.info('RAG query:', { query, collection, limit });

    const response = await fetch(`${RAG_BACKEND_URL}/api/query`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        query,
        collection: collection || 'kbli_unified',
        limit,
        metadata_filter,
      }),
    });

    if (!response.ok) {
      throw new Error(`RAG backend error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();

    return {
      ok: true,
      results: (data as any).results || [],
      count: (data as any).count || 0,
      collection: collection || 'kbli_unified',
      query,
    };
  } catch (error: any) {
    logger.error('RAG query error:', error instanceof Error ? error : new Error(String(error)));
    throw new Error(`RAG query failed: ${error?.message || 'Unknown error'}`);
  }
}

/**
 * Semantic search across multiple collections
 */
export interface SemanticSearchParams {
  query: string;
  collections: string[];
  limit?: number;
  threshold?: number;
}

export async function semanticSearch(params: SemanticSearchParams) {
  const { query, collections, limit = 10, threshold = 0.7 } = params;

  try {
    logger.info('Semantic search:', { query, collections, limit });

    const response = await fetch(`${RAG_BACKEND_URL}/api/semantic-search`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        query,
        collections,
        limit,
        threshold,
      }),
    });

    if (!response.ok) {
      throw new Error(`RAG backend error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();

    return {
      ok: true,
      results: (data as any).results || [],
      collections_searched: collections,
      total_results: (data as any).total_results || 0,
      query,
    };
  } catch (error: any) {
    logger.error('Semantic search error:', error instanceof Error ? error : new Error(String(error)));
    throw new Error(`Semantic search failed: ${error?.message || 'Unknown error'}`);
  }
}

/**
 * Get list of available collections
 */
export async function getCollections() {
  try {
    logger.info('Getting RAG collections');

    const response = await fetch(`${RAG_BACKEND_URL}/api/collections`);

    if (!response.ok) {
      throw new Error(`RAG backend error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();

    const collections = (data as any).collections || [];
    const collectionsArray = collections.map((col: any) => ({
      name: col.name,
      description: col.description,
      document_count: 0,
    }));

    return {
      ok: true,
      collections: collectionsArray,
      total_collections: (data as any).total || collectionsArray.length,
      total_documents: 0,
    };
  } catch (error: any) {
    logger.error('Get collections error:', error instanceof Error ? error : new Error(String(error)));
    throw new Error(`Failed to get collections: ${error?.message || 'Unknown error'}`);
  }
}

/**
 * Generate embeddings for text
 */
export interface EmbeddingParams {
  text: string;
  model?: string;
}

export async function generateEmbeddings(params: EmbeddingParams) {
  const { text, model = 'all-MiniLM-L6-v2' } = params;

  try {
    logger.info('Generating embeddings:', { text_length: text.length, model });

    const response = await fetch(`${RAG_BACKEND_URL}/api/embeddings`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        text,
        model,
      }),
    });

    if (!response.ok) {
      throw new Error(`RAG backend error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();

    return {
      ok: true,
      embeddings: (data as any).embeddings || [],
      dimensions: (data as any).dimensions || 384,
      model,
    };
  } catch (error: any) {
    logger.error('Generate embeddings error:', error instanceof Error ? error : new Error(String(error)));
    throw new Error(`Failed to generate embeddings: ${error?.message || 'Unknown error'}`);
  }
}

/**
 * Get RAG backend health status
 */
export async function getRagHealth() {
  try {
    const response = await fetch(`${RAG_BACKEND_URL}/health`, {
      method: 'GET',
    });

    if (!response.ok) {
      return {
        ok: false,
        status: 'unhealthy',
        error: `HTTP ${response.status}`,
      };
    }

    const data = await response.json();

    return {
      ok: true,
      status: 'healthy',
      data,
    };
  } catch (error: any) {
    logger.error('RAG health check error:', error instanceof Error ? error : new Error(String(error)));
    return {
      ok: false,
      status: 'unhealthy',
      error: error?.message || 'Connection failed',
    };
  }
}
