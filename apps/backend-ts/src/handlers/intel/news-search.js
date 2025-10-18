/**
 * Intel News Search Handler
 * Search Bali intelligence news from ChromaDB via RAG backend
 */
import logger from '../../services/logger.js';
import axios from 'axios';
const RAG_BACKEND_URL = process.env.RAG_BACKEND_URL || 'https://zantara-rag-backend-himaadsxua-ew.a.run.app';
export async function intelNewsSearch(params) {
    try {
        const { query, category, date_range = 'last_7_days', tier = '1,2,3', impact_level, limit = 20 } = params;
        // Call Python RAG backend
        const response = await axios.post(`${RAG_BACKEND_URL}/api/intel/search`, {
            query,
            category,
            date_range,
            tier: tier.split(','),
            impact_level,
            limit
        }, {
            timeout: 30000
        });
        const results = response.data.results;
        return {
            success: true,
            results,
            metadata: {
                total: results.length,
                query,
                category: category || 'all',
                date_range,
                tier,
                has_critical: results.some(r => r.impact_level === 'critical'),
                has_action_required: results.some(r => r.action_required === true)
            }
        };
    }
    catch (error) {
        logger.error('Intel news search error:', error.message);
        return {
            success: false,
            error: error.message,
            results: []
        };
    }
}
export async function intelNewsGetCritical(params) {
    try {
        const { category, days = 7 } = params;
        const response = await axios.get(`${RAG_BACKEND_URL}/api/intel/critical`, {
            params: { category, days },
            timeout: 15000
        });
        return {
            success: true,
            critical_items: response.data.items,
            count: response.data.count
        };
    }
    catch (error) {
        return {
            success: false,
            error: error.message,
            critical_items: []
        };
    }
}
export async function intelNewsGetTrends(params) {
    try {
        const { category, days = 30 } = params;
        const response = await axios.get(`${RAG_BACKEND_URL}/api/intel/trends`, {
            params: { category, days },
            timeout: 15000
        });
        return {
            success: true,
            trends: response.data.trends,
            topics: response.data.top_topics
        };
    }
    catch (error) {
        return {
            success: false,
            error: error.message,
            trends: []
        };
    }
}
