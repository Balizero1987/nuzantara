/**
 * DEPRECATED: KBLI endpoints moved to RAG backend
 * Returns 410 Gone for all requests
 */

import { ok } from '../../utils/response.js';

export async function kbliLookup() {
  return {
    ok: false,
    error: 'This endpoint has been permanently moved to the RAG backend',
    code: 'ENDPOINT_MOVED',
    statusCode: 410,
    newEndpoint: 'https://nuzantara-rag.fly.dev/api/oracle/kbli'
  };
}

export async function kbliRequirements() {
  return {
    ok: false,
    error: 'This endpoint has been permanently moved to the RAG backend',
    code: 'ENDPOINT_MOVED',
    statusCode: 410,
    newEndpoint: 'https://nuzantara-rag.fly.dev/api/oracle/kbli'
  };
}
