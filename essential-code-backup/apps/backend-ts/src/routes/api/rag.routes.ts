/**
 * RAG API Routes
 * Direct access to RAG backend services
 * Feature #10: RAG Query Direct
 */

import { Router, Request, Response } from 'express';
import {
  ragQueryDirect,
  semanticSearch,
  getCollections,
  generateEmbeddings,
  getRagHealth,
} from '../../handlers/rag/rag.js';
import { logger } from '../../logging/unified-logger.js';

const router = Router();

/**
 * POST /api/rag/query
 * Direct query to RAG backend
 *
 * Body:
 * {
 *   "query": "restaurant KBLI code",
 *   "collection": "kbli_unified",  // optional
 *   "limit": 10,                    // optional
 *   "metadata_filter": {}           // optional
 * }
 */
router.post('/query', async (req: Request, res: Response) => {
  try {
    const { query, collection, limit, metadata_filter } = req.body || {};

    // Validation
    if (!query || typeof query !== 'string') {
      return res.status(400).json({
        ok: false,
        error: 'Query string is required',
      });
    }

    if (query.length < 2) {
      return res.status(400).json({
        ok: false,
        error: 'Query must be at least 2 characters',
      });
    }

    if (limit && (typeof limit !== 'number' || limit < 1 || limit > 100)) {
      return res.status(400).json({
        ok: false,
        error: 'Limit must be between 1 and 100',
      });
    }

    // Execute query
    const result = await ragQueryDirect({
      query,
      collection,
      limit,
      metadata_filter,
    });

    res.json(result);
  } catch (error: any) {
    logger.error('RAG query route error:', error);
    res.status(500).json({
      ok: false,
      error: error?.message || 'RAG query failed',
    });
  }
});

/**
 * POST /api/rag/semantic-search
 * Semantic search across multiple collections
 *
 * Body:
 * {
 *   "query": "visa requirements for foreigners",
 *   "collections": ["visa_oracle", "legal_unified"],
 *   "limit": 10,        // optional
 *   "threshold": 0.7    // optional
 * }
 */
router.post('/semantic-search', async (req: Request, res: Response) => {
  try {
    const { query, collections, limit, threshold } = req.body || {};

    // Validation
    if (!query || typeof query !== 'string') {
      return res.status(400).json({
        ok: false,
        error: 'Query string is required',
      });
    }

    if (!collections || !Array.isArray(collections) || collections.length === 0) {
      return res.status(400).json({
        ok: false,
        error: 'Collections array is required',
      });
    }

    if (collections.length > 10) {
      return res.status(400).json({
        ok: false,
        error: 'Maximum 10 collections allowed',
      });
    }

    if (limit && (typeof limit !== 'number' || limit < 1 || limit > 100)) {
      return res.status(400).json({
        ok: false,
        error: 'Limit must be between 1 and 100',
      });
    }

    if (threshold && (typeof threshold !== 'number' || threshold < 0 || threshold > 1)) {
      return res.status(400).json({
        ok: false,
        error: 'Threshold must be between 0 and 1',
      });
    }

    // Execute search
    const result = await semanticSearch({
      query,
      collections,
      limit,
      threshold,
    });

    res.json(result);
  } catch (error: any) {
    logger.error('Semantic search route error:', error);
    res.status(500).json({
      ok: false,
      error: error?.message || 'Semantic search failed',
    });
  }
});

/**
 * GET /api/rag/collections
 * Get list of available collections with document counts
 */
router.get('/collections', async (req: Request, res: Response) => {
  try {
    const result = await getCollections();
    res.json(result);
  } catch (error: any) {
    logger.error('Get collections route error:', error);
    res.status(500).json({
      ok: false,
      error: error?.message || 'Failed to get collections',
    });
  }
});

/**
 * POST /api/rag/embeddings
 * Generate embeddings for text
 *
 * Body:
 * {
 *   "text": "Restaurant business in Bali",
 *   "model": "all-MiniLM-L6-v2"  // optional
 * }
 */
router.post('/embeddings', async (req: Request, res: Response) => {
  try {
    const { text, model } = req.body || {};

    // Validation
    if (!text || typeof text !== 'string') {
      return res.status(400).json({
        ok: false,
        error: 'Text string is required',
      });
    }

    if (text.length < 1) {
      return res.status(400).json({
        ok: false,
        error: 'Text cannot be empty',
      });
    }

    if (text.length > 10000) {
      return res.status(400).json({
        ok: false,
        error: 'Text too long (max 10,000 characters)',
      });
    }

    // Generate embeddings
    const result = await generateEmbeddings({
      text,
      model,
    });

    res.json(result);
  } catch (error: any) {
    logger.error('Generate embeddings route error:', error);
    res.status(500).json({
      ok: false,
      error: error?.message || 'Failed to generate embeddings',
    });
  }
});

/**
 * GET /api/rag/health
 * Check RAG backend health
 */
router.get('/health', async (req: Request, res: Response) => {
  try {
    const result = await getRagHealth();

    if (result.ok) {
      res.json(result);
    } else {
      res.status(503).json(result);
    }
  } catch (error: any) {
    logger.error('RAG health route error:', error);
    res.status(503).json({
      ok: false,
      status: 'unhealthy',
      error: error?.message || 'Health check failed',
    });
  }
});

export default router;
