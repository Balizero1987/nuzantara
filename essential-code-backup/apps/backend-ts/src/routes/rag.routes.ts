/**
 * RAG Ingestion & Management Routes
 * Handles document ingestion, collection management for ChromaDB/Qdrant
 */

import { Router, Request, Response } from 'express';
import { ChromaClient } from 'chromadb';
import { QdrantClient } from '@qdrant/js-client-rest';
import { logger } from '../logging/unified-logger.js';

const router = Router();

// Initialize clients
const chromaClient = new ChromaClient({
  path: process.env.CHROMADB_URL || 'http://localhost:8000',
});

const qdrantClient = new QdrantClient({
  url: process.env.QDRANT_URL || 'http://localhost:6333',
  apiKey: process.env.QDRANT_API_KEY,
});

/**
 * POST /api/rag/ingest
 * Batch ingest documents into RAG collection
 */
router.post('/ingest', async (req: Request, res: Response) => {
  try {
    const { collection, chunks, metadata = {} } = req.body;

    if (!collection || !chunks || !Array.isArray(chunks)) {
      return res.status(400).json({
        error: 'Invalid request',
        message: 'collection and chunks[] are required',
      });
    }

    logger.info(`Ingesting chunks`, {
      collection,
      chunksCount: chunks.length,
      source: metadata.source,
    });

    // Get or create ChromaDB collection
    let chromaCollection;
    try {
      chromaCollection = await chromaClient.getCollection({ name: collection });
    } catch (err) {
      chromaCollection = await chromaClient.createCollection({
        name: collection,
        metadata: {
          'hnsw:space': 'cosine',
          ...metadata,
        },
      });
    }

    // Prepare batch data
    const ids = chunks.map((chunk: any) => chunk.chunk_id || chunk.id);
    const documents = chunks.map((chunk: any) => chunk.text || chunk.document);
    const metadatas = chunks.map((chunk: any) => ({
      ...chunk.metadata,
      law_id: chunk.law_id || metadata.law_id,
      source: metadata.source,
      ingested_at: new Date().toISOString(),
    }));

    // Ingest to ChromaDB
    await chromaCollection.add({
      ids,
      documents,
      metadatas,
    });

    logger.info('Successfully ingested chunks', {
      collection,
      chunksIngested: chunks.length,
    });

    res.json({
      success: true,
      collection,
      chunks_ingested: chunks.length,
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    logger.error('Ingestion error', error as Error, {
      collection: req.body.collection,
    });
    res.status(500).json({
      error: 'Ingestion failed',
      message: error.message,
      details: error.stack,
    });
  }
});

/**
 * GET /api/rag/stats
 * Get collection statistics
 */
router.get('/stats', async (req: Request, res: Response) => {
  try {
    const { collection } = req.query;

    if (!collection) {
      return res.status(400).json({
        error: 'collection parameter required',
      });
    }

    const chromaCollection = await chromaClient.getCollection({
      name: collection as string,
    });

    const count = await chromaCollection.count();

    res.json({
      collection,
      count,
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    logger.error('Failed to get collection stats', error as Error, {
      collection: req.query.collection,
    });
    res.status(500).json({
      error: 'Failed to get stats',
      message: error.message,
    });
  }
});

/**
 * POST /api/rag/query
 * Query RAG collection with filters
 */
router.post('/query', async (req: Request, res: Response) => {
  try {
    const { collection, query, filters = {}, limit = 10 } = req.body;

    if (!collection || !query) {
      return res.status(400).json({
        error: 'collection and query are required',
      });
    }

    const chromaCollection = await chromaClient.getCollection({
      name: collection,
    });

    const results = await chromaCollection.query({
      queryTexts: [query],
      nResults: limit,
      where: filters,
    });

    res.json({
      query,
      collection,
      results: results.documents[0].map((doc: string, idx: number) => ({
        document: doc,
        metadata: results.metadatas[0][idx],
        distance: results.distances ? results.distances[0][idx] : null,
      })),
      count: results.documents[0].length,
    });
  } catch (error: any) {
    logger.error('Query error', error as Error, {
      collection: req.body.collection,
    });
    res.status(500).json({
      error: 'Query failed',
      message: error.message,
    });
  }
});

/**
 * GET /api/rag/collections
 * List all RAG collections
 */
router.get('/collections', async (req: Request, res: Response) => {
  try {
    const collections = await chromaClient.listCollections();

    res.json({
      collections: collections.map((c) => ({
        name: c.name,
        metadata: c.metadata,
      })),
      count: collections.length,
    });
  } catch (error: any) {
    logger.error('Failed to list collections', error as Error);
    res.status(500).json({
      error: 'Failed to list collections',
      message: error.message,
    });
  }
});

/**
 * DELETE /api/rag/collection/:name
 * Delete a collection
 */
router.delete('/collection/:name', async (req: Request, res: Response) => {
  try {
    const { name } = req.params;

    await chromaClient.deleteCollection({ name });

    res.json({
      success: true,
      message: `Collection ${name} deleted`,
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    logger.error('Failed to delete collection', error as Error, {
      collection: req.params.name,
    });
    res.status(500).json({
      error: 'Failed to delete collection',
      message: error.message,
    });
  }
});

/**
 * GET /api/rag/health
 * Health check for RAG system
 */
router.get('/health', async (req: Request, res: Response) => {
  try {
    // Check ChromaDB
    const collections = await chromaClient.listCollections();

    res.json({
      status: 'healthy',
      chromadb: {
        connected: true,
        collections: collections.length,
      },
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    res.status(500).json({
      status: 'unhealthy',
      error: error.message,
      timestamp: new Date().toISOString(),
    });
  }
});

export default router;
