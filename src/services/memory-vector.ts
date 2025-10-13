// Memory Vector Service for ZANTARA v5.2.0
// Integrates with Python RAG backend for semantic memory search via embeddings
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
        model: 'sentence-transformers' // Use FREE local embeddings
      });
      return response.data.embedding;
    });

    if (cached) {
      console.log(`⚡ Embedding cache HIT for: "${text.substring(0, 40)}..."`);
    }

    return embedding;
  } catch (error: any) {
    console.error(`⚠️ Embedding generation failed (${RAG_BACKEND_URL}/api/memory/embed):`, error?.message);
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
        created_at: new Date().toISOString()
      }
    });

    console.log(`✅ Memory vector stored: ${memoryId} for ${userId}`);
    return true;
  } catch (error: any) {
    console.error(`⚠️ Vector storage failed (${RAG_BACKEND_URL}/api/memory/store):`, error?.response?.data || error?.message);
    return false;
  }
}

/**
 * Semantic search across all memories using vector similarity
 * WITH CACHING for performance optimization
 */
export async function searchMemoriesSemantica(params: {
  query: string;
  userId?: string;
  limit?: number;
  entityFilter?: string;
}): Promise<VectorSearchResult[]> {
  try {
    const { query, userId, limit = 10, entityFilter } = params;

    // Try cache first (ignore entityFilter for simplicity)
    const cacheKey = `${query}|${userId || 'all'}`;
    const { results: cachedResults, cached } = await getCachedSearch(
      cacheKey,
      userId,
      limit,
      async () => {
        // Generate query embedding (also cached)
        const queryEmbedding = await generateEmbedding(query);

        // Search ChromaDB
        const response = await axios.post(`${RAG_BACKEND_URL}/api/memory/search`, {
          query_embedding: queryEmbedding,
          limit,
          metadata_filter: {
            ...(userId && { userId }),
            ...(entityFilter && { entities: { $contains: entityFilter } })
          }
        });

        // Transform results
        return response.data.results.map((r: any, idx: number) => ({
          id: response.data.ids[idx],
          userId: r.metadata.userId,
          content: r.document,
          type: r.metadata.type,
          timestamp: r.metadata.timestamp,
          entities: r.metadata.entities ? r.metadata.entities.split(',') : [],
          similarity: 1 / (1 + response.data.distances[idx]) // Convert distance to similarity
        }));
      }
    );

    if (cached) {
      console.log(`⚡ Search cache HIT for: "${query.substring(0, 40)}..."`);
    }

    return cachedResults;
  } catch (error: any) {
    console.log('⚠️ Semantic search failed:', error?.message);
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
      limit
    });

    return response.data.results.map((r: any, idx: number) => ({
      id: response.data.ids[idx],
      userId: r.metadata.userId,
      content: r.document,
      type: r.metadata.type,
      timestamp: r.metadata.timestamp,
      entities: r.metadata.entities ? r.metadata.entities.split(',') : [],
      similarity: 1 / (1 + response.data.distances[idx])
    }));
  } catch (error: any) {
    console.log('⚠️ Similar memory search failed:', error?.message);
    return [];
  }
}

/**
 * Delete memory from vector store
 */
export async function deleteMemoryVector(memoryId: string): Promise<boolean> {
  try {
    await axios.delete(`${RAG_BACKEND_URL}/api/memory/${memoryId}`);
    console.log(`✅ Memory vector deleted: ${memoryId}`);
    return true;
  } catch (error: any) {
    console.log('⚠️ Vector deletion failed:', error?.message);
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
    console.log('⚠️ Stats retrieval failed:', error?.message);
    return {
      total_memories: 0,
      users: 0,
      collection_size_mb: 0
    };
  }
}
