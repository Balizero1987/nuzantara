/**
 * Intel News Search Handler
 * Search Bali intelligence news from Qdrant via RAG backend
 */

import logger from '../../services/logger.js';
import axios from 'axios';

const RAG_BACKEND_URL =
  process.env.RAG_BACKEND_URL || 'https://nuzantara-rag.fly.dev';

interface IntelSearchParams {
  query: string;
  category?:
    | 'immigration'
    | 'bkpm_tax'
    | 'realestate'
    | 'events'
    | 'social'
    | 'competitors'
    | 'bali_news'
    | 'roundup';
  date_range?: 'today' | 'last_7_days' | 'last_30_days' | 'last_90_days';
  tier?: '1' | '2' | '3' | '1,2' | '1,2,3' | 'T1' | 'T2' | 'T3' | 'T1,T2' | 'T1,T2,T3'; // Support both legacy and new formats
  impact_level?: 'critical' | 'high' | 'medium' | 'low';
  limit?: number;
}

interface IntelSearchResult {
  id: string;
  title: string;
  summary_english: string;
  summary_italian: string;
  source: string;
  tier: string;
  published_date: string;
  category: string;
  impact_level: string;
  url: string;
  key_changes?: string;
  action_required?: boolean;
  deadline_date?: string;
  similarity_score: number;
}

export async function intelNewsSearch(params: IntelSearchParams) {
  try {
    const {
      query,
      category,
      date_range = 'last_7_days',
      tier = 'T1,T2,T3', // Changed default to new format
      impact_level,
      limit = 20,
    } = params;

    // Normalize tier format: support both '1,2,3' (legacy) and 'T1,T2,T3' (new)
    const tierArray = tier.split(',').map((t) => {
      const trimmed = t.trim();
      return trimmed.startsWith('T') ? trimmed : `T${trimmed}`;
    });

    // Call Python RAG backend
    const response = await axios.post(
      `${RAG_BACKEND_URL}/api/intel/search`,
      {
        query,
        category,
        date_range,
        tier: tierArray, // Now sends ['T1','T2','T3']
        impact_level,
        limit,
      },
      {
        timeout: 30000,
      }
    );

    const results: IntelSearchResult[] = response.data.results;

    return {
      success: true,
      results,
      metadata: {
        total: results.length,
        query,
        category: category || 'all',
        date_range,
        tier,
        has_critical: results.some((r) => r.impact_level === 'critical'),
        has_action_required: results.some((r) => r.action_required === true),
      },
    };
  } catch (error: any) {
    logger.error('Intel news search error:', error.message);
    return {
      success: false,
      error: error.message,
      results: [],
    };
  }
}

export async function intelNewsGetCritical(params: { category?: string; days?: number }) {
  try {
    const { category, days = 7 } = params;

    const response = await axios.get(`${RAG_BACKEND_URL}/api/intel/critical`, {
      params: { category, days },
      timeout: 15000,
    });

    return {
      success: true,
      critical_items: response.data.items,
      count: response.data.count,
    };
  } catch (error: any) {
    return {
      success: false,
      error: error.message,
      critical_items: [],
    };
  }
}

export async function intelNewsGetTrends(params: { category?: string; days?: number }) {
  try {
    const { category, days = 30 } = params;

    const response = await axios.get(`${RAG_BACKEND_URL}/api/intel/trends`, {
      params: { category, days },
      timeout: 15000,
    });

    return {
      success: true,
      trends: response.data.trends,
      topics: response.data.top_topics,
    };
  } catch (error: any) {
    return {
      success: false,
      error: error.message,
      trends: [],
    };
  }
}
