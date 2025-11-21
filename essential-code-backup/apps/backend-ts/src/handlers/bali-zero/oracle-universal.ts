/**
 * Oracle Universal Query Handler
 * Proxies to RAG Backend's Universal Oracle endpoint
 *
 * Single intelligent endpoint that routes to appropriate Oracle collection automatically
 */

import logger from '../../services/logger.js';
import { ok, err } from '../../utils/response.js';
import { ENV } from '../../config/index.js';

const RAG_BACKEND_URL = ENV.RAG_BACKEND_URL;

interface OracleUniversalParams {
  query: string;
  limit?: number;
  generate_ai_answer?: boolean;
  domain_hint?: string; // Optional: 'tax', 'legal', 'property', 'visa', 'kbli'
}

/**
 * Universal Oracle Query
 * Automatically routes to appropriate collection (tax, legal, property, visa, kbli)
 */
export async function oracleUniversalQuery(params: OracleUniversalParams) {
  if (!params.query) {
    return err('Query is required');
  }

  try {
    const response = await fetch(`${RAG_BACKEND_URL}/api/oracle/query`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        query: params.query,
        limit: params.limit || 5,
        generate_ai_answer: params.generate_ai_answer !== false,
        include_routing_info: true,
        domain_hint: params.domain_hint,
      }),
    });

    if (!response.ok) {
      throw new Error(`Oracle query failed: ${response.statusText}`);
    }

    const data: any = await response.json();

    logger.info(
      `🔮 [Oracle Universal] Query: "${params.query}" → ${data.collection_used} (${data.total_results} results)`
    );

    return ok({
      success: data.success,
      query: data.query,
      collection: data.collection_used,
      routing: data.routing_reason,
      results: data.results,
      total: data.total_results,
      answer: data.answer,
      model: data.model_used,
      executionTime: data.execution_time_ms,
    });
  } catch (error: any) {
    logger.error('❌ Oracle universal query error:', error);
    return err(`Oracle query failed: ${error.message}`);
  }
}

/**
 * Get available Oracle collections
 */
export async function oracleCollections() {
  try {
    const response = await fetch(`${RAG_BACKEND_URL}/api/oracle/collections`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch collections: ${response.statusText}`);
    }

    const data: any = await response.json();

    return ok({
      collections: data.collections,
      total: data.total,
      descriptions: data.description,
    });
  } catch (error: any) {
    logger.error('❌ Oracle collections error:', error);
    return err(`Failed to fetch collections: ${error.message}`);
  }
}
