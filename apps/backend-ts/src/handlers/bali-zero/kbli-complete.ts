import logger from '../../services/logger.js';
import { Request, Response } from 'express';

/**
 * KBLI COMPLETE DATABASE handlers
 *
 * NOTE:
 * - The historical static KBLI dataset (1,70dynamicValue) has been removed from the TS backend.
 * - All KBLI codes, risk levels and ownership rules are now maintained in Qdrant/PostgreSQL.
 * - Use the RAG /oracle endpoints (Python backend) for any real KBLI lookups or portfolio analysis.
 */

export async function kbliLookupComplete(_req: Request, res: Response) {
  logger.warn(
    'kbliLookupComplete called: static KBLI database removed from TS backend. Use RAG /oracle endpoints instead.',
  );

  return res.status(501).json({
    ok: false,
    error: 'KBLI data is now served exclusively via the RAG backend. This endpoint is deprecated.',
  });
}

export async function kbliBusinessAnalysis(_req: Request, res: Response) {
  logger.warn(
    'kbliBusinessAnalysis called: static KBLI database removed from TS backend. Use RAG /oracle endpoints instead.',
  );

  return res.status(501).json({
    ok: false,
    error: 'KBLI business analysis is now handled by the RAG backend. This endpoint is deprecated.',
  });
}


