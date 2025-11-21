/**
 * RAG Query Handler
 * Direct access to RAG backend for semantic search and queries
 * Feature #10: RAG Query Direct
 */

import { logger } from '../../logging/unified-logger.js';

const RAG_BACKEND_URL = process.env.RAG_BACKEND_URL || 'https://nuzantara-rag.fly.dev';

export interface RAGQueryParams {
  query: string;
  collection?: string;
  limit?: number;
  metadata_filter?: Record<string, any>;
}

export interface SemanticSearchParams {
  query: string;
  collections: string[];
  limit?: number;
  threshold?: number;
}

export interface EmbeddingParams {
  text: string;
  model?: string;
}

interface RAGQueryResponse {
  results?: any[];
  count?: number;
}

interface SemanticSearchResponse {
  results?: any[];
  total_results?: number;
}


interface EmbeddingsResponse {
  embeddings?: number[];
  dimensions?: number;
}

/**
 * Direct query to RAG backend
 */
export async function ragQuery(params: RAGQueryParams) {
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

    const data = (await response.json()) as RAGQueryResponse;

    return {
      ok: true,
      results: data.results || [],
      count: data.count || 0,
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

    const data = (await response.json()) as SemanticSearchResponse;

    return {
      ok: true,
      results: data.results || [],
      collections_searched: collections,
      total_results: data.total_results || 0,
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

    const data = (await response.json()) as any;

    // Extract collections from Feature #10 API format
    const collections = data.collections || [];
    const collectionsArray = collections.map((col: any) => ({
      name: col.name,
      description: col.description,
      document_count: 0, // Will be populated by stats endpoint if needed
    }));

    return {
      ok: true,
      collections: collectionsArray,
      total_collections: data.total || collectionsArray.length,
      total_documents: 0, // Sum from stats if needed
    };
  } catch (error: any) {
    logger.error('Get collections error:', error instanceof Error ? error : new Error(String(error)));
    throw new Error(`Failed to get collections: ${error?.message || 'Unknown error'}`);
  }
}

/**
 * Generate embeddings for text
 */
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

    const data = (await response.json()) as EmbeddingsResponse;

    return {
      ok: true,
      embeddings: data.embeddings || [],
      dimensions: data.dimensions || 384,
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
