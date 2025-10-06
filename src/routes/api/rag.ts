/**
 * RAG API Routes
 * Endpoints that proxy to Python RAG backend
 */

import { Router, Request, Response } from 'express';
import { ragService } from '../../services/ragService.js';

const router = Router();

/**
 * POST /api/rag/query
 * Main RAG endpoint - generates answer using Ollama
 */
router.post('/query', async (req: Request, res: Response) => {
  try {
    const { query, k, use_llm, conversation_history } = req.body;

    if (!query) {
      return res.status(400).json({
        error: 'Query is required'
      });
    }

    const result = await ragService.generateAnswer({
      query,
      k: k || 5,
      use_llm: use_llm !== false,
      conversation_history
    });

    res.json(result);

  } catch (error: any) {
    console.error('RAG query error:', error);
    res.status(500).json({
      error: error.message || 'Internal server error'
    });
  }
});

/**
 * POST /api/rag/bali-zero
 * Bali Zero chat - intelligent Haiku/Sonnet routing
 * Specialized for immigration/visa queries
 */
router.post('/bali-zero', async (req: Request, res: Response) => {
  try {
    const { query, conversation_history, user_role } = req.body;

    if (!query) {
      return res.status(400).json({
        error: 'Query is required'
      });
    }

    // Determine user role from request
    const role = user_role || 'member';

    const result = await ragService.baliZeroChat({
      query,
      conversation_history,
      user_role: role
    });

    res.json(result);

  } catch (error: any) {
    console.error('Bali Zero error:', error);
    res.status(500).json({
      error: error.message || 'Internal server error'
    });
  }
});

/**
 * POST /api/rag/search
 * Fast semantic search (no LLM generation)
 */
router.post('/search', async (req: Request, res: Response) => {
  try {
    const { query, k } = req.body;

    if (!query) {
      return res.status(400).json({
        error: 'Query is required'
      });
    }

    const result = await ragService.search(query, k);

    return res.json(result);

  } catch (error: any) {
    console.error('Search error:', error);
    return res.status(500).json({
      error: error.message || 'Internal server error'
    });
  }
});

/**
 * GET /api/rag/health
 * Check RAG backend health
 */
router.get('/health', async (req: Request, res: Response) => {
  try {
    const isHealthy = await ragService.healthCheck();

    res.json({
      status: isHealthy ? 'healthy' : 'unhealthy',
      rag_backend: isHealthy
    });

  } catch (error) {
    res.status(503).json({
      status: 'unhealthy',
      error: 'RAG backend unavailable'
    });
  }
});

export default router;