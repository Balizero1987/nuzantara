import { Request, Response } from 'express';
import logger from '../../services/logger.js';

const RAG_BACKEND_URL = process.env.RAG_BACKEND_URL || 'https://nuzantara-rag.fly.dev';

/**
 * ZANTARA v3 Ω Ecosystem Knowledge Endpoint
 * Searches across visa_oracle, tax_genius, and property_knowledge collections
 */
export async function zantaraEcosystem(req: Request, res: Response) {
  try {
    const { query, domain = 'all', mode = 'comprehensive', include_sources = false } = req.body.params || req.body;

    if (!query) {
      return res.status(400).json({
        ok: false,
        error: 'Query parameter is required',
      });
    }

    logger.info(`🧠 ZANTARA Ecosystem query: "${query.substring(0, 100)}" (domain: ${domain}, mode: ${mode})`);

    // Forward to RAG backend with ecosystem collections
    const response = await fetch(`${RAG_BACKEND_URL}/search`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(req.headers['x-api-key'] && { 'x-api-key': req.headers['x-api-key'] as string }),
        ...(req.headers['x-user-id'] && { 'x-user-id': req.headers['x-user-id'] as string }),
      },
      body: JSON.stringify({
        query,
        collection: 'visa_oracle,tax_genius,property_knowledge',
        top_k: mode === 'comprehensive' ? 20 : mode === 'focused' ? 10 : 5,
        include_metadata: include_sources,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      logger.error(`❌ RAG backend error: ${response.status} - ${errorText}`);
      return res.status(response.status).json({
        ok: false,
        error: `RAG backend error: ${response.status}`,
      });
    }

    const data = await response.json();

    return res.json({
      ok: true,
      data: {
        results: data.results || data,
        query,
        domain,
        mode,
        timestamp: new Date().toISOString(),
      },
    });
  } catch (error: any) {
    logger.error('zantara.ecosystem error:', error);
    return res.status(500).json({
      ok: false,
      error: error.message || 'Internal server error',
    });
  }
}
