// Memory Vector Service for ZANTARA v5.2.0
// Integrates with Python RAG backend for semantic memory search via embeddings
import logger from './logger.js';
import axios from 'axios';
import { getCachedEmbedding, getCachedSearch } from './memory-cache.js';

const RAG_BACKEND_URL = process.env.RAG_BACKEND_URL || 'http://localhost:8000';

// Unused interface - commented out
/*
interface EmbeddingResponse {
  embedding: number[];
  dimensions: number;
  model: string;
}
*/

interface VectorSearchResult {
  id: string;
  userId: string;
  content: string;
  type: string;
  timestamp: string;
  entities: string[];
  similarity: number;
}

/**
 * Generate embedding for text using Python RAG backend
 * Uses existing EmbeddingsGenerator (sentence-transformers or OpenAI)
 * WITH CACHING for performance optimization
 */
export async function generateEmbedding(text: string): Promise<number[]> {
  try {
    // Use cache wrapper
    const { embedding, cached } = await getCachedEmbedding(text, async () => {
      // Call Python RAG backend to generate embedding
      const response = await axios.post(`${RAG_BACKEND_URL}/api/memory/embed`, {
        text,
        model: 'sentence-transformers', // Use FREE local embeddings
      });
      return response.data.embedding;
    });

    if (cached) {
      logger.info(`⚡ Embedding cache HIT for: "${text.substring(0, 40)}..."`);
    }

    return embedding;
  } catch (error: any) {
    logger.error(
      `⚠️ Embedding generation failed (${RAG_BACKEND_URL}/api/memory/embed):`,
      error?.message
    );
    // Fallback: return zero vector (won't work for search but won't crash)
    return new Array(384).fill(0); // sentence-transformers dimension
  }
}

/**
 * Store memory in ChromaDB for semantic search
 * Creates a new collection "zantara_memories" alongside existing "zantara_books"
 */
export async function storeMemoryVector(params: {
  memoryId: string;
  userId: string;
  content: string;
  type: string;
  timestamp: string;
  entities: string[];
}): Promise<boolean> {
  try {
    const { memoryId, userId, content, type, timestamp, entities } = params;

    // Generate embedding
    const embedding = await generateEmbedding(content);

    // Store in ChromaDB via Python backend
    await axios.post(`${RAG_BACKEND_URL}/api/memory/store`, {
      id: memoryId,
      document: content,
      embedding,
      metadata: {
        userId,
        type,
        timestamp,
        entities: entities.join(','), // ChromaDB metadata must be strings
        created_at: new Date().toISOString(),
      },
    });

    logger.info(`✅ Memory vector stored: ${memoryId} for ${userId}`);
    return true;
  } catch (error: any) {
    logger.error(
      `⚠️ Vector storage failed (${RAG_BACKEND_URL}/api/memory/store):`,
      error?.response?.data || error?.message
    );
    return false;
  }
}

/**
 * Enhanced semantic search across all memories using vector similarity
 * WITH CACHING, filtering, and relevance scoring
 */
export async function searchMemoriesSemantica(params: {
  query: string;
  userId?: string;
  limit?: number;
  threshold?: number;
  entityFilter?: string;
  typeFilter?: string;
}): Promise<VectorSearchResult[]> {
  try {
    const { query, userId, limit = 10, threshold = 0.7, entityFilter, typeFilter } = params;

    // Enhanced cache key with all filters
    const cacheKey = `${query}|${userId || 'all'}|${threshold}|${entityFilter || 'none'}|${typeFilter || 'none'}`;
    const { results: cachedResults, cached } = await getCachedSearch(
      cacheKey,
      userId,
      limit,
      async () => {
        // Generate query embedding (also cached)
        const queryEmbedding = await generateEmbedding(query);

        // Build comprehensive metadata filter
        const metadataFilter: any = {};
        if (userId) metadataFilter.userId = userId;
        if (entityFilter) metadataFilter.entities = { $contains: entityFilter };
        if (typeFilter) metadataFilter.type = typeFilter;

        // Search ChromaDB with enhanced parameters
        const response = await axios.post(`${RAG_BACKEND_URL}/api/memory/search`, {
          query_embedding: queryEmbedding,
          limit: Math.ceil(limit * 1.5), // Get more results to filter by threshold
          n_results: limit * 2, // Ensure we get enough results
          metadata_filter: Object.keys(metadataFilter).length > 0 ? metadataFilter : undefined,
          include_metadata: true,
          include_documents: true,
          include_distances: true,
        });

        // Transform and filter results
        const results = response.data.results || [];
        const transformedResults = results
          .map((r: any, idx: number) => {
            const similarity = 1 / (1 + (response.data.distances?.[idx] || 1));

            return {
              id: response.data.ids?.[idx] || r.id,
              userId: r.metadata?.userId || r.user_id,
              content: r.document || r.content,
              type: r.metadata?.type || r.type,
              timestamp: r.metadata?.timestamp || r.created_at,
              entities: r.metadata?.entities
                ? Array.isArray(r.metadata.entities)
                  ? r.metadata.entities
                  : r.metadata.entities.split(',')
                : [],
              similarity,
              score: (similarity * (r.metadata?.importance || 5)) / 10, // Boost by importance
              metadata: r.metadata,
            };
          })
          .filter((result) => result.similarity >= threshold) // Filter by threshold
          .sort((a, b) => b.score - a.score) // Sort by relevance score
          .slice(0, limit); // Limit results

        logger.info(
          `🔍 Vector search: ${results.length} raw → ${transformedResults.length} filtered results`
        );
        return transformedResults;
      }
    );

    if (cached) {
      logger.info(`⚡ Search cache HIT for: "${query.substring(0, 40)}..."`);
    }

    return cachedResults;
  } catch (error: any) {
    logger.info('⚠️ Enhanced semantic search failed:', error?.message);
    return [];
  }
}

/**
 * Hybrid search: Combine keyword + semantic search
 * Returns best results from both approaches
 */
export async function hybridMemorySearch(params: {
  query: string;
  userId?: string;
  limit?: number;
}): Promise<VectorSearchResult[]> {
  const { query, userId, limit = 10 } = params;

  // Run semantic search
  const vectorResults = await searchMemoriesSemantica({ query, userId, limit: limit * 2 });

  // TODO: Combine with keyword search from Firestore (memory-firestore.ts)
  // For now, just return semantic results
  return vectorResults.slice(0, limit);
}

/**
 * Get similar memories (find memories similar to given memory)
 */
export async function findSimilarMemories(params: {
  memoryId: string;
  limit?: number;
}): Promise<VectorSearchResult[]> {
  try {
    const { memoryId, limit = 5 } = params;

    // Get the memory's embedding from ChromaDB
    const response = await axios.post(`${RAG_BACKEND_URL}/api/memory/similar`, {
      memory_id: memoryId,
      limit,
    });

    return response.data.results.map((r: any, idx: number) => ({
      id: response.data.ids[idx],
      userId: r.metadata.userId,
      content: r.document,
      type: r.metadata.type,
      timestamp: r.metadata.timestamp,
      entities: r.metadata.entities ? r.metadata.entities.split(',') : [],
      similarity: 1 / (1 + response.data.distances[idx]),
    }));
  } catch (error: any) {
    logger.info('⚠️ Similar memory search failed:', error?.message);
    return [];
  }
}

/**
 * Delete memory from vector store
 */
export async function deleteMemoryVector(memoryId: string): Promise<boolean> {
  try {
    await axios.delete(`${RAG_BACKEND_URL}/api/memory/${memoryId}`);
    logger.info(`✅ Memory vector deleted: ${memoryId}`);
    return true;
  } catch (error: any) {
    logger.info('⚠️ Vector deletion failed:', error?.message);
    return false;
  }
}

/**
 * Get collection stats for memory vectors
 */
export async function getMemoryVectorStats(): Promise<{
  total_memories: number;
  users: number;
  collection_size_mb: number;
}> {
  try {
    const response = await axios.get(`${RAG_BACKEND_URL}/api/memory/stats`);
    return response.data;
  } catch (error: any) {
    logger.info('⚠️ Stats retrieval failed:', error?.message);
    return {
      total_memories: 0,
      users: 0,
      collection_size_mb: 0,
    };
  }
}
