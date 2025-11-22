import logger from '../../services/logger.js';
import { Request, Response } from 'express';

/**
 * KBLI handlers (TS backend)
 *
 * NOTE:
 * - All authoritative KBLI data now lives in Qdrant/PostgreSQL and is served via the RAG backend.
 * - This TypeScript handler no longer contains any embedded KBLI tables or regulatory data.
 * - Frontends should call the RAG /oracle endpoints for actual KBLI lookups and requirements.
 */

export async function kbliLookup(_req: Request, res: Response) {
  logger.warn(
    'kbliLookup called: static KBLI tables removed from TS backend. Use RAG /oracle endpoints instead.',
  );

  return res.status(501).json({
    ok: false,
    error: 'KBLI lookup is now handled by the RAG backend. This endpoint is deprecated.',
  });
}

export async function kbliRequirements(_req: Request, res: Response) {
  logger.warn(
    'kbliRequirements called: static KBLI tables removed from TS backend. Use RAG /oracle endpoints instead.',
  );

  return res.status(501).json({
    ok: false,
    error: 'KBLI requirements are now handled by the RAG backend. This endpoint is deprecated.',
  });
}


